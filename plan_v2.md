# Plan V2: Dynamic Preprocessing Configuration

Dibuat: 2026-05-24

---

## 1. Tujuan
Memberikan kontrol kepada pengguna melalui UI untuk memilih file konfigurasi (seperti `Baseline+TN.yaml` atau `Double_Cosign_sd.yaml`). Pilihan ini akan secara dinamis menentukan langkah preprocessing (misal temporal normalization, missing keypoint reconstruction, downsampling) tanpa harus memuat ulang bobot model.

## 2. Perubahan Backend

### 2.1. `inference/cslr_runner.py`
- Tambahkan metode `update_preprocessor(config_path: str)` ke dalam class `InferenceRunner`.
- Tujuannya adalah untuk memperbarui objek `self.preprocessor` jika config yang diminta berbeda dari config yang sedang aktif, sehingga kita tidak perlu memanggil `self._load_model()` yang memakan waktu (±5-10 detik karena model berukuran ~700MB).

### 2.2. `app.py`
- Ubah default config jika tidak disediakan oleh klien menjadi `Double_Cosign_sd.yaml`.
- Tambahkan endpoint baru `GET /api/configs` untuk mendapatkan daftar file konfigurasi yang tersedia di direktori `mslr_iccv2025/configs/experiment_configs/normalization/` serta config default di `mslr_iccv2025/configs/`.
- Modifikasi endpoint `POST /api/inference` untuk menerima parameter tambahan `config_name: str`. Endpoint ini akan memetakan nama file ke absolute path, memanggil `runner.update_preprocessor()`, lalu menjalankan inference.

---

## 3. Perubahan Frontend

### 3.1. State & Types
- Buat state baru untuk menyimpan konfigurasi yang dipilih (`selectedConfig`). Bisa ditambahkan di `useInferenceStore` atau store terpisah.

### 3.2. Komponen UI
- Tambahkan Dropdown / Selector untuk memilih Config, serupa dengan komponen `GroundTruthSelector`.
- Dropdown ini akan menarik data dari endpoint `GET /api/configs` saat komponen dimuat.

### 3.3. Update `useInference` Hook
- Pada `startInference`, masukkan `selectedConfig` ke dalam `FormData` sebagai field `config_name`.

---

## 4. Urutan Eksekusi

1. [ ] Buat `plan_v2.md` (Selesai).
2. [ ] Modifikasi `inference/cslr_runner.py` untuk mendukung `update_preprocessor()`.
3. [ ] Modifikasi `app.py` untuk menambah endpoint `/api/configs` dan mengupdate parameter `/api/inference`.
4. [ ] Modifikasi Frontend (types, store, hooks, UI) untuk mengintegrasikan pilihan config.
5. [ ] Verifikasi keseluruhan flow.
