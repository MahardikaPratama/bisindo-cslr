import math
import logging
import sys
from importlib import util as importlib_util
from pathlib import Path
import numpy as np
import torch

logger = logging.getLogger(__name__)

class SkeletonPreprocessor:
    def __init__(self, feeder_args: dict, cslr_project_dir: Path) -> None:
        candidate_roots = [cslr_project_dir, cslr_project_dir / "mslr_iccv2025"]
        mslr_root = next(
            (
                root
                for root in candidate_roots
                if (root / "datasets" / "skeleton_feeder.py").exists()
            ),
            cslr_project_dir,
        )
        mslr_path = str(mslr_root)
        if mslr_path not in sys.path:
            sys.path.insert(0, mslr_path)

        feeder_path = mslr_root / "datasets" / "skeleton_feeder.py"
        spec = importlib_util.spec_from_file_location("mslr_iccv2025_skeleton_feeder", feeder_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Cannot load SkeletonFeeder from {feeder_path}")

        feeder_module = importlib_util.module_from_spec(spec)
        spec.loader.exec_module(feeder_module)
        SkeletonFeeder = feeder_module.SkeletonFeeder
        
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
        self.feeder.augmentation_types = []
        
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

    def _ensure_tensor(self, value):
        if isinstance(value, np.ndarray):
            return torch.from_numpy(value).float()
        return value

    def _make_final_tensor(self, frames: np.ndarray) -> np.ndarray:
        input_data = frames[:, self.feeder.pose_idx, :2] * 10240.0
        conf = np.zeros_like(input_data)[:, :, 0]

        total_motion = np.zeros(input_data.shape[0:2] + (4,))
        total_motion[1:, :, 0:2] = input_data[1:, :, 0:2] - input_data[0:-1, :, 0:2]
        total_motion[0:-1, :, 2:4] = input_data[:-1, :, 0:2] - input_data[1:, :, 0:2]

        return np.concatenate([input_data, total_motion, conf[:, :, None]], axis=-1)

    def _downsample_indices(self, frame_count: int) -> np.ndarray:
        if not self.feeder.downsampling:
            return np.arange(frame_count)

        step = max(1, int(round(1.0 / self.feeder.downsampling_ratio)))
        return np.arange(0, frame_count, step)

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
        # MediaPipe outputs 0.0 to 1.0.
        # SkeletonFeeder expects coordinates up to 10240 (because norm_div = 5119.5)
        final = self._make_final_tensor(frames)
        tensor = self._ensure_tensor(self.feeder.normalize(final, sentence_id=sentence_id))

        return tensor

    def preprocess_preview(self, frames: np.ndarray, sentence_id: str = None) -> tuple[torch.Tensor, np.ndarray, np.ndarray]:
        indices = self._downsample_indices(frames.shape[0])
        sampled_frames = frames[indices]
        final = self._make_final_tensor(sampled_frames)
        augmented = self.feeder.data_aug(final, sentence_id=sentence_id)
        tensor = self._ensure_tensor(self.feeder.simple_normalize(augmented))

        preview_keypoints = tensor[:, :, :2].detach().cpu().numpy()
        preview_keypoints = np.clip((preview_keypoints + 1.0) / 2.0, 0.0, 1.0)
        return tensor, indices, preview_keypoints

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
