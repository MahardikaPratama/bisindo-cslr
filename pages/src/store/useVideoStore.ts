/**
 * @file        useVideoStore.ts
 * @description Zustand store untuk domain video upload.
 *              Mengelola state file video, metadata, dan status pemrosesan.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import { create } from 'zustand';
import type { VideoMetadata, VideoStatus, VideoPreviews } from '../types/video.types';

interface VideoStore {
  /** File video yang diupload pengguna, null jika belum ada */
  videoFile: File | null;
  /** Metadata yang diekstrak dari video file */
  videoMetadata: VideoMetadata | null;
  /** URL object untuk preview video */
  videoObjectUrl: string | null;
  /** Status lifecycle video */
  videoStatus: VideoStatus;
  /** URL preview hasil pemrosesan API backend */
  videoPreviews: VideoPreviews | null;

  /** Set video file beserta metadata-nya */
  setVideo: (file: File, metadata: VideoMetadata, objectUrl: string) => void;
  /** Update status video */
  setVideoStatus: (status: VideoStatus) => void;
  /** Set preview URLs yang didapat dari backend */
  setVideoPreviews: (previews: VideoPreviews | null) => void;
  /** Reset seluruh state video ke initial state */
  resetVideo: () => void;
}

const INITIAL_STATE = {
  videoFile: null,
  videoMetadata: null,
  videoObjectUrl: null,
  videoStatus: 'idle' as VideoStatus,
  videoPreviews: null,
};

export const useVideoStore = create<VideoStore>((set, get) => ({
  ...INITIAL_STATE,

  setVideo: (file, metadata, objectUrl) => {
    // Revoke URL lama jika ada untuk menghindari memory leak
    const prevUrl = get().videoObjectUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);

    set({
      videoFile: file,
      videoMetadata: metadata,
      videoObjectUrl: objectUrl,
      videoStatus: 'ready',
      videoPreviews: null, // Reset previews saat video baru diupload
    });
  },

  setVideoStatus: (status) => set({ videoStatus: status }),

  setVideoPreviews: (previews) => set({ videoPreviews: previews }),

  resetVideo: () => {
    const prevUrl = get().videoObjectUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);
    set(INITIAL_STATE);
  },
}));
