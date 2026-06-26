import json
import os
from typing import Optional
import numpy as np

from src.config import JSON_DIR

class JsonConverter:
    """Saves skeleton data into a JSON file."""
    
    def __init__(self):
        os.makedirs(JSON_DIR, exist_ok=True)
        
    def save(self, keypoints: np.ndarray, video_id: str, label: Optional[int] = None, output_subpath: str = "", filename: str = None) -> tuple:
        """
        Saves keypoints to a JSON file.
        
        Args:
            keypoints: ndarray of shape (T, K, C)
            video_id: identifier of the video
            label: class label (optional)
            output_subpath: subdirectory to save in
            filename: specific filename (optional)
            
        Returns:
            tuple: (sample_id, json_path)
        """
        out_dir = os.path.join(JSON_DIR, output_subpath)
        os.makedirs(out_dir, exist_ok=True)
        
        target_filename = filename if filename else f"{video_id}.json"
        json_path = os.path.join(out_dir, target_filename)
        
        # Ensure only 2D coordinates are saved (x, y)
        if keypoints.ndim == 3 and keypoints.shape[2] >= 2:
            keypoints = keypoints[:, :, :2]
            
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(keypoints.tolist(), f)
            
        return video_id, json_path
