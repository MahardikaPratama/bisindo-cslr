/**
 * @file        inference.types.ts
 * @description TypeScript types untuk hasil inferensi CSLR: gloss sequence,
 *              system telemetry, dan log entries.
 * @author      KoTA 502
 * @version     2.0.0
 * @created     2024-01-01
 */

export interface GlossItem {
  /** Teks gloss bahasa isyarat, misal "SAYA", "MAU" */
  gloss: string;
  /** Skor confidence model, rentang 0.0–1.0 */
  confidence: number;
}

export interface SystemTelemetry {
  /** Nama model yang digunakan */
  model: string;
  /** Waktu inferensi dalam milidetik */
  inferenceMs: number;
  /** Frame per second proses inference */
  fps: number;
  /** Persentase utilisasi GPU, rentang 0–100 */
  gpuUtilPercent: number;
}

export type LogType = 'INFO' | 'PROCESS' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  id: string;
  type: LogType;
  message: string;
  timestamp: string;
}

/** Hasil inference CSLR dari backend */
export interface InferenceResult {
  /** Kalimat ground truth dari dataset */
  groundTruth: string;
  /** Kalimat hasil prediksi model */
  prediction: string;
  /** WER dalam rentang [0.0, ...] */
  wer: number;
  /** WER dalam format string persen, misal "12.50%" */
  werPercent: string;
  /** Waktu forward pass model dalam milidetik */
  inferenceMs: number;
  /** Kecepatan inference dalam frames per second */
  inferenceFps: number;
}
