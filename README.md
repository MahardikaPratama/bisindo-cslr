# bisindo-cslr

Pipeline inference **Continuous Sign Language Recognition (CSLR)** berbasis skeleton untuk dataset BISINDO, dilengkapi dengan demo web app interaktif.

## Overview

Project ini menerima satu file video RGB dan menjalankan pipeline lengkap:

1. **Skeleton Extraction** — konversi video RGB ke keypoint skeleton 86 titik menggunakan MediaPipe Holistic
2. **Preprocessing** — seleksi keypoint, fitur motion, normalisasi, dan padding sesuai konfigurasi model
3. **CSLR Inference** — inferensi model `TwoStream CoSign` untuk menghasilkan prediksi gloss sequence
4. **WER Evaluation** — perhitungan Word Error Rate terhadap ground truth kalimat

Tersedia tiga mode operasi: **CLI** (`main.py`), **Web App** (`app.py` + `pages/`), dan **Google Colab** (`bisindo_cslr_colab.ipynb`).

---

## Struktur Project

```
bisindo-cslr/
├── app.py                       # FastAPI backend (REST API)
├── main.py                      # CLI entry point
├── bisindo_cslr_colab.ipynb     # Notebook untuk menjalankan backend di Google Colab
├── inference/                   # Modul inference CSLR
│   ├── ground_truth.py          # Modul pembaca file .stm untuk ground truth
│   ├── preprocessor.py          # SkeletonPreprocessor untuk penyesuaian skala MediaPipe
│   └── runner.py                # InferenceRunner, eksekusi model TwoStream CoSign
├── rgb-to-skeleton-mediapipe/   # Modul konversi video → skeleton 86-keypoint
│   ├── data/                    # Output sementara video preview & json
│   ├── src/
│   │   ├── core/                # Pipeline orchestration & CLI
│   │   ├── extractor/           # MediaPipe Holistic extractor
│   │   ├── visualizer/          # Generator preview video (skeleton, overlay)
│   │   └── config/              # Path & keypoint layout config
├── mslr_iccv2025/               # Model CSLR TwoStream CoSign
│   ├── configs/                 # YAML konfigurasi model & dataset
│   ├── datasets/                # SkeletonFeeder & data loader
│   ├── model/                   # Checkpoint model (.pt)
│   ├── modules/                 # Temporal conv & BiLSTM layers
│   ├── slr_network.py           # Definisi model TwoStream_Cosign
│   └── evaluation/              # WER evaluation (python + sclite)
├── pages/                       # Frontend React + TypeScript (Vite)
│   └── src/
│       ├── components/          # UI components (pipeline, visualization, result)
│       ├── hooks/               # useInference, useVideoUpload
│       ├── store/               # Zustand state management
│       └── constants/           # Ground truth sentences, pipeline steps
```
```


---

## Setup (Lokal)

### 1. Clone repository

```bash
git clone --recursive https://github.com/MahardikaPratama/bisindo-cslr.git
cd bisindo-cslr
```

> **`--recursive`** wajib digunakan karena project ini mengandung submodule (`rgb-to-skeleton-mediapipe`).

### 2. Buat environment Conda

```bash
conda env create -f environment.yml
conda activate bisindo-cslr
```

### 3. Download model checkpoint

Unduh file model (±680 MB) dari Google Drive dan letakkan di:

```
mslr_iccv2025/model/best_dev_01.30_epoch39_model.pt
```

🔗 **Link download:** [best_dev_01.30_epoch39_model.pt](https://drive.google.com/file/d/1Uw6nJnR74DtNp3xhGi5kCT702I8II_As/view?usp=drive_link)

### 4. Install frontend dependencies

```bash
cd pages
pnpm install
```

---

## 🚀 Menjalankan Backend di Google Colab (Direkomendasikan)

Untuk memanfaatkan GPU T4 gratis dari Google Colab sebagai backend inference:

### Langkah 1 — Buka Notebook

Import file `bisindo_cslr_colab.ipynb` ke Google Colab:

1. Buka [Google Colab](https://colab.research.google.com)
2. **File → Upload notebook** → pilih `bisindo_cslr_colab.ipynb`
3. Atur runtime ke **GPU**: Runtime → Change runtime type → **T4 GPU**

### Langkah 2 — Jalankan Sel Secara Berurutan

| Sel | Deskripsi |
|---|---|
| Step 0 | Verifikasi GPU tersedia |
| Step 1 | Clone repo dengan `--recursive` |
| Step 2 | Install semua dependencies |
| Step 3 | Download model (~680 MB) dari Google Drive |
| Step 4 | Input ngrok authtoken |
| Step 5 | Jalankan uvicorn server di background |
| Step 6 | Buat tunnel ngrok → dapatkan **URL publik** |
| Step 7 | Verifikasi endpoint (opsional) |

### Langkah 3 — Hubungkan Frontend ke Colab

Setelah Step 6 selesai, Anda akan mendapat URL publik seperti:

```
https://xxxx-xx-xx-xxx-xx.ngrok-free.app
```

Update `pages/vite.config.ts` di komputer lokal:

```ts
proxy: {
  '/api'    : { target: 'https://xxxx-xx-xx-xxx-xx.ngrok-free.app', changeOrigin: true },
  '/preview': { target: 'https://xxxx-xx-xx-xxx-xx.ngrok-free.app', changeOrigin: true },
},
```

Lalu jalankan frontend:

```bash
cd pages
npm run dev
```

Buka `http://localhost:5173` — frontend akan terhubung ke backend Colab dengan GPU.

> **Catatan ngrok free tier:** URL berubah setiap sesi. Perbarui `vite.config.ts` setiap kali memulai Colab baru.

---


## Menjalankan Web App (Cara Utama)

### Terminal 1 — Backend API

```bash
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

### Terminal 2 — Frontend Dev Server

```bash
cd pages
npm run dev
```

Buka browser di `http://localhost:5173`.

### Alur penggunaan

1. Upload file video RGB (.mp4 / .webm / .avi / .mov)
2. Pilih **Sentence ID** (S001–S030) dari dropdown
3. Klik **Run Pipeline Inference**
4. Pantau progress di **Processing Pipeline** bar
5. Lihat hasil di panel **Inference Result**:
   - Kalimat Ground Truth
   - Kalimat Hasil Prediksi
   - Word Error Rate (WER)

---

## REST API

Backend berjalan di `http://127.0.0.1:8000`.

### `GET /health`

Cek status server.

```bash
curl http://127.0.0.1:8000/health
```

```json
{ "status": "ok" }
```

---

### `POST /api/inference`

**Full pipeline**: skeleton extraction → preprocessing → inference → WER.

| Field | Type | Keterangan |
|---|---|---|
| `video` | file | File video RGB (mp4/webm/avi/mov/mkv) |
| `sentence_id` | string | ID kalimat ground truth, contoh: `S001` |

```bash
curl -X POST "http://127.0.0.1:8000/api/inference" \
  -F "video=@data/raw/sample.mp4" \
  -F "sentence_id=S001"
```

**Response:**

```json
{
  "video_id": "P01_S001",
  "num_frames": 94,
  "num_keypoints": 86,
  "previews": {
    "rgb": "/preview/rgb/P01_S001_rgb.mp4",
    "skeleton": "/preview/skeleton_only/P01_S001_skeleton.mp4",
    "overlay": "/preview/overlay_rgb_skeleton/P01_S001_overlay.mp4"
  },
  "inference": {
    "ground_truth": "AYAH SAMA IBU MANA",
    "prediction": "AYAH SAMA IBU MANA",
    "wer": 0.0,
    "wer_percent": "0.00%",
    "inference_ms": 312
  },
  "total_ms": 4821
}
```

---

### `POST /api/preview/process`

Skeleton extraction dan preview saja (tanpa inference CSLR).

```bash
curl -X POST "http://127.0.0.1:8000/api/preview/process" \
  -F "video=@data/raw/sample.mp4"
```

---

## CLI (`main.py`)

Jalankan pipeline dari terminal tanpa web app.

### Tanpa inference (skeleton + preview saja)

```bash
python main.py --input data/raw/sample.mp4
```

### Dengan inference CSLR

```bash
python main.py \
  --input data/raw/sample.mp4 \
  --checkpoint mslr_iccv2025/model/best_dev_01.30_epoch39_model.pt \
  --sentence-id S001 \
  --annotation-split test_sd \
  --cslr-config mslr_iccv2025/configs/Double_Cosign_sd.yaml
```

**Output:**

```text
============================================================
CSLR INFERENCE RESULT
============================================================
Sentence ID          : S001
Ground Truth         : AYAH SAMA IBU MANA
Inference Prediction : AYAH SAMA IBU MANA
WER                  : 0.00%
============================================================
```

### CLI Parameters

| Parameter | Wajib | Default | Keterangan |
|---|---|---|---|
| `--input` / `-i` | ✅ | — | Path ke file video input |
| `--checkpoint` | — | — | Path ke file `.pt` bobot model. Jika tidak diisi, inference dilewati |
| `--sentence-id` | — | `UNKNOWN` | ID kalimat ground truth (S001–S030) |
| `--cslr-config` | — | `Double_Cosign_sd.yaml` | Path ke config YAML model |
| `--annotation-split` | — | `test_sd` | Split anotasi untuk lookup ground truth |
| `--save-to-disk` | — | `False` | Simpan skeleton JSON ke disk |
| `--async-save` | — | `False` | Disk write secara background thread |

---

## Model

| Property | Value |
|---|---|
| Arsitektur | TwoStream CoSign (Two-Stream + CTC) |
| Input | Skeleton keypoint 86 titik (hand21 = 42 titik) |
| Dataset | BISINDO (Signer Dependent) |
| Checkpoint | `mslr_iccv2025/model/best_dev_01.30_epoch39_model.pt` |
| Config | `mslr_iccv2025/configs/Double_Cosign_sd.yaml` |
| WER terbaik | 1.30% (dev set) |

---

## Ground Truth Sentences

Tersedia 30 kalimat (S001–S030) yang dapat dipilih sebagai ground truth. Daftar lengkap tersedia di:

- Frontend: `pages/src/constants/ground-truth.constants.ts`
- Backend: `GROUND_TRUTH_TABLE` di `app.py`

---

## `rgb-to-skeleton-mediapipe` Module

Modul ini bertanggung jawab atas konversi video RGB ke skeleton keypoint.

| Submodul | Fungsi |
|---|---|
| `extractor/` | Ekstraksi keypoint menggunakan MediaPipe Holistic (86 titik) |
| `data/` | Output sementara video preview & json |
| `visualizer/` | Generator preview: RGB, skeleton-only, overlay |
| `core/pipeline.py` | Orkestrasi pipeline |
| `core/cli.py` | Argument parser CLI |
| `config/` | Path & keypoint layout config |

> **Catatan:** MediaPipe Holistic membutuhkan versi `<= 0.10.14`.
