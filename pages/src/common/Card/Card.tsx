/**
 * @file        Card.tsx
 * @description Panel Card atom. Wrapper untuk semua panel konten (VideoInput, ConsoleLog, dll).
 *              Menerapkan design token surface-panel dengan optional glow effect.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import { cn } from '../../utils/cn';
import type { CardProps } from './Card.types';

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-6',
};

const Card = React.memo(function Card({
  children,
  glow = false,
  padding = 'md',
  className,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        'panel-card rounded-xl',
        'transition-all duration-300',
        glow && 'shadow-panel-glow border-brand-blue/20',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
});

export default Card;
