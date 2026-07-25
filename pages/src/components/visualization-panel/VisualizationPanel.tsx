import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Eye, Play, Pause, Maximize } from 'lucide-react';
import Card from '../../common/Card/Card';
import { useVideoStore } from '../../store/useVideoStore';
import { useThemeStore } from '../../store/useThemeStore';
import { cn } from '../../utils/cn';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const VisualizationPanel = React.memo(function VisualizationPanel() {
  const { videoObjectUrl, videoStatus, videoPreviews, videoMetadata } = useVideoStore();
  const theme = useThemeStore((state) => state.theme);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Play/Pause handler
  const togglePlay = () => {
    if (!videoObjectUrl) return;
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);

    if (nextPlaying) {
      videoRef.current?.play().catch(() => {});
    } else {
      videoRef.current?.pause();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

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
  }, [videoPreviews, videoObjectUrl]);

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
    setCurrentTime(newTime);
  };

  const duration = videoMetadata?.duration || videoRef.current?.duration || 4.2;

  const buildPreviewSrc = (previewPath?: string | null) => {
    if (!previewPath) return undefined;
    const base = API_BASE ? API_BASE.replace(/\/$/, '') : '';
    const rawUrl = previewPath.startsWith('http') ? previewPath : `${base}${previewPath}`;
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}t=${Date.now()}`;
  };

  const overlayVideoUrl = useMemo(() => buildPreviewSrc(videoPreviews?.overlay), [videoPreviews?.overlay]);
  
  // Use overlay if available, fallback to raw rgb video
  const activeVideoUrl = overlayVideoUrl || videoObjectUrl;
  const isOverlay = !!overlayVideoUrl;

  useEffect(() => {
    setVideoError(null);
  }, [activeVideoUrl]);

  return (
    <Card className="flex flex-col gap-4" padding="md">
      {/* Header: Label */}
      <div className="flex items-center justify-between">
        <div className="panel-card-label">
          <Eye size={14} className="text-text-secondary" />
          <span>Visualisasi Video</span>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="relative bg-surface-bg rounded-xl overflow-hidden border border-surface-border aspect-video flex">
        
        <div className={cn('relative w-full h-full', theme === 'dark' ? 'bg-black' : 'bg-white')}>
          {activeVideoUrl && videoStatus !== 'idle' ? (
            <>
              <video
                key={activeVideoUrl}
                ref={videoRef}
                controls={false}
                playsInline
                preload="metadata"
                muted
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => {
                  setVideoError('Gagal memuat video');
                }}
              >
                <source src={activeVideoUrl} type="video/mp4" />
              </video>
            </>
          ) : (
            <div className={cn(
              'absolute inset-0 flex items-center justify-center text-sm italic',
              theme === 'dark' ? 'text-text-muted' : 'text-slate-500'
            )}>
              Belum ada video
            </div>
          )}

          <div className={cn(
            'absolute top-3 left-3 backdrop-blur-sm text-text-primary text-[10px] font-mono px-2 py-1 rounded tracking-wider uppercase z-20',
            theme === 'dark' ? 'bg-black/60' : 'bg-white/60'
          )}>
            {isOverlay ? 'Visualisasi Rangka' : 'Video Asli'}
          </div>
          
          {videoError && (
            <div className="absolute inset-0 z-30 flex items-center justify-center text-sm text-white bg-black/40">
              {videoError}
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-4 px-2">
        <button
          onClick={togglePlay}
          disabled={!activeVideoUrl}
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
