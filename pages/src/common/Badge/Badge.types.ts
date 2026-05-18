/**
 * @file        Badge.types.ts
 * @description Type definitions untuk komponen Badge.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import type { ReactNode } from 'react';

export type BadgeVariant = 'success' | 'info' | 'warning' | 'error' | 'neutral' | 'live';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}
