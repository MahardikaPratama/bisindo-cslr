/**
 * @file        Button.tsx
 * @description Reusable Button atom. Mendukung variant (primary/secondary/ghost/danger),
 *              size, loading state, dan icon slots kiri/kanan.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import { cn } from '../../utils/cn';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-blue hover:bg-brand-blue-light text-white shadow-btn-primary hover:shadow-panel-glow border border-brand-blue/30',
  secondary:
    'bg-brand-blue/5 border border-brand-blue/30 hover:border-brand-blue hover:bg-brand-blue/10 text-brand-blue transition-all',
  ghost:
    'bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-transparent',
  danger:
    'bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700/50 hover:border-red-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5',
};

const Button = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:ring-offset-2 focus:ring-offset-surface-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
});

export default Button;
