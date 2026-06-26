from typing import Dict, List, Tuple

from .settings import (
    LEFT_HAND_RANGE,
    RIGHT_HAND_RANGE,
    TOTAL_KEYPOINTS,
)

# Convert ranges to explicit selections when needed by processors
LEFT_HAND_SELECTION: List[int] = list(range(21))
RIGHT_HAND_SELECTION: List[int] = list(range(21))

KEYPOINT_RANGES: Dict[str, Tuple[int, int]] = {
    "left_hand": LEFT_HAND_RANGE,
    "right_hand": RIGHT_HAND_RANGE,
}

KEYPOINT_SELECTIONS: Dict[str, List[int]] = {
    "left_hand": LEFT_HAND_SELECTION,
    "right_hand": RIGHT_HAND_SELECTION,
}

__all__ = [
    "LEFT_HAND_SELECTION",
    "RIGHT_HAND_SELECTION",
    "KEYPOINT_SELECTIONS",
    "KEYPOINT_RANGES",
    "TOTAL_KEYPOINTS",
]
