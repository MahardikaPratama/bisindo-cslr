/**
 * @file        useInference.ts
 * @description Custom hook untuk mengelola alur inferensi CSLR nyata.
 *              Mengirim video + sentence_id ke /api/inference, lalu menganimasikan
 *              progress bar pipeline steps dan menyimpan hasil ke store.
 * @author      KoTA 502
 * @version     2.0.0
 * @created     2024-01-01
 */

import { useCallback, useRef } from 'react';
import { useInferenceStore } from '../store/useInferenceStore';
import { useConsoleStore } from '../store/useConsoleStore';
import { useVideoStore } from '../store/useVideoStore';
import { useGroundTruthStore } from '../store/useGroundTruthStore';
import { useConfigStore } from '../store/useConfigStore';
import type { PipelineStepId } from '../types/pipeline.types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useInference() {
  const {
    setStepStatus,
    setCurrentStep,
    setGlossSequence,
    setInferenceResult,
    setTelemetry,
    setIsRunning,
    resetInference,
  } = useInferenceStore();
  const { appendLog, clearLogs } = useConsoleStore();
  const { videoStatus, videoFile, setVideoPreviews, setVideoStatus } = useVideoStore();
  const { selectedGroundTruth } = useGroundTruthStore();
  const { selectedConfig } = useConfigStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  const startInference = useCallback(async () => {
    if (videoStatus === 'idle' || !videoFile) {
      alert('Please upload a video first.');
      return;
    }
    if (!selectedGroundTruth) {
      alert('Please select a sentence ID (Ground Truth) first.');
      return;
    }

    if (!selectedConfig) {
      alert('Please select a preprocessing config first.');
      return;
    }

    // Reset state sebelum mulai
    resetInference();
    clearLogs();
    setIsRunning(true);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      appendLog('INFO', 'Starting CSLR inference pipeline...');

      // ── STEP 1: RGB Video Validation (lokal) ──
      setCurrentStep('rgb-video');
      setStepStatus('rgb-video', 'running');
      appendLog('INFO', `Validating source RGB video: ${videoFile.name}`);
      await sleep(300);
      if (signal.aborted) throw new Error('Aborted');
      setStepStatus('rgb-video', 'completed');

      // ── STEP 2: Skeleton Extraction + Inference (satu request ke /api/inference) ──
      setCurrentStep('skeleton-ext');
      setStepStatus('skeleton-ext', 'running');
      appendLog('PROCESS', 'Uploading video to backend. Running MediaPipe Holistic skeleton extraction...');

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('sentence_id', selectedGroundTruth.id);
      formData.append('config_name', selectedConfig || '');

      const response = await fetch(`${API_BASE}/api/inference`, {
        method: 'POST',
        body: formData,
        signal,
      });

      if (!response.ok) {
        const errorDetail = await response
          .json()
          .catch(() => ({ detail: 'Inference pipeline failed' }));
        throw new Error(errorDetail.detail || `Server error ${response.status}`);
      }

      const result = await response.json();
      const numFrames: number = result.num_frames || 0;
      const numKeypoints: number = result.num_keypoints || 86;
      const inferenceData = result.inference || {};

      // Simpan preview URLs
      setVideoPreviews(result.previews);
      appendLog(
        'INFO',
        `Skeleton extraction completed — ${numKeypoints} keypoints × ${numFrames} frames.`
      );
      setStepStatus('skeleton-ext', 'completed');

      await sleep(200);
      if (signal.aborted) throw new Error('Aborted');

      // ── STEP 3: Preprocess (animasi saja, sudah selesai di BE) ──
      setCurrentStep('preprocess');
      setStepStatus('preprocess', 'running');
      appendLog(
        'PROCESS',
        'Applying coordinate selection (hand21), motion features, normalization & padding...'
      );
      await sleep(400);
      if (signal.aborted) throw new Error('Aborted');
      setStepStatus('preprocess', 'completed');

      await sleep(150);

      // ── STEP 4: Inference ──
      setCurrentStep('inference');
      setStepStatus('inference', 'running');
      appendLog('PROCESS', 'Running TwoStream-CoSign forward pass on skeleton sequences...');
      await sleep(400);
      if (signal.aborted) throw new Error('Aborted');

      const inferenceMs: number = inferenceData.inference_ms || 0;
      const calculatedFps = numFrames > 0 && inferenceMs > 0
        ? parseFloat((numFrames / (inferenceMs / 1000)).toFixed(1))
        : 0;

      setTelemetry({
        model: 'TwoStream CoSign',
        inferenceMs,
        fps: calculatedFps,
        gpuUtilPercent: 0,
      });
      setStepStatus('inference', 'completed');

      await sleep(150);

      // ── STEP 5: Prediction + WER ──
      setCurrentStep('prediction');
      setStepStatus('prediction', 'running');
      appendLog('PROCESS', 'Running CTC Beam Search Decoder. Computing WER...');
      await sleep(300);
      if (signal.aborted) throw new Error('Aborted');

      const prediction: string = inferenceData.prediction || '[EMPTY]';
      const groundTruth: string = inferenceData.ground_truth || selectedGroundTruth.text;
      const werPercent: string = inferenceData.wer_percent || 'N/A';
      const wer: number = inferenceData.wer ?? 1.0;

      // Simpan inference result ke store
      setInferenceResult({
        groundTruth,
        prediction,
        wer,
        werPercent,
        inferenceMs,
      });

      // Simpan gloss sequence (untuk backward compat)
      const predWords = prediction.split(' ').filter(Boolean);
      setGlossSequence(predWords.map((w) => ({ gloss: w, confidence: 1.0 })));

      setStepStatus('prediction', 'completed');
      setVideoStatus('done');

      appendLog('INFO', `Ground Truth  : ${groundTruth}`);
      appendLog('INFO', `Prediction    : ${prediction}`);
      appendLog('INFO', `WER           : ${werPercent}`);

    } catch (err: any) {
      if (err.message !== 'Aborted') {
        appendLog('ERROR', `Pipeline failed: ${err.message}`);
        setVideoStatus('error');
        // Mark current running step as error
        const { pipelineSteps } = useInferenceStore.getState();
        pipelineSteps.forEach((s) => {
          if (s.status === 'running') setStepStatus(s.id as PipelineStepId, 'error');
        });
      }
    } finally {
      if (!signal.aborted) {
        setIsRunning(false);
        setCurrentStep(null);
      }
    }
  }, [
    videoStatus,
    videoFile,
    selectedGroundTruth,
    resetInference,
    clearLogs,
    setIsRunning,
    setVideoStatus,
    appendLog,
    setCurrentStep,
    setStepStatus,
    setVideoPreviews,
    setTelemetry,
    setGlossSequence,
    setInferenceResult,
    selectedConfig,
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
