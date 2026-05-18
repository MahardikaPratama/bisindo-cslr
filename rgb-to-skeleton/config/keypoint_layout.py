"""
Keypoint layout and selection configuration.

Centralizes all keypoint selection indices used by the extractors and
processors. This module intentionally imports range constants from
`config.settings` so existing callers that reference ranges continue to
work while providing explicit selection lists for processors.
"""
from typing import Dict, List, Tuple

from .settings import (
    LEFT_HAND_RANGE,
    RIGHT_HAND_RANGE,
    MOUTH_RANGE,
    POSE_RANGE,
    TOTAL_KEYPOINTS,
)

# Convert ranges to explicit selections when needed by processors.
# Selections here are RELATIVE to the specific landmark set returned by
# MediaPipe for each region (e.g., hand landmarks are 0..20, pose landmarks
# are 0..24). We therefore convert the configured ranges into local
# zero-based selections for each region.
LEFT_HAND_SELECTION: List[int] = list(range(0, LEFT_HAND_RANGE[1] - LEFT_HAND_RANGE[0]))
RIGHT_HAND_SELECTION: List[int] = list(range(0, RIGHT_HAND_RANGE[1] - RIGHT_HAND_RANGE[0]))

# Mouth selection uses specific 468-face-mesh indices targeting lips
# These indices were chosen for the Isharah specification and are stable
# for reproducibility across experiments.
MOUTH_SELECTION: List[int] = [
    61, 185, 40, 39, 37, 0, 267, 269, 270, 409,  # outer lip
    78, 191, 80, 81, 82, 13, 312, 311, 308,      # inner lip
]

POSE_SELECTION: List[int] = list(range(0, POSE_RANGE[1] - POSE_RANGE[0]))

KEYPOINT_RANGES: Dict[str, Tuple[int, int]] = {
    "left_hand": LEFT_HAND_RANGE,
    "right_hand": RIGHT_HAND_RANGE,
    "mouth": MOUTH_RANGE,
    "pose": POSE_RANGE,
}

KEYPOINT_SELECTIONS: Dict[str, List[int]] = {
    "left_hand": LEFT_HAND_SELECTION,
    "right_hand": RIGHT_HAND_SELECTION,
    "mouth": MOUTH_SELECTION,
    "pose": POSE_SELECTION,
}

__all__ = [
    "LEFT_HAND_SELECTION",
    "RIGHT_HAND_SELECTION",
    "MOUTH_SELECTION",
    "POSE_SELECTION",
    "KEYPOINT_SELECTIONS",
    "KEYPOINT_RANGES",
    "TOTAL_KEYPOINTS",
]
