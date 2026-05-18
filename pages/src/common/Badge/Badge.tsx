/**
 * @file        Badge.tsx
 * @description Reusable Badge atom untuk status indicators, label kategori, dan live output.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import { cn } from '../../utils/cn';
import type { BadgeProps, BadgeVariant } from './Badge.types';

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success-bg border-success-green/30 text-success-green',
  info:    'bg-blue-950/50 border-blue-700/30 text-blue-300',
  warning: 'bg-yellow-950/50 border-yellow-700/30 text-yellow-300',
  error:   'bg-red-950/50 border-red-700/30 text-red-300',
  neutral: 'bg-surface-panel-2 border-surface-border text-text-secondary',
  live:    'bg-brand-blue/20 border-brand-blue/40 text-brand-blue-light',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-success-green',
  info:    'bg-blue-400',
  warning: 'bg-yellow-400',
  error:   'bg-red-400',
  neutral: 'bg-text-muted',
  live:    'bg-brand-blue-light',
};

const Badge = React.memo(function Badge({
  variant = 'neutral',
  children,
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        'text-[10px] font-semibold tracking-wider uppercase rounded-md border',
        'transition-colors duration-200',
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse-slow',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
});

export default Badge;
