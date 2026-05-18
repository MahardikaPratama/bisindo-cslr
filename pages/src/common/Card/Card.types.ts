/**
 * @file        Card.types.ts
 * @description Type definitions untuk komponen Card panel.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Aktifkan glow border effect saat hover atau state aktif */
  glow?: boolean;
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
