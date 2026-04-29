import React, { createContext, useContext, useState, useEffect } from 'react';

// Predefined color schemes
const colorSchemes = {
  orange: {
    primary: '#e16a3d',
    'primary-dark': '#c95a32',
    'primary-light': '#fb923c',
    'primary-100': '#ffedd5',
    'primary-50': '#fff7ed',
  },
  red: {
    primary: '#ef4444',
    'primary-dark': '#dc2626',
    'primary-light': '#f87171',
    'primary-100': '#fee2e2',
    'primary-50': '#fef2f2',
  },
  blue: {
    primary: '#3b82f6',
    'primary-dark': '#2563eb',
    'primary-light': '#60a5fa',
    'primary-100': '#dbeafe',
    'primary-50': '#eff6ff',
  },
  green: {
    primary: '#10b981',
    'primary-dark': '#059669',
    'primary-light': '#34d399',
    'primary-100': '#d1fae5',
    'primary-50': '#ecfdf5',
  },
  purple: {
    primary: '#8b5cf6',
    'primary-dark': '#7c3aed',
    'primary-light': '#a78bfa',
    'primary-100': '#ede9fe',
    'primary-50': '#f5f3ff',
  },
};

type ThemeMode = 'light' | 'dark';
type ColorTheme = keyof typeof colorSchemes;

interface ThemeContextType {
  mode: ThemeMode;
  colorTheme: ColorTheme;
  colorScheme: typeof colorSchemes.orange;
  toggleMode: () => void;
  changeColor: (colorName: ColorTheme) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const Theme = ({ children }: { children: React.ReactNode }) => {
  // Dark/Light mode state
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    if (saved) return saved as ThemeMode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Color theme state
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem('color-theme');
    return (saved as ColorTheme) || 'orange';
  });

  const [colorScheme, setColorScheme] = useState(() => {
    return colorSchemes[colorTheme];
  });

  // Apply dark/light mode
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  // Apply color scheme
  useEffect(() => {
    const root = document.documentElement;
    Object.keys(colorScheme).forEach(key => {
      root.style.setProperty(`--color-${key}`, colorScheme[key as keyof typeof colorScheme]);
    });
    localStorage.setItem('color-theme', colorTheme);
  }, [colorScheme, colorTheme]);

  const toggleMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const changeColor = (colorName: ColorTheme) => {
    setColorTheme(colorName);
    setColorScheme(colorSchemes[colorName]);
  };

  return (
    <ThemeContext.Provider value={{ mode, colorTheme, colorScheme, toggleMode, changeColor, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};