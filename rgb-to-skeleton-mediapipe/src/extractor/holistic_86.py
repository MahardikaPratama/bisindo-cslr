import cv2
import mediapipe as mp
import numpy as np

from src.config import MEDIAPIPE_CONFIG, TOTAL_KEYPOINTS, USE_3D_COORDINATES
from src.config.keypoint_layout import (
    LEFT_HAND_SELECTION,
    RIGHT_HAND_SELECTION,
)
from src.processor.keypoint_selector import KeypointSelector
from src.utils.exceptions import ExtractionException, ValidationException
from src.utils.logger import get_logger


logger = get_logger(__name__)


class Holistic86Extractor:
    def __init__(self):
        self.mp_holistic = mp.solutions.holistic
        self.model = self.mp_holistic.Holistic(**MEDIAPIPE_CONFIG)
        self.selector = KeypointSelector(use_3d=USE_3D_COORDINATES)

    def extract_frame(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.model.process(rgb)

        keypoints = []

        keypoints.extend(self.selector.select_landmarks(results.left_hand_landmarks, LEFT_HAND_SELECTION))
        keypoints.extend(self.selector.select_landmarks(results.right_hand_landmarks, RIGHT_HAND_SELECTION))

        keypoints = np.array(keypoints, dtype=float)

        if keypoints.shape[0] != TOTAL_KEYPOINTS:
            raise ValidationException(f"Expected {TOTAL_KEYPOINTS} keypoints, got {keypoints.shape[0]}")

        return keypoints

    def extract_video(self, video_path):
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
                all_frames.append(self.extract_frame(frame))

            if len(all_frames) == 0:
                raise ExtractionException(f"Video has no readable frames: {video_path}")

            return np.stack(all_frames)

        finally:
            cap.release()