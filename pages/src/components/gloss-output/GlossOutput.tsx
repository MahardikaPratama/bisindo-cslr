/**
 * @file        GlossOutput.tsx
 * @description Panel hasil inferensi CSLR — menampilkan kalimat Ground Truth,
 *              kalimat hasil prediksi model, dan Word Error Rate (WER).
 * @author      KoTA 502
 * @version     2.0.0
 * @created     2024-01-01
 */

import React from 'react';
import Card from '../../common/Card/Card';
import Badge from '../../common/Badge/Badge';
import { useInferenceStore } from '../../store/useInferenceStore';

// ── WER badge colour helper ──────────────────────────────────────────────────
function werBadgeClass(wer: number): string {
  if (wer <= 0.2) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  if (wer <= 0.5) return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
  return 'bg-red-500/15 text-red-400 border border-red-500/30';
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SentenceBoxProps {
  label: string;
  text: string;
  variant?: 'default' | 'prediction';
}

const SentenceBox: React.FC<SentenceBoxProps> = ({ label, text, variant = 'default' }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
      {label}
    </span>
    <div
      className={`
        w-full rounded-xl px-4 py-3 font-semibold text-base leading-relaxed tracking-wide
        transition-all duration-300
        ${variant === 'prediction'
          ? 'bg-brand-blue/10 border border-brand-blue/30 text-brand-blue-light'
          : 'bg-surface-border/20 border border-surface-border text-text-primary'}
      `}
    >
      {text || <span className="italic text-text-muted font-normal">—</span>}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const GlossOutput = React.memo(function GlossOutput() {
  const { inferenceResult, isRunning } = useInferenceStore();

  const isEmpty = !inferenceResult;

  return (
    <Card className="flex flex-col h-full gap-4 relative" padding="md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="panel-card-label">
          <span>Inference Result</span>
        </div>
        <Badge variant={isRunning ? 'live' : 'neutral'} dot={isRunning}>
          {isRunning ? 'LIVE' : 'OUTPUT'}
        </Badge>
      </div>

      {/* Body */}
      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted italic text-sm text-center">
            No inference result yet. Upload a video and run the pipeline.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Ground Truth */}
          <SentenceBox
            label="Ground Truth"
            text={inferenceResult.groundTruth}
            variant="default"
          />

          {/* Prediction */}
          <SentenceBox
            label="Prediction"
            text={inferenceResult.prediction}
            variant="prediction"
          />

          {/* WER */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Word Error Rate (WER)
            </span>
            <span
              className={`
                px-3 py-1 rounded-full text-sm font-bold font-mono
                ${werBadgeClass(inferenceResult.wer)}
              `}
            >
              {inferenceResult.werPercent}
            </span>
          </div>

          {/* Inference time (subtle) */}
          {inferenceResult.inferenceMs > 0 && (
            <p className="text-[11px] text-text-muted font-mono text-right -mt-2">
              model forward pass: {inferenceResult.inferenceMs} ms
            </p>
          )}
        </div>
      )}
    </Card>
  );
});

export default GlossOutput;
