import os
import time
from datetime import timedelta
from pathlib import Path
import numpy as np
import cv2

import pandas as pd
from src.config import PROJECT_ROOT
from src.extractor.holistic_86 import Holistic86Extractor

SUPPORTED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

class SkeletonPipeline:
    
    def __init__(self):
        from src.config import SAVE_JSON, SAVE_VIDEO_SKELETON, SAVE_VIDEO_OVERLAY
        self.save_json = SAVE_JSON
        self.save_video_skeleton = SAVE_VIDEO_SKELETON
        self.save_video_overlay = SAVE_VIDEO_OVERLAY
        self.extractor     = Holistic86Extractor()
        if self.save_json:
            from src.converter.to_json import JsonConverter
            self.json_conv = JsonConverter()
            
        if self.save_video_skeleton or self.save_video_overlay:
            from src.visualizer.video_generator import VideoGenerator
            self.video_gen = VideoGenerator()
            
        self.start_time = time.time()

    def _elapsed(self) -> str:
        elapsed = int(time.time() - self.start_time)
        return str(timedelta(seconds=elapsed))

    def process_video(self, video_path: str, label: int = None, output_subpath: str = "") -> np.ndarray:
        if not os.path.isfile(video_path):
            raise FileNotFoundError(f"Video not found: {video_path}")

        path_obj = Path(video_path)
        video_id = path_obj.stem
        
        print(f"\n[{self._elapsed()}] [INFO] Processing: {path_obj.name} -> {video_id} (Subpath: {output_subpath or '.'})")

        keypoints = self.extractor.extract_video(video_path)
        
        # We don't want to slice off Z or confidence if SAVE_JSON needs it
        # However, we will ensure it matches the use_3d setting via the KeypointSelector.
            
        print(f"[{self._elapsed()}]        Frames extracted: {keypoints.shape[0]}")
        
        if self.save_json:
            self.json_conv.save(keypoints, video_id, label, output_subpath)
            
        if self.save_video_skeleton or self.save_video_overlay:
            print(f"[{self._elapsed()}]        Generating preview videos...")
            self.video_gen.generate(
                raw_video_path=video_path,
                keypoints=keypoints,
                video_id=video_id,
                output_subpath=output_subpath,
                save_skeleton=self.save_video_skeleton,
                save_overlay=self.save_video_overlay
            )

        print(f"[{self._elapsed()}] [DONE] {video_id}\n")
        return keypoints

    def process_folder(self, folder_path: str, label: int = None) -> None:
        if not os.path.isdir(folder_path):
            raise NotADirectoryError(f"Not a directory: {folder_path}")

        all_files = Path(folder_path).rglob("*")
        video_files = sorted([f for f in all_files if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS])

        if len(video_files) == 0:
            print(f"[{self._elapsed()}] [WARN] No supported video files found in: {folder_path}")
            return

        print(f"[{self._elapsed()}] [INFO] Found {len(video_files)} video(s) recursively in: {folder_path}")

        for i, filepath in enumerate(video_files, 1):
            video_path = str(filepath)
            
            rel_path = filepath.relative_to(Path(folder_path))
            output_subpath = str(rel_path.parent)
            if output_subpath == ".":
                output_subpath = ""

            print(f"[{self._elapsed()}] [{i}/{len(video_files)}] {rel_path}")
            try:
                self.process_video(video_path, label=label, output_subpath=output_subpath)
            except Exception as e:
                print(f"[{self._elapsed()}] [ERROR] Failed on {filepath.name}: {e}")

        print(f"\n[{self._elapsed()}] [INFO] Batch complete. {len(video_files)} video(s) processed.")
