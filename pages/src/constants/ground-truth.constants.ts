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
  { sentence_id: 'S001', text: 'AKU CIUM BADAN DIA' },
  { sentence_id: 'S002', text: 'AKU LIHAT ADA ULAR MASUK KELAS' },
  { sentence_id: 'S003', text: 'AKU NILAI JELEK' },
  { sentence_id: 'S004', text: 'AKU PUSING SERING, AKU HARUS PERIKSA MANA' },
  { sentence_id: 'S005', text: 'APA KAMU PERNAH BACA NOVEL B.INGGRIS' },
  { sentence_id: 'S006', text: 'AYAH SAMA IBU MANA' },
  { sentence_id: 'S007', text: 'BADAN AKU GEMUK TAPI BADAN ADIK KURUS' },
  { sentence_id: 'S008', text: 'BUKU AKU SOBEK GEGARA DIA' },
  { sentence_id: 'S009', text: 'DIA ANAK BAIK SAMPAI BANYAK ORANG SUKA' },
  { sentence_id: 'S010', text: 'DIA MENGEJEK AKU' },
  { sentence_id: 'S011', text: 'GAK BOLEH PULANG SEKARANG KAMU' },
  { sentence_id: 'S012', text: 'GIMANA IBUMU BAIK-BAIK ATAU TIDAK' },
  { sentence_id: 'S013', text: 'IBU AKU PUNYA KUCING SAMA IKAN' },
  { sentence_id: 'S014', text: 'KAKAK AKU KASIH HADIAH BUAT AKU' },
  { sentence_id: 'S015', text: 'KAMU BELAJAR BISINDO KAPAN' },
  { sentence_id: 'S016', text: 'KAMU PERGI KEMANA' },
  { sentence_id: 'S017', text: 'KAMU PUNYA ANGGOTA KELUARGA BERAPA' },
  { sentence_id: 'S018', text: 'KENAPA KAMU GAK MASUK KULIAH KEMARIN' },
  { sentence_id: 'S019', text: 'KITA ISTIRAHAT JAM BERAPA' },
  { sentence_id: 'S020', text: 'OBAT BISA BELI TOKO OBAT MANA' },
  { sentence_id: 'S021', text: 'ORANG JAHAT SANA PUKUL AKU BERULANG' },
  { sentence_id: 'S022', text: 'POLISI SANA PUKUL PENCURI' },
  { sentence_id: 'S023', text: 'RUMAH DIMANA KAMU' },
  { sentence_id: 'S024', text: 'SANA BERITA SUDAH BANYAK RIBUAN ORANG LIHAT' },
  { sentence_id: 'S025', text: 'SANA ENAK NASI PADANG TAPI MAHAL' },
  { sentence_id: 'S026', text: 'SANA TOILET KOTOR' },
  { sentence_id: 'S027', text: 'SEPATU DIA KOTOR' },
  { sentence_id: 'S028', text: 'TONG SAMPAH ADA SEMUT BANYAK' },
  { sentence_id: 'S029', text: 'ULANG TAHUN SELAMAT' },
  { sentence_id: 'S030', text: 'ULAR SANA MAKAN KAMBING' },
];
