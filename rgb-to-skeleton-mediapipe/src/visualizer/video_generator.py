import cv2
import numpy as np
import os
from pathlib import Path
import logging

from src.config import VIDEO_OUT_SKELETON_DIR, VIDEO_OUT_OVERLAY_DIR
from src.visualizer.draw_utils import draw_skeleton

logger = logging.getLogger(__name__)

class VideoGenerator:
    """Generates visualization videos (skeleton-only and overlay)."""

    def __init__(self):
        os.makedirs(VIDEO_OUT_SKELETON_DIR, exist_ok=True)
        os.makedirs(VIDEO_OUT_OVERLAY_DIR, exist_ok=True)

    def generate(self, raw_video_path: str, keypoints: np.ndarray, video_id: str, output_subpath: str = "", save_skeleton: bool = True, save_overlay: bool = True, frame_indices: np.ndarray | None = None, normalized_keypoints: bool = False):
        """
        Generates and saves the videos.
        Args:
            raw_video_path: Path to the original raw RGB video.
            keypoints: ndarray of shape (T, 42, 2)
            video_id: Name of the video (without extension)
            output_subpath: Subdirectory to preserve folder structures
        """
        if not save_skeleton and not save_overlay:
            return

        if frame_indices is None:
            frame_indices = np.arange(keypoints.shape[0])

        frame_indices = np.asarray(frame_indices, dtype=int)
        frame_count = min(len(frame_indices), keypoints.shape[0])
        frame_indices = frame_indices[:frame_count]
        keypoints = keypoints[:frame_count]

        cap = cv2.VideoCapture(raw_video_path)
        if not cap.isOpened():
            logger.error(f"Cannot open raw video for visualization: {raw_video_path}")
            return

        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0 or fps is None or np.isnan(fps):
            fps = 30.0

        fourcc = cv2.VideoWriter_fourcc(*'avc1')

        # Prepare writers
        out_skel = None
        out_over = None

        if save_skeleton:
            skel_dir = os.path.join(VIDEO_OUT_SKELETON_DIR, output_subpath)
            os.makedirs(skel_dir, exist_ok=True)
            skel_path = os.path.join(skel_dir, f"{video_id}_skeleton.mp4")
            out_skel = cv2.VideoWriter(skel_path, fourcc, fps, (width, height))

        if save_overlay:
            over_dir = os.path.join(VIDEO_OUT_OVERLAY_DIR, output_subpath)
            os.makedirs(over_dir, exist_ok=True)
            over_path = os.path.join(over_dir, f"{video_id}_overlay.mp4")
            out_over = cv2.VideoWriter(over_path, fourcc, fps, (width, height))

        try:
            for frame_idx, source_frame_idx in enumerate(frame_indices):
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(source_frame_idx))
                ret, frame = cap.read()
                if not ret:
                    break

                frame_kps = keypoints[frame_idx]

                # Generate skeleton only (black background)
                if save_skeleton:
                    bg_skel = np.zeros((height, width, 3), dtype=np.uint8)
                    draw_skeleton(bg_skel, frame_kps, normalized=normalized_keypoints)
                    out_skel.write(bg_skel)

                # Generate overlay
                if save_overlay:
                    # Make a copy so we don't accidentally modify the raw frame if used elsewhere
                    bg_over = frame.copy()
                    draw_skeleton(bg_over, frame_kps, normalized=normalized_keypoints)
                    out_over.write(bg_over)
        finally:
            cap.release()
            if out_skel:
                out_skel.release()
            if out_over:
                out_over.release()

        if save_skeleton:
            logger.info(f"Saved Skeleton Video: {skel_path}")
        if save_overlay:
            logger.info(f"Saved Overlay Video: {over_path}")
