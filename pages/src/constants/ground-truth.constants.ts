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
  { sentence_id: 'S01', text: 'AKU CIUM BADAN DIA' },
  { sentence_id: 'S02', text: 'AKU LIHAT ADA ULAR MASUK KELAS' },
  { sentence_id: 'S03', text: 'AKU NILAI JELEK' },
  { sentence_id: 'S04', text: 'AKU PUSING AKU HARUS PERIKSA MANA' },
  { sentence_id: 'S05', text: 'APA KAMU PERNAH BACA BUKU BAHASA INGGRIS' },
  { sentence_id: 'S06', text: 'AYAH SAMA IBU MANA' },
  { sentence_id: 'S07', text: 'BADAN AKU GEMUK TAPI BADAN ADIK KURUS' },
  { sentence_id: 'S08', text: 'BUKU AKU SOBEK GEGARA DIA' },
  { sentence_id: 'S09', text: 'DIA ANAK BAIK SAMPAI BANYAK ORANG SUKA' },
  { sentence_id: 'S10', text: 'DIA MENGEJEK AKU' },
  { sentence_id: 'S11', text: 'GAKBOLEH PULANG SEKARANG KAMU' },
  { sentence_id: 'S12', text: 'IBU AKU PUNYA KUCING SAMA IKAN' },
  { sentence_id: 'S13', text: 'KAKAK AKU KASIH HADIAH BUAT AKU' },
  { sentence_id: 'S14', text: 'KAMU BELAJAR BISINDO KAPAN' },
  { sentence_id: 'S15', text: 'KAMU PERGI MANA' },
  { sentence_id: 'S16', text: 'KAMU PUNYA ANGGOTA KELUARGA BERAPA' },
  { sentence_id: 'S17', text: 'KENAPA KAMU GAK MASUK KULIAH KEMARIN' },
  { sentence_id: 'S18', text: 'KITA ISTIRAHAT JAM BERAPA' },
  { sentence_id: 'S19', text: 'MANA IBU KAMU BAIK-BAIK ATAU TIDAK' },
  { sentence_id: 'S20', text: 'NAMA ISYARAT KAMU APA' },
  { sentence_id: 'S21', text: 'OBAT BISA BELI TOKO MANA' },
  { sentence_id: 'S22', text: 'ORANG JAHAT SANA PUKUL AKU BERULANG' },
  { sentence_id: 'S23', text: 'POLISI SANA PUKUL PENCURI' },
  { sentence_id: 'S24', text: 'RUMAH DIMANA KAMU' },
  { sentence_id: 'S25', text: 'SANA BERITA SUDAH BANYAK RIBUAN ORANG LIHAT' },
  { sentence_id: 'S26', text: 'SANA ENAK NASI PADANG TAPI MAHAL' },
  { sentence_id: 'S27', text: 'SANA TOILET KOTOR' },
  { sentence_id: 'S28', text: 'SEPATU DIA KOTOR' },
  { sentence_id: 'S29', text: 'TONG-SAMPAH ADA SEMUT BANYAK' },
  { sentence_id: 'S30', text: 'ULAR SANA MAKAN KAMBING' },
];
