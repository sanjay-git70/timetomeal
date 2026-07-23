import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('hb_theme') as ThemeMode) || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else {
      // System mode
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemDark);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }

    localStorage.setItem('hb_theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
