"""Generate skeleton-only and overlay preview videos for multiple preprocessing variants.

This script is meant to help inspect how the BISINDO CSLR pipeline changes the
hand keypoints across different preprocessing orders.

It produces the following variants:
- original
- normalized
- normalized + downsampling (0.5)
- normalized + downsampling (0.5) + spatial jitter
- normalized + downsampling (0.5) + spatial scale
- normalized + downsampling (0.5) + temporal drop
- normalized + downsampling (0.5) + temporal rescale
- normalized + spatial jitter + downsampling (0.5)
- normalized + spatial scale + downsampling (0.5)
- normalized + temporal drop + downsampling (0.5)
- normalized + temporal rescale + downsampling (0.5)

Outputs are written into the same video output folders used by the RGB-to-
skeleton pipeline, with one subfolder per variant.
"""

from __future__ import annotations

import argparse
import random
import sys
from importlib import util as importlib_util
from pathlib import Path
from typing import Callable

import cv2
import numpy as np
import yaml

PROJECT_ROOT = Path(__file__).resolve().parent
RGB_PIPELINE_ROOT = PROJECT_ROOT / "rgb-to-skeleton-mediapipe"
MSLR_ROOT = PROJECT_ROOT / "mslr_iccv2025"

if str(RGB_PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(RGB_PIPELINE_ROOT))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from inference.preprocessor import SkeletonPreprocessor
from src.config import VIDEO_OUT_OVERLAY_DIR, VIDEO_OUT_SKELETON_DIR
from src.extractor.holistic_86 import Holistic86Extractor
from src.visualizer.draw_utils import draw_skeleton


def _load_module(module_name: str, file_path: Path):
    spec = importlib_util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load module from {file_path}")

    module = importlib_util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_augmentations = _load_module(
    "mslr_skeleton_augmentation",
    MSLR_ROOT / "utils" / "skeleton_augmentation.py",
)
Downsample = _augmentations.Downsample
Jitter = _augmentations.Jitter
Scale = _augmentations.Scale
TemporalDropout = _augmentations.TemporalDropout
TemporalRescale = _augmentations.TemporalRescale


DEFAULT_CONFIG_PATH = MSLR_ROOT / "configs" / "experiment_configs" / "baseline" / "O4.yaml"


def load_feeder_args(config_path: Path) -> dict:
    with open(config_path, "r", encoding="utf-8") as handle:
        cfg = yaml.safe_load(handle)
    feeder_args = dict(cfg.get("feeder_args", {}))
    feeder_args["used_part"] = feeder_args.get("used_part", ["hand21"])
    feeder_args["split"] = feeder_args.get("split", [21, 42])
    feeder_args["norm_point"] = feeder_args.get("norm_point", [0, 21])
    feeder_args["downsampling"] = False
    feeder_args["downsampling_position"] = "after"
    feeder_args["downsampling_ratio"] = 0.5
    feeder_args["augmentation_types"] = []
    return feeder_args


def read_video_frames(video_path: Path) -> tuple[list[np.ndarray], float, tuple[int, int]]:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    try:
        cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)
    except Exception:
        pass

    frames: list[np.ndarray] = []
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or fps is None or np.isnan(fps):
        fps = 30.0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
    finally:
        cap.release()

    if not frames:
        raise RuntimeError(f"Video has no readable frames: {video_path}")

    height, width = frames[0].shape[:2]
    return frames, float(fps), (width, height)


def make_writer(output_path: Path, fps: float, size: tuple[int, int]) -> cv2.VideoWriter:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    for codec in ("mp4v", "MJPG", "XVID", "avc1"):
        writer = cv2.VideoWriter(str(output_path), cv2.VideoWriter_fourcc(*codec), fps, size)
        if writer.isOpened():
            return writer
        writer.release()

    raise RuntimeError(f"Failed to open video writer for {output_path}")


def clip_to_preview(coords: np.ndarray) -> np.ndarray:
    return np.clip(coords, 0.0, 1.0)


def tensor_to_preview_coords(tensor) -> np.ndarray:
    coords = tensor[:, :, :2].detach().cpu().numpy()
    coords = (coords + 1.0) / 2.0
    return clip_to_preview(coords)


def write_variant_videos(
    raw_frames: list[np.ndarray],
    keypoints: np.ndarray,
    output_root: Path,
    video_id: str,
    variant_slug: str,
    fps: float,
    normalized_keypoints: bool,
) -> None:
    skeleton_dir = Path(VIDEO_OUT_SKELETON_DIR) / output_root / variant_slug
    overlay_dir = Path(VIDEO_OUT_OVERLAY_DIR) / output_root / variant_slug
    skeleton_dir.mkdir(parents=True, exist_ok=True)
    overlay_dir.mkdir(parents=True, exist_ok=True)

    skeleton_path = skeleton_dir / f"{video_id}_{variant_slug}_skeleton.mp4"
    overlay_path = overlay_dir / f"{video_id}_{variant_slug}_overlay.mp4"

    if len(keypoints) == 0:
        raise RuntimeError(f"Variant '{variant_slug}' produced zero frames")

    bg_indices = np.linspace(0, len(raw_frames) - 1, len(keypoints)).round().astype(int)

    height, width = raw_frames[0].shape[:2]
    skeleton_writer = make_writer(skeleton_path, fps, (width, height))
    overlay_writer = make_writer(overlay_path, fps, (width, height))

    try:
        for idx, frame_kps in enumerate(keypoints):
            frame_idx = int(bg_indices[idx])
            background_frame = raw_frames[frame_idx]

            skeleton_frame = np.zeros_like(background_frame)
            draw_skeleton(skeleton_frame, frame_kps, normalized=normalized_keypoints)
            skeleton_writer.write(skeleton_frame)

            overlay_frame = background_frame.copy()
            draw_skeleton(overlay_frame, frame_kps, normalized=normalized_keypoints)
            overlay_writer.write(overlay_frame)
    finally:
        skeleton_writer.release()
        overlay_writer.release()


def apply_downsample(sequence: np.ndarray) -> np.ndarray:
    return Downsample(ratio=0.5, random_offset=False)(sequence)


def apply_spatial_jitter(sequence: np.ndarray) -> np.ndarray:
    return Jitter(std_dev=0.006)(sequence)


def apply_spatial_scale(sequence: np.ndarray) -> np.ndarray:
    return Scale(scale_range=(0.8, 1.2))(sequence)


def apply_temporal_drop(sequence: np.ndarray) -> np.ndarray:
    return TemporalDropout(max_dp=0.2)(sequence)


def apply_temporal_rescale(sequence: np.ndarray, sentence_id: str) -> np.ndarray:
    return TemporalRescale(temp_scaling=0.2)(sequence, sentence_id=sentence_id)


def build_variants(normalized: np.ndarray, sentence_id: str) -> list[tuple[str, np.ndarray]]:
    """Build every requested processing order.

    The input is expected to be the normalized preview keypoints in [0, 1].
    """

    def with_seed(seed: int, fn: Callable[[], np.ndarray]) -> np.ndarray:
        random.seed(seed)
        np.random.seed(seed)
        return fn()

    variants: list[tuple[str, np.ndarray]] = []

    variants.append(("normalized", normalized))
    variants.append(("normalized_downsample_05", with_seed(101, lambda: apply_downsample(normalized))))
    variants.append(("normalized_downsample_05_spatial_jitter", with_seed(102, lambda: apply_spatial_jitter(apply_downsample(normalized)))))
    variants.append(("normalized_downsample_05_spatial_scale", with_seed(103, lambda: apply_spatial_scale(apply_downsample(normalized)))))
    variants.append(("normalized_downsample_05_temporal_drop", with_seed(104, lambda: apply_temporal_drop(apply_downsample(normalized)))))
    variants.append(("normalized_downsample_05_temporal_rescale", with_seed(105, lambda: apply_temporal_rescale(apply_downsample(normalized), sentence_id))))

    variants.append(("normalized_spatial_jitter_downsample_05", with_seed(106, lambda: apply_downsample(apply_spatial_jitter(normalized)))))
    variants.append(("normalized_spatial_scale_downsample_05", with_seed(107, lambda: apply_downsample(apply_spatial_scale(normalized)))))
    variants.append(("normalized_temporal_drop_downsample_05", with_seed(108, lambda: apply_downsample(apply_temporal_drop(normalized)))))
    variants.append(("normalized_temporal_rescale_downsample_05", with_seed(109, lambda: apply_downsample(apply_temporal_rescale(normalized, sentence_id)))))

    return variants


def extract_original_keypoints(frames: np.ndarray) -> np.ndarray:
    return clip_to_preview(frames[:, :, :2])


def extract_normalized_keypoints(frames: np.ndarray, feeder_args: dict, cslr_project_root: Path, sentence_id: str) -> np.ndarray:
    preprocessor = SkeletonPreprocessor(feeder_args, cslr_project_root)
    tensor = preprocessor.preprocess(frames, sentence_id=sentence_id)
    return tensor_to_preview_coords(tensor)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate skeleton and overlay previews for multiple keypoint variants.")
    parser.add_argument("video_path", type=Path, help="Input RGB video path")
    parser.add_argument(
        "--config",
        type=Path,
        default=DEFAULT_CONFIG_PATH,
        help=f"Experiment config YAML used to derive normalization settings (default: {DEFAULT_CONFIG_PATH})",
    )
    parser.add_argument(
        "--output-subdir",
        type=Path,
        default=Path("variant-previews"),
        help="Subdirectory name under the package preview output folders",
    )
    parser.add_argument(
        "--sentence-id",
        type=str,
        default=None,
        help="Sentence ID used by temporal rescale bounds. Defaults to the input file stem.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=1234,
        help="Random seed for augmentation reproducibility",
    )
    args = parser.parse_args()

    video_path = args.video_path.resolve()
    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    sentence_id = args.sentence_id or video_path.stem
    output_root = args.output_subdir

    extractor = Holistic86Extractor()
    raw_kps = extractor.extract_video(str(video_path))

    feeder_args = load_feeder_args(args.config)
    normalized_kps = extract_normalized_keypoints(raw_kps, feeder_args, PROJECT_ROOT, sentence_id)
    original_kps = extract_original_keypoints(raw_kps)

    raw_frames, fps, _ = read_video_frames(video_path)

    variant_sequences: list[tuple[str, np.ndarray]] = [
        ("original", original_kps),
    ]
    variant_sequences.extend(build_variants(normalized_kps, sentence_id))

    for index, (variant_slug, sequence) in enumerate(variant_sequences):
        random.seed(args.seed + index)
        np.random.seed(args.seed + index)

        normalized_flag = True
        write_variant_videos(
            raw_frames=raw_frames,
            keypoints=sequence,
            output_root=output_root,
            video_id=video_path.stem,
            variant_slug=variant_slug,
            fps=fps,
            normalized_keypoints=normalized_flag,
        )
        print(f"[OK] {variant_slug} -> skeleton and overlay videos written")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
