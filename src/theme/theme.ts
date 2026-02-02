export type ThemeMode = "light" | "dark";

export const tokens = {
  radius: {
    sm: 10,
    md: 16,
    lg: 22,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
  },
};

export const palette = {
  violet: "#7C3AED",
  mint: "#34D399",
  blue: "#5B6CFF",

  lightBg: "#F7F8FC",
  lightCard: "#FFFFFF",
  lightText: "#101828",
  lightSubText: "#475467",

  darkBg: "#0B1020",
  darkCard: "#121A2F",
  darkText: "#E6EAF2",
  darkSubText: "#A7B0C0",

  danger: "#F04438",
  borderLight: "rgba(16,24,40,0.10)",
  borderDark: "rgba(255,255,255,0.12)",
};

export const makeTheme = (mode: ThemeMode) => {
  const isDark = mode === "dark";

  return {
    mode,
    isDark,
    colors: {
      bg: isDark ? palette.darkBg : palette.lightBg,
      card: isDark ? palette.darkCard : palette.lightCard,
      text: isDark ? palette.darkText : palette.lightText,
      subText: isDark ? palette.darkSubText : palette.lightSubText,
      border: isDark ? palette.borderDark : palette.borderLight,

      primary: palette.violet,
      secondary: palette.mint,
      accent: palette.blue,

      danger: palette.danger,

      glass: isDark ? "rgba(18,26,47,0.70)" : "rgba(255,255,255,0.78)",
      overlay: isDark ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.08)",
    },
    gradients: {
      brand: [palette.violet, palette.blue, palette.mint] as const,
    },
    ...tokens,
  };
};

export type AppTheme = ReturnType<typeof makeTheme>;
