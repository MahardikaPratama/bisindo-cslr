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


# Silence noisy third-party logs before importing MediaPipe / TensorFlow.
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("GLOG_minloglevel", "3")
os.environ.setdefault("FLAGS_minloglevel", "3")
os.environ.setdefault("ABSL_MIN_LOG_LEVEL", "3")

PROJECT_ROOT = Path(__file__).resolve().parent
PROJECT_MODULE_DIR = PROJECT_ROOT / "rgb-to-skeleton"
CSLR_PROJECT_DIR = PROJECT_ROOT / "mslr_iccv2025"

if str(PROJECT_MODULE_DIR) not in os.sys.path:
    os.sys.path.insert(0, str(PROJECT_MODULE_DIR))

stderr_filters = importlib.import_module("utils.stderr_filters")
get_logger = importlib.import_module("utils.logger").get_logger
SkeletonPipeline = importlib.import_module("core.pipeline").SkeletonPipeline

logger = get_logger(__name__)
stderr_filters.install_filtered_stderr()
NativeStderrFilter = stderr_filters.NativeStderrFilter

UPLOAD_DIR = PROJECT_ROOT / "data" / "uploads"
PREVIEW_DIR = PROJECT_ROOT / "data" / "preview"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Ground Truth Table (synced with pages/src/constants/ground-truth.constants.ts)
# ---------------------------------------------------------------------------
GROUND_TRUTH_TABLE: Dict[str, str] = {
    "S001": "AKU CIUM BADAN DIA",
    "S002": "AKU LIHAT ADA ULAR MASUK KELAS",
    "S003": "AKU NILAI JELEK",
    "S004": "AKU PUSING SERING, AKU HARUS PERIKSA MANA",
    "S005": "APA KAMU PERNAH BACA NOVEL B.INGGRIS",
    "S006": "AYAH SAMA IBU MANA",
    "S007": "BADAN AKU GEMUK TAPI BADAN ADIK KURUS",
    "S008": "BUKU AKU SOBEK GEGARA DIA",
    "S009": "DIA ANAK BAIK SAMPAI BANYAK ORANG SUKA",
    "S010": "DIA MENGEJEK AKU",
    "S011": "GAK BOLEH PULANG SEKARANG KAMU",
    "S012": "GIMANA IBUMU BAIK-BAIK ATAU TIDAK",
    "S013": "IBU AKU PUNYA KUCING SAMA IKAN",
    "S014": "KAKAK AKU KASIH HADIAH BUAT AKU",
    "S015": "KAMU BELAJAR BISINDO KAPAN",
    "S016": "KAMU PERGI KEMANA",
    "S017": "KAMU PUNYA ANGGOTA KELUARGA BERAPA",
    "S018": "KENAPA KAMU GAK MASUK KULIAH KEMARIN",
    "S019": "KITA ISTIRAHAT JAM BERAPA",
    "S020": "OBAT BISA BELI TOKO OBAT MANA",
    "S021": "ORANG JAHAT SANA PUKUL AKU BERULANG",
    "S022": "POLISI SANA PUKUL PENCURI",
    "S023": "RUMAH DIMANA KAMU",
    "S024": "SANA BERITA SUDAH BANYAK RIBUAN ORANG LIHAT",
    "S025": "SANA ENAK NASI PADANG TAPI MAHAL",
    "S026": "SANA TOILET KOTOR",
    "S027": "SEPATU DIA KOTOR",
    "S028": "TONG SAMPAH ADA SEMUT BANYAK",
    "S029": "ULANG TAHUN SELAMAT",
    "S030": "ULAR SANA MAKAN KAMBING",
}

# ---------------------------------------------------------------------------
# Lazy-loaded InferenceRunner (loaded on first request)
# ---------------------------------------------------------------------------
_inference_runner: Optional[Any] = None

_CHECKPOINT_CANDIDATES = [
    CSLR_PROJECT_DIR / "model" / "best_dev_00.80_epoch37_model.pt",
]
CHECKPOINT_PATH = str(next((path for path in _CHECKPOINT_CANDIDATES if path.exists()), _CHECKPOINT_CANDIDATES[0]))
CSLR_CONFIG_PATH = str(
    CSLR_PROJECT_DIR / "configs" / "experiment_configs" / "normalization" / "Baseline+MKR+TN.yaml"
)
DEFAULT_CSLR_CONFIG_NAME = "Baseline+MKR+TN.yaml"


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

app.mount("/preview", StaticFiles(directory=str(PREVIEW_DIR)), name="preview")


@app.api_route("/preview_stream/{subdir}/{filename}", methods=["GET", "HEAD"])
async def preview_stream(subdir: str, filename: str, request: Request):
    """Range-aware streaming endpoint for preview files.

    Use this URL in the frontend when the static mount doesn't support
    partial content via a proxy/tunnel (eg. some ngrok setups).

    Example: /preview_stream/rgb/9cd3d279bcb5_demo-001_rgb.mp4
    """
    # Prevent directory traversal
    if ".." in subdir or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid path")

    path = PREVIEW_DIR / subdir / filename
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
            pipeline = SkeletonPipeline(save_to_disk=False, async_save=False)
            result: Dict[str, Any] = pipeline.process_video(str(temp_path))

        skeleton = result.get("skeleton")
        if skeleton is None:
            raise HTTPException(status_code=500, detail="Failed to produce skeleton output")

        summary = skeleton.summary()
        payload = {
            "video_id": summary.get("video_id"),
            "num_frames": summary.get("num_frames"),
            "num_keypoints": summary.get("num_keypoints"),
            "previews": {
                "rgb": _to_preview_url(result.get("preview_rgb_path")),
                "skeleton": _to_preview_url(result.get("preview_skeleton_path")),
                "overlay": _to_preview_url(result.get("preview_overlay_path")),
            },
        }
        logger.info(
            "[API] Preview artifacts: rgb=%s (%s bytes) skeleton=%s (%s bytes) overlay=%s (%s bytes)",
            result.get("preview_rgb_path"),
            _preview_file_size(result.get("preview_rgb_path")),
            result.get("preview_skeleton_path"),
            _preview_file_size(result.get("preview_skeleton_path")),
            result.get("preview_overlay_path"),
            _preview_file_size(result.get("preview_overlay_path")),
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
@app.post("/api/inference")
async def run_inference(
    video: UploadFile = File(...),
    sentence_id: str = Form(...),
    config_name: Optional[str] = Form(None),
) -> JSONResponse:
    """Full pipeline: skeleton extraction → CSLR inference → WER.

    Form fields:
        video       : file video RGB (mp4/webm/avi/mov/mkv)
        sentence_id : ID kalimat ground truth, contoh: 'S001'
        config_name : Nama file konfigurasi preprocessing (opsional).
                  Jika tidak dikirim, backend memakai preprocessor default
                  yang sudah dimuat saat InferenceRunner dibuat.

    Returns JSON dengan:
        video_id, num_frames, num_keypoints, previews,
        inference.{ground_truth, prediction, wer, wer_percent, inference_ms, inference_fps}
    """
    if not video.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    if sentence_id not in GROUND_TRUTH_TABLE:
        raise HTTPException(
            status_code=400,
            detail=f"sentence_id '{sentence_id}' tidak dikenal. Pilih S001–S030.",
        )

    temp_path: Optional[Path] = None
    try:
        temp_path = _save_upload(video)
        t_start = time.perf_counter()

        # ── Step 1-2: Skeleton extraction ──
        logger.info("[API] Skeleton extraction: %s | sentence_id=%s", video.filename, sentence_id)
        with NativeStderrFilter():
            pipeline = SkeletonPipeline(save_to_disk=False, async_save=False)
            result: Dict[str, Any] = pipeline.process_video(str(temp_path))

        skeleton = result.get("skeleton")
        if skeleton is None:
            raise HTTPException(status_code=500, detail="Failed to produce skeleton output")

        summary = skeleton.summary()
        previews = {
            "rgb": _to_preview_url(result.get("preview_rgb_path")),
            "skeleton": _to_preview_url(result.get("preview_skeleton_path")),
            "overlay": _to_preview_url(result.get("preview_overlay_path")),
        }
        logger.info(
            "[API] Preview URLs: rgb=%s skeleton=%s overlay=%s",
            previews["rgb"],
            previews["skeleton"],
            previews["overlay"],
        )
        logger.info(
            "[API] Preview file sizes: rgb=%s skeleton=%s overlay=%s",
            _preview_file_size(result.get("preview_rgb_path")),
            _preview_file_size(result.get("preview_skeleton_path")),
            _preview_file_size(result.get("preview_overlay_path")),
        )

        # ── Step 3-5: Preprocessing + Inference + WER ──
        logger.info(
            "[API] Running CSLR inference for sentence_id=%s with config=%s",
            sentence_id,
            config_name or "<backend-default>",
        )
        runner = _get_inference_runner()
        logger.info("[API] Current preprocessor before optional update: %s", runner.describe_preprocessor())

        # Jika frontend mengirim config_name, update preprocessor.
        # Jika tidak, biarkan backend memakai preprocessor default yang sudah
        # dimuat saat InferenceRunner dibuat.
        if config_name:
            if config_name == "Double_Cosign_sd.yaml":
                config_path = str(CSLR_PROJECT_DIR / "configs" / "Double_Cosign_sd.yaml")
            else:
                config_path = str(CSLR_PROJECT_DIR / "configs" / "experiment_configs" / "normalization" / config_name)
            runner.update_preprocessor(config_path)
        else:
            logger.info("[API] Using backend default preprocessor from InferenceRunner initialization.")

        logger.info("[API] Active preprocessor for this request: %s", runner.describe_preprocessor())

        # Override GT lookup dengan GROUND_TRUTH_TABLE agar tidak bergantung JSON file
        ground_truth_text = GROUND_TRUTH_TABLE[sentence_id]
        inference_result = runner.run_return(skeleton.to_numpy(), sentence_id)

        # Jika GT dari runner adalah [NOT FOUND] (JSON tidak tersedia),
        # override dengan nilai dari GROUND_TRUTH_TABLE yang hardcoded
        if inference_result["ground_truth"] == "[NOT FOUND]":
            from inference.cslr_runner import compute_wer_single
            inference_result["ground_truth"] = ground_truth_text
            wer_val = compute_wer_single(ground_truth_text, inference_result["prediction"])
            inference_result["wer"] = round(wer_val, 6)
            inference_result["wer_percent"] = f"{wer_val * 100:.2f}%"

        total_ms = int((time.perf_counter() - t_start) * 1000)

        payload = {
            "video_id": summary.get("video_id"),
            "num_frames": summary.get("num_frames"),
            "num_keypoints": summary.get("num_keypoints"),
            "previews": previews,
            "inference": inference_result,
            "total_ms": total_ms,
        }

        logger.info(
            "[API] /inference done video_id=%s frames=%s gt='%s' pred='%s' wer=%s",
            payload["video_id"],
            payload["num_frames"],
            inference_result["ground_truth"],
            inference_result["prediction"],
            inference_result["wer_percent"],
        )

        return JSONResponse(payload)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("[API] Inference failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Inference pipeline failed: {str(exc)}") from exc
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
