/**
 * @file        formatters.ts
 * @description Pure functions untuk formatting data: durasi video, confidence score,
 *              timestamp log, resolusi, dan GPU utilization.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

/**
 * Format detik menjadi format MM:SS
 * @example formatDuration(65.3) => "01:05.3"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(4, '0')}`;
}

/**
 * Format confidence score menjadi persentase 2 desimal
 * @example formatConfidence(0.9876) => "0.99"
 */
export function formatConfidence(score: number): string {
  return score.toFixed(2);
}

/**
 * Format timestamp log HH:MM:SS.mmm
 */
export function formatLogTimestamp(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

/**
 * Format bytes file menjadi ukuran yang human-readable
 * @example formatFileSize(1048576) => "1.00 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format fps number menjadi string dengan satu desimal
 */
export function formatFps(fps: number): string {
  return fps.toFixed(1);
}
