import { createContext, useContext } from "react";

export type ThemeMode = "light" | "dark";
export type ColorTheme = "orange" | "red" | "blue" | "green" | "purple";

interface ThemeContextType {
  mode: ThemeMode;
  colorTheme: ColorTheme;
  colorScheme: Record<string, string>;
  toggleMode: () => void;
  changeColor: (colorName: ColorTheme) => void;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
