import { Theme } from '@/types/theme';

export function mockSystemTheme(theme: Theme): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: theme === 'dark' ? query.includes('dark') : query.includes('light'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
}

export function clearThemeStorage(): void {
  localStorage.removeItem('bitdap-theme');
}

export function setThemeStorage(theme: Theme): void {
  localStorage.setItem('bitdap-theme', theme);
}

export function getThemeFromDOM(): Theme {
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'light' || theme === 'dark' ? theme : 'dark';
}
