# CSLR Skeleton-Based Inference Pipeline

Saya ingin membuat pipeline inference untuk model Continuous Sign Language Recognition (CSLR) berbasis skeleton.

Sebelum menulis kode, buat terlebih dahulu file `plan.md` yang berisi:

1. Tujuan pipeline inference.
2. Struktur input dan output.
3. Alur preprocessing data skeleton.
4. Komponen yang digunakan dari project existing.
5. Langkah inference model.
6. Perhitungan WER.
7. Struktur file yang akan dibuat.
8. Potensi edge case dan validasi.

Setelah `plan.md` selesai, baru lanjut implementasi kode.

---

# Context Existing Project

Project sudah memiliki entry point utama pada file `main.py` di root project.

Lanjutkan implementasi dari file tersebut, jangan membuat entry point baru.

Berikut struktur existing pipeline yang perlu dijadikan acuan:

- `main.py` di root project digunakan sebagai orchestrator pipeline.
- Skeleton extraction dilakukan melalui:
  - `SkeletonPipeline`
  - `pipeline.process_video(input_path)`
- Project `rgb-to-skeleton` sudah di-load ke `sys.path`.
- Data skeleton hasil extraction tersedia secara in-memory pada:
  ```python
  result["skeleton"]
  ```
- Existing project sudah memiliki:
  - logger
  - CLI parser
  - stderr filter
  - preview generation
  - async save mechanism

Inference CSLR harus diintegrasikan ke flow existing tersebut, bukan dibuat sebagai pipeline terpisah.

---

# Requirement Pipeline

Buat kode inference dengan spesifikasi berikut:

## Input

Pipeline menerima:

- `sentence_id` 

Ini nanti dikirim oleh inputan dari user melalui API

Contoh:

```python
sentence_id = "S001"
```

- data skeleton

Data skeleton berasal dari hasil pipeline `rgb-to-skeleton`.

Penting:

- data skeleton sudah tersedia secara in-memory
- jangan load ulang dari `.npy`
- gunakan object/format asli hasil:
  ```python
  result["skeleton"]
  ```

- inference dilakukan setelah:
  ```python
  pipeline.process_video(input_path)
  ```

---

# Tugas Utama

## 1. Extend Existing main.py

Tambahkan pipeline inference ke existing `main.py` flow:

```python
result = pipeline.process_video(input_path)
```

Setelah skeleton berhasil dibuat:
- ambil skeleton in-memory
- lakukan preprocessing
- inferensi model
- hitung WER
- tampilkan hasil inference

Jangan merusak flow existing pipeline.

---

## 2. Load Config YAML

Pipeline harus membaca file config YAML model untuk menentukan:

- preprocessing (normalization dan downsampling)

Gunakan konfigurasi yang sama seperti saat testing resmi model.

---

## 3. Preprocessing Skeleton

Lakukan preprocessing skeleton mengikuti pipeline pada config dan kode existing project. Pastikan preprocessing inference konsisten dengan preprocessing testing.

Jangan membuat preprocessing baru jika fungsi existing sudah tersedia.

Jangan lupa logging untuk setiap step preprocessing.

---

## 4. Inference Model

Lakukan:

- load model checkpoint
- set model ke evaluation mode
- inferensi terhadap skeleton input yang sudah diprepocessing
- decode hasil prediksi menjadi kalimat/gloss sequence

Inference harus menggunakan skeleton hasil extraction dari pipeline existing.

---

## 5. Ground Truth Retrieval

Gunakan `sentence_id` untuk mengambil ground truth sentence/gloss dari dataset annotation yang digunakan project.

---

## 6. Hitung WER

Hitung:

- Word Error Rate (WER)

Gunakan evaluasi yang konsisten dengan evaluasi resmi project/model.

---

# Output

Tampilkan output akhir berikut:

```text
Sentence ID          : S001
Ground Truth         : ...
Inference Prediction : ...
WER                  : ...
```

Tambahkan logging menggunakan logger existing project.

---

# Constraint Penting

- Jangan membuat preprocessing baru dari nol karena sudah ada implementasi pada project.
- Reuse utility/function existing.
- Ikuti struktur coding dan style project existing.
- Fokus pada inference single sample.
- Hindari hardcode parameter karena sudah ada di config YAML.
- Semua parameter harus mengikuti config YAML.
- Jangan membuat pipeline inference terpisah dari `main.py`, integrasikan.
- Jika ada bagian project yang ambigu, telusuri dependency dan call flow terlebih dahulu sebelum implementasi.
- Jangan lupa logging untuk setiap step preprocessing.
---

# Yang Harus Dilakukan Model Secara Berurutan

1. Analisis struktur project terlebih dahulu.
2. Pahami flow existing `main.py`.
3. Buat `plan.md`.
4. Identifikasi reusable preprocessing pipeline.
5. Identifikasi format skeleton in-memory.
6. Extend existing `main.py`.
7. Implementasi inference pipeline.
8. Implementasi WER evaluation.
9. Verifikasi output final.

---

# Existing Flow Reference

Berikut flow existing yang harus dipertahankan:

```python
pipeline = SkeletonPipeline(...)
result = pipeline.process_video(input_path)

skeleton = result.get("skeleton")
```

Inference CSLR dilakukan setelah step tersebut.

---

# Expected Deliverables

Minimal hasil akhir terdiri dari:

- `plan.md`
- update `main.py`
- module/helper inference bila diperlukan
- dokumentasi singkat cara menjalankan inference single sample