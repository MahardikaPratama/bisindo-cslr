/**
 * @file        ConsoleLogPanel.tsx
 * @description Panel terminal untuk menampilkan log proses pipeline.
 *              Otomatis scroll ke bawah saat ada log baru.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import Card from '../../common/Card/Card';
import { useConsoleStore } from '../../store/useConsoleStore';
import { useInferenceStore } from '../../store/useInferenceStore';
import { cn } from '../../utils/cn';

const getLogColorClass = (type: string) => {
  switch (type) {
    case 'INFO':
      return 'console-info';
    case 'PROCESS':
      return 'console-process';
    case 'ERROR':
      return 'console-error';
    case 'DEBUG':
    default:
      return 'console-default';
  }
};

const ConsoleLogPanel = React.memo(function ConsoleLogPanel() {
  const { logs } = useConsoleStore();
  const { isRunning } = useInferenceStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah setiap kali logs berubah
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="flex flex-col h-full gap-3" padding="md">
      <div className="panel-card-label">
        <Terminal size={14} className="text-text-secondary" />
        <span>Console Log</span>
      </div>

      <div
        ref={scrollRef}
        className={cn(
          'flex-1 bg-surface-panel-2 border border-surface-border rounded-lg p-3',
          'font-mono text-[11px] leading-relaxed overflow-y-auto min-h-[150px]'
        )}
      >
        {logs.length === 0 ? (
          <span className="text-text-muted italic">Ready. Waiting for process to start...</span>
        ) : (
          <div className="flex flex-col">
            {logs.map((log) => (
              <span key={log.id} className={getLogColorClass(log.type)}>
                [{log.type}] {log.message}
              </span>
            ))}
            {/* Blinking cursor effect if running */}
            {isRunning && (
              <span className="cursor-blink text-brand-blue-light opacity-80 mt-1"></span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
});

export default ConsoleLogPanel;
