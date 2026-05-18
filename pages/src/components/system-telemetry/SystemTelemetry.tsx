/**
 * @file        SystemTelemetry.tsx
 * @description Panel untuk menampilkan metrik sistem seperti waktu inferensi,
 *              FPS, dan utilisasi GPU.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import Card from '../../common/Card/Card';
import { useInferenceStore } from '../../store/useInferenceStore';
import { formatFps } from '../../utils/formatters';

const SystemTelemetry = React.memo(function SystemTelemetry() {
  const { telemetry } = useInferenceStore();

  return (
    <Card className="flex flex-col h-full gap-4" padding="md">
      <div className="panel-card-label">
        <span>System Telemetry</span>
      </div>

      <div className="flex flex-col gap-3 mt-1 text-sm">
        {/* Model */}
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Model</span>
          <span className="font-semibold text-brand-blue-light">
            {telemetry?.model || 'TwoStream CoSign'}
          </span>
        </div>

        {/* Inference */}
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Inference</span>
          <span className="font-bold text-text-primary font-mono">
            {telemetry?.inferenceMs ? `${telemetry.inferenceMs}ms` : '-'}
          </span>
        </div>

        {/* FPS */}
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">FPS</span>
          <span className="font-bold text-text-primary font-mono">
            {telemetry?.fps ? formatFps(telemetry.fps) : '-'}
          </span>
        </div>

        {/* GPU Util */}
        <div className="flex flex-col gap-1.5 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">GPU Util</span>
            <span className="font-bold text-brand-blue-light font-mono text-xs">
              {telemetry?.gpuUtilPercent ? `${telemetry.gpuUtilPercent}%` : '0%'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-panel-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gpu-bar rounded-full progress-fill"
              style={{ width: `${telemetry?.gpuUtilPercent || 0}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
});

export default SystemTelemetry;
