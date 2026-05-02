import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext, type ColorTheme, type ThemeMode } from './themeContext';
import { colorSchemes } from './themeTokens';

export const Theme = ({ children }: { children: ReactNode }) => {
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
