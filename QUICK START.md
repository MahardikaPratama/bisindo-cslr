# 🚀 QUICK START GUIDE

Ikuti panduan singkat berikut untuk menjalankan aplikasi BISINDO CSLR secara lokal di komputer Anda. Aplikasi ini terdiri dari dua bagian utama: **Backend (FastAPI)** dan **Frontend (React + Vite)**.

---

## 1. Menjalankan Backend (FastAPI)

Backend berfungsi untuk memproses video, melakukan ekstraksi skeleton (MediaPipe), dan menjalankan model inference.

### Prasyarat
Pastikan Anda sudah menginstal **Python 3.10+**. Disarankan menggunakan `conda` atau `venv` untuk isolasi environment.

### Langkah-langkah:
1. Buka terminal baru dan arahkan ke direktori utama proyek (`c:\TA\Source-Code\bisindo-cslr`).
2. Buat dan aktifkan virtual environment (Opsional tapi direkomendasikan):
   ```bash
   python -m venv venv
   # Di Windows:
   venv\Scripts\activate
   # Di Mac/Linux:
   source venv/bin/activate
   ```
3. Instal semua dependensi yang dibutuhkan:
   ```bash
   pip install -r requirements.txt
   ```
   *(Catatan: Anda juga dapat menggunakan `conda env create -f environment.yml` jika menggunakan Anaconda/Miniconda).*

4. Jalankan server FastAPI:
   ```bash
   uvicorn app:app --reload --port 8000
   ```
   Backend sekarang berjalan di: `http://localhost:8000`

---

## 2. Menjalankan Frontend (React UI)

Frontend berfungsi sebagai antarmuka pengguna (Dashboard, Demo, dll).

### Prasyarat
Pastikan Anda sudah menginstal **Node.js** (versi 18+) dan **pnpm** (atau npm/yarn).

### Langkah-langkah:
1. Buka terminal baru (biarkan terminal backend tetap berjalan).
2. Arahkan terminal ke dalam folder `pages`:
   ```bash
   cd pages
   ```
3. Instal semua dependensi frontend:
   ```bash
   pnpm install
   ```
   *(Jika Anda tidak memiliki pnpm, Anda bisa menggunakan `npm install`)*

4. Jalankan server pengembangan Vite:
   ```bash
   pnpm run dev
   ```
5. Buka tautan yang muncul di terminal pada browser Anda (biasanya `http://localhost:5173`).

---

🎉 **Selesai!** Anda sekarang dapat menggunakan halaman **Demo** untuk mengunggah video, serta halaman **Dashboard** untuk menganalisis statistik dari hasil eksperimen model.
