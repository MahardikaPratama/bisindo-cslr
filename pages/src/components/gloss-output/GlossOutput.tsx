/**
 * @file        GlossOutput.tsx
 * @description Panel hasil inferensi CSLR — menampilkan kalimat Ground Truth,
 *              kalimat hasil prediksi model, dan Word Error Rate (WER).
 * @author      KoTA 502
 * @version     2.0.0
 * @created     2024-01-01
 */

import React from 'react';
import { Volume2 } from 'lucide-react';
import Card from '../../common/Card/Card';
import Badge from '../../common/Badge/Badge';
import { useInferenceStore } from '../../store/useInferenceStore';
import { formatFps } from '../../utils/formatters';

// ── Gloss to Indonesian Mapping ──────────────────────────────────────────────
export const GLOSS_TO_INDONESIAN: Record<string, string> = {
  'AKU CIUM BADAN DIA': 'Saya mencium bau badan dia',
  'AKU LIHAT ADA ULAR MASUK KELAS': 'Saya melihat ada ular masuk kelas',
  'AKU NILAI JELEK': 'Nilai Aku jelek',
  'AKU PUSING AKU HARUS PERIKSA MANA': 'Saya sering pusing, saya harus periksa ke mana?',
  'APA KAMU PERNAH BACA BUKU BAHASA INGGRIS': 'Apa kamu pernah membaca novel bahasa inggris?',
  'AYAH SAMA IBU MANA': 'Di mana ayah sama Ibu?',
  'BADAN AKU GEMUK TAPI BADAN ADIK KURUS': 'Badan ku gemuk, tapi badan adik kurus',
  'BUKU AKU SOBEK GEGARA DIA': 'Dia menyobek buku saya',
  'DIA ANAK BAIK SAMPAI BANYAK ORANG SUKA': 'Dia anak baik sehingga banyak orang menyukainya',
  'DIA MENGEJEK AKU': 'Dia mengejek saya',
  'GAKBOLEH PULANG SEKARANG KAMU': 'Kamu tidak boleh pulang sekarang.',
  'IBU AKU PUNYA KUCING SAMA IKAN': 'Ibu aku punya kucing sama ikan.',
  'KAKAK AKU KASIH HADIAH BUAT AKU': 'Kakak saya memberi saya hadiah.',
  'KAMU BELAJAR BISINDO KAPAN': 'Kapan kamu belajar Bisindo?',
  'KAMU PERGI MANA': 'Kemana kamu mau pergi?',
  'KAMU PUNYA ANGGOTA KELUARGA BERAPA': 'Berapa jumlah anggota keluarga kamu?',
  'KENAPA KAMU GAK MASUK KULIAH KEMARIN': 'Mengapa kemarin kamu tidak kuliah?',
  'KITA ISTIRAHAT JAM BERAPA': 'Jam berapa kita istirahat?',
  'MANA IBU KAMU BAIK-BAIK ATAU TIDAK': 'Bagaimana keadaan ibumu?',
  'NAMA ISYARAT KAMU APA': 'Nama isyarat kamu apa?',
  'OBAT BISA BELI TOKO MANA': 'Di apotek mana obat ini bisa dibeli?',
  'ORANG JAHAT SANA PUKUL AKU BERULANG': 'Orang jahat di sana memukul saya berulang.',
  'POLISI SANA PUKUL PENCURI': 'Pencuri di sana dipukul polisi.',
  'RUMAH DIMANA KAMU': 'Rumah kamu di mana?',
  'SANA BERITA SUDAH BANYAK RIBUAN ORANG LIHAT': 'Berita di sana sudah dilihat oleh ribuan orang.',
  'SANA ENAK NASI PADANG TAPI MAHAL': 'Nasi padang di sana enak, tetapi mahal',
  'SANA TOILET KOTOR': 'Toilet di sana kotor',
  'SEPATU DIA KOTOR': 'Sepatu dia kotor',
  'TONG-SAMPAH ADA SEMUT BANYAK': 'Tempat sampah banyak semut',
  'ULAR SANA MAKAN KAMBING': 'Kambing di sana dimakan ular'
};

// ── TTS Helper ───────────────────────────────────────────────────────────────
const playAudio = (text: string) => {
  if (!text) return;
  window.speechSynthesis.cancel(); // Hentikan audio sebelumnya jika ada
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID'; // Bahasa Indonesia
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};

// ── WER badge colour helper ──────────────────────────────────────────────────
function werBadgeClass(wer: number): string {
  if (wer <= 0.2) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  if (wer <= 0.5) return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
  return 'bg-red-500/15 text-red-400 border border-red-500/30';
}

// ── Removed Sub-components (inlined for better layout) ────────────────────

// ── Main Component ────────────────────────────────────────────────────────────

const GlossOutput = React.memo(function GlossOutput() {
  const { inferenceResult, isRunning } = useInferenceStore();

  const isEmpty = !inferenceResult;

  return (
    <Card className="relative flex flex-col gap-4 min-h-[160px] sm:min-h-[180px] md:min-h-[220px]" padding="md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="panel-card-label">
          <span>Hasil Terjemahan</span>
        </div>
        <Badge variant={isRunning ? 'live' : 'neutral'} dot={isRunning}>
          {isRunning ? 'PROSES' : 'SELESAI'}
        </Badge>
      </div>

      {/* Body */}
      {isEmpty ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm italic text-center text-text-muted">
            Belum ada hasil. Silakan unggah atau rekam video untuk diterjemahkan.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Main Output Card */}
          <div className="relative w-full rounded-xl p-6 bg-brand-blue/10 border border-brand-blue/30 shadow-panel-glow">
            <button
              onClick={() => playAudio(GLOSS_TO_INDONESIAN[inferenceResult.prediction] || inferenceResult.prediction)}
              className="absolute right-4 top-4 text-brand-blue/70 hover:text-brand-blue-light transition-colors p-1"
              title="Putar Suara"
              aria-label="Play Audio"
            >
              <Volume2 size={24} />
            </button>

            <div className="flex flex-col gap-1 pr-10 mb-4">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-brand-blue/60">
                Gloss
              </span>
              <span className="font-mono text-sm font-semibold text-brand-blue/80">
                {inferenceResult.prediction || "—"}
              </span>
            </div>

            <div className="flex flex-col gap-2 pr-10">
              <span className="text-xs font-semibold tracking-widest uppercase text-brand-blue-light/70">
                Terjemahan Bahasa Indonesia
              </span>
              <span className="font-bold text-2xl leading-relaxed text-brand-blue-light">
                {(GLOSS_TO_INDONESIAN[inferenceResult.prediction] || inferenceResult.prediction || "Terjemahan tidak tersedia").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
});

export default GlossOutput;
