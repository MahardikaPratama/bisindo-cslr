"""Preview generation helpers for RGB, skeleton-only, and overlay videos."""

import cv2
import os

import numpy as np
from typing import Optional

from config import (
    PREVIEW_FPS,
    PREVIEW_RESOLUTION,
    PREVIEW_RGB_DIR,
    PREVIEW_SKELETON_DIR,
    PREVIEW_OVERLAY_DIR
)

from visualizer.draw_skeleton import SkeletonDrawer
from utils.logger import get_logger


logger = get_logger(__name__)


class PreviewGenerator:
    """Generate preview artifacts from extracted keypoints."""

    def __init__(self) -> None:
        # Drawer is created per preview using the actual resolution.
        self.default_resolution = PREVIEW_RESOLUTION

    def generate_rgb_preview(
        self,
        original_video_path: str,
        output_name: str,
        resolution: tuple[int, int] | None = None,
        output_subpath: str = "",
    ) -> str:
        """
        Create a resized RGB preview from the source video.
        """
        output_dir = os.path.join(PREVIEW_RGB_DIR, output_subpath)
        os.makedirs(output_dir, exist_ok=True)

        output_path = os.path.join(output_dir, f"{output_name}_rgb.mp4")

        cap = cv2.VideoCapture(original_video_path)
        cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)

        if resolution is None:
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            resolution = (width, height)

        res = (int(resolution[0]), int(resolution[1]))
        writer = self._make_writer(output_path, PREVIEW_FPS, res, preferred_codecs=("avc1", "H264", "X264", "mp4v", "XVID", "MJPG"))

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            writer.write(cv2.resize(frame, res))

        cap.release()
        writer.release()

        logger.info("RGB preview saved to %s", output_path)
        return output_path

    def generate_skeleton_only(
        self,
        keypoints: np.ndarray,
        output_name: str,
        resolution: tuple[int, int] | None = None,
        output_subpath: str = "",
    ) -> str:
        """
        Create a skeleton-only preview from extracted keypoints.
        """
        output_dir = os.path.join(PREVIEW_SKELETON_DIR, output_subpath)
        os.makedirs(output_dir, exist_ok=True)

        output_path = os.path.join(
            output_dir,
            f"{output_name}_skeleton.mp4"
        )

        # Force skeleton-only previews to a fixed 256x256 resolution.
        # This ensures consistency across videos with different resolutions
        # and avoids estimation / visual mismatch caused by varying sizes.
        resolution = (256, 256)

        # Ensure integers
        res = (int(resolution[0]), int(resolution[1]))

        # Prefer Windows-friendly MP4 codec and fall back if unavailable
        writer = self._make_writer(output_path, PREVIEW_FPS, res, preferred_codecs=("avc1", "H264", "X264", "mp4v", "XVID", "MJPG"))

        drawer = SkeletonDrawer(res)

        for frame_kp in keypoints:
            frame = drawer.draw_frame(frame_kp, background=None)
            writer.write(frame)

        writer.release()
        logger.info("Skeleton-only preview saved to %s", output_path)
        return output_path

    def generate_overlay(
        self,
        keypoints: np.ndarray,
        original_video_path: str,
        output_name: str,
        resolution: tuple[int, int] | None = None,
        output_subpath: str = "",
    ) -> str:
        """
        Create an RGB-skeleton overlay preview.
        """
        output_dir = os.path.join(PREVIEW_OVERLAY_DIR, output_subpath)
        os.makedirs(output_dir, exist_ok=True)

        output_path = os.path.join(
            output_dir,
            f"{output_name}_overlay.mp4"
        )

        cap = cv2.VideoCapture(original_video_path)

        # Respect rotation metadata so output matches original orientation
        cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)

        # Determine resolution AFTER enabling auto-rotation
        # (rotated videos swap width/height)
        if resolution is None:
            width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            resolution = (width, height)

        res = (int(resolution[0]), int(resolution[1]))

        writer = self._make_writer(output_path, PREVIEW_FPS, res, preferred_codecs=("avc1", "H264", "X264", "mp4v", "XVID", "MJPG"))

        drawer = SkeletonDrawer(res)

        t = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret or t >= len(keypoints):
                break

            overlay_frame = drawer.draw_frame(
                keypoints[t],
                background=frame
            )

            writer.write(overlay_frame)
            t += 1

        cap.release()
        writer.release()

        logger.info("Overlay preview saved to %s", output_path)
        return output_path

    def _make_writer(self, output_path: str, fps: int, res: tuple[int, int], preferred_codecs=("avc1", "H264", "X264", "mp4v", "XVID", "MJPG")):
        """Try multiple fourcc codecs and return a working VideoWriter.

        This avoids hard-dependency on a single codec (e.g. libopenh264).
        """
        for code in preferred_codecs:
            fourcc = cv2.VideoWriter_fourcc(*code)
            writer = cv2.VideoWriter(output_path, fourcc, fps, res)
            if writer.isOpened():
                logger.debug("Using codec %s for %s", code, output_path)
                return writer
            else:
                # ensure release and try next
                try:
                    writer.release()
                except Exception:
                    pass

        # Last resort: attempt without specifying codec (let OpenCV choose)
        writer = cv2.VideoWriter(output_path, 0, fps, res)
        if writer.isOpened():
            logger.debug("Using default codec for %s", output_path)
            return writer
        raise RuntimeError(f"Failed to create VideoWriter for {output_path} with codecs {preferred_codecs}")