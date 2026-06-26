import os
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class GroundTruthLookup:
    def __init__(self, annotation_json_path: str) -> None:
        self._lookup: dict[str, str] = {}

        if not os.path.isfile(annotation_json_path):
            logger.warning(f"Annotation JSON tidak ditemukan: {annotation_json_path}")
            return

        with open(annotation_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for item in data:
            sid = str(item.get("sentence_id", "")).strip()
            gloss = str(item.get("gloss_sequence", "")).strip()
            if sid:
                self._lookup[sid] = gloss

    def get(self, sentence_id: str) -> Optional[str]:
        return self._lookup.get(str(sentence_id).strip())
