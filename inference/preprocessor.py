import math
import logging
from pathlib import Path
import numpy as np
import torch

logger = logging.getLogger(__name__)

class SkeletonPreprocessor:
    def __init__(self, feeder_args: dict, cslr_project_dir: Path) -> None:
        import sys
        mslr_path = str(cslr_project_dir / "mslr_iccv2025")
        if mslr_path not in sys.path:
            sys.path.append(mslr_path)
            
        from datasets.skeleton_feeder import SkeletonFeeder
        
        self.feeder = SkeletonFeeder.__new__(SkeletonFeeder)
        
        self.feeder.data_type = 'skeleton'
        self.feeder.mode = 'test'
        self.feeder.transform_mode = 'test'
        
        self.feeder.used_part = feeder_args.get("used_part", ["hand21"])
        self.feeder.split = feeder_args.get("split", [21, 42])
        self.feeder.norm_point = feeder_args.get("norm_point", [0, 21])
        self.feeder.norm_div = (10240 - 1) / 2
        
        self.feeder.downsampling = feeder_args.get("downsampling", False)
        self.feeder.downsampling_ratio = feeder_args.get("downsampling_ratio", 0.5)
        self.feeder.downsampling_position = feeder_args.get("downsampling_position", "after")
        self.feeder.augmentation_types = feeder_args.get("augmentation_types", [])
        
        self.feeder.pose_idx = []
        for part in self.feeder.used_part:
            if part == 'body':
                self.feeder.pose_idx += [i for i in range(61, 86)]
            elif part == 'hand21':
                self.feeder.pose_idx += [i for i in range(0, 21)]
                self.feeder.pose_idx += [i for i in range(21, 42)]
            elif part == 'mouth_8':
                self.feeder.pose_idx += [i for i in range(42, 61)]
            elif part == 'left_hand':
                self.feeder.pose_idx += [i for i in range(0, 21)]
            elif part == 'right_hand':
                self.feeder.pose_idx += [i for i in range(21, 42)]
                
        self.feeder.data_aug = self.feeder.pose_transform()

    def summary(self) -> dict:
        return {
            "used_part": self.feeder.used_part,
            "pose_idx_len": len(self.feeder.pose_idx),
            "norm_point": self.feeder.norm_point,
            "downsampling": self.feeder.downsampling,
            "downsampling_ratio": self.feeder.downsampling_ratio,
            "augmentation_types": self.feeder.augmentation_types,
        }

    def preprocess(self, frames: np.ndarray, sentence_id: str = None) -> torch.Tensor:
        input_data = frames[:, self.feeder.pose_idx, :2]
        conf = np.zeros_like(input_data)[:, :, 0]

        total_motion = np.zeros(input_data.shape[0:2] + (4,))
        total_motion[1:, :, 0:2] = input_data[1:, :, 0:2] - input_data[0:-1, :, 0:2]
        total_motion[0:-1, :, 2:4] = input_data[:-1, :, 0:2] - input_data[1:, :, 0:2]

        final = np.concatenate([input_data, total_motion, conf[:, :, None]], axis=-1)
        tensor = self.feeder.normalize(final, sentence_id=sentence_id)
        
        return tensor

    def make_batch(self, tensor: torch.Tensor) -> dict:
        T = len(tensor)
        left_pad = 6
        right_pad = int(math.ceil(T / 4.0)) * 4 - T + 6

        padded = torch.cat([
            tensor[0:1].expand(left_pad, -1, -1),
            tensor,
            tensor[-1:].expand(right_pad, -1, -1),
        ], dim=0)

        video_length = int(math.ceil(T / 4.0)) * 4 + 12

        return {
            "x": padded.unsqueeze(0),
            "len_x": torch.LongTensor([video_length]),
        }
