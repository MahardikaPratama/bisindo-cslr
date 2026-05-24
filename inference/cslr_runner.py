"""
inference/cslr_runner.py

Modul inference CSLR untuk single sample berbasis skeleton.

Tanggung jawab:
- Preprocessing skeleton in-memory mengikuti pipeline SkeletonFeeder (test mode).
- Load model TwoStream_Cosign dari checkpoint.
- Inference dan decode gloss sequence.
- Lookup ground truth dari anotasi dataset via sentence_id.
- Hitung WER single sample.

Tidak membuat preprocessing baru dari nol — reuse logika dari SkeletonFeeder.
"""

import os
import sys
import json
import math
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import yaml

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# WER Utility
# ---------------------------------------------------------------------------

def compute_wer_single(reference: str, hypothesis: str) -> float:
    """Hitung Word Error Rate untuk satu pasang kalimat.

    Input:
        reference  : string ground truth gloss sequence.
        hypothesis : string prediksi gloss sequence.

    Proses:
        Edit distance (substitution + insertion + deletion) dibagi
        jumlah token referensi. Konsisten dengan penalty yang dipakai
        pada python_wer_evaluation.py (setiap error bernilai 1).

    Output:
        float: WER dalam rentang [0.0, ...] — 0.0 artinya sempurna.
               Nilai bisa > 1.0 jika prediksi jauh lebih panjang.
    """
    ref_tokens = reference.strip().split()
    hyp_tokens = hypothesis.strip().split()

    if len(ref_tokens) == 0:
        return 0.0 if len(hyp_tokens) == 0 else float(len(hyp_tokens))

    # Dynamic programming — edit distance
    r, h = len(ref_tokens), len(hyp_tokens)
    dp = [[0] * (h + 1) for _ in range(r + 1)]

    for i in range(r + 1):
        dp[i][0] = i
    for j in range(h + 1):
        dp[0][j] = j

    for i in range(1, r + 1):
        for j in range(1, h + 1):
            if ref_tokens[i - 1] == hyp_tokens[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j - 1],  # substitution
                    dp[i - 1][j],      # deletion
                    dp[i][j - 1],      # insertion
                )

    return dp[r][h] / r


# ---------------------------------------------------------------------------
# Ground Truth Lookup
# ---------------------------------------------------------------------------

class GroundTruthLookup:
    """Membaca anotasi dataset dan menyediakan lookup ground truth via sentence_id.

    Anotasi dibaca dari file JSON yang dihasilkan mslr_process.py
    (format: list of dict dengan key 'sentence_id' dan 'gloss_sequence').

    Input konstruktor:
        annotation_json_path : path ke file JSON info split (misal train_info.json
                               atau test_sd_info.json).

    Proses:
        Membangun dict internal {sentence_id -> gloss_sequence} saat inisialisasi.
    """

    def __init__(self, annotation_json_path: str) -> None:
        self._lookup: dict[str, str] = {}

        if not os.path.isfile(annotation_json_path):
            logger.warning(
                "Annotation JSON tidak ditemukan: %s — ground truth tidak tersedia.",
                annotation_json_path,
            )
            return

        logger.info("Memuat anotasi ground truth dari: %s", annotation_json_path)
        with open(annotation_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for item in data:
            sid = str(item.get("sentence_id", "")).strip()
            gloss = str(item.get("gloss_sequence", "")).strip()
            if sid:
                # Simpan semua entri — jika sentence_id duplikat pakai yang terakhir
                self._lookup[sid] = gloss

        logger.info("Anotasi dimuat: %d entri.", len(self._lookup))

    def get(self, sentence_id: str) -> Optional[str]:
        """Kembalikan gloss sequence untuk sentence_id, atau None jika tidak ditemukan."""
        return self._lookup.get(str(sentence_id).strip())


# ---------------------------------------------------------------------------
# Skeleton Preprocessor
# ---------------------------------------------------------------------------

class SkeletonPreprocessor:
    """Preprocessing skeleton in-memory mengikuti SkeletonFeeder (mode test).

    Tidak me-load data dari disk; menerima numpy array langsung.

    Input konstruktor:
        feeder_args : dict dari key 'feeder_args' pada config YAML model.

    Proses sesuai SkeletonFeeder.__getitem__ (test mode, no augmentation):
        1. Pilih keypoint berdasarkan used_part.
        2. Ambil koordinat xy.
        3. Hitung motion features.
        4. Gabungkan pose + motion + confidence dummy.
        5. Konversi ke tensor.
        6. Apply normalization sesuai normalization_types.
        7. Apply downsampling jika aktif.
    """

    def __init__(self, feeder_args: dict) -> None:
        self.used_part = feeder_args.get("used_part", ["hand21"])
        self.split = feeder_args.get("split", [21, 42])
        self.norm_point = feeder_args.get("norm_point", [0, 21])
        self.normalization_types = feeder_args.get("normalization_types", [])
        self.downsampling = feeder_args.get("downsampling", False)
        self.downsampling_ratio = feeder_args.get("downsampling_ratio", 0.5)
        self.temporal_length = feeder_args.get("temporal_length", 194)

        # norm_div sama persis dengan SkeletonFeeder
        self.norm_div = (10240 - 1) / 2

        # Bangun pose_idx (sama persis dengan SkeletonFeeder.__init__)
        self.pose_idx: list[int] = []
        for part in self.used_part:
            if part == "body":
                self.pose_idx += list(range(61, 86))
            elif part == "hand21":
                self.pose_idx += list(range(0, 21))   # tangan kiri
                self.pose_idx += list(range(21, 42))  # tangan kanan
            elif part == "mouth_8":
                self.pose_idx += list(range(42, 61))

        logger.info(
            "[Preprocessor] used_part=%s | pose_idx_len=%d | normalization=%s",
            self.used_part,
            len(self.pose_idx),
            self.normalization_types,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def preprocess(self, frames: np.ndarray) -> torch.Tensor:
        """Preprocessing lengkap untuk satu sample skeleton.

        Input:
            frames : numpy array shape (T, 86, 3) — hasil skeleton.to_numpy().

        Output:
            torch.Tensor shape (T_out, K_selected, 7) — siap untuk collate.
        """
        logger.info("[Preprocessor] Input shape: %s", frames.shape)

        # Step 1-2: Pilih keypoint dan ambil koordinat xy
        input_data = frames[:, self.pose_idx, :2]   # (T, K, 2)
        logger.info("[Preprocessor] Setelah pilih keypoint: %s", input_data.shape)

        # Step 3: Hitung motion features (identik dengan SkeletonFeeder)
        T, K, _ = input_data.shape
        total_motion = np.zeros((T, K, 4), dtype=input_data.dtype)
        total_motion[1:, :, 0:2] = input_data[1:, :, :] - input_data[:-1, :, :]   # delta maju
        total_motion[:-1, :, 2:4] = input_data[:-1, :, :] - input_data[1:, :, :]  # delta mundur
        logger.info("[Preprocessor] Motion features dihitung.")

        # Step 4: Gabungkan pose, motion, dan confidence dummy
        conf = np.zeros((T, K, 1), dtype=input_data.dtype)
        final = np.concatenate([input_data, total_motion, conf], axis=-1)  # (T, K, 7)
        logger.info("[Preprocessor] Setelah concat [pose|motion|conf]: %s", final.shape)

        # Step 5: Konversi ke tensor (test transform — ToTensor only)
        tensor = torch.from_numpy(final).float()
        logger.info("[Preprocessor] Dikonversi ke tensor: %s", tensor.shape)

        # Step 6: Spatial normalization (jika aktif)
        if "spatial" in self.normalization_types:
            tensor = self._spatial_normalize(tensor)
            logger.info("[Preprocessor] Spatial normalization applied.")

        # Step 6b: Missing keypoint reconstruction (jika aktif)
        if "missing_kp" in self.normalization_types:
            tensor = self._missing_keypoint_reconstruction(tensor)
            logger.info("[Preprocessor] Missing keypoint reconstruction applied.")

        # Step 6c: Temporal normalization (jika aktif)
        if "temporal" in self.normalization_types:
            tensor = self._temporal_normalize(tensor, self.temporal_length)
            logger.info("[Preprocessor] Temporal normalization applied. Shape: %s", tensor.shape)

        # Step 7: Downsampling (jika aktif)
        if self.downsampling:
            tensor = self._downsample(tensor, self.downsampling_ratio)
            logger.info("[Preprocessor] Downsampling applied. Shape: %s", tensor.shape)

        return tensor

    def make_batch(self, tensor: torch.Tensor) -> dict:
        """Bungkus single tensor menjadi batch dict dengan padding.

        Padding mengikuti SkeletonFeeder.collate_fn:
            left_pad  = 6 frame (replicate frame pertama)
            right_pad = ceil(T/4)*4 - T + 6 frame (replicate frame terakhir)
            len_x     = ceil(T_original/4)*4 + 12

        Input:
            tensor : shape (T, K, C)

        Output:
            dict {
                'x'    : torch.Tensor shape (1, T_padded, K, C),
                'len_x': torch.LongTensor shape (1,),
            }
        """
        T = len(tensor)
        left_pad = 6
        right_pad = int(math.ceil(T / 4.0)) * 4 - T + 6
        max_len = T + left_pad + right_pad

        padded = torch.cat([
            tensor[0:1].expand(left_pad, -1, -1),
            tensor,
            tensor[-1:].expand(right_pad, -1, -1),
        ], dim=0)  # (max_len, K, C)

        video_length = int(math.ceil(T / 4.0)) * 4 + 12

        batch = {
            "x": padded.unsqueeze(0),                          # (1, T_padded, K, C)
            "len_x": torch.LongTensor([video_length]),         # (1,)
        }
        logger.info(
            "[Preprocessor] Batch dibuat — x: %s | len_x: %s",
            batch["x"].shape,
            batch["len_x"].tolist(),
        )
        return batch

    # ------------------------------------------------------------------
    # Private helpers — identik dengan SkeletonFeeder
    # ------------------------------------------------------------------

    def _spatial_normalize(self, origin: torch.Tensor) -> torch.Tensor:
        """Normalisasi spasial — persis sama dengan SkeletonFeeder.spatial_normalize."""
        conf = origin[:, :, 6]
        origin = origin / self.norm_div - 1

        input_xy = origin[:, :, 0:2].clone()
        if self.norm_point is not None:
            index = 0
            for part in self.used_part:
                if index == 0:
                    start, end = 0, self.split[0]
                else:
                    start, end = self.split[index - 1], self.split[index]
                if part == "body":
                    input_xy[:, start:end] -= (
                        input_xy[0, self.norm_point[index]:self.norm_point[index] + 2]
                        .mean(0)[None, None]
                    )
                elif part == "hand21":
                    input_xy[:, start:end] -= input_xy[:, self.norm_point[index]][:, None, :]
                    index += 1
                    start, end = self.split[index - 1], self.split[index]
                    input_xy[:, start:end] -= input_xy[:, self.norm_point[index]][:, None, :]
                else:
                    input_xy[:, start:end] -= input_xy[:, self.norm_point[index]][:, None, :]
                index += 1
        return torch.cat([input_xy, origin[:, :, 2:6], conf.unsqueeze(-1)], dim=-1)

    def _missing_keypoint_reconstruction(self, origin: torch.Tensor) -> torch.Tensor:
        """Rekonstruksi keypoint hilang — persis sama dengan SkeletonFeeder."""
        result = origin.clone()
        kp_xy = result[:, :, 0:2].cpu().numpy().astype(float)
        T, K, _ = kp_xy.shape

        for k in range(K):
            coords = kp_xy[:, k, :]
            valid_mask = ~((coords[:, 0] == 0) & (coords[:, 1] == 0))
            valid_idx = np.where(valid_mask)[0]
            if len(valid_idx) == 0:
                continue
            for t in range(T):
                if valid_mask[t]:
                    continue
                prev_arr = valid_idx[valid_idx < t]
                next_arr = valid_idx[valid_idx > t]
                if len(prev_arr) and len(next_arr):
                    p, n = prev_arr[-1], next_arr[0]
                    alpha = (t - p) / (n - p)
                    coords[t] = (1 - alpha) * coords[p] + alpha * coords[n]
                elif len(prev_arr):
                    coords[t] = coords[prev_arr[-1]]
                elif len(next_arr):
                    coords[t] = coords[next_arr[0]]
            kp_xy[:, k, :] = coords

        result[:, :, 0:2] = torch.from_numpy(kp_xy).to(result.device)
        return result

    def _temporal_normalize(self, origin: torch.Tensor, target_length: int) -> torch.Tensor:
        """Normalisasi temporal — persis sama dengan SkeletonFeeder."""
        from scipy.interpolate import interp1d

        T, K, C = origin.shape
        if T == target_length:
            return origin.clone()
        data = origin.cpu().numpy()
        orig_idx = np.linspace(0, T - 1, T)
        new_idx = np.linspace(0, T - 1, target_length)
        result = np.zeros((target_length, K, C), dtype=data.dtype)
        for k in range(K):
            for c in range(C):
                fn = interp1d(orig_idx, data[:, k, c], kind="linear")
                result[:, k, c] = fn(new_idx)
        return torch.from_numpy(result).to(origin.device)

    def _downsample(self, video: torch.Tensor, ratio: float) -> torch.Tensor:
        """Downsampling temporal — persis sama dengan SkeletonFeeder."""
        if ratio >= 1.0 or ratio <= 0.0:
            return video
        T = video.shape[0]
        new_len = max(1, int(T * ratio))
        idx = np.linspace(0, T - 1, new_len).astype(int)
        return video[idx]


# ---------------------------------------------------------------------------
# Inference Runner
# ---------------------------------------------------------------------------

class InferenceRunner:
    """Menjalankan inference CSLR untuk single sample skeleton.

    Alur:
        1. Load config YAML model.
        2. Load gloss dictionary.
        3. Load model TwoStream_Cosign dari checkpoint.
        4. Preprocess skeleton in-memory.
        5. Inference model.
        6. Lookup ground truth via sentence_id.
        7. Hitung WER.
        8. Tampilkan hasil.

    Input konstruktor:
        cslr_project_dir : path ke direktori mslr_iccv2025/.
        config_path      : path ke file YAML konfigurasi model.
        checkpoint_path  : path ke file .pt bobot model.
        annotation_split : nama split untuk ground truth lookup
                           (misal 'test_sd', 'train'). Default 'test_sd'.
    """

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

        # Tambahkan mslr_iccv2025 ke sys.path agar import-nya bisa jalan
        cslr_dir_str = str(self.cslr_dir)
        if cslr_dir_str not in sys.path:
            sys.path.insert(0, cslr_dir_str)
            logger.info("Menambahkan ke sys.path: %s", cslr_dir_str)

        # Load config YAML
        logger.info("[InferenceRunner] Memuat config: %s", config_path)
        with open(config_path, "r", encoding="utf-8") as f:
            self.cfg = yaml.load(f, Loader=yaml.FullLoader)

        feeder_args = self.cfg.get("feeder_args", {})
        self.preprocessor = SkeletonPreprocessor(feeder_args)

        # Load gloss dict
        gloss_dict_path = self._resolve_dataset_path("dict_path")
        logger.info("[InferenceRunner] Memuat gloss dict: %s", gloss_dict_path)
        with open(gloss_dict_path, "r", encoding="utf-8") as f:
            raw_gloss_dict = json.load(f)

        # Mapping gloss->id sesuai format SLRProcessor.load_data
        self.gloss_dict = raw_gloss_dict
        self.g2i_dict = {k: v["index"] for k, v in raw_gloss_dict["gloss2id"].items()}
        self.i2g_dict = {
            int(k): v["gloss"] for k, v in raw_gloss_dict["id2gloss"].items()
        }

        # Load ground truth
        dataset_root = self._resolve_dataset_path("dataset_root")
        anno_file = os.path.join(dataset_root, f"{annotation_split}_info.json")
        self.gt_lookup = GroundTruthLookup(anno_file)

        # Load model
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )
        logger.info("[InferenceRunner] Device: %s", self.device)
        self.model = self._load_model()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run_return(self, frames: np.ndarray, sentence_id: str) -> dict:
        """Jalankan inference dan kembalikan hasil sebagai dict (untuk API endpoint).

        Input:
            frames      : numpy array (T, 86, 3) dari skeleton.to_numpy().
            sentence_id : string ID kalimat untuk lookup ground truth.

        Output:
            dict {
                'ground_truth' : str — kalimat referensi (atau '[NOT FOUND]'),
                'prediction'   : str — kalimat hasil decode model,
                'wer'          : float — WER [0.0, ...],
                'wer_percent'  : str  — misal '12.50%',
                'inference_ms' : int  — waktu forward pass dalam milidetik,
            }
        """
        import time as _time

        if frames is None or frames.shape[0] < 1:
            logger.warning("[InferenceRunner] Skeleton kosong — inference dibatalkan.")
            return {
                "ground_truth": "[EMPTY SKELETON]",
                "prediction": "[EMPTY SKELETON]",
                "wer": 1.0,
                "wer_percent": "100.00%",
                "inference_ms": 0,
            }

        logger.info("[InferenceRunner] Mulai preprocessing skeleton.")
        tensor = self.preprocessor.preprocess(frames)
        batch = self.preprocessor.make_batch(tensor)
        batch["x"] = batch["x"].to(self.device)
        batch["len_x"] = batch["len_x"].to(self.device)

        logger.info("[InferenceRunner] Menjalankan inference model.")
        self.model.eval()
        t0 = _time.perf_counter()
        with torch.no_grad():
            ret_dict = self.model(batch)
        inference_ms = int(((_time.perf_counter() - t0) * 1000))

        prediction = self._decode_prediction(ret_dict)

        ground_truth = self.gt_lookup.get(sentence_id)
        if ground_truth is None:
            logger.warning("[InferenceRunner] sentence_id='%s' tidak ditemukan.", sentence_id)
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
            "wer": round(wer_val, 6),
            "wer_percent": wer_percent,
            "inference_ms": inference_ms,
        }

    def run(self, frames: np.ndarray, sentence_id: str) -> None:
        """Jalankan full inference pipeline dan cetak hasil ke logger.

        Input:
            frames      : numpy array (T, 86, 3) dari skeleton.to_numpy().
            sentence_id : string ID kalimat untuk lookup ground truth.
        """
        if frames is None or frames.shape[0] < 1:
            logger.warning("[InferenceRunner] Skeleton kosong — inference dibatalkan.")
            return

        logger.info("[InferenceRunner] Mulai preprocessing skeleton.")

        # Preprocessing
        tensor = self.preprocessor.preprocess(frames)
        batch = self.preprocessor.make_batch(tensor)

        # Pindahkan ke device
        batch["x"] = batch["x"].to(self.device)
        batch["len_x"] = batch["len_x"].to(self.device)

        # Inference
        logger.info("[InferenceRunner] Menjalankan inference model.")
        self.model.eval()
        with torch.no_grad():
            ret_dict = self.model(batch)

        # Decode prediksi
        prediction = self._decode_prediction(ret_dict)
        logger.info("[InferenceRunner] Prediksi decoded: %s", prediction)

        # Lookup ground truth
        ground_truth = self.gt_lookup.get(sentence_id)
        if ground_truth is None:
            logger.warning(
                "[InferenceRunner] sentence_id='%s' tidak ditemukan di anotasi.",
                sentence_id,
            )
            gt_display = "[NOT FOUND]"
            wer_display = "N/A"
        else:
            gt_display = ground_truth
            wer_val = compute_wer_single(ground_truth, prediction)
            wer_display = f"{wer_val * 100:.2f}%"

        # Tampilkan hasil
        self._print_result(sentence_id, gt_display, prediction, wer_display)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _resolve_dataset_path(self, key: str) -> str:
        """Resolve path dataset dari bisindo.yaml relatif terhadap cslr_dir."""
        dataset_name = self.cfg.get("dataset", "bisindo")
        dataset_cfg_path = self.cslr_dir / "configs" / "dataset_configs" / f"{dataset_name}.yaml"
        with open(dataset_cfg_path, "r", encoding="utf-8") as f:
            dataset_cfg = yaml.load(f, Loader=yaml.FullLoader)
        raw_path = dataset_cfg.get(key, "")
        # Path bisa relatif terhadap cslr_dir
        return str((self.cslr_dir / raw_path).resolve())

    def _load_model(self):
        """Load model TwoStream_Cosign dari checkpoint.

        Proses:
            1. Import slr_network dari cslr_dir.
            2. Bangun model dengan model_args + gloss_dict dari config.
            3. Load state_dict dari checkpoint.
            4. Pindahkan ke device.
        """
        import slr_network as slr_net

        model_name = self.cfg.get("model", "TwoStream_Cosign")
        model_args = self.cfg.get("model_args", {})

        logger.info("[InferenceRunner] Membangun model: %s", model_name)
        model_class = getattr(slr_net, model_name)
        model = model_class(**model_args, gloss_dict=self.gloss_dict)

        if not os.path.isfile(self.checkpoint_path):
            raise FileNotFoundError(
                f"Checkpoint tidak ditemukan: {self.checkpoint_path}"
            )

        logger.info("[InferenceRunner] Memuat bobot dari: %s", self.checkpoint_path)
        ckpt = torch.load(self.checkpoint_path, map_location=self.device, weights_only=False)
        state_dict = ckpt.get("model_state_dict", ckpt)
        model.load_state_dict(state_dict, strict=False)
        model.to(self.device)
        model.eval()
        logger.info("[InferenceRunner] Model berhasil dimuat.")
        return model

    def _decode_prediction(self, ret_dict: dict) -> str:
        """Ekstrak dan decode prediksi gloss dari output model.

        Output model saat eval adalah:
            ret_dict['recognized_sents_fusion'] -> list of list of tuples [(gloss_str, score), ...]

        Output:
            string gloss sequence hasil prediksi.
        """
        sents = ret_dict.get("recognized_sents_fusion", [])
        if not sents or len(sents) == 0:
            return "[EMPTY]"

        # Single sample -> ambil index 0
        sent = sents[0]
        if not sent:
            return "[EMPTY]"

        # Setiap elemen adalah tuple (gloss_string, score) atau string
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
        """Tampilkan hasil inference ke logger dan stdout."""
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
