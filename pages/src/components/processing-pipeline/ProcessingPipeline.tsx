/**
 * @file        ProcessingPipeline.tsx
 * @description Panel untuk menampilkan visualisasi progres langkah-langkah pipeline
 *              (RGB Video -> Skeleton -> Preprocess -> Inference -> Prediction).
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import { GitCommit } from 'lucide-react';
import Card from '../../common/Card/Card';
import Stepper from '../../common/Stepper/Stepper';
import { useInferenceStore } from '../../store/useInferenceStore';

const ProcessingPipeline = React.memo(function ProcessingPipeline() {
  const { pipelineSteps } = useInferenceStore();

  return (
    <Card className="flex flex-col gap-8 pb-10" padding="md">
      <div className="panel-card-label">
        <GitCommit size={14} className="text-text-secondary" />
        <span>Processing Pipeline</span>
      </div>

      <div className="px-4">
        <Stepper steps={pipelineSteps} />
      </div>
    </Card>
  );
});

export default ProcessingPipeline;
