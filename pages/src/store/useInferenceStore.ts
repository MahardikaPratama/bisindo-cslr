/**
 * @file        useInferenceStore.ts
 * @description Zustand store untuk domain inferensi CSLR.
 *              Mengelola pipeline steps, inference result (GT, prediction, WER),
 *              dan system telemetry.
 * @author      KoTA 502
 * @version     2.0.0
 * @created     2024-01-01
 */

import { create } from 'zustand';
import type { PipelineStep, PipelineStepId, PipelineStatus } from '../types/pipeline.types';
import type { GlossItem, SystemTelemetry, InferenceResult } from '../types/inference.types';
import { PIPELINE_STEPS } from '../constants/pipeline.constants';

interface InferenceStore {
  /** Daftar semua step pipeline beserta status masing-masing */
  pipelineSteps: PipelineStep[];
  /** ID step yang sedang aktif/berjalan */
  currentStepId: PipelineStepId | null;
  /** Urutan gloss hasil prediksi model (legacy, masih digunakan GlossOutput) */
  glossSequence: GlossItem[];
  /** Hasil inference lengkap: ground truth, prediction, WER */
  inferenceResult: InferenceResult | null;
  /** Data performa sistem saat inferensi */
  telemetry: SystemTelemetry | null;
  /** Flag apakah sedang dalam proses inferensi */
  isRunning: boolean;

  /** Update status satu step pipeline */
  setStepStatus: (stepId: PipelineStepId, status: PipelineStatus) => void;
  /** Set step yang sedang berjalan */
  setCurrentStep: (stepId: PipelineStepId | null) => void;
  /** Set hasil gloss sequence */
  setGlossSequence: (glosses: GlossItem[]) => void;
  /** Set hasil inference lengkap */
  setInferenceResult: (result: InferenceResult | null) => void;
  /** Set data telemetry sistem */
  setTelemetry: (telemetry: SystemTelemetry) => void;
  /** Set flag running state */
  setIsRunning: (running: boolean) => void;
  /** Reset semua state inferensi */
  resetInference: () => void;
}

const buildInitialSteps = (): PipelineStep[] =>
  PIPELINE_STEPS.map((s) => ({ ...s, status: 'idle' as PipelineStatus }));

const INITIAL_STATE = {
  pipelineSteps: buildInitialSteps(),
  currentStepId: null,
  glossSequence: [],
  inferenceResult: null,
  telemetry: null,
  isRunning: false,
};

export const useInferenceStore = create<InferenceStore>((set) => ({
  ...INITIAL_STATE,

  setStepStatus: (stepId, status) =>
    set((state) => ({
      pipelineSteps: state.pipelineSteps.map((s) =>
        s.id === stepId ? { ...s, status } : s
      ),
    })),

  setCurrentStep: (stepId) => set({ currentStepId: stepId }),

  setGlossSequence: (glosses) => set({ glossSequence: glosses }),

  setInferenceResult: (result) => set({ inferenceResult: result }),

  setTelemetry: (telemetry) => set({ telemetry }),

  setIsRunning: (running) => set({ isRunning: running }),

  resetInference: () =>
    set({ ...INITIAL_STATE, pipelineSteps: buildInitialSteps() }),
}));
