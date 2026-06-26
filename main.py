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

PROJECT_MODULE_DIR = Path(__file__).resolve().parent / "rgb-to-skeleton-mediapipe"
if str(PROJECT_MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_MODULE_DIR))

warnings.filterwarnings(
    "ignore",
    message=r"SymbolDatabase\.GetPrototype\(\) is deprecated.*",
    category=UserWarning,
)
from contextlib import nullcontext as NativeStderrFilter

get_logger = importlib.import_module("src.utils.logger").get_logger
SkeletonPipeline = importlib.import_module("src.core.pipeline").SkeletonPipeline
parse_args = importlib.import_module("src.core.cli").parse_args

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
        pipeline = SkeletonPipeline()
        keypoints = pipeline.process_video(input_path)

    if keypoints is not None:
        logger.info(
            "Done video_id=%s frames=%s keypoints=%s previews=[rgb,skeleton,overlay]",
            Path(input_path).stem,
            keypoints.shape[0],
            keypoints.shape[1],
        )

    # ----------------------------------------------------------------
    # CSLR Inference (opsional — hanya jika --checkpoint diberikan)
    # ----------------------------------------------------------------
    checkpoint = getattr(args, "checkpoint", None)
    if checkpoint is not None and keypoints is not None:
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
                frames=keypoints,
                sentence_id=sentence_id,
            )
        except Exception as exc:
            logger.exception("[CSLR] Inference gagal: %s", exc)
    elif checkpoint is None:
        logger.info(
            "[CSLR] --checkpoint tidak diberikan — inference dilewati. "
            "Gunakan --checkpoint <path.pt> untuk mengaktifkan inference."
        )

    logger.info("Preview files: {'rgb': None, 'skeleton': None, 'overlay': None}")

    elapsed = time.time() - start_time
    logger.info("Total execution time: %s", timedelta(seconds=int(elapsed)))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())