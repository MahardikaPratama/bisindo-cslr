<div align="center">

# 🤟 BISINDO-CSLR Pipeline

### End-to-End Skeleton-based Continuous Sign Language Recognition
### for BISINDO (Bandung Variant)

<br/>

[![Python](https://img.shields.io/badge/Python-3.8%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0.0-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.103.1-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.x-20232a?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)

<br/>

**Undergraduate Thesis · Politeknik Negeri Bandung · 2026**

**Mahardika Pratama** (221524044) &nbsp;·&nbsp; **Sarah** (221524059)

*D-IV Teknik Informatika — Jurusan Teknik Komputer dan Informatika*

</div>

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Repository Structure](#-repository-structure)
- [Quick Start (Local)](#-quick-start-local)
- [Google Colab Setup (Recommended)](#-google-colab-setup-recommended)
- [Running the Application](#-running-the-application)
- [REST API Reference](#-rest-api-reference)
- [CLI Usage](#-cli-usage)
- [Acknowledgements](#-acknowledgements)

---

## 🔍 Overview

**BISINDO-CSLR** is a complete, end-to-end inference pipeline for Continuous Sign Language Recognition. It processes raw RGB videos of sign language (BISINDO - Bandung Variant) and translates them into sequences of words (glosses).

The pipeline operates in four main stages:
1. **Skeleton Extraction**: Converts raw RGB video into an 86-point skeletal representation using **MediaPipe Holistic**.
2. **Preprocessing**: Applies spatial normalization, missing keypoint reconstruction, temporal normalization, and motion feature extraction.
3. **Inference**: Passes the normalized skeleton data through a **GCN-1DCNN-BiLSTM (TwoStream CoSign)** model.
4. **Evaluation**: Computes the Word Error Rate (WER) against the ground truth.

This repository provides three interfaces:
- **CLI (`main.py`)**: For headless bulk processing and evaluation.
- **REST API (`app.py`)**: A FastAPI backend providing inference endpoints.
- **Web App (`pages/`)**: An interactive React-based dashboard for real-time visualization, experiment results analysis, and model configuration comparisons.

---

## 📁 Repository Structure

```text
bisindo-cslr/
├── app.py                       # FastAPI backend (REST API)
├── main.py                      # CLI entry point
├── bisindo_cslr_colab.ipynb     # Jupyter Notebook for Colab deployment
├── inference/                   # High-level inference orchestration
├── rgb-to-skeleton-mediapipe/   # Skeleton extraction submodule (MediaPipe)
├── mslr_iccv2025/               # Core CSLR Neural Network (PyTorch)
└── pages/                       # Frontend Web App (React + Vite)
```

---

## 🚀 Quick Start (Local)

### 1. Clone the Repository
Due to the use of submodules, you **must** use the `--recursive` flag:
```bash
git clone --recursive https://github.com/MahardikaPratama/bisindo-cslr.git
cd bisindo-cslr
```

### 2. Environment Setup
Create and activate the Conda environment:
```bash
conda env create -f environment.yml
conda activate bisindo-cslr
```

### 3. Model Weights
Download the pre-trained model weights (~680 MB) and place them in the correct directory:
- **Destination**: `mslr_iccv2025/model/O4_model.pt`
- **Download Link**: [Google Drive](https://drive.google.com/file/d/18bqBybTXWK7tm80RHJxxYZ4t0PyjUzfQ/view?usp=drive_link)

### 4. Frontend Setup
```bash
cd pages
pnpm install
```

---

## ☁️ Google Colab Setup (Recommended)

Due to heavy computational requirements, utilizing a free T4 GPU via Google Colab is highly recommended for backend inference.

1. **Upload Notebook**: Open [Google Colab](https://colab.research.google.com) and upload `bisindo_cslr_colab.ipynb`.
2. **Enable GPU**: Go to `Runtime` → `Change runtime type` → Select **T4 GPU**.
3. **Run Cells**: Execute the cells sequentially. You will need to provide an **ngrok authtoken**.
4. **Get Public URL**: The final cell will generate a public URL (e.g., `https://xxxx.ngrok-free.app`).
5. **Configure Frontend**: Update `pages/vite.config.ts` on your local machine to proxy requests to this URL.
6. **Launch UI**: Run the frontend locally via `pnpm dev`.

---

## 💻 Running the Application

If you have a local GPU and wish to run the entire stack locally:

**Terminal 1 (Backend)**:
```bash
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend)**:
```bash
cd pages
pnpm dev
```
Navigate to `http://localhost:5173` in your browser to access the interactive dashboard.

---

## 🌐 REST API Reference

The FastAPI backend runs on `http://127.0.0.1:8000`.

### Health Check
```bash
curl http://127.0.0.1:8000/health
```
**Response**: `{"status": "ok"}`

### Inference Endpoint
Executes the full pipeline (Extraction → Preprocessing → Inference → Evaluation).
- **Endpoint**: `POST /api/inference`
- **Payload**: `multipart/form-data`
  - `video` (File): The RGB video file.
  - `sentence_id` (String): Ground truth ID (e.g., `S001`).

```bash
curl -X POST "http://127.0.0.1:8000/api/inference" \
  -F "video=@sample.mp4" -F "sentence_id=S001"
```

---

## ⌨️ CLI Usage

You can process videos directly from the terminal without starting the web server.

**Full Inference Pipeline**:
```bash
python main.py \
  --input data/raw/sample.mp4 \
  --checkpoint mslr_iccv2025/model/best_dev_01.30_epoch39_model.pt \
  --sentence-id S001 \
  --annotation-split test_sd \
  --cslr-config mslr_iccv2025/configs/Double_Cosign_sd.yaml
```

**Skeleton Extraction Only (No Inference)**:
```bash
python main.py --input data/raw/sample.mp4
```

---

<div align="center">
<sub>Made with ❤️ for the Indonesian Deaf community · Politeknik Negeri Bandung · 2026</sub>
</div>
