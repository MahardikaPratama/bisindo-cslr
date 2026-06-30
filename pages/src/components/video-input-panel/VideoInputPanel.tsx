/**
 * @file        VideoInputPanel.tsx
 * @description Panel untuk menampilkan status input video. Menampilkan video thumbnail
 *              atau placeholder jika kosong, beserta metadata (durasi, resolusi, FPS).
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import { Video, FileVideo } from 'lucide-react';
import Card from '../../common/Card/Card';
import { useVideoStore } from '../../store/useVideoStore';
import { formatDuration, formatFps } from '../../utils/formatters';
import GroundTruthSelector from '../ground-truth-selector/GroundTruthSelector';
// ConfigSelector intentionally not rendered to avoid frontend-side config errors
// import ConfigSelector from '../config-selector/ConfigSelector';
import type { VideoInputPanelProps } from './VideoInputPanel.types';
import { cn } from '../../utils/cn';

const VideoInputPanel = React.memo(function VideoInputPanel(_props: VideoInputPanelProps) {
  const { videoFile, videoMetadata, videoObjectUrl, videoStatus } = useVideoStore();

  return (
    <Card className="flex flex-col h-full gap-4">
      {/* Label */}
      <div className="panel-card-label">
        <FileVideo size={14} className="text-brand-blue-light" />
        <span>Video Input</span>
      </div>

      {/* Preview Area */}
      <div
        className={cn(
          'relative flex-1 rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden min-h-[160px]',
          videoStatus !== 'idle'
            ? 'border-surface-border bg-surface-panel-2'
            : 'border-surface-border/50 bg-surface-bg/50'
        )}
      >
        {videoObjectUrl && videoStatus !== 'idle' ? (
          <>
            <video
              src={videoObjectUrl}
              className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale blur-[2px]"
              muted
              playsInline
            />
            <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue-light mb-1">
                <Video size={20} />
              </div>
              <span className="font-mono text-sm text-text-primary max-w-full truncate px-4">
                {videoFile?.name || 'video_input.mp4'}
              </span>
              <span className="text-xs text-text-secondary">Ready for processing</span>
            </div>
          </>
        ) : (
          <div className="text-text-secondary flex flex-col items-center gap-2 opacity-50">
            <FileVideo size={24} />
            <span className="text-xs font-medium">No video selected</span>
          </div>
        )}
      </div>

      {/* Metadata Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-panel-2 rounded-lg py-2.5 px-3 flex flex-col items-center justify-center border border-surface-border/50">
          <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-0.5">Duration</span>
          <span className="text-sm font-semibold text-text-primary font-mono">
            {videoMetadata?.duration ? `${formatDuration(videoMetadata.duration)}s` : '-'}
          </span>
        </div>
        <div className="bg-surface-panel-2 rounded-lg py-2.5 px-3 flex flex-col items-center justify-center border border-surface-border/50">
          <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-0.5">Resolution</span>
          <span className="text-sm font-semibold text-text-primary font-mono">
            {videoMetadata?.resolution || '-'}
          </span>
        </div>
        <div className="bg-surface-panel-2 rounded-lg py-2.5 px-3 flex flex-col items-center justify-center border border-surface-border/50">
          <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-0.5">FPS</span>
          <span className="text-sm font-semibold text-text-primary font-mono">
            {videoMetadata?.fps ? formatFps(videoMetadata.fps) : '-'}
          </span>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-col gap-3">
        <GroundTruthSelector />
        {/* Preprocessing config selector removed from UI — backend default will be used */}
      </div>
    </Card>
  );
});

export default VideoInputPanel;
