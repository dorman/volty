import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '../types';

declare global {
  interface Window {
    Volty?: {
      setTheme: (theme: Theme, opts?: { persist?: boolean; transition?: boolean }) => void;
      getTheme: () => Theme;
      getSystemTheme: () => 'light' | 'dark';
      setBrand: (brand: string | null) => void;
      getBrand: () => string | null;
      toast: (opts: string | object) => HTMLElement;
      initTabs: (root?: Element | Document) => void;
      initDropdowns: (root?: Element | Document) => void;
    };
  }
}

/**
 * Hook for reading and setting the Volty theme.
 *
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme } = useVoltyTheme();
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       {theme === 'dark' ? 'Light mode' : 'Dark mode'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useVoltyTheme() {
  const getTheme = useCallback((): Theme => window.Volty?.getTheme() ?? 'system', []);
  const [theme, setThemeState] = useState<Theme>(getTheme);

  const setTheme = useCallback((next: Theme, opts?: { persist?: boolean; transition?: boolean }) => {
    window.Volty?.setTheme(next, opts);
    setThemeState(next);
  }, []);

  // Sync with system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (getTheme() === 'system') setThemeState('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [getTheme]);

  return {
    theme,
    setTheme,
    systemTheme: window.Volty?.getSystemTheme(),
    resolvedTheme: theme === 'system' ? (window.Volty?.getSystemTheme() ?? 'light') : theme,
  } as const;
}
