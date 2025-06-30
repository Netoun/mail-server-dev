import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Initial theme: system
  let initialTheme: Theme = 'system';
  let initialResolved: 'light' | 'dark' = getSystemTheme();

  // Try to load from localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      initialTheme = saved;
      initialResolved = saved === 'system' ? getSystemTheme() : saved;
    }
  }

  // Listen to system changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (get().theme === 'system') {
        set({ resolvedTheme: e.matches ? 'dark' : 'light' });
      }
    });
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,
    setTheme: (theme: Theme) => {
      set({ theme, resolvedTheme: theme === 'system' ? getSystemTheme() : theme });
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
    },
  };
}); 