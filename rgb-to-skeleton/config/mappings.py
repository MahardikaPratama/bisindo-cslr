"""
Metadata Mappings Configuration

This module defines standard dictionaries for mapping raw strings
(e.g. folder names, speaker names) to standardized system IDs (Pxx, Sxxx).
"""

# ==========================================================
# METADATA MAPPINGS
# ==========================================================

PERSON_MAP = {
    "ACHMAD": "P1",
    "ANDRI": "P2",
    "FADIL": "P3",
    "HADI": "P4",
    "HENDI": "P5",
    "DELIA": "P6",
}

SENTENCE_FOLDERS = [
    "AKU CIUM BADAN DIA",
    "AKU LIHAT ADA ULAR MASUK KELAS",
    "AKU NILAI JELEK",
    "AKU PUSING AKU HARUS PERIKSA MANA",
    "APA KAMU PERNAH BACA BUKU BAHASA INGGRIS",
    "AYAH SAMA IBU MANA",
    "BADAN AKU GEMUK TAPI BADAN ADIK KURUS",
    "BUKU AKU SOBEK GEGARA DIA",
    "DIA ANAK BAIK SAMPAI BANYAK ORANG SUKA",
    "DIA MENGEJEK AKU",
    "GAKBOLEH PULANG SEKARANG KAMU",
    "IBU AKU PUNYA KUCING SAMA IKAN",
    "KAKAK AKU KASIH HADIAH BUAT AKU",
    "KAMU BELAJAR BISINDO KAPAN",
    "KAMU PERGI MANA",
    "KAMU PUNYA ANGGOTA KELUARGA BERAPA",
    "KENAPA KAMU GAK MASUK KULIAH KEMARIN",
    "KITA ISTIRAHAT JAM BERAPA",
    "MANA IBU KAMU BAIK-BAIK ATAU TIDAK",
    "NAMA ISYARAT KAMU APA",
    "OBAT BISA BELI TOKO MANA",
    "ORANG JAHAT SANA PUKUL AKU BERULANG",
    "POLISI SANA PUKUL PENCURI",
    "RUMAH DIMANA KAMU",
    "SANA BERITA SUDAH BANYAK RIBUAN ORANG LIHAT",
    "SANA ENAK NASI PADANG TAPI MAHAL",
    "SANA TOILET KOTOR",
    "SEPATU DIA KOTOR",
    "TONG-SAMPAH ADA SEMUT BANYAK",
    "ULAR SANA MAKAN KAMBING",
]

# Create mapping S01 - S30
SENTENCE_MAP = {folder: f"S{i:02d}" for i, folder in enumerate(SENTENCE_FOLDERS, 1)}
