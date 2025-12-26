'use client';
import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { Theme, ThemeContextType } from '@/types/theme';
import { getInitialTheme, saveTheme, applyThemeToDocument, getSystemTheme } from '@/utils/theme-utils';
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [systemPreference, setSystemPreference] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const initialTheme = getInitialTheme();
    const system = getSystemTheme();
    setThemeState(initialTheme);
    setSystemPreference(system);
    applyThemeToDocument(initialTheme);
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
    applyThemeToDocument(newTheme);
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);
  if (!mounted) return <>{children}</>;
  const value: ThemeContextType = { theme, systemPreference, toggleTheme, setTheme };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
