# Plan: CSLR Skeleton-Based Inference Pipeline

Dibuat: 2026-05-24

---

## 1. Tujuan Pipeline Inference

Mengintegrasikan pipeline inference CSLR berbasis skeleton ke dalam `main.py` yang sudah ada (di root project `bisindo-cslr`), sehingga setelah skeleton berhasil diekstrak dari video oleh `SkeletonPipeline`, sistem secara otomatis:

1. Mengambil data skeleton in-memory (`result["skeleton"]`)
2. Melakukan preprocessing menggunakan pipeline yang konsisten dengan testing resmi model (`TwoStream_Cosign`)
3. Menjalankan inference menggunakan model CSLR yang sudah dilatih
4. Mengambil ground truth dari anotasi dataset menggunakan `sentence_id`
5. Menghitung Word Error Rate (WER) antara prediksi dan ground truth
6. Menampilkan hasil akhir ke terminal dan logger

---

## 2. Struktur Input dan Output

### Input

| Parameter | Sumber | Format |
|---|---|---|
| `sentence_id` | CLI argument baru (`--sentence-id`) | String, contoh: `"S001"` |
| `skeleton` | `result["skeleton"]` dari `pipeline.process_video()` | `SkeletonSequence` (in-memory) — shape `(T, 86, 3)` |
| `config_path` | CLI argument baru (`--cslr-config`) | Path ke file YAML, default: `mslr_iccv2025/configs/Double_Cosign_sd.yaml` |
| `checkpoint_path` | CLI argument baru (`--checkpoint`) | Path ke file `.pt` bobot model |

### Output (Terminal + Logger)

```text
============================================================
CSLR INFERENCE RESULT
============================================================
Sentence ID          : S001
Ground Truth         : HALO APA KABAR
Inference Prediction : HALO APA KABAR
WER                  : 0.00%
============================================================
```

---

## 3. Alur Preprocessing Data Skeleton

### 3.1 Sumber Data
- `result["skeleton"]` → `SkeletonSequence` → `.to_numpy()` → array shape `(T, 86, 3)`
- **Tidak ada** load ulang dari file `.npy` atau pickle

### 3.2 Langkah Preprocessing (mengikuti `SkeletonFeeder`)

| Step | Operasi | Referensi |
|---|---|---|
| 1 | Pilih keypoint berdasarkan `used_part` dari config | `SkeletonFeeder.__getitem__` -> `pose_idx` |
| 2 | Ambil koordinat `xy` saja (`[:, :, :2]`) | `SkeletonFeeder.__getitem__` baris 161 |
| 3 | Hitung motion features (delta maju dan mundur) | `SkeletonFeeder.__getitem__` baris 165-167 |
| 4 | Gabungkan: `[pose_xy, motion_4ch, conf_dummy]` -> shape `(T, K, 7)` | `SkeletonFeeder.__getitem__` baris 170 |
| 5 | Konversi ke Tensor (via `ToTensor`) | `SkeletonFeeder.normalize` -> `pose_transform` |
| 6 | Apply normalization sesuai `normalization_types` config | `SkeletonFeeder.normalize` |
| 7 | Apply downsampling jika aktif | `SkeletonFeeder.normalize` |
| 8 | Apply padding (left=6, right=tergantung panjang) | `SkeletonFeeder.collate_fn` |

### 3.3 Konfigurasi dari YAML
- `feeder_args.used_part` -> menentukan indeks keypoint
- `feeder_args.norm_point` -> titik pusat normalisasi
- `feeder_args.split` -> range per bagian tubuh
- `feeder_args.normalization_types` -> pipeline normalisasi
- `feeder_args.augmentation_types` -> dikosongkan untuk inference (pakai test transform)

---

## 4. Komponen yang Digunakan dari Project Existing

### Dari `rgb-to-skeleton/` (sudah di-load ke `sys.path` oleh `main.py`)
| Komponen | Modul | Kegunaan |
|---|---|---|
| `SkeletonPipeline` | `core.pipeline` | Ekstraksi skeleton dari video |
| `SkeletonSequence` | `data.skeleton` | Container data skeleton in-memory |
| `get_logger` | `utils.logger` | Logger existing |
| `NativeStderrFilter` | `utils.stderr_filters` | Filter stderr |
| `parse_args` | `core.cli` | Argumen CLI |

### Dari `mslr_iccv2025/` (akan di-load baru)
| Komponen | Modul | Kegunaan |
|---|---|---|
| `TwoStream_Cosign` | `slr_network` | Model CSLR |
| `SkeletonFeeder` | `datasets.skeleton_feeder` | Preprocessing pipeline |
| `skeleton_augmentation` | `utils.skeleton_augmentation` | Transform ToTensor |
| `Decode` | `utils` | CTC beam decoder |
| `info2dict` | `preprocess.mslr2025.mslr_process` | Membaca anotasi ground truth |

---

## 5. Langkah Inference Model

```
[skeleton in-memory]
        |
        v
[preprocessing: select keypoints -> motion -> concat -> normalize -> pad]
        |
        v
[batch dict: {x: (1, T_padded, K, 7), len_x: (1,)}]
        |
        v
[model.eval() + torch.no_grad()]
        |
        v
[TwoStream_Cosign.forward(batch)]
        |
        v
[ret_dict['recognized_sents_fusion'] -> gloss list]
        |
        v
[decode -> join(' ') -> predicted sentence]
```

**Catatan penting:**
- Model di-load ke CPU jika tidak ada GPU, atau ke device yang dikonfigurasi
- `model.eval()` wajib dipanggil sebelum inference
- `torch.no_grad()` dipakai untuk efisiensi memori

---

## 6. Perhitungan WER

### Strategi: Pure Python WER (tanpa sclite)
Menggunakan implementasi edit distance yang sama konsepnya dengan
`get_wer_delsubins` dari `evaluation.slr_eval.python_wer_evaluation` karena:
- Tidak membutuhkan binary `sclite`
- Konsisten dengan `python_evaluate=True` yang dipakai saat evaluasi resmi
- Cocok untuk single-sample inference

### Formula
```
WER = (Substitutions + Insertions + Deletions) / Total Words Referensi x 100%
```

---

## 7. Struktur File yang Akan Dibuat/Dimodifikasi

```
bisindo-cslr/
├── main.py                          <- DIMODIFIKASI (tambah CLI args + inference block)
├── inference/
│   ├── __init__.py                  <- BARU (ekspor public API)
│   └── cslr_runner.py               <- BARU (modul inference utama)
└── plan.md                          <- FILE INI
```

### `inference/cslr_runner.py` — Fungsi & Class Utama

| Entitas | Tipe | Tanggung Jawab |
|---|---|---|
| `SkeletonPreprocessor` | class | Membungkus logika preprocessing dari `SkeletonFeeder` |
| `GroundTruthLookup` | class | Membaca anotasi dan mencari ground truth via `sentence_id` |
| `InferenceRunner` | class | Load model, jalankan inference, hitung WER |
| `compute_wer_single()` | function | Hitung WER satu sample tanpa sclite |

---

## 8. Potensi Edge Case dan Validasi

| Edge Case | Penanganan |
|---|---|
| `--checkpoint` tidak diberikan | Logging warning, skip inference, lanjut normal |
| File checkpoint tidak ditemukan | `FileNotFoundError` dengan pesan yang informatif |
| `sentence_id` tidak ada di anotasi | Logging warning, tampilkan `[NOT FOUND]`, WER: N/A |
| Config YAML tidak ada key tertentu | Gunakan default value konsisten dengan `SkeletonFeeder` |
| Skeleton terlalu pendek (< 1 frame) | Logging warning, skip inference |
| `normalization_types` kosong | Tidak masalah — konsisten dengan config SD default |
| GPU tidak tersedia | Fallback ke CPU otomatis |
| Gloss tidak ada di `gloss_dict` | Diabaikan (konsisten dengan `SkeletonFeeder.read_pose`) |

---

## Urutan Implementasi

1. [x] Analisis project selesai
2. [x] `plan.md` dibuat
3. [ ] Buat `inference/__init__.py`
4. [ ] Buat `inference/cslr_runner.py` (preprocessing + inference + WER)
5. [ ] Extend `main.py` (tambah CLI args + panggil inference runner)
6. [ ] Verifikasi output format
