import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useAppTheme } from "../theme/ThemeProvider";

export function Card({ style, ...props }: ViewProps) {
  const { theme } = useAppTheme();
  return (
    <View
      {...props}
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.glass,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
});
