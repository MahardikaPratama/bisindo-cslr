/**
 * @file        useThemeStore.ts
 * @description Zustand store untuk theme management (shared state across all components)
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import { create } from 'zustand';

type ThemeType = 'light' | 'dark';

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

// Helper untuk get initial theme dari localStorage atau system preference
const getInitialTheme = (): ThemeType => {
  if (typeof window === 'undefined') return 'dark';
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'dark';
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'dark',

  setTheme: (theme) => {
    set({ theme });
    
    // Update DOM
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    }
  },

  toggleTheme: () => {
    const current = get().theme;
    const newTheme = current === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },

  initTheme: () => {
    const initialTheme = getInitialTheme();
    get().setTheme(initialTheme);
  },
}));
