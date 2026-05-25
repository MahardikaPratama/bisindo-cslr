/**
 * @file        VisualizationPanel.tsx
 * @description Panel utama untuk menampilkan video RGB dan hasil ekstraksi skeleton.
 *              Mendukung toggle ViewMode (Dual/Overlay) dan playback controls.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React, { useState, useRef, useEffect } from 'react';
import { Eye, LayoutGrid, Layers, Play, Pause, Maximize } from 'lucide-react';
import Card from '../../common/Card/Card';
import { useVideoStore } from '../../store/useVideoStore';
import { useThemeStore } from '../../store/useThemeStore';
import { cn } from '../../utils/cn';
import type { ViewMode } from './VisualizationPanel.types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const VisualizationPanel = React.memo(function VisualizationPanel() {
  const { videoObjectUrl, videoStatus, videoPreviews, videoMetadata } = useVideoStore();
  const theme = useThemeStore((state) => state.theme);
  const [viewMode, setViewMode] = useState<ViewMode>('dual');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [overlayError, setOverlayError] = useState<string | null>(null);
  const [skeletonError, setSkeletonError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const skeletonVideoRef = useRef<HTMLVideoElement>(null);
  const overlayVideoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Play/Pause handler
  const togglePlay = () => {
    if (!videoObjectUrl) return;
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);

    if (nextPlaying) {
      videoRef.current?.play().catch(() => {});
      skeletonVideoRef.current?.play().catch(() => {});
      overlayVideoRef.current?.play().catch(() => {});
    } else {
      videoRef.current?.pause();
      skeletonVideoRef.current?.pause();
      overlayVideoRef.current?.pause();
    }
  };

  // Sync secondary videos to the main RGB video timeline
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);

      // Sync skeleton video
      if (skeletonVideoRef.current && Math.abs(skeletonVideoRef.current.currentTime - current) > 0.1) {
        skeletonVideoRef.current.currentTime = current;
      }
      // Sync overlay video
      if (overlayVideoRef.current && Math.abs(overlayVideoRef.current.currentTime - current) > 0.1) {
        overlayVideoRef.current.currentTime = current;
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      skeletonVideoRef.current?.play().catch(() => {});
      overlayVideoRef.current?.play().catch(() => {});
    };

    const onPause = () => {
      setIsPlaying(false);
      skeletonVideoRef.current?.pause();
      overlayVideoRef.current?.pause();
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (skeletonVideoRef.current) skeletonVideoRef.current.pause();
      if (overlayVideoRef.current) overlayVideoRef.current.pause();
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
    };
  }, [videoPreviews, viewMode]);

  // Handle Seek/Scrub on Progress Bar Click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickPercent = Math.max(0, Math.min(1, clickX / width));
    
    const duration = videoMetadata?.duration || videoRef.current.duration || 1;
    const newTime = clickPercent * duration;

    videoRef.current.currentTime = newTime;
    if (skeletonVideoRef.current) skeletonVideoRef.current.currentTime = newTime;
    if (overlayVideoRef.current) overlayVideoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const duration = videoMetadata?.duration || videoRef.current?.duration || 4.2;

  const buildPreviewSrc = (previewPath?: string | null) => {
    if (!previewPath) return undefined;
    // If backend returns a full URL, prefer it. Otherwise rewrite /preview/ -> /preview_stream/
    if (/^https?:\/\//.test(previewPath)) return previewPath;
    const rewritten = previewPath.replace(/^\/preview\//, '/preview_stream/');
    // Encode each path segment to handle spaces and special characters in filenames
    const parts = rewritten.split('/').filter(Boolean); // remove leading empty string
    const encodedPath = parts.map((p) => encodeURIComponent(p)).join('/');
    const base = API_BASE ? API_BASE.replace(/\/$/, '') : '';
    return `${base}/${encodedPath}`;
  };

  return (
    <Card className="flex flex-col gap-4" padding="md">
      {/* Header: Label & View Toggle */}
      <div className="flex items-center justify-between">
        <div className="panel-card-label">
          <Eye size={14} className="text-text-secondary" />
          <span>Visualization Panel</span>
        </div>
        
        <div className="flex items-center p-1 border rounded-lg bg-surface-panel-2 border-surface-border">
          <button
            onClick={() => setViewMode('dual')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              viewMode === 'dual' ? 'bg-surface-border text-text-primary' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <LayoutGrid size={13} />
            Dual View
          </button>
          <button
            onClick={() => setViewMode('overlay')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              viewMode === 'overlay' ? 'bg-surface-border text-text-primary' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Layers size={13} />
            Overlay
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="relative bg-surface-bg rounded-xl overflow-hidden border border-surface-border aspect-[21/9] flex gap-0.5">
        
        {/* Main Panel (RGB or Overlay depending on mode) */}
        <div className={cn(
          'relative h-full transition-all duration-300',
          theme === 'dark' ? 'bg-black' : 'bg-white',
          viewMode === 'dual' ? 'flex-1' : 'w-full'
        )}>
          {videoObjectUrl && videoStatus !== 'idle' ? (
            <>
              {/* 1. Original RGB Video */}
              <video
                ref={videoRef}
                src={videoObjectUrl}
                className={cn(
                  'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
                  viewMode === 'overlay' && videoPreviews?.overlay ? 'opacity-0 pointer-events-none' : 'opacity-100'
                )}
                playsInline
                muted
              />

              {/* 2. Processed Overlay Video */}
              {videoPreviews?.overlay && (
                <video
                  ref={overlayVideoRef}
                  src={buildPreviewSrc(videoPreviews.overlay)}
                  className={cn(
                    'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
                    viewMode === 'overlay' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  )}
                  playsInline
                  muted
                  onError={(e) => {
                    // Log and save the failed src for debugging
                    // eslint-disable-next-line no-console
                    const src = buildPreviewSrc(videoPreviews.overlay);
                    // eslint-disable-next-line no-console
                    console.error('Overlay video failed to load', e, src, overlayVideoRef.current?.error);
                    // Also log the video element error code/message if available
                    // eslint-disable-next-line no-console
                    if (overlayVideoRef.current && overlayVideoRef.current.error) {
                      console.error('Overlay media error:', overlayVideoRef.current.error.code, overlayVideoRef.current.error.message);
                    }
                    setOverlayError(String(src));
                  }}
                />
              )}
            </>
          ) : (
            <div className={cn(
              'absolute inset-0 flex items-center justify-center text-sm italic',
              theme === 'dark' ? 'text-text-muted' : 'text-slate-500'
            )}>
              No video source
            </div>
          )}

          <div className={cn(
            'absolute top-3 left-3 backdrop-blur-sm text-text-primary text-[10px] font-mono px-2 py-1 rounded tracking-wider uppercase z-20',
            theme === 'dark' ? 'bg-black/60' : 'bg-white/60'
          )}>
            {viewMode === 'overlay' && videoPreviews?.overlay ? 'Overlay Map' : 'Original RGB'}
          </div>
        </div>

        {/* Skeleton Mapping (Only in Dual View) */}
        <div className={cn(
          'relative bg-surface-panel-2 h-full overflow-hidden flex items-center justify-center transition-all duration-300 border-l border-surface-border',
          viewMode === 'dual' ? 'flex-1 opacity-100' : 'w-0 opacity-0 pointer-events-none border-l-0'
        )}>
          {videoPreviews?.skeleton ? (
            <video
              ref={skeletonVideoRef}
              src={buildPreviewSrc(videoPreviews.skeleton)}
              className="absolute inset-0 object-cover w-full h-full"
              playsInline
              muted
              onError={(e) => {
                const src = buildPreviewSrc(videoPreviews.skeleton);
                // eslint-disable-next-line no-console
                console.error('Skeleton video failed to load', e, src, skeletonVideoRef.current?.error);
                // eslint-disable-next-line no-console
                if (skeletonVideoRef.current && skeletonVideoRef.current.error) {
                  console.error('Skeleton media error:', skeletonVideoRef.current.error.code, skeletonVideoRef.current.error.message);
                }
                setSkeletonError(String(src));
              }}
            />
          ) : videoStatus === 'processing' ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 rounded-full border-brand-blue border-t-transparent animate-spin" />
              <span className="text-[10px] font-medium text-text-secondary tracking-wide">Processing landmarks...</span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center w-1/2 h-2/3 opacity-80">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible max-h-[120px]">
                {/* Lines */}
                <line x1="50" y1="20" x2="50" y2="40" stroke="#3B82F6" strokeWidth="1.5" />
                <line x1="50" y1="40" x2="25" y2="70" stroke="#3B82F6" strokeWidth="1.5" />
                <line x1="50" y1="40" x2="75" y2="70" stroke="#3B82F6" strokeWidth="1.5" />
                <line x1="50" y1="40" x2="50" y2="80" stroke="#3B82F6" strokeWidth="1.5" />
                {/* Joints */}
                <circle cx="50" cy="20" r="3" fill="transparent" stroke="#3B82F6" strokeWidth="1.5" />
                <circle cx="50" cy="40" r="2" fill="#3B82F6" />
                <circle cx="25" cy="70" r="2" fill="transparent" stroke="#3B82F6" strokeWidth="1.5" />
                <circle cx="75" cy="70" r="2" fill="transparent" stroke="#3B82F6" strokeWidth="1.5" />
                <circle cx="50" cy="80" r="2" fill="transparent" stroke="#3B82F6" strokeWidth="1.5" />
              </svg>
            </div>
          )}
          
          <div className="absolute top-3 left-3 bg-brand-blue/90 text-white text-[10px] font-mono px-2 py-1 rounded tracking-wider uppercase z-20">
            Skeleton Mapping
          </div>
          {skeletonError && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 text-white text-sm">
              Failed to load skeleton preview: {skeletonError}
            </div>
          )}
          {overlayError && (
            <div className="absolute top-12 left-3 bg-red-600/90 text-white text-xs font-mono px-2 py-1 rounded tracking-wider z-30">
              Overlay load failed
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-4 px-2">
        <button
          onClick={togglePlay}
          disabled={!videoObjectUrl}
          className="transition-colors text-brand-blue-light hover:text-brand-blue-light/80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        
        {/* Progress Bar (Clickable/Seekable) */}
        <div 
          ref={progressRef}
          onClick={handleProgressClick}
          className="flex-1 relative h-1.5 bg-surface-panel-2 rounded-full cursor-pointer group overflow-hidden"
        >
          <div 
            className="absolute top-0 left-0 h-full transition-all ease-linear rounded-full bg-brand-blue"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div 
            className="absolute w-3 h-3 transition-opacity -translate-y-1/2 bg-white rounded-full shadow opacity-0 top-1/2 group-hover:opacity-100"
            style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
          />
        </div>

        {/* Timestamps & Fullscreen */}
        <div className="flex items-center gap-3 font-mono text-xs text-text-secondary">
          <span>00:0{currentTime.toFixed(1)} / 00:0{duration.toFixed(1)}</span>
          <button className="ml-2 transition-colors hover:text-text-primary">
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
});

export default VisualizationPanel;
