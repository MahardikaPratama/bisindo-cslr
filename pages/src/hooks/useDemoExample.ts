/**
 * @file        useDemoExample.ts
 * @description Hook untuk mengelola Try Demo Examples functionality
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import { useCallback } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { useGroundTruthStore } from '../store/useGroundTruthStore';
import { DEMO_EXAMPLES } from '../constants/demo-examples.constants';
import { GROUND_TRUTH_SENTENCES } from '../constants/ground-truth.constants';

/**
 * Hook untuk load demo example
 * @param demoId - ID demo yang akan di-load
 */
export function useDemoExample() {
  const { setVideo, resetVideo } = useVideoStore((state) => ({
    setVideo: state.setVideo,
    resetVideo: state.resetVideo,
  }));
  const { setSelectedGroundTruth } = useGroundTruthStore();

  const loadDemo = useCallback(async (demoId: string) => {
    try {
      // Find demo
      const demo = DEMO_EXAMPLES.find((d) => d.id === demoId);
      if (!demo) {
        console.error(`Demo ${demoId} tidak ditemukan`);
        return;
      }

      // Find ground truth sentence
      const groundTruth = GROUND_TRUTH_SENTENCES.find((s) => s.sentence_id === demo.groundTruthId);
      if (!groundTruth) {
        console.error(`Ground truth ${demo.groundTruthId} tidak ditemukan`);
        return;
      }

      // Fetch video file
      const videoUrl = new URL(demo.videoPath, window.location.origin).href;
      const response = await fetch(videoUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load demo video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], `${demo.id}.mp4`, { type: 'video/mp4' });

      // Create object URL
      const objectUrl = URL.createObjectURL(blob);

      // Extract basic metadata (ini simplified, bisa di-enhance)
      const video = document.createElement('video');
      video.src = objectUrl;
      
      video.onloadedmetadata = () => {
        const metadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: 30, // Default, ideally extract dari file
          resolution: `${video.videoWidth}x${video.videoHeight}`,
        };

        // Set video ke store
        setVideo(file, metadata, objectUrl);

        // Set ground truth ke store
        setSelectedGroundTruth({
          id: groundTruth.sentence_id,
          text: groundTruth.text,
        });
      };

      video.onerror = () => {
        console.error('Failed to load video metadata');
        URL.revokeObjectURL(objectUrl);
      };
    } catch (error) {
      console.error('Error loading demo:', error);
    }
  }, [setVideo, setSelectedGroundTruth]);

  const clearDemo = useCallback(() => {
    resetVideo();
  }, [resetVideo]);

  return { loadDemo, clearDemo, demos: DEMO_EXAMPLES };
}
