# Dark/Light Mode Theme System

## Overview
Bitdap now supports both light and dark themes with automatic system preference detection and user preference persistence.

## Features
- **Automatic Detection**: Detects system theme preference on first visit
- **User Preference**: Saves user's theme choice to localStorage
- **Smooth Transitions**: 300ms CSS transitions between themes
- **CSS Variables**: All colors use CSS custom properties for easy theming
- **Accessibility**: Full keyboard navigation and screen reader support

## CSS Variables
The following CSS variables are available for use in components:
- `--background`: Main background color
- `--surface`: Card and surface background color
- `--text-primary`: Primary text color
- `--text-secondary`: Secondary text color
- `--border`: Border color
- `--accent`: Accent color (primary action color)

## Usage
```tsx
import { useTheme } from '@/context/ThemeContext';

export function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

## Color Palettes

### Light Mode
- Background: #ffffff
- Surface: #f5f5f5
- Text Primary: #1a1a1a
- Text Secondary: #666666
- Border: #e0e0e0
- Accent: #4371ff

### Dark Mode
- Background: #0b0d10
- Surface: #111722
- Text Primary: #e9edf5
- Text Secondary: #9aa5b5
- Border: #1f2937
- Accent: #4371ff

## Implementation Details
- Theme state is managed by ThemeContext
- Theme preference is persisted to localStorage with key 'bitdap-theme'
- System preference is detected using window.matchMedia('(prefers-color-scheme: dark)')
- Theme is applied to document root via data-theme attribute
- All transitions are disabled on initial page load to prevent flash
