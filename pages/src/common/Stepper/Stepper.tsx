/**
 * @file        Stepper.tsx
 * @description Horizontal stepper component untuk menampilkan progres pipeline.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import { cn } from '../../utils/cn';
import type { StepperProps } from './Stepper.types';
import type { PipelineStatus } from '../../types/pipeline.types';

const getStatusClasses = (status: PipelineStatus) => {
  switch (status) {
    case 'running':
      return 'step-running';
    case 'completed':
      return 'step-completed';
    case 'error':
      return 'step-error';
    case 'idle':
    default:
      return 'step-idle';
  }
};

const getLineClasses = (status: PipelineStatus, nextStatus?: PipelineStatus) => {
  if (status === 'completed' || status === 'running') {
    return 'bg-brand-blue';
  }
  return 'bg-surface-border';
};

const Stepper = React.memo(function Stepper({ steps }: StepperProps) {
  return (
    <div className="flex items-center justify-between w-full px-2">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const nextStep = isLast ? undefined : steps[index + 1];

        return (
          <React.Fragment key={step.id}>
            {/* Step Circle & Label */}
            <div className="relative flex flex-col items-center gap-2 z-10 group">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-all duration-300',
                  getStatusClasses(step.status),
                  step.status === 'running' && 'ring-4 ring-brand-blue/20'
                )}
              >
                {step.stepNumber}
              </div>
              <span
                className={cn(
                  'absolute top-10 whitespace-nowrap text-[11px] font-medium transition-colors duration-300',
                  step.status === 'running' || step.status === 'completed'
                    ? 'text-text-primary'
                    : 'text-text-secondary'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting Line */}
            {!isLast && (
              <div className="flex-1 h-[2px] mx-2">
                <div
                  className={cn(
                    'h-full w-full transition-colors duration-500',
                    getLineClasses(step.status, nextStep?.status)
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

export default Stepper;
