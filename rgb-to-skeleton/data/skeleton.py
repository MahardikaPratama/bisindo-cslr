from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional

import numpy as np


@dataclass
class SkeletonSequence:
    """In-memory container for one video's skeleton sequence.

    Stores frames as a numpy array with shape (T, K, C) where
    - T = number of frames
    - K = keypoints (e.g., 86)
    - C = coordinates and confidence (usually 3)

    Use `from_numpy` to construct from extractor outputs.
    """

    video_id: str
    frames: np.ndarray
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not isinstance(self.frames, np.ndarray):
            raise TypeError("frames must be a numpy.ndarray")
        if self.frames.ndim != 3:
            raise ValueError("frames must have shape (T, K, C)")

    @property
    def num_frames(self) -> int:
        return int(self.frames.shape[0])

    @property
    def num_keypoints(self) -> int:
        return int(self.frames.shape[1])

    def to_numpy(self) -> np.ndarray:
        return self.frames

    @classmethod
    def from_numpy(cls, video_id: str, arr: np.ndarray, metadata: Optional[Dict[str, Any]] = None) -> "SkeletonSequence":
        return cls(video_id=video_id, frames=arr, metadata=metadata or {})

    def summary(self) -> Dict[str, Any]:
        return {
            "video_id": self.video_id,
            "num_frames": self.num_frames,
            "num_keypoints": self.num_keypoints,
            "metadata": self.metadata,
        }
