# Backend Coding Standards

**Version**: 1.0.0  
**Last Updated**: May 18, 2026  
**Status**: Active

## Scope

Dokumen ini mengatur kualitas kode untuk bagian backend. Fokusnya adalah maintainability,
testability, consistency, dan keamanan implementasi. Dokumen ini tidak membahas arsitektur
aplikasi secara spesifik.

## Prinsip Utama

1. Satu fungsi atau kelas harus punya satu tanggung jawab utama.
2. Logika bisnis harus terpisah dari I/O, parsing, dan format output.
3. Konfigurasi harus disimpan di satu tempat dan tidak di-hardcode di banyak file.
4. Kode harus mudah diuji tanpa bergantung pada state global yang rumit.
5. Perubahan kecil seharusnya tidak memaksa perubahan besar di banyak modul.

## Struktur Kode Backend RGB TO SKELETON 

- `config/` untuk konstanta, path, dan pengaturan runtime.
- `core/` untuk alur eksekusi tingkat atas.
- `extractor/` untuk proses pengambilan data dari sumber input.
- `processor/` untuk transformasi dan validasi data.
- `converter/` untuk serialisasi output.
- `utils/` untuk helper umum, logger, dan exception.

## Standar Penulisan Kode

- Gunakan Python 3.10+.
- Gunakan indentasi 4 spasi.
- Gunakan nama variabel, fungsi, dan file yang deskriptif.
- Hindari one-letter variable kecuali untuk loop pendek yang sangat jelas.
- Setiap public function harus punya type hints.
- Setiap public function harus punya docstring singkat yang menjelaskan input, output, dan error penting.
- Gunakan `snake_case` untuk fungsi dan file, `PascalCase` untuk class, dan `UPPER_SNAKE_CASE` untuk konstanta.

## Kontrak Data

- Validasi bentuk data di batas modul, bukan tersebar di banyak tempat.
- Jangan ubah format data diam-diam di tengah pipeline.
- Kalau format output berubah, update dokumentasi dan test yang terkait.
- Simpan struktur output dalam format yang eksplisit dan mudah dibaca.

Contoh:

```python
def process_item(item_id: str, payload: dict) -> dict:
    """Process one payload and return a validated result."""
    ...
```

## Konfigurasi

- Semua nilai yang dapat berubah harus ada di file konfigurasi.
- Jangan menaruh path, threshold, atau magic number langsung di dalam logika utama.
- Gunakan satu sumber kebenaran untuk konstanta yang dipakai lintas modul.
- Jika perlu default, definisikan di konfigurasi dan baca dari sana.

## Error Handling

- Gunakan exception yang spesifik, bukan `Exception` umum kecuali benar-benar terakhir.
- Jangan menelan error tanpa logging.
- Pesan error harus cukup jelas untuk debugging, tetapi tidak membocorkan data sensitif.
- Tangani error sedekat mungkin dengan sumber masalah.

Contoh:

```python
class ProcessingError(Exception):
    """Raised when backend processing fails."""


def load_input(path: str) -> bytes:
    if not path:
        raise ProcessingError("Input path is required")
```

## Logging

- Gunakan logger terpusat, bukan `print` untuk flow normal.
- Gunakan level log yang sesuai: `info`, `warning`, `error`, dan `debug`.
- Hindari logging data sensitif atau payload lengkap bila tidak perlu.
- Log harus cukup untuk menelusuri satu request atau satu proses end-to-end.

## Testing

- Semua fungsi baru yang logis harus punya test.
- Test unit untuk fungsi yang deterministik.
- Test integrasi untuk alur utama antar modul.
- Mock dependency eksternal seperti filesystem, video reader, atau service lain bila memungkinkan.
- Prioritaskan test untuk error case, boundary case, dan format output.

Target minimum:

- Unit test untuk logic inti
- Integration test untuk alur backend utama
- Smoke test untuk memastikan entry point jalan

## Dependency Management

- Tambahkan dependency hanya jika benar-benar dipakai.
- Hapus dependency yang tidak relevan dari `requirements.txt` dan `environment.yml`.
- Jangan campur dependency untuk eksperimen dengan dependency runtime utama tanpa alasan.
- Jika satu paket dipakai hanya untuk utilitas opsional, nyatakan dengan jelas di dokumentasi.

## Performance dan Maintainability

- Hindari kerja berulang yang bisa dipindah ke inisialisasi sekali saja.
- Jangan membuat object berat di dalam loop frame atau loop item jika bisa dihindari.
- Gunakan helper kecil untuk tugas yang jelas.
- Jangan optimasi prematur; utamakan struktur yang mudah dipahami dan diuji.

## Anti-Pattern yang Harus Dihindari

- Fungsi yang terlalu panjang dan melakukan banyak hal.
- Class yang bercampur antara proses, validasi, dan penyimpanan.
- Konfigurasi yang tersebar di banyak file.
- Duplikasi logika yang sama di beberapa modul.
- `print` sebagai mekanisme logging utama.
- Magic number yang tidak dijelaskan.
- Import yang tidak dipakai.

## Checklist Review

- [ ] Type hints lengkap untuk public API
- [ ] Docstring ada dan sesuai isi fungsi
- [ ] Tidak ada magic number yang tidak dijelaskan
- [ ] Config dipisah dari logic
- [ ] Error handling jelas dan spesifik
- [ ] Logging konsisten
- [ ] Test ditambahkan atau diperbarui
- [ ] Dependency yang dipakai memang relevan
- [ ] Tidak ada duplikasi logic yang tidak perlu

## Ringkasan

Backend yang baik harus mudah dibaca, mudah diuji, dan mudah diubah. Fokus utama dokumen ini
adalah menjaga kualitas kode agar stabil ketika fitur berkembang, tanpa mengikat implementasi
ke arsitektur spesifik tertentu.