/**
 * @file        useInference.ts
 * @description Custom hook untuk mengelola alur (flow) simulasi inferensi CSLR.
 *              Mengkoordinasi update ke pipeline steps, console log, dan telemetry secara berurutan.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import { useCallback, useRef } from 'react';
import { useInferenceStore } from '../store/useInferenceStore';
import { useConsoleStore } from '../store/useConsoleStore';
import { useVideoStore } from '../store/useVideoStore';
import { PIPELINE_STEPS, MOCK_INFERENCE_DELAY_MS } from '../constants/pipeline.constants';
import type { PipelineStepId } from '../types/pipeline.types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useInference() {
  const {
    setStepStatus,
    setCurrentStep,
    setGlossSequence,
    setTelemetry,
    setIsRunning,
    resetInference,
  } = useInferenceStore();
  const { appendLog, clearLogs } = useConsoleStore();
  const { videoStatus } = useVideoStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  const startInference = useCallback(async () => {
    if (videoStatus === 'idle') {
      alert('Please upload a video first.');
      return;
    }

    // Reset state before starting
    resetInference();
    clearLogs();
    setIsRunning(true);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      appendLog('INFO', 'Starting inference pipeline...');

      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        if (signal.aborted) throw new Error('Aborted');

        const step = PIPELINE_STEPS[i];
        const stepId = step.id as PipelineStepId;

        // Mark as running
        setCurrentStep(stepId);
        setStepStatus(stepId, 'running');
        
        if (stepId === 'skeleton-ext') {
          appendLog('PROCESS', 'Extracting 2D skeleton keypoints (MediaPipe Holistic)...');
        } else if (stepId === 'preprocess') {
          appendLog('PROCESS', 'Normalizing spatial coordinates and temporal padding...');
        } else if (stepId === 'inference') {
          appendLog('PROCESS', 'Running TwoStream-CoSign inference model...');
        }

        // Simulate delay
        await sleep(MOCK_INFERENCE_DELAY_MS + Math.random() * 500);

        // Mark as completed
        setStepStatus(stepId, 'completed');
        
        if (stepId === 'inference') {
          setTelemetry({
            model: 'TwoStream CoSign',
            inferenceMs: Math.floor(110 + Math.random() * 30),
            fps: parseFloat((24 + Math.random() * 3).toFixed(1)),
            gpuUtilPercent: Math.floor(40 + Math.random() * 15),
          });
        }
      }

      if (signal.aborted) throw new Error('Aborted');

      // Final prediction
      appendLog('INFO', 'Pipeline completed successfully.');
      setGlossSequence([
        { gloss: 'SAYA', confidence: 0.99 },
        { gloss: 'MAU', confidence: 0.97 },
        { gloss: 'MAKAN', confidence: 0.84 },
      ]);

    } catch (err: any) {
      if (err.message !== 'Aborted') {
        appendLog('ERROR', `Pipeline failed: ${err.message}`);
        setIsRunning(false);
      }
    } finally {
      if (!signal.aborted) {
        setIsRunning(false);
        setCurrentStep(null);
      }
    }
  }, [
    videoStatus,
    resetInference,
    clearLogs,
    setIsRunning,
    appendLog,
    setCurrentStep,
    setStepStatus,
    setTelemetry,
    setGlossSequence
  ]);

  const abortInference = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      appendLog('ERROR', 'Inference aborted by user.');
      setIsRunning(false);
      setCurrentStep(null);
    }
  }, [appendLog, setIsRunning, setCurrentStep]);

  return {
    startInference,
    abortInference,
  };
}
