import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { AppTheme, makeTheme, ThemeMode } from "./theme";

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === "dark" ? "dark" : "light";

  const value = useMemo(() => ({ theme: makeTheme(mode), mode }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
