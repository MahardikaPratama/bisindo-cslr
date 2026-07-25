/**
 * @file        pipeline.constants.ts
 * @description Konstanta definisi 5 langkah processing pipeline CSLR.
 *              Menghindari magic strings dan memastikan konsistensi referensi antar file.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import type { PipelineStep } from '../types/pipeline.types';

export const PIPELINE_STEPS: Omit<PipelineStep, 'status'>[] = [
  { id: 'rgb-video',    label: 'Validasi Video',    stepNumber: 1 },
  { id: 'skeleton-ext', label: 'Ekstraksi Rangka', stepNumber: 2 },
  { id: 'preprocess',   label: 'Prapemrosesan',   stepNumber: 3 },
  { id: 'inference',    label: 'Analisis AI',    stepNumber: 4 },
  { id: 'prediction',   label: 'Penyusunan Teks',   stepNumber: 5 },
] as const;

export const ACCEPTED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime'];
export const MAX_FILE_SIZE_MB = 500;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const MOCK_INFERENCE_DELAY_MS = 800;
