/**
 * @file        video.types.ts
 * @description TypeScript types untuk video upload dan metadata extraction.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

export interface VideoMetadata {
  /** Nama file asli yang diupload */
  filename: string;
  /** Durasi video dalam detik */
  duration: number;
  /** Resolusi display, misal "1080p" atau "720p" */
  resolution: string;
  /** Frame per second */
  fps: number;
  /** Ukuran file dalam bytes */
  fileSize: number;
}

export interface VideoPreviews {
  rgb: string | null;
  skeleton: string | null;
  overlay: string | null;
}

export type VideoStatus = 'idle' | 'ready' | 'processing' | 'done' | 'error';
