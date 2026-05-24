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

CSLR_PROJECT_DIR = Path(__file__).resolve().parent / "mslr_iccv2025"


logger = get_logger(__name__)


def _build_extended_parser():
    """Extends the rgb-to-skeleton CLI parser with CSLR inference arguments."""
    import argparse
    parser = argparse.ArgumentParser(
        description="Process a single video into skeleton and optionally run CSLR inference.",
        parents=[],
        add_help=True,
    )
    parser.add_argument("--input", "-i", required=True, help="Path to input video file.")
    parser.add_argument(
        "--save-to-disk", action="store_true",
        help="Persist extracted skeleton data (JSON) to disk.",
    )
    parser.add_argument(
        "--async-save", action="store_true",
        help="Perform disk writes in background threads.",
    )
    # --- CSLR Inference args ---
    parser.add_argument(
        "--sentence-id",
        default=None,
        help="ID kalimat untuk lookup ground truth (contoh: S001). "
             "Wajib diisi untuk menghitung WER.",
    )
    parser.add_argument(
        "--checkpoint",
        default=None,
        help="Path ke file .pt bobot model CSLR. Jika tidak diisi, inference dilewati.",
    )
    parser.add_argument(
        "--cslr-config",
        default=str(CSLR_PROJECT_DIR / "configs" / "experiment_configs" / "normalization" / "Baseline+TN.yaml"),
        help="Path ke config YAML model CSLR (default: Baseline+TN.yaml).",
    )
    parser.add_argument(
        "--annotation-split",
        default="test_sd",
        help="Split anotasi untuk lookup ground truth "
             "(pilihan: train, dev, test_sd, test_si_major, test_si_minor). Default: test_sd.",
    )
    return parser


def main() -> int:
    """Run the single-video backend pipeline and report generated artifacts."""
    args = _build_extended_parser().parse_args()
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

    # ----------------------------------------------------------------
    # CSLR Inference (opsional — hanya jika --checkpoint diberikan)
    # ----------------------------------------------------------------
    checkpoint = getattr(args, "checkpoint", None)
    if checkpoint is not None and skeleton is not None:
        logger.info("[CSLR] Memulai inference pipeline.")
        try:
            from inference import InferenceRunner

            sentence_id = getattr(args, "sentence_id", None) or "UNKNOWN"
            cslr_config = getattr(args, "cslr_config", None) or str(
                CSLR_PROJECT_DIR / "configs" / "experiment_configs" / "normalization" / "Baseline+TN.yaml"
            )
            annotation_split = getattr(args, "annotation_split", "test_sd")

            runner = InferenceRunner(
                cslr_project_dir=str(CSLR_PROJECT_DIR),
                config_path=cslr_config,
                checkpoint_path=checkpoint,
                annotation_split=annotation_split,
            )
            runner.run(
                frames=skeleton.to_numpy(),
                sentence_id=sentence_id,
            )
        except Exception as exc:
            logger.exception("[CSLR] Inference gagal: %s", exc)
    elif checkpoint is None:
        logger.info(
            "[CSLR] --checkpoint tidak diberikan — inference dilewati. "
            "Gunakan --checkpoint <path.pt> untuk mengaktifkan inference."
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