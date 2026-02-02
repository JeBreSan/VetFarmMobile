import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useAppTheme } from "../theme/ThemeProvider";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  style?: ViewStyle;
};

export function Button({ title, onPress, disabled, variant = "primary", style }: Props) {
  const { theme } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const commonShadow = useMemo(
    () => ({
      shadowColor: "#000",
      shadowOpacity: theme.isDark ? 0.35 : 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    }),
    [theme.isDark]
  );

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  // ✅ cursor pointer en web
  const webCursor = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null;

  if (variant === "ghost") {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable
          onPress={onPress}
          disabled={disabled}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={({ pressed, hovered }: any) => [
            styles.ghost,
            webCursor,
            {
              borderColor: theme.colors.border,
              opacity: disabled ? 0.45 : pressed ? 0.9 : hovered ? 0.98 : 1,
              transform: [{ scale: pressed ? 0.99 : hovered ? 1.01 : 1 }],
            },
          ]}
        >
          <Text style={[styles.text, { color: theme.colors.text }]}>{title}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === "secondary") {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable
          onPress={onPress}
          disabled={disabled}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={({ pressed, hovered }: any) => [
            styles.secondary,
            commonShadow,
            webCursor,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
              opacity: disabled ? 0.45 : pressed ? 0.92 : hovered ? 0.98 : 1,
              transform: [{ scale: pressed ? 0.98 : hovered ? 1.01 : 1 }],
            },
          ]}
        >
          <Text style={[styles.text, { color: theme.colors.primary }]}>{title}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={({ pressed, hovered }: any) => [
          styles.primaryWrap,
          commonShadow,
          webCursor,
          {
            opacity: disabled ? 0.45 : pressed ? 0.95 : hovered ? 0.98 : 1,
            transform: [{ scale: pressed ? 0.97 : hovered ? 1.01 : 1 }],
          },
        ]}
      >
        <LinearGradient
          colors={theme.gradients.brand as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primary}
        >
          <Text style={[styles.text, { color: "#FFF" }]}>{title}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  primaryWrap: {
    borderRadius: 18,
    overflow: "hidden",
  },
  primary: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 18,
  },
  ghost: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 16,
  },
});
