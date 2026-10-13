import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'petcare.theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Theme remains available for the current page session.
    }
  }, [mode]);

  const value = {
    mode,
    toggleTheme: () => setMode((current) => current === 'light' ? 'dark' : 'light'),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider.');
  return context;
}
