"""
Core Pipeline Module

This module orchestrates the extraction of keypoints from video files
and dispatches the results to JSON export and preview generators.
"""

import os
from pathlib import Path

import numpy as np
from typing import TypedDict

from core.metadata import parse_video_id
from extractor.holistic_86 import Holistic86Extractor
from visualizer.preview_generator import PreviewGenerator
from data.skeleton import SkeletonSequence
from data.writer import DiskWriter
from utils.logger import get_logger


logger = get_logger(__name__)


class ProcessingResult(TypedDict):
    """Typed result returned by the backend pipeline (in-memory)."""

    video_id: str
    skeleton: SkeletonSequence
    preview_rgb_path: str | None
    preview_skeleton_path: str | None
    preview_overlay_path: str | None


class SkeletonPipeline:
    """Main orchestration class for the backend workflow (in-memory).

    Supports optional persisting to disk via `DiskWriter` and background writes.
    """

    def __init__(self, save_previews: bool = True, save_to_disk: bool = False, async_save: bool = False):
        """Initialize the pipeline.

        Args:
            save_previews: Whether to generate RGB, skeleton, and overlay previews.
            save_to_disk: Whether to persist JSON to disk.
            async_save: If True and `save_to_disk` is True, perform disk writes in background threads.
        """
        self.extractor = Holistic86Extractor()
        self.preview_conv = PreviewGenerator()

        self.save_previews = save_previews
        self.save_to_disk = save_to_disk
        self.async_save = async_save
        self.writer: DiskWriter | None = DiskWriter() if save_to_disk else None

        self.last_preview_rgb_path: str | None = None
        self.last_preview_skeleton_path: str | None = None
        self.last_preview_overlay_path: str | None = None

    def process_video(self, video_path: str, output_subpath: str = "") -> ProcessingResult:
        """Extract keypoints from one video file and return an in-memory `SkeletonSequence`.

        Args:
            video_path: Path to the input RGB video.
            output_subpath: Relative subpath for mirrored output folders (used for previews).

        Returns:
            ProcessingResult with the in-memory skeleton sequence and optional preview paths.

        Raises:
            FileNotFoundError: If the video path does not exist.
        """
        if not os.path.isfile(video_path):
            raise FileNotFoundError(f"Video not found: {video_path}")

        path_obj = Path(video_path)
        video_id = parse_video_id(path_obj)

        logger.info("Processing %s -> %s (subpath: %s)", path_obj.name, video_id, output_subpath or ".")

        keypoints = self.extractor.extract_video(video_path)

        if keypoints.ndim != 3:
            raise ValueError(f"Expected keypoints shape (T, K, C), got {keypoints.shape}")

        logger.info("Frames extracted: %s", int(keypoints.shape[0]))

        skeleton_seq = SkeletonSequence.from_numpy(video_id, keypoints)

        result: ProcessingResult = {
            "video_id": video_id,
            "skeleton": skeleton_seq,
            "preview_rgb_path": None,
            "preview_skeleton_path": None,
            "preview_overlay_path": None,
        }


        # persistence and previews
        futures = {}

        if self.save_to_disk and self.writer is not None:
            if self.async_save:
                futures["json"] = self.writer.save_json_async(skeleton_seq, output_subpath, filename=f"{video_id}.json")
            else:
                json_path = self.writer.save_json(skeleton_seq, output_subpath, filename=f"{video_id}.json")
                result["json_path"] = json_path

        if self.save_previews:
            if self.save_to_disk and self.async_save and self.writer is not None:
                # schedule preview generation on writer executor to avoid extra threadpools
                ex = self.writer.executor
                futures["preview_rgb"] = ex.submit(self.preview_conv.generate_rgb_preview, video_path, video_id, output_subpath)
                futures["preview_skeleton"] = ex.submit(self.preview_conv.generate_skeleton_only, skeleton_seq.to_numpy(), video_id, output_subpath)
                futures["preview_overlay"] = ex.submit(self.preview_conv.generate_overlay, skeleton_seq.to_numpy(), video_path, video_id, output_subpath)
            else:
                self.last_preview_rgb_path = self.preview_conv.generate_rgb_preview(video_path, video_id, output_subpath=output_subpath)
                self.last_preview_skeleton_path = self.preview_conv.generate_skeleton_only(skeleton_seq.to_numpy(), video_id, output_subpath=output_subpath)
                self.last_preview_overlay_path = self.preview_conv.generate_overlay(skeleton_seq.to_numpy(), video_path, video_id, output_subpath=output_subpath)

                result["preview_rgb_path"] = self.last_preview_rgb_path
                result["preview_skeleton_path"] = self.last_preview_skeleton_path
                result["preview_overlay_path"] = self.last_preview_overlay_path

        if futures:
            result["futures"] = futures

        return result
