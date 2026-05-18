/**
 * @file        cn.ts
 * @description Utility untuk dynamic class merging. Menggabungkan clsx dan tailwind-merge
 *              untuk menghindari konflik class Tailwind saat conditional styling dari props.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan class names secara aman menggunakan clsx dan tailwind-merge.
 * Menghindari konflik class Tailwind pada conditional styling.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-brand-blue', 'text-white')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
