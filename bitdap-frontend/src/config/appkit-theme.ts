/**
 * AppKit Theme Configuration
 * Defines theme colors and styling for AppKit modal
 */

export const appKitTheme = {
  light: {
    primary: '#6366f1',
    secondary: '#10b981',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  dark: {
    primary: '#818cf8',
    secondary: '#34d399',
    accent: '#fbbf24',
    background: '#111827',
    surface: '#1f2937',
    text: '#f3f4f6',
    textSecondary: '#9ca3af',
    border: '#374151',
    error: '#f87171',
    success: '#6ee7b7',
    warning: '#fcd34d',
  },
};

export type ThemeMode = 'light' | 'dark';
export type ThemeConfig = typeof appKitTheme.light;

/**
 * Gets the current theme configuration
 */
export function getThemeConfig(mode: ThemeMode): ThemeConfig {
  return appKitTheme[mode];
}

/**
 * Converts theme config to CSS variables
 */
export function themeToCSSVariables(theme: ThemeConfig): Record<string, string> {
  return {
    '--color-primary': theme.primary,
    '--color-secondary': theme.secondary,
    '--color-accent': theme.accent,
    '--color-background': theme.background,
    '--color-surface': theme.surface,
    '--color-text': theme.text,
    '--color-text-secondary': theme.textSecondary,
    '--color-border': theme.border,
    '--color-error': theme.error,
    '--color-success': theme.success,
    '--color-warning': theme.warning,
  };
}

/**
 * Applies theme to document
 */
export function applyTheme(mode: ThemeMode): void {
  const theme = getThemeConfig(mode);
  const variables = themeToCSSVariables(theme);

  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
