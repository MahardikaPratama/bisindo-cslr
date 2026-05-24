"""
Holistic86Extractor

Extracts 86 keypoints per frame from an RGB video using MediaPipe Holistic.

Keypoint layout (matches isharah format):
    Index  0 – 20  : Left Hand  (GL) — 21 keypoints  → hand landmarks 0–20
    Index 21 – 41  : Right Hand (GR) — 21 keypoints  → hand landmarks 0–20
    Index 42 – 60  : Mouth      (GM) — 19 keypoints  → face landmarks 0–18
    Index 61 – 85  : Pose       (GP) — 25 keypoints  → pose landmarks 0–24

All regions are selected sequentially (landmark 0 to N-1).
Counts are derived from the range constants in config/settings.py.
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Any

from config import MEDIAPIPE_CONFIG, TOTAL_KEYPOINTS, USE_3D_COORDINATES
from config.keypoint_layout import (
    LEFT_HAND_SELECTION,
    RIGHT_HAND_SELECTION,
    MOUTH_SELECTION,
    POSE_SELECTION,
)
from processor.keypoint_selector import KeypointSelector
from utils.exceptions import ExtractionException, ValidationException
from utils.logger import get_logger


logger = get_logger(__name__)


def pad_to_16_9(frame: np.ndarray) -> np.ndarray:
    """Pad the video frame to 16:9 aspect ratio to maintain MediaPipe coordinate scales."""
    h, w = frame.shape[:2]
    target_aspect = 16.0 / 9.0
    current_aspect = w / h

    if abs(current_aspect - target_aspect) < 0.01:
        return frame

    if current_aspect < target_aspect:
        # Pillarbox (add left/right padding)
        new_w = int(h * target_aspect)
        pad_w = new_w - w
        left = pad_w // 2
        right = pad_w - left
        return cv2.copyMakeBorder(frame, 0, 0, left, right, cv2.BORDER_CONSTANT, value=[0, 0, 0])
    else:
        # Letterbox (add top/bottom padding)
        new_h = int(w / target_aspect)
        pad_h = new_h - h
        top = pad_h // 2
        bottom = pad_h - top
        return cv2.copyMakeBorder(frame, top, bottom, 0, 0, cv2.BORDER_CONSTANT, value=[0, 0, 0])


class Holistic86Extractor:
    """Extract 86 keypoints from RGB videos using MediaPipe Holistic."""

    def __init__(self) -> None:
        self.mp_holistic = mp.solutions.holistic
        self.model = self.mp_holistic.Holistic(**MEDIAPIPE_CONFIG)
        self.selector = KeypointSelector(use_3d=USE_3D_COORDINATES)

    def extract_frame(self, frame: np.ndarray) -> np.ndarray:
        """
        Extract 86 keypoints from a single BGR video frame.

        Output shape: (86, 3) where the third value is confidence by default.

        Layout:
            [  0– 20] Left Hand  (GL) — face landmarks  0–20
            [ 21– 41] Right Hand (GR) — hand landmarks  0–20
            [ 42– 60] Mouth      (GM) — face landmarks  0–18
            [ 61– 85] Pose       (GP) — pose landmarks  0–24
        """

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.model.process(rgb_frame)

        keypoints = []

        keypoints.extend(self.selector.select_landmarks(results.left_hand_landmarks, LEFT_HAND_SELECTION))
        keypoints.extend(self.selector.select_landmarks(results.right_hand_landmarks, RIGHT_HAND_SELECTION))
        keypoints.extend(self.selector.select_landmarks(results.face_landmarks, MOUTH_SELECTION))
        keypoints.extend(self.selector.select_landmarks(results.pose_landmarks, POSE_SELECTION))

        keypoints = np.array(keypoints, dtype=float)

        if keypoints.shape[0] != TOTAL_KEYPOINTS:
            raise ValidationException(f"Expected {TOTAL_KEYPOINTS} keypoints, got {keypoints.shape[0]}")

        return keypoints

    def extract_video(self, video_path: str) -> np.ndarray:
        """
        Extract all frames from a video file.

        Returns
        -------
        np.ndarray, shape (T, 86, 3)
            T = number of frames
        """

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ExtractionException(f"Cannot open video: {video_path}")

        # Respect rotation metadata when possible
        try:
            cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)
        except Exception:
            logger.debug("Video capture does not support ORIENTATION_AUTO on this platform")

        all_frames = []

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                frame = pad_to_16_9(frame)
                all_frames.append(self.extract_frame(frame))

            if len(all_frames) == 0:
                raise ExtractionException(f"Video has no readable frames: {video_path}")

            return np.stack(all_frames)

        finally:
            cap.release()