"""
Inference package untuk CSLR skeleton-based pipeline.

Ekspor utama:
    InferenceRunner  — load model, preprocess skeleton, inferensi, hitung WER.
"""

from .cslr_runner import InferenceRunner

__all__ = ["InferenceRunner"]
