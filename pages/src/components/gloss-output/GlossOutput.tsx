/**
 * @file        GlossOutput.tsx
 * @description Panel untuk menampilkan urutan gloss (kata prediksi) hasil inferensi model.
 *              Menampilkan LIVE OUTPUT badge dan list gloss dengan tingkat confidence.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import Card from '../../common/Card/Card';
import Badge from '../../common/Badge/Badge';
import { useInferenceStore } from '../../store/useInferenceStore';
import { formatConfidence } from '../../utils/formatters';

const GlossOutput = React.memo(function GlossOutput() {
  const { glossSequence, isRunning } = useInferenceStore();

  return (
    <Card className="flex flex-col h-full gap-4 relative" padding="md">
      <div className="flex items-center justify-between">
        <div className="panel-card-label">
          <span>Predicted Gloss Sequence</span>
        </div>
        <Badge variant={isRunning ? 'live' : 'neutral'} dot={isRunning}>
          LIVE OUTPUT
        </Badge>
      </div>

      <div className="flex-1 flex items-center justify-start flex-wrap gap-2 mt-2">
        {glossSequence.length === 0 ? (
          <div className="text-text-muted italic text-sm text-center w-full mt-4">
            No predictions yet.
          </div>
        ) : (
          glossSequence.map((item, index) => {
            const isLast = index === glossSequence.length - 1;
            // Anggap item terakhir yang baru muncul sedang 'active', sisanya 'pending'/'done' (biru terang vs outline)
            const isActive = isLast && isRunning;

            return (
              <React.Fragment key={`${item.gloss}-${index}`}>
                <div className="flex flex-col items-center gap-1 animate-fade-in">
                  <div
                    className={`
                      px-4 py-3 rounded-lg font-bold text-xl tracking-wide min-w-[80px] text-center
                      transition-all duration-300
                      ${
                        isActive || !isRunning
                          ? 'bg-brand-blue text-white shadow-btn-primary'
                          : 'bg-brand-blue/10 border border-brand-blue/30 text-brand-blue-light'
                      }
                    `}
                  >
                    {item.gloss}
                  </div>
                  <span className="text-[10px] font-mono font-medium text-success-green">
                    {formatConfidence(item.confidence)}
                  </span>
                </div>

                {!isLast && (
                  <ChevronRight size={20} className="text-surface-border mb-4" />
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </Card>
  );
});

export default GlossOutput;
