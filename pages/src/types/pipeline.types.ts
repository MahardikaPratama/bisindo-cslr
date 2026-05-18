/**
 * @file        pipeline.types.ts
 * @description TypeScript types untuk processing pipeline CSLR.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

export type PipelineStepId =
  | 'rgb-video'
  | 'skeleton-ext'
  | 'preprocess'
  | 'inference'
  | 'prediction';

export type PipelineStatus = 'idle' | 'running' | 'completed' | 'error';

export interface PipelineStep {
  id: PipelineStepId;
  label: string;
  stepNumber: number;
  status: PipelineStatus;
}
