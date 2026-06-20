# Plan Integration: BE ↔ FE CSLR Full Pipeline

Dibuat: 2026-05-24

---

## 1. Kondisi Saat Ini (As-Is)

### Backend (`app.py`)
- Endpoint `/api/preview/process` — menerima video, jalankan skeleton extraction, kembalikan preview URLs + frame info.
- **Belum ada**: inference CSLR, WER, ground truth lookup.

### Frontend (`useInference.ts`)
- Step 1 & 2 nyata (upload video → API `/api/preview/process`).
- Step 3, 4, 5 adalah simulasi `sleep()` + mock data hardcoded.
- `GlossOutput` menampilkan list gloss + confidence badge — belum menampilkan ground truth & WER.

---

## 2. Target (To-Be)

### Endpoint API Baru: `POST /api/inference`

**Request (multipart/form-data)**:
| Field | Type | Keterangan |
|---|---|---|
| `video` | File | File video RGB |
| `sentence_id` | string | ID kalimat ground truth (S001–S030) |

**Response (JSON)**:
```json
{
  "video_id": "P01_S001",
  "num_frames": 94,
  "num_keypoints": 86,
  "previews": {
    "rgb": "/preview/...",
    "skeleton": "/preview/...",
    "overlay": "/preview/..."
  },
  "inference": {
    "ground_truth": "AYAH SAMA IBU MANA",
    "prediction": "AYAH SAMA IBU MANA",
    "wer": 0.0,
    "wer_percent": "0.00%",
    "inference_ms": 312
  }
}
```

### Alur Backend

```
POST /api/inference
  │
  ├─ 1. Simpan video ke temp file
  ├─ 2. SkeletonPipeline.process_video() → skeleton in-memory + preview URLs
  ├─ 3. InferenceRunner.run_return() → (prediction, ground_truth, wer)
  │       ├─ SkeletonPreprocessor.preprocess(frames)
  │       ├─ make_batch() → collate padding
  │       ├─ model.eval() + forward()
  │       ├─ decode prediction
  │       └─ lookup ground truth via sentence_id (dari GROUND_TRUTH_SENTENCES di FE)
  └─ 4. Return JSON payload lengkap
```

### Alur Frontend

**Step tracking yang sekarang dipakai**:
| Step ID | Label | API Trigger |
|---|---|---|
| `rgb-video` | Validasi video | Lokal, sebelum upload |
| `skeleton-ext` | Skeleton extraction | Saat API call berlangsung |
| `preprocess` | Preprocessing | Setelah API selesai — step ditandai dari BE metadata |
| `inference` | Model inference | Setelah API selesai |
| `prediction` | Decode & WER | Setelah API selesai |

Karena backend sekarang **satu request** yang menjalankan semua step sekaligus, FE akan:
1. Mulai request ke `/api/inference`
2. Tandai step `skeleton-ext` → `running`
3. Saat response diterima → tandai `skeleton-ext` + `preprocess` + `inference` + `prediction` semuanya `completed` secara berurutan dengan animasi delay kecil.

### GlossOutput → InferenceResult Panel

Komponen `GlossOutput` akan **diganti total** menjadi `InferenceResult` yang menampilkan:
- **Kalimat Ground Truth** — teks penuh dari `GROUND_TRUTH_SENTENCES[sentence_id].text`
- **Kalimat Hasil Prediksi** — string hasil decode model
- **WER** — badge persentase dengan warna kondisional (green ≤20%, yellow ≤50%, red >50%)

---

## 3. Perubahan File

### Backend
| File | Aksi | Keterangan |
|---|---|---|
| `app.py` | MODIFIKASI | Tambah endpoint `POST /api/inference` |
| `inference/cslr_runner.py` | MODIFIKASI | Tambah method `run_return()` yang mengembalikan dict hasil (tidak hanya print) |

### Frontend
| File | Aksi | Keterangan |
|---|---|---|
| `src/types/inference.types.ts` | MODIFIKASI | Tambah `InferenceResult` type |
| `src/store/useInferenceStore.ts` | MODIFIKASI | Tambah field `inferenceResult` |
| `src/hooks/useInference.ts` | MODIFIKASI | Ganti mock dengan real API call ke `/api/inference` |
| `src/components/gloss-output/GlossOutput.tsx` | MODIFIKASI | Tampilkan ground truth, prediksi, WER |

---

## 4. Konfigurasi Model

- Checkpoint: `mslr_iccv2025/model/best_dev_01.30_epoch39_model.pt`
- Config: `mslr_iccv2025/configs/Double_Cosign_sd.yaml`
- Annotation split: ground truth **di-inject dari FE** via `sentence_id` field
  - BE tidak perlu lookup annotation JSON karena FE mengirim `sentence_id` dan BE mencari di `GROUND_TRUTH_SENTENCES` yang di-hardcode di backend (sync dengan FE constants)

---

## 5. Desain InferenceResult Component

```
┌─────────────────────────────────────────────────────┐
│  INFERENCE RESULT              [● LIVE OUTPUT]       │
├─────────────────────────────────────────────────────┤
│  Ground Truth                                        │
│  ┌─────────────────────────────────────────────┐    │
│  │  AYAH SAMA IBU MANA                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  Prediction                                          │
│  ┌─────────────────────────────────────────────┐    │
│  │  AYAH SAMA IBU MANA                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  Word Error Rate              [0.00%] ← green badge  │
└─────────────────────────────────────────────────────┘
```

---

## 6. Urutan Implementasi

1. [x] `plan_integration.md` dibuat
2. [ ] Modifikasi `inference/cslr_runner.py` — tambah `run_return()`
3. [ ] Modifikasi `app.py` — tambah endpoint `/api/inference`
4. [ ] Modifikasi `src/types/inference.types.ts` — tambah `InferenceResult`
5. [ ] Modifikasi `src/store/useInferenceStore.ts` — tambah `inferenceResult`
6. [ ] Modifikasi `src/hooks/useInference.ts` — real API + progress steps
7. [ ] Modifikasi `src/components/gloss-output/GlossOutput.tsx` — tampilkan hasil nyata
