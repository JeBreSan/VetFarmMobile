import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { useAppTheme } from "../theme/ThemeProvider";

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, style, ...props }: Props) {
  const { theme } = useAppTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = useMemo(() => {
    if (error) return theme.colors.danger;
    if (focused) return theme.colors.primary;
    return theme.colors.border;
  }, [error, focused, theme.colors]);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.label, { color: theme.colors.subText }]}>{label}</Text>

      <View
        style={[
          styles.inputWrap,
          {
            borderColor,
            backgroundColor: theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(16,24,40,0.03)",
          },
          focused && styles.focusGlow,
        ]}
      >
        <TextInput
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={theme.isDark ? "rgba(230,234,242,0.35)" : "rgba(16,24,40,0.35)"}
          selectionColor={theme.colors.secondary}
          style={[
            styles.input,
            {
              color: theme.colors.text,

              // ✅ Quita el borde negro feo del navegador (solo web)
              ...(Platform.OS === "web"
                ? ({ outlineStyle: "none", outlineWidth: 0 } as any)
                : null),
            },
            style,
          ]}
        />
      </View>

      {!!error && <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "600",
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  focusGlow: {
    shadowColor: "#34D399",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  input: {
    fontSize: 16,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
  },
});
