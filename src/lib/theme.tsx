import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type EdgeConfidence = 'evidence' | 'model_estimated' | 'unknown';

export interface EdgeVisualStyle {
  lineStyle: 'solid' | 'dashed';
  opacity: number;
}

export function getEdgeStyle(confidence: EdgeConfidence): EdgeVisualStyle {
  switch (confidence) {
    case 'evidence':
      return { lineStyle: 'solid', opacity: 1 };
    case 'model_estimated':
      return { lineStyle: 'dashed', opacity: 0.55 };
    case 'unknown':
      return { lineStyle: 'dashed', opacity: 0.25 };
  }
}

export const colors = {
  amberPale: '#FFE49E',
  amber: '#FCBA48',
  amberDeep: '#EE8E28',
  amberRust: '#B25A12',
  ink: '#140D07',
  bgLight: '#FBF6EE',
  bgDark: '#100C08',
  textLight: '#4A3B2A',
  textDark: '#D8C6AC',
  conflict: '#C4451C',
  graphBlue: '#3C78A8',
} as const;

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem('relict_theme') as Theme | null;
    return saved && ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') return getSystemTheme();
    return theme;
  });

  useEffect(() => {
    const root = document.documentElement;
    const computed = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(computed);

    root.classList.remove('light', 'dark');
    root.classList.add(computed);
    root.setAttribute('data-theme', computed);
    localStorage.setItem('relict_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const computed = e.matches ? 'dark' : 'light';
      setResolvedTheme(computed);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(computed);
      document.documentElement.setAttribute('data-theme', computed);
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const currentResolved = prev === 'system' ? getSystemTheme() : prev;
      return currentResolved === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
