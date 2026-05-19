from __future__ import annotations

import importlib
import os
import shutil
import uuid
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles


# Silence noisy third-party logs before importing MediaPipe / TensorFlow.
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("GLOG_minloglevel", "3")
os.environ.setdefault("FLAGS_minloglevel", "3")
os.environ.setdefault("ABSL_MIN_LOG_LEVEL", "3")

PROJECT_ROOT = Path(__file__).resolve().parent
PROJECT_MODULE_DIR = PROJECT_ROOT / "rgb-to-skeleton"
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

app = FastAPI(title="BISINDO Preview API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/preview", StaticFiles(directory=str(PREVIEW_DIR)), name="preview")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/preview/process")
async def process_preview(video: UploadFile = File(...)) -> JSONResponse:
    if not video.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    suffix = Path(video.filename).suffix.lower()
    if suffix not in {".mp4", ".mov", ".avi", ".mkv", ".webm"}:
        raise HTTPException(status_code=400, detail="Unsupported video format")

    request_id = uuid.uuid4().hex[:12]
    temp_filename = f"{request_id}_{Path(video.filename).name}"
    temp_path = UPLOAD_DIR / temp_filename

    try:
        with temp_path.open("wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

        with NativeStderrFilter():
            pipeline = SkeletonPipeline(save_to_disk=False, async_save=False)
            result: Dict[str, Any] = pipeline.process_video(str(temp_path))

        skeleton = result.get("skeleton")
        if skeleton is None:
            raise HTTPException(status_code=500, detail="Failed to produce skeleton output")

        summary = skeleton.summary()

        def to_preview_url(path_value: Any) -> str | None:
            if not path_value:
                return None
            path_obj = Path(str(path_value)).resolve()
            try:
                rel = path_obj.relative_to(PREVIEW_DIR.resolve())
            except ValueError:
                return None
            return f"/preview/{rel.as_posix()}"

        payload = {
            "video_id": summary.get("video_id"),
            "num_frames": summary.get("num_frames"),
            "num_keypoints": summary.get("num_keypoints"),
            "previews": {
                "rgb": to_preview_url(result.get("preview_rgb_path")),
                "skeleton": to_preview_url(result.get("preview_skeleton_path")),
                "overlay": to_preview_url(result.get("preview_overlay_path")),
            },
        }

        logger.info(
            "API done video_id=%s frames=%s previews=%s",
            payload["video_id"],
            payload["num_frames"],
            payload["previews"],
        )

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
        if temp_path.exists():
            try:
                temp_path.unlink()
            except OSError:
                pass
