import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme/ThemeProvider";

type ToastType = "success" | "error" | "info";

type Props = {
  visible: boolean;
  text: string;
  type?: ToastType;
  durationMs?: number;
  onHide: () => void;
};

export function Toast({
  visible,
  text,
  type = "info",
  durationMs = 2400,
  onHide,
}: Props) {
  const { theme } = useAppTheme();
  const anim = useRef(new Animated.Value(0)).current;

  const bgColor = useMemo(() => {
    if (type === "error") return "rgba(239,68,68,0.95)";
    if (type === "success") return "rgba(34,197,94,0.95)";
    return theme.isDark
      ? "rgba(17,24,39,0.95)"
      : "rgba(31,41,55,0.95)";
  }, [type, theme.isDark]);

  useEffect(() => {
    if (!visible) return;

    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => onHide());
    }, durationMs);

    return () => clearTimeout(timer);
  }, [visible, durationMs, anim, onHide]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: bgColor,
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
          Platform.OS === "web"
            ? ({ backdropFilter: "blur(10px)" } as any)
            : null,
        ]}
      >
        <Text style={styles.text}>{text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 22,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 999,
  },
  toast: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  text: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
