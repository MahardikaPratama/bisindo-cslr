#!/usr/bin/env python3
"""
Entry point for the backend pipeline.

Run this file directly to process one video.

Examples:
    python main.py --input data/raw/marah.mp4
"""

import os
import importlib
import sys
import time
import warnings
from datetime import timedelta
from pathlib import Path

# Silence noisy third-party logs before importing MediaPipe / TensorFlow.
# Level 3 is the most aggressive and is usually needed for native C++ warnings.
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("GLOG_minloglevel", "3")
os.environ.setdefault("FLAGS_minloglevel", "3")
os.environ.setdefault("ABSL_MIN_LOG_LEVEL", "3")

try:
    absl_logging = importlib.import_module("absl.logging")
    absl_logging.set_verbosity("fatal")
    absl_logging.set_stderrthreshold("fatal")
except Exception:
    pass

PROJECT_MODULE_DIR = Path(__file__).resolve().parent / "rgb-to-skeleton"
if str(PROJECT_MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_MODULE_DIR))

warnings.filterwarnings(
    "ignore",
    message=r"SymbolDatabase\.GetPrototype\(\) is deprecated.*",
    category=UserWarning,
)
stderr_filters = importlib.import_module("utils.stderr_filters")
NativeStderrFilter = stderr_filters.NativeStderrFilter
stderr_filters.install_filtered_stderr()

get_logger = importlib.import_module("utils.logger").get_logger
SkeletonPipeline = importlib.import_module("core.pipeline").SkeletonPipeline
parse_args = importlib.import_module("core.cli").parse_args


logger = get_logger(__name__)


def main() -> int:
    """Run the single-video backend pipeline and report generated artifacts."""
    args = parse_args()
    input_path = args.input

    if not os.path.isfile(input_path):
        raise FileNotFoundError(f"Input path does not exist or is not a file: {input_path}")

    start_time = time.time()
    with NativeStderrFilter():
        pipeline = SkeletonPipeline(save_to_disk=bool(getattr(args, "save_to_disk", False)), async_save=bool(getattr(args, "async_save", False)))
        result = pipeline.process_video(input_path)

    skeleton = result.get("skeleton")
    if skeleton is not None:
        summary = skeleton.summary()
        logger.info(
            "Done video_id=%s frames=%s keypoints=%s previews=[rgb,skeleton,overlay]",
            summary.get("video_id"),
            summary.get("num_frames"),
            summary.get("num_keypoints"),
        )

    preview_paths = {
        "rgb": Path(result.get("preview_rgb_path") or "").name or None,
        "skeleton": Path(result.get("preview_skeleton_path") or "").name or None,
        "overlay": Path(result.get("preview_overlay_path") or "").name or None,
    }
    logger.info("Preview files: %s", preview_paths)

    # If background writes were submitted, log futures and optionally wait
    futures = result.get("futures")
    if futures:
        logger.info("Background write tasks submitted: %s", ", ".join(sorted(futures.keys())))
        if not getattr(args, "async_save", False):
            # If async_save was False, futures shouldn't exist; but guard anyway
            for name, fut in futures.items():
                try:
                    fut.result()
                    logger.info("Background task %s completed", name)
                except Exception as exc:
                    logger.exception("Background task %s failed: %s", name, exc)

    elapsed = time.time() - start_time
    logger.info("Total execution time: %s", timedelta(seconds=int(elapsed)))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())