/**
 * @file        Stepper.types.ts
 * @description Type definitions untuk komponen Stepper.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import type { PipelineStatus } from '../../types/pipeline.types';

export interface StepItem {
  id: string;
  label: string;
  stepNumber: number;
  status: PipelineStatus;
}

export interface StepperProps {
  steps: StepItem[];
}
