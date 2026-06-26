import os
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class GroundTruthLookup:
    def __init__(self, annotation_json_path: str) -> None:
        self._lookup: dict[str, str] = {}
        
        # 1. Coba baca dari file STM di folder yang sama terlebih dahulu
        base_dir = os.path.dirname(annotation_json_path)
        if os.path.isdir(base_dir):
            for fname in os.listdir(base_dir):
                if fname.endswith(".stm"):
                    stm_path = os.path.join(base_dir, fname)
                    try:
                        with open(stm_path, "r", encoding="utf-8") as f:
                            for line in f:
                                parts = line.strip().split()
                                if len(parts) >= 6:
                                    # Contoh parts[0] = "P6_S01_MJ" atau "P6_S01_MN"
                                    # Kita ambil "S01" dari tengah
                                    vid_id = parts[0]
                                    if "_S" in vid_id:
                                        # Ambil SXX
                                        sentence_id = "S" + vid_id.split("_S")[1].split("_")[0]
                                        gloss = " ".join(parts[5:])
                                        self._lookup[sentence_id] = gloss
                    except Exception as e:
                        logger.warning(f"Gagal membaca STM {stm_path}: {e}")

        # 2. Coba baca dari JSON (fallback/legacy)
        if os.path.isfile(annotation_json_path):
            try:
                with open(annotation_json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for item in data:
                    sid = str(item.get("sentence_id", "")).strip()
                    gloss = str(item.get("gloss_sequence", "")).strip()
                    if sid and sid not in self._lookup:
                        self._lookup[sid] = gloss
            except Exception as e:
                logger.warning(f"Gagal membaca JSON {annotation_json_path}: {e}")
        else:
            logger.info(f"Annotation JSON tidak ditemukan: {annotation_json_path} (Menggunakan data STM jika ada)")

    def get(self, sentence_id: str) -> Optional[str]:
        return self._lookup.get(str(sentence_id).strip())
