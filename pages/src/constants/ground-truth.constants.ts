/**
 * @file        ground-truth.constants.ts
 * @description Daftar tetap kalimat ground truth untuk perbandingan hasil inferensi
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

export interface GroundTruthSentence {
  sentence_id: string;
  text: string;
}

export const GROUND_TRUTH_SENTENCES: GroundTruthSentence[] = [
  { sentence_id: 'S001', text: 'AYAH SAMA IBU MANA' },
  { sentence_id: 'S002', text: 'DIA ANAK BAIK SAMPAI BANYAK ORANG SUKA' },
  { sentence_id: 'S003', text: 'APA KAMU PERNAH BACA BUKU BAHASA INGGRIS' },
  { sentence_id: 'S004', text: 'BADAN AKU GEMUK TAPI BADAN ADIK KURUS' },
  { sentence_id: 'S005', text: 'AKU PUSING AKU HARUS PERIKSA MANA' },
  { sentence_id: 'S006', text: 'SANA ENAK NASI PADANG TAPI MAHAL' },
  { sentence_id: 'S007', text: 'IBU AKU PUNYA KUCING SAMA IKAN' },
  { sentence_id: 'S008', text: 'AKU CIUM BADAN DIA' },
  { sentence_id: 'S009', text: 'AKU LIHAT ADA ULAR MASUK KELAS' },
  { sentence_id: 'S010', text: 'OBAT BISA BELI TOKO MANA' },
  { sentence_id: 'S011', text: 'GAK BOLEH PULANG SEKARANG KAMU' },
  { sentence_id: 'S012', text: 'ORANG JAHAT SANA PUKUL AKU BERULANG' },
  { sentence_id: 'S013', text: 'KENAPA KAMU GAK MASUK KULIAH KEMARIN' },
  { sentence_id: 'S014', text: 'POLISI SANA PUKUL PENCURI' },
  { sentence_id: 'S015', text: 'SANA BERITA SUDAH BANYAK RIBUAN ORANG LIHAT' },
  { sentence_id: 'S016', text: 'BUKU AKU SOBEK GEGARA DIA' },
  { sentence_id: 'S017', text: 'TONG-SAMPAH ADA SEMUT BANYAK' },
  { sentence_id: 'S018', text: 'ULAR SANA MAKAN KAMBING' },
  { sentence_id: 'S019', text: 'KAMU PERGI MANA' },
  { sentence_id: 'S020', text: 'KITA ISTIRAHAT JAM BERAPA' },
  { sentence_id: 'S021', text: 'KAMU PUNYA ANGGOTA KELUARGA BERAPA' },
  { sentence_id: 'S022', text: 'MANA IBU KAMU BAIK-BAIK ATAU TIDAK' },
  { sentence_id: 'S023', text: 'KAMU BELAJAR BISINDO KAPAN' },
  { sentence_id: 'S024', text: 'AKU NILAI JELEK' },
  { sentence_id: 'S025', text: 'ULANG TAHUN SELAMAT' },
  { sentence_id: 'S026', text: 'KAKAK AKU KASIH HADIAH BUAT AKU' },
  { sentence_id: 'S027', text: 'SANA TOILET KOTOR' },
  { sentence_id: 'S028', text: 'SEPATU DIA KOTOR' },
  { sentence_id: 'S029', text: 'RUMAH DIMANA KAMU' },
  { sentence_id: 'S030', text: 'DIA MENGEJEK AKU' },
];
