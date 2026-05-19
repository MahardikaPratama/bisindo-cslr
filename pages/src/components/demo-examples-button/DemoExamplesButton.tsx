/**
 * @file        DemoExamplesButton.tsx
 * @description Button untuk Try Demo Examples dengan dropdown selector
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { useDemoExample } from '../../hooks/useDemoExample';
import { cn } from '../../utils/cn';

interface DemoExamplesButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary';
}

const DemoExamplesButton = React.memo(function DemoExamplesButton({
  className,
  variant = 'primary',
}: DemoExamplesButtonProps) {
  const { loadDemo, demos } = useDemoExample();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectDemo = async (demoId: string) => {
    try {
      setIsLoading(true);
      await loadDemo(demoId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error loading demo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || demos.length === 0}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variant === 'primary'
            ? 'bg-brand-blue text-white hover:bg-brand-blue/90'
            : 'bg-surface-panel-2 border border-surface-border text-text-primary hover:bg-surface-panel-1'
        )}
      >
        <Play size={14} />
        {isLoading ? 'Loading...' : 'Try Demo Sample'}
      </button>

      {/* Dropdown Menu */}
      {isOpen && demos.length > 0 && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute top-full right-0 z-50 mt-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden min-w-[250px]">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => handleSelectDemo(demo.id)}
                disabled={isLoading}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-700',
                  'border-b border-slate-100 dark:border-slate-700',
                  'last:border-b-0 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <div className="font-medium text-slate-900 dark:text-slate-200">{demo.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{demo.description}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* No demos message */}
      {!isOpen && demos.length === 0 && (
        <div className="text-xs text-text-secondary mt-1">No demo examples available</div>
      )}
    </div>
  );
});

export default DemoExamplesButton;
