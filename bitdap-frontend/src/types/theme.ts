export type Theme = 'light' | 'dark';
export interface ThemeContextType {
  theme: Theme;
  systemPreference: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}
export const LIGHT_THEME = {
  background: '#ffffff',
  surface: '#f5f5f5',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  border: '#e0e0e0',
  accent: '#4371ff',
};
export const DARK_THEME = {
  background: '#0b0d10',
  surface: '#111722',
  textPrimary: '#e9edf5',
  textSecondary: '#9aa5b5',
  border: '#1f2937',
  accent: '#4371ff',
};
