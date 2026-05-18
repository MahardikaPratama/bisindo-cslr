/**
 * @file        useConsoleStore.ts
 * @description Zustand store untuk domain console log terminal.
 *              Mengelola log entries yang muncul di panel CONSOLE LOG.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import { create } from 'zustand';
import type { LogEntry, LogType } from '../types/inference.types';
import { formatLogTimestamp } from '../utils/formatters';

const MAX_LOG_ENTRIES = 200;

interface ConsoleStore {
  logs: LogEntry[];

  /** Tambahkan satu log entry baru */
  appendLog: (type: LogType, message: string) => void;
  /** Hapus semua log */
  clearLogs: () => void;
}

let logIdCounter = 0;

export const useConsoleStore = create<ConsoleStore>((set) => ({
  logs: [],

  appendLog: (type, message) =>
    set((state) => {
      const entry: LogEntry = {
        id: `log-${++logIdCounter}`,
        type,
        message,
        timestamp: formatLogTimestamp(),
      };
      const newLogs = [...state.logs, entry];
      // Batasi log maksimum agar tidak memory leak
      return { logs: newLogs.slice(-MAX_LOG_ENTRIES) };
    }),

  clearLogs: () => set({ logs: [] }),
}));
