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
import { cn } from '../../utils/cn';
import type { ViewMode } from './VisualizationPanel.types';

const VisualizationPanel = React.memo(function VisualizationPanel() {
  const { videoObjectUrl, videoStatus } = useVideoStore();
  const [viewMode, setViewMode] = useState<ViewMode>('dual');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play/Pause handler
  const togglePlay = () => {
    if (!videoRef.current || !videoObjectUrl) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Time update listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

  const duration = videoRef.current?.duration || 4.2; // mock duration fallback

  return (
    <Card className="flex flex-col gap-4" padding="md">
      {/* Header: Label & View Toggle */}
      <div className="flex items-center justify-between">
        <div className="panel-card-label">
          <Eye size={14} className="text-text-secondary" />
          <span>Visualization Panel</span>
        </div>
        
        <div className="flex items-center bg-surface-panel-2 rounded-lg p-1 border border-surface-border">
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
      <div className={cn(
        'relative bg-surface-bg rounded-xl overflow-hidden border border-surface-border aspect-[21/9] flex',
        viewMode === 'dual' ? 'gap-0.5' : ''
      )}>
        {/* RGB Video */}
        <div className="relative flex-1 bg-black h-full">
          {videoObjectUrl && videoStatus !== 'idle' ? (
            <video
              ref={videoRef}
              src={videoObjectUrl}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm italic">
              No video source
            </div>
          )}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-text-primary text-[10px] font-mono px-2 py-1 rounded tracking-wider uppercase">
            Original RGB
          </div>
        </div>

        {/* Skeleton Mapping */}
        {viewMode === 'dual' && (
          <div className="relative flex-1 bg-surface-panel-2 h-full overflow-hidden flex items-center justify-center">
            {/* Mock Skeleton Graph matching the UI design */}
            <div className="relative w-1/2 h-2/3 opacity-80">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
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
            
            <div className="absolute top-3 left-3 bg-brand-blue/90 text-white text-[10px] font-mono px-2 py-1 rounded tracking-wider uppercase">
              Skeleton Mapping
            </div>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-4 px-2">
        <button
          onClick={togglePlay}
          className="text-brand-blue-light hover:text-brand-blue-light/80 transition-colors"
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        
        {/* Progress Bar */}
        <div className="flex-1 relative h-1.5 bg-surface-panel-2 rounded-full cursor-pointer group overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-brand-blue rounded-full transition-all ease-linear"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
          />
        </div>

        {/* Timestamps & Fullscreen */}
        <div className="flex items-center gap-3 text-xs font-mono text-text-secondary">
          <span>00:0{currentTime.toFixed(1)} / 00:0{duration.toFixed(1)}</span>
          <button className="hover:text-text-primary transition-colors ml-2">
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
});

export default VisualizationPanel;
