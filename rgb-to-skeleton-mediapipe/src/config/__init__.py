"""
Configuration Package

This package consolidates directory paths, system settings, and keypoint layout
definitions used by the RGB-to-skeleton pipeline.
"""

from .paths import (
    PROJECT_ROOT,
    DATA_DIR,
    RAW_VIDEO_DIR,
    JSON_DIR,
    VIDEO_OUT_SKELETON_DIR,
    VIDEO_OUT_OVERLAY_DIR,
)

from .settings import (
    MEDIAPIPE_CONFIG,
    TOTAL_KEYPOINTS,
    LEFT_HAND_RANGE,
    RIGHT_HAND_RANGE,
    USE_3D_COORDINATES,
    SAVE_JSON,
    SAVE_VIDEO_SKELETON,
    SAVE_VIDEO_OVERLAY,
)

# New selection lists for processors
from .keypoint_layout import (
    LEFT_HAND_SELECTION,
    RIGHT_HAND_SELECTION,
    KEYPOINT_SELECTIONS,
)

__all__ = [
    # paths
    "PROJECT_ROOT",
    "DATA_DIR",
    "RAW_VIDEO_DIR",
    "JSON_DIR",
    "VIDEO_OUT_SKELETON_DIR",
    "VIDEO_OUT_OVERLAY_DIR",
    # settings
    "MEDIAPIPE_CONFIG",
    "TOTAL_KEYPOINTS",
    "USE_3D_COORDINATES",
    "SAVE_JSON",
    "SAVE_VIDEO_SKELETON",
    "SAVE_VIDEO_OVERLAY",
    # ranges (backwards compat)
    "LEFT_HAND_RANGE",
    "RIGHT_HAND_RANGE",
    # selection lists
    "LEFT_HAND_SELECTION",
    "RIGHT_HAND_SELECTION",
    "KEYPOINT_SELECTIONS",
]
