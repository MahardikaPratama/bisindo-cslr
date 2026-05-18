from typing import List

import numpy as np


class KeypointSelector:
    """Selects and formats landmarks from MediaPipe-like outputs."""

    def __init__(self, use_3d: bool = False):
        self.use_3d = use_3d

    def select_landmarks(self, landmarks, selection: List[int]) -> List[List[float]]:
        """Extract selected landmarks into [x, y, confidence] or [x, y, z]."""
        if landmarks is None:
            return [[0.0, 0.0, 0.0] for _ in selection]

        output: List[List[float]] = []
        for idx in selection:
            lm = landmarks.landmark[idx]
            coords = [float(lm.x), float(lm.y)]
            if self.use_3d:
                coords.append(float(getattr(lm, "z", 0.0)))
            else:
                confidence = float(getattr(lm, "visibility", getattr(lm, "presence", 1.0)))
                coords.append(confidence)
            output.append(coords)
        return output

    def validate(self, arr: np.ndarray, expected_kpts: int, expected_dims: int) -> bool:
        """Basic validation helper for downstream tests."""
        if not isinstance(arr, np.ndarray):
            raise ValueError("Keypoints must be a numpy.ndarray")
        if arr.ndim != 2:
            raise ValueError(f"Expected 2D array for single-frame keypoints, got ndim={arr.ndim}")
        if arr.shape[0] != expected_kpts:
            raise ValueError(f"Expected {expected_kpts} keypoints, got {arr.shape[0]}")
        if arr.shape[1] != expected_dims:
            raise ValueError(f"Expected {expected_dims} dims, got {arr.shape[1]}")
        return True


__all__ = ["KeypointSelector"]