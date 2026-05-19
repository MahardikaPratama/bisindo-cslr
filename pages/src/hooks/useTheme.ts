import { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';

export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const initTheme = useThemeStore((state) => state.initTheme);

  // Initialize theme on mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return { theme, setTheme, toggleTheme };
}
