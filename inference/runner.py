import os
import sys
import json
import logging
import yaml
from pathlib import Path
import numpy as np
import torch

from .metrics import compute_wer_single
from .ground_truth import GroundTruthLookup
from .preprocessor import SkeletonPreprocessor

logger = logging.getLogger(__name__)

class InferenceRunner:
    def __init__(
        self,
        cslr_project_dir: str,
        config_path: str,
        checkpoint_path: str,
        annotation_split: str = "test_sd",
    ) -> None:
        self.cslr_dir = Path(cslr_project_dir).resolve()
        self.config_path = config_path
        self.checkpoint_path = checkpoint_path

        cslr_dir_str = str(self.cslr_dir)
        if cslr_dir_str not in sys.path:
            sys.path.insert(0, cslr_dir_str)

        with open(config_path, "r", encoding="utf-8") as f:
            self.cfg = yaml.load(f, Loader=yaml.FullLoader)

        feeder_args = self.cfg.get("feeder_args", {})
        self.preprocessor = SkeletonPreprocessor(feeder_args, self.cslr_dir)

        gloss_dict_path = self._resolve_dataset_path("dict_path")
        with open(gloss_dict_path, "r", encoding="utf-8") as f:
            raw_gloss_dict = json.load(f)

        self.gloss_dict = raw_gloss_dict
        self.g2i_dict = {k: v["index"] for k, v in raw_gloss_dict["gloss2id"].items()}
        self.i2g_dict = {
            int(k): v["gloss"] for k, v in raw_gloss_dict["id2gloss"].items()
        }

        dataset_root = self._resolve_dataset_path("dataset_root")
        anno_file = os.path.join(dataset_root, f"{annotation_split}_info.json")
        self.gt_lookup = GroundTruthLookup(anno_file)

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model()

    def update_preprocessor(self, config_path: str) -> None:
        if config_path != self.config_path:
            if not os.path.isfile(config_path):
                return
                
            with open(config_path, "r", encoding="utf-8") as f:
                new_cfg = yaml.load(f, Loader=yaml.FullLoader)
            
            feeder_args = new_cfg.get("feeder_args", {})
            self.preprocessor = SkeletonPreprocessor(feeder_args, self.cslr_dir)
            self.config_path = config_path

    def describe_preprocessor(self) -> dict:
        return {
            "config_path": self.config_path,
            **self.preprocessor.summary(),
        }

    def run_return(self, frames: np.ndarray, sentence_id: str, ground_truth_text: str = None) -> dict:
        import time as _time

        if frames is None or frames.shape[0] < 1:
            return {
                "ground_truth": "[EMPTY SKELETON]",
                "prediction": "[EMPTY SKELETON]",
                "wer": 1.0,
                "wer_percent": "100.00%",
                "inference_ms": 0,
                "inference_fps": 0.0,
            }

        tensor = self.preprocessor.preprocess(frames, sentence_id)
        batch = self.preprocessor.make_batch(tensor)
        batch["x"] = batch["x"].to(self.device)
        batch["len_x"] = batch["len_x"].to(self.device)

        self.model.eval()
        t0 = _time.perf_counter()
        with torch.no_grad():
            ret_dict = self.model(batch)
        inference_ms = int(((_time.perf_counter() - t0) * 1000))
        inference_fps = float(frames.shape[0] / (inference_ms / 1000.0)) if inference_ms > 0 else 0.0

        prediction_bilstm = self._decode_prediction(ret_dict, key="recognized_sents_fusion")
        prediction_conv = self._decode_prediction(ret_dict, key="conv_sents_fusion")

        prediction = prediction_bilstm

        if ground_truth_text:
            ground_truth = ground_truth_text
        else:
            ground_truth = self.gt_lookup.get(sentence_id)
        if ground_truth is None:
            gt_display = "[NOT FOUND]"
            wer_val = 1.0
        else:
            gt_display = ground_truth
            wer_val = compute_wer_single(ground_truth, prediction)

        wer_percent = f"{wer_val * 100:.2f}%"
        self._print_result(sentence_id, gt_display, prediction, wer_percent)

        return {
            "ground_truth": gt_display,
            "prediction": prediction,
            "prediction_bilstm": prediction_bilstm,
            "prediction_conv": prediction_conv,
            "wer": round(wer_val, 6),
            "wer_percent": wer_percent,
            "inference_ms": inference_ms,
            "inference_fps": round(inference_fps, 3),
        }

    def run(self, frames: np.ndarray, sentence_id: str) -> None:
        if frames is None or frames.shape[0] < 1:
            return

        tensor = self.preprocessor.preprocess(frames, sentence_id)
        batch = self.preprocessor.make_batch(tensor)

        batch["x"] = batch["x"].to(self.device)
        batch["len_x"] = batch["len_x"].to(self.device)

        self.model.eval()
        with torch.no_grad():
            ret_dict = self.model(batch)

        prediction_bilstm = self._decode_prediction(ret_dict, key="recognized_sents_fusion")
        prediction = prediction_bilstm

        ground_truth = self.gt_lookup.get(sentence_id)
        if ground_truth is None:
            gt_display = "[NOT FOUND]"
            wer_display = "N/A"
        else:
            gt_display = ground_truth
            wer_val = compute_wer_single(ground_truth, prediction)
            wer_display = f"{wer_val * 100:.2f}%"

        self._print_result(sentence_id, gt_display, prediction, wer_display)

    def _resolve_dataset_path(self, key: str) -> str:
        dataset_name = self.cfg.get("dataset", "bisindo")
        dataset_cfg_path = self.cslr_dir / "configs" / "dataset_configs" / f"{dataset_name}.yaml"
        with open(dataset_cfg_path, "r", encoding="utf-8") as f:
            dataset_cfg = yaml.load(f, Loader=yaml.FullLoader)
        raw_path = dataset_cfg.get(key, "")
        return str((self.cslr_dir / raw_path).resolve())

    def _load_model(self):
        import slr_network as slr_net

        model_name = self.cfg.get("model", "TwoStream_Cosign")
        model_args = self.cfg.get("model_args", {})

        model_class = getattr(slr_net, model_name)
        model = model_class(**model_args, gloss_dict=self.gloss_dict)

        if not os.path.isfile(self.checkpoint_path):
            raise FileNotFoundError(
                f"Checkpoint tidak ditemukan: {self.checkpoint_path}"
            )

        ckpt = torch.load(self.checkpoint_path, map_location=self.device, weights_only=False)
        state_dict = ckpt.get("model_state_dict", ckpt)
        model.load_state_dict(state_dict, strict=False)
        model.to(self.device)
        model.eval()
        return model

    def _decode_prediction(self, ret_dict: dict, key: str = "recognized_sents_fusion") -> str:
        sents = ret_dict.get(key, [])
        if not sents or len(sents) == 0:
            return "[EMPTY]"

        sent = sents[0]
        if not sent:
            return "[EMPTY]"

        words = []
        for item in sent:
            if isinstance(item, (list, tuple)):
                words.append(str(item[0]))
            else:
                words.append(str(item))

        return " ".join(words)

    @staticmethod
    def _print_result(
        sentence_id: str,
        ground_truth: str,
        prediction: str,
        wer_display: str,
    ) -> None:
        separator = "=" * 60
        result_lines = [
            "",
            separator,
            "CSLR INFERENCE RESULT",
            separator,
            f"Sentence ID          : {sentence_id}",
            f"Ground Truth         : {ground_truth}",
            f"Inference Prediction : {prediction}",
            f"WER                  : {wer_display}",
            separator,
        ]
        output = "\n".join(result_lines)
        print(output)
        logger.info(output)
