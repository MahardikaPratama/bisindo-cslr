from __future__ import annotations

import importlib
import os
import shutil
import time
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import re
import numpy as np


# Silence noisy third-party logs before importing MediaPipe / TensorFlow.
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("GLOG_minloglevel", "3")
os.environ.setdefault("FLAGS_minloglevel", "3")
os.environ.setdefault("ABSL_MIN_LOG_LEVEL", "3")

PROJECT_ROOT = Path(__file__).resolve().parent
PROJECT_MODULE_DIR = PROJECT_ROOT / "rgb-to-skeleton-mediapipe"
CSLR_PROJECT_DIR = PROJECT_ROOT / "mslr_iccv2025"

if str(PROJECT_MODULE_DIR) not in os.sys.path:
    os.sys.path.insert(0, str(PROJECT_MODULE_DIR))

from contextlib import nullcontext as NativeStderrFilter

get_logger = importlib.import_module("src.utils.logger").get_logger
SkeletonPipeline = importlib.import_module("src.core.pipeline").SkeletonPipeline

logger = get_logger(__name__)

UPLOAD_DIR = PROJECT_ROOT / "data" / "uploads"
PREVIEW_DIRS = {
    "rgb": UPLOAD_DIR,
    "skeleton": PROJECT_MODULE_DIR / "data" / "video_skeleton",
    "overlay": PROJECT_MODULE_DIR / "data" / "video_overlay",
}

TEMP_KPS_DIR = PROJECT_ROOT / "data" / "temp_keypoints"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
TEMP_KPS_DIR.mkdir(parents=True, exist_ok=True)
for pd in PREVIEW_DIRS.values():
    pd.mkdir(parents=True, exist_ok=True)

# (GROUND_TRUTH_TABLE removed: we rely on GroundTruthLookup parsing .stm files)

# ---------------------------------------------------------------------------
# Lazy-loaded InferenceRunner (loaded on first request)
# ---------------------------------------------------------------------------
_inference_runner: Optional[Any] = None

_CHECKPOINT_CANDIDATES = [
    CSLR_PROJECT_DIR / "model" / "best_dev_01.80_epoch39_model.pt",
]
CHECKPOINT_PATH = str(next((path for path in _CHECKPOINT_CANDIDATES if path.exists()), _CHECKPOINT_CANDIDATES[0]))
CSLR_CONFIG_PATH = str(
    CSLR_PROJECT_DIR / "configs" / "experiment_configs" / "baseline" / "O4.yaml"
)
DEFAULT_CSLR_CONFIG_NAME = "O4.yaml"


def _get_inference_runner():
    global _inference_runner
    if _inference_runner is None:
        logger.info("[API] Loading InferenceRunner (first request)...")
        from inference import InferenceRunner
        _inference_runner = InferenceRunner(
            cslr_project_dir=str(CSLR_PROJECT_DIR),
            config_path=CSLR_CONFIG_PATH,
            checkpoint_path=CHECKPOINT_PATH,
            annotation_split="test_sd",
        )
        logger.info("[API] InferenceRunner loaded.")
    return _inference_runner


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(title="BISINDO CSLR API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/preview/rgb", StaticFiles(directory=str(PREVIEW_DIRS["rgb"])), name="preview_rgb")
app.mount("/preview/skeleton", StaticFiles(directory=str(PREVIEW_DIRS["skeleton"])), name="preview_skeleton")
app.mount("/preview/overlay", StaticFiles(directory=str(PREVIEW_DIRS["overlay"])), name="preview_overlay")

@app.api_route("/preview_stream/{subdir}/{filename}", methods=["GET", "HEAD"])
async def preview_stream(subdir: str, filename: str, request: Request):
    """Range-aware streaming endpoint for preview files."""
    if ".." in subdir or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid path")
        
    if subdir not in PREVIEW_DIRS:
        raise HTTPException(status_code=404, detail="Invalid preview type")

    path = PREVIEW_DIRS[subdir] / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    file_size = path.stat().st_size
    range_header = request.headers.get("range")
    method = request.method.upper()
    # Log request for debugging (show method, path and Range header)
    try:
        logger.info("[API] preview_stream request: method=%s path=%s range=%s remote=%s", method, str(path), range_header, request.client)
    except Exception:
        logger.info("[API] preview_stream request: method=%s path=%s range=%s", method, str(path), range_header)
    if range_header:
        m = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if not m:
            raise HTTPException(status_code=416)
        start = int(m.group(1))
        end = int(m.group(2)) if m.group(2) else file_size - 1
        if start >= file_size:
            raise HTTPException(status_code=416)
        if end >= file_size:
            end = file_size - 1
        length = end - start + 1
        with open(path, "rb") as f:
            f.seek(start)
            chunk = f.read(length)
        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(length),
            "Content-Type": "video/mp4",
            "Access-Control-Allow-Origin": "*",
        }
        # If it's a HEAD request, return headers only
        if method == "HEAD":
            return Response(content=b"", status_code=206, headers=headers)
        return Response(content=chunk, status_code=206, headers=headers)

    # No range header — return full file (GET) or headers only (HEAD)
    full_headers = {"Content-Length": str(file_size), "Content-Type": "video/mp4", "Access-Control-Allow-Origin": "*", "Accept-Ranges": "bytes"}
    if method == "HEAD":
        return Response(content=b"", status_code=200, headers=full_headers)
    return FileResponse(path)


def _get_available_configs() -> list[str]:
    configs = []
    # Always include top-level config files in mslr_iccv2025/configs
    top_dir = CSLR_PROJECT_DIR / "configs"
    if top_dir.exists():
        for f in top_dir.glob("*.yaml"):
            configs.append(f.name)

    # Also include normalization experiment configs
    norm_dir = CSLR_PROJECT_DIR / "configs" / "experiment_configs" / "normalization"
    if norm_dir.exists():
        for f in norm_dir.glob("*.yaml"):
            configs.append(f.name)

    # Also include baseline experiment configs
    baseline_dir = CSLR_PROJECT_DIR / "configs" / "experiment_configs" / "baseline"
    if baseline_dir.exists():
        for f in baseline_dir.glob("*.yaml"):
            configs.append(f.name)

    # Deduplicate and sort
    configs = sorted(list(dict.fromkeys(configs)))
    logger.info("[API] Available configs discovered at %s: %s", norm_dir, configs)
    # Fallback default if nothing found
    if not configs:
        configs = [DEFAULT_CSLR_CONFIG_NAME]
    return configs

@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}

@app.get("/api/configs")
def get_configs() -> JSONResponse:
    configs = _get_available_configs()
    default = DEFAULT_CSLR_CONFIG_NAME if DEFAULT_CSLR_CONFIG_NAME in configs else (configs[0] if configs else DEFAULT_CSLR_CONFIG_NAME)
    return JSONResponse({"configs": configs, "default": default})


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def _to_preview_url(path_value: Any) -> Optional[str]:
    if not path_value:
        return None
    path_obj = Path(str(path_value)).resolve()
    try:
        rel = path_obj.relative_to(PREVIEW_DIR.resolve())
    except ValueError:
        return None
    return f"/preview/{rel.as_posix()}"


def _preview_file_size(path_value: Any) -> Optional[int]:
    if not path_value:
        return None
    try:
        return Path(str(path_value)).stat().st_size
    except OSError:
        return None


def _save_upload(video: UploadFile) -> Path:
    """Simpan file upload ke temp dir dan kembalikan path-nya."""
    suffix = Path(video.filename or "video.mp4").suffix.lower()
    if suffix not in {".mp4", ".mov", ".avi", ".mkv", ".webm"}:
        raise HTTPException(status_code=400, detail="Unsupported video format")
    request_id = uuid.uuid4().hex[:12]
    temp_path = UPLOAD_DIR / f"{request_id}_{Path(video.filename or 'video').name}"
    with temp_path.open("wb") as buf:
        shutil.copyfileobj(video.file, buf)
    return temp_path


# ---------------------------------------------------------------------------
# Endpoint 1: Preview only (backward-compat, masih dipakai FE lama jika ada)
# ---------------------------------------------------------------------------
@app.post("/api/preview/process")
async def process_preview(video: UploadFile = File(...)) -> JSONResponse:
    """Skeleton extraction + preview generation saja (tanpa inference CSLR)."""
    if not video.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    temp_path: Optional[Path] = None
    try:
        temp_path = _save_upload(video)

        with NativeStderrFilter():
            pipeline = SkeletonPipeline()
            keypoints = pipeline.process_video(str(temp_path))

        if keypoints is None:
            raise HTTPException(status_code=500, detail="Failed to produce skeleton output")

        payload = {
            "video_id": temp_path.stem,
            "num_frames": keypoints.shape[0],
            "num_keypoints": keypoints.shape[1],
            "previews": {
                "rgb": None,
                "skeleton": None,
                "overlay": None,
            },
        }
        logger.info(
            "[API] Preview artifacts: rgb=None skeleton=None overlay=None",
        )
        logger.info("API /preview done video_id=%s frames=%s", payload["video_id"], payload["num_frames"])
        return JSONResponse(payload)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Preview processing failed: %s", exc)
        raise HTTPException(status_code=500, detail="Preview processing failed") from exc
    finally:
        try:
            video.file.close()
        except Exception:
            pass
        if temp_path and temp_path.exists():
            try:
                temp_path.unlink()
            except OSError:
                pass


# ---------------------------------------------------------------------------
# Endpoint 2: Full inference pipeline (skeleton + inference + WER)
# ---------------------------------------------------------------------------
@app.post("/api/extract_skeleton")
async def extract_skeleton(video: UploadFile = File(...)) -> JSONResponse:
    if not video.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    temp_path: Optional[Path] = None
    try:
        temp_path = _save_upload(video)
        t_start = time.perf_counter()

        logger.info("[API] Skeleton extraction: %s", video.filename)
        with NativeStderrFilter():
            pipeline = SkeletonPipeline()
            keypoints = pipeline.process_video(str(temp_path))

        if keypoints is None:
            raise HTTPException(status_code=500, detail="Failed to produce skeleton output")

        video_id = temp_path.stem
        
        # Simpan sementara keypoints ke format npy
        np.save(str(TEMP_KPS_DIR / f"{video_id}.npy"), keypoints)

        summary = {
            "video_id": video_id,
            "num_frames": keypoints.shape[0],
            "num_keypoints": keypoints.shape[1]
        }
        previews = {
            "rgb": f"/preview_stream/rgb/{temp_path.name}",
            "skeleton": f"/preview_stream/skeleton/{video_id}_skeleton.mp4",
            "overlay": f"/preview_stream/overlay/{video_id}_overlay.mp4",
        }
        logger.info(
            "[API] Preview URLs: rgb=%s skeleton=%s overlay=%s",
            previews["rgb"], previews["skeleton"], previews["overlay"]
        )

        total_ms = int((time.perf_counter() - t_start) * 1000)

        payload = {
            "video_id": video_id,
            "num_frames": summary["num_frames"],
            "num_keypoints": summary["num_keypoints"],
            "previews": previews,
            "total_ms": total_ms,
        }
        return JSONResponse(payload)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("[API] Extraction failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Extraction pipeline failed: {str(exc)}") from exc
    finally:
        try:
            video.file.close()
        except Exception:
            pass


@app.post("/api/predict")
async def predict(
    video_id: str = Form(...),
    sentence_id: str = Form(...),
    config_name: Optional[str] = Form(None),
) -> JSONResponse:
    # Validasi basic
    if not sentence_id or not isinstance(sentence_id, str):
        raise HTTPException(status_code=400, detail="Invalid sentence_id")
        
    kps_path = TEMP_KPS_DIR / f"{video_id}.npy"
    if not kps_path.exists():
        raise HTTPException(status_code=404, detail="Keypoints file not found. Ensure extraction ran first.")

    try:
        t_start = time.perf_counter()
        keypoints = np.load(str(kps_path))

        logger.info(
            "[API] Running CSLR inference for sentence_id=%s with config=%s",
            sentence_id,
            config_name or "<backend-default>",
        )
        runner = _get_inference_runner()
        logger.info("[API] Current preprocessor before optional update: %s", runner.describe_preprocessor())

        if config_name:
            if config_name == "Double_Cosign_sd.yaml":
                config_path = str(CSLR_PROJECT_DIR / "configs" / "Double_Cosign_sd.yaml")
            elif (CSLR_PROJECT_DIR / "configs" / "experiment_configs" / "baseline" / config_name).exists():
                config_path = str(CSLR_PROJECT_DIR / "configs" / "experiment_configs" / "baseline" / config_name)
            else:
                config_path = str(CSLR_PROJECT_DIR / "configs" / "experiment_configs" / "normalization" / config_name)
            runner.update_preprocessor(config_path)
        else:
            logger.info("[API] Using backend default preprocessor from InferenceRunner initialization.")

        logger.info("[API] Active preprocessor for this request: %s", runner.describe_preprocessor())

        inference_result = runner.run_return(keypoints, sentence_id)

        total_ms = int((time.perf_counter() - t_start) * 1000)

        # Merge additional metadata
        inference_result.update({
            "inference_ms": total_ms,
            "inference_fps": float(keypoints.shape[0] / (total_ms / 1000.0)) if total_ms > 0 else 0.0,
        })
        payload = {
            "video_id": video_id,
            "inference": inference_result,
            "total_ms": total_ms,
        }

        logger.info(
            "[API] /predict done video_id=%s gt='%s' pred='%s' wer=%s",
            video_id, inference_result["ground_truth"], inference_result["prediction"], inference_result["wer_percent"]
        )

        return JSONResponse(content=payload)

    except Exception as e:
        logger.exception("[API] Inference failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
    finally:
        # Hapus file npy temporary jika proses selesai atau gagal
        if kps_path.exists():
            try:
                kps_path.unlink()
            except OSError:
                pass
