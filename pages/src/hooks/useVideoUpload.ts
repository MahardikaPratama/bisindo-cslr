/**
 * @file        useVideoUpload.ts
 * @description Custom hook untuk mengelola logic pemilihan file video.
 *              Mengabstraksi validasi format, batas ukuran, ekstraksi metadata,
 *              dan update ke useVideoStore.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import { useRef, useCallback } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { useConsoleStore } from '../store/useConsoleStore';
import { ACCEPTED_VIDEO_FORMATS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../constants/pipeline.constants';

export function useVideoUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setVideo, setVideoStatus } = useVideoStore();
  const { appendLog } = useConsoleStore();

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input agar file yang sama bisa dipilih lagi jika dihapus
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validasi tipe file
    if (!ACCEPTED_VIDEO_FORMATS.includes(file.type)) {
      alert(`Invalid format. Accepted: ${ACCEPTED_VIDEO_FORMATS.join(', ')}`);
      return;
    }

    // Validasi ukuran file
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File too large. Max allowed is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setVideoStatus('processing');
    appendLog('INFO', `Initializing video upload: ${file.name}`);

    // Create object URL
    const objectUrl = URL.createObjectURL(file);

    // Extract metadata using an invisible video element
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.src = objectUrl;

    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src); // Cleanup for the temp video
      
      const metadata = {
        filename: file.name,
        duration: videoElement.duration,
        resolution: `${videoElement.videoWidth}x${videoElement.videoHeight}`,
        fps: 30, // Mock FPS since browser API doesn't provide exact FPS easily
        fileSize: file.size,
      };

      setVideo(file, metadata, objectUrl);
      appendLog('INFO', `Video loaded successfully. Duration: ${metadata.duration.toFixed(1)}s, Res: ${metadata.resolution}`);
    };

    videoElement.onerror = () => {
      setVideoStatus('error');
      appendLog('ERROR', 'Failed to load video metadata.');
      URL.revokeObjectURL(objectUrl);
    };

  }, [setVideo, setVideoStatus, appendLog]);

  const triggerSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    fileInputRef,
    handleFileChange,
    triggerSelect,
  };
}
