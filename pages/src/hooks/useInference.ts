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

      // ── STEP 2: Skeleton Extraction ──
      setCurrentStep('skeleton-ext');
      setStepStatus('skeleton-ext', 'running');
      appendLog('PROCESS', 'Uploading video to backend. Running MediaPipe Holistic skeleton extraction...');

      const extractFormData = new FormData();
      extractFormData.append('video', videoFile);
      if (selectedConfig) extractFormData.append('config_name', selectedConfig);

      const extractResponse = await fetch(`${API_BASE}/api/extract_skeleton`, {
        method: 'POST',
        body: extractFormData,
        signal,
      });

      if (!extractResponse.ok) {
        const errorDetail = await extractResponse.json().catch(() => ({ detail: 'Skeleton extraction failed' }));
        throw new Error(errorDetail.detail || `Server error ${extractResponse.status}`);
      }

      const extractResult = await extractResponse.json();
      const videoId = extractResult.video_id;
      const numFrames: number = extractResult.num_frames || 0;
      const numKeypoints: number = extractResult.num_keypoints || 86;

      // Simpan preview URLs dan selesaikan step 2
      setVideoPreviews(extractResult.previews);
      appendLog('INFO', `Skeleton extraction completed — ${numKeypoints} keypoints × ${numFrames} frames.`);
      setStepStatus('skeleton-ext', 'completed');

      // ── STEP 3 & 4 & 5: Predict (Preprocess, Inference, WER) ──
      setCurrentStep('preprocess');
      setStepStatus('preprocess', 'running');
      appendLog('PROCESS', 'Requesting backend to run CSLR inference (Preprocessing & Cosign Model)...');

      const predictFormData = new FormData();
      predictFormData.append('video_id', videoId);
      predictFormData.append('sentence_id', selectedGroundTruth.id);
      if (selectedConfig) predictFormData.append('config_name', selectedConfig);

      const predictResponse = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        body: predictFormData,
        signal,
      });

      if (!predictResponse.ok) {
        const errorDetail = await predictResponse.json().catch(() => ({ detail: 'Prediction failed' }));
        throw new Error(errorDetail.detail || `Server error ${predictResponse.status}`);
      }

      const predictResult = await predictResponse.json();
      const inferenceData = predictResult.inference || {};

      setStepStatus('preprocess', 'completed');
      
      setCurrentStep('inference');
      const inferenceMs: number = inferenceData.inference_ms || 0;
      const inferenceFps: number = inferenceData.inference_fps || 0;
      setTelemetry({
        model: 'TwoStream CoSign',
        inferenceMs,
        fps: inferenceFps,
        gpuUtilPercent: 0,
      });
      setStepStatus('inference', 'completed');

      setCurrentStep('prediction');
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
        inferenceFps,
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
