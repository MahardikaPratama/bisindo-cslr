from __future__ import annotations

import json
import os
from concurrent.futures import ThreadPoolExecutor, Future
from pathlib import Path
from typing import Optional

import numpy as np

from data.skeleton import SkeletonSequence
from config import JSON_DIR
from utils.logger import get_logger


logger = get_logger(__name__)


class DiskWriter:
    """Background writer for persisting skeleton sequences and other artifacts.

    Uses a ThreadPoolExecutor to write without blocking the caller thread.
    """

    def __init__(self, max_workers: int = 2) -> None:
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        os.makedirs(JSON_DIR, exist_ok=True)

    def _get_output_path(self, video_id: str, output_subpath: str = "", filename: Optional[str] = None) -> str:
        out_dir = Path(JSON_DIR) / output_subpath
        out_dir.mkdir(parents=True, exist_ok=True)
        name = filename or f"{video_id}.json"
        return str(out_dir / name)

    def _write_json(self, skeleton: SkeletonSequence, output_path: str) -> str:
        tmp = output_path + ".tmp"
        frames = []
        for frame_index, frame in enumerate(skeleton.to_numpy()):
            pts = []
            for point in frame:
                confidence = float(point[2]) if point.shape[0] >= 3 else 1.0
                pts.append({"x": float(point[0]), "y": float(point[1]), "confidence": confidence})
            frames.append({"frame_index": frame_index, "keypoints": pts})

        payload = {
            "video_id": skeleton.video_id,
            "num_frames": skeleton.num_frames,
            "num_keypoints": skeleton.num_keypoints,
            "dimensions": ["x", "y", "confidence"],
            "frames": frames,
        }

        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        os.replace(tmp, output_path)
        logger.info("Saved JSON: %s", output_path)
        return output_path

    def save_json(self, skeleton: SkeletonSequence, output_subpath: str = "", filename: Optional[str] = None) -> str:
        path = self._get_output_path(skeleton.video_id, output_subpath, filename)
        return self._write_json(skeleton, path)

    def save_json_async(self, skeleton: SkeletonSequence, output_subpath: str = "", filename: Optional[str] = None) -> Future:
        path = self._get_output_path(skeleton.video_id, output_subpath, filename)
        return self.executor.submit(self._write_json, skeleton, path)

    def shutdown(self, wait: bool = True) -> None:
        self.executor.shutdown(wait=wait)
