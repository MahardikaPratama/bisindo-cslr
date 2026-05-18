# 🤟 BISINDO CSLR Demo

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

Sebuah platform web demonstrasi *end-to-end* untuk **Continuous Sign Language Recognition (CSLR)** khusus untuk **BISINDO** (Bahasa Isyarat Indonesia). Aplikasi ini dirancang untuk mensimulasikan alur inferensi model dari input *raw RGB video*, ekstraksi *skeleton* menggunakan MediaPipe, hingga prediksi *gloss sequence* (urutan kata) menggunakan arsitektur **TwoStream-CoSign**.

Aplikasi ini dikembangkan oleh **KoTA 502** sebagai bagian dari inisiatif riset CSLR.

---

## ✨ Fitur Utama

- **🎬 Video Processing Setup**: Upload video interaktif yang melakukan ekstraksi metadata dasar (durasi, FPS, resolusi) secara otomatis.
- **🔄 Visualisasi Pipeline 5-Tahap**: Status *real-time* dari langkah-langkah pemrosesan (RGB Video → Skeleton Ext. → Preprocess → Inference → Prediction).
- **👁️ Dual-View / Overlay Panel**: Fitur *playback* tersinkronisasi untuk membandingkan video asli (RGB) dengan hasil pemetaan ekstraksi 2D *skeleton* (MediaPipe).
- **📊 System Telemetry**: Laporan terperinci mengenai performa sistem, termasuk *Inference Latency*, FPS throughput, dan Utilisasi GPU.
- **📝 Real-time Console Logging**: Panel terminal bawaan yang melacak eksekusi di latar belakang, mempermudah proses *debugging* dan monitoring status pemrosesan.
- **⚡ Domain-Driven Modular State**: Arsitektur responsif dan *performant* berbasis Zustand dengan state yang sepenuhnya terisolasi (menghindari *prop-drilling*).

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS v3](https://tailwindcss.com/) + `clsx` + `tailwind-merge`
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Instalasi & Cara Menjalankan

Aplikasi ini menggunakan **pnpm** sebagai *package manager* utama untuk manajemen dependensi yang ketat dan efisien.

### 1. Prasyarat
Pastikan environment Anda sudah ter-install:
- [Node.js](https://nodejs.org/) (Versi 18.x atau lebih baru)
- [pnpm](https://pnpm.io/) (Versi 8.x atau lebih baru)

### 2. Setup Project
Clone repositori dan masuk ke direktori proyek:
```bash
# Install seluruh dependensi
pnpm install
```

### 3. Menjalankan Development Server
```bash
# Menjalankan Vite development server di http://localhost:5173
pnpm dev
```

### 4. Build untuk Production
```bash
# Melakukan type-checking dan mem-build asset production-ready
pnpm build

# Melihat preview dari hasil build
pnpm preview
```

---

## 🏗️ Arsitektur & Dokumentasi Engineering

Proyek ini dibangun secara ketat menggunakan prinsip **Domain-Driven Modular Design**. Seluruh standar pemrograman, *naming conventions*, dan keputusan sistem diatur dalam dokumentasi pusat. 

Developer yang ingin berkontribusi **DIWAJIBKAN** untuk membaca pedoman *engineering* berikut sebelum mengubah *source code*:
👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**

Struktur arsitektur tingkat tinggi:
- **`src/store/`**: Pemisahan state domain secara global (`useVideoStore`, `useInferenceStore`, `useConsoleStore`).
- **`src/hooks/`**: Abstraksi *business logic* (contoh: simulasi *pipeline* dan manajemen WebSocket/Upload).
- **`src/components/`**: Komponen terisolasi sesuai kapabilitasnya pada UI (*Separation of Concerns*).
- **`src/common/`**: Reusable *Atom* komponen yang *agnostik* (contoh: *Button*, *Card*, *Badge*, *Stepper*).

---

## 📄 Lisensi
Hak Cipta © 2024 **KoTA 502**. Continuous Sign Language Recognition Research. Powered by PyTorch & MediaPipe. All Rights Reserved.
