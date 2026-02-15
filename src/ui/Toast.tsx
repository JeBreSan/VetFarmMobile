import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme/ThemeProvider";

type ToastType = "success" | "error" | "info";

type Props = {
  visible: boolean;
  text: string;
  type?: ToastType;
  durationMs?: number;
  onHide: () => void;
};

export function Toast({ visible, text, type = "info", durationMs = 2400, onHide }: Props) {
  const { theme } = useAppTheme();
  const anim = useRef(new Animated.Value(0)).current;

  const bgColor = useMemo(() => {
  if (type === "error") return "#B91C1C";      // rojo sólido
  if (type === "success") return "#15803D";   // verde sólido
  return "#1F2937";                           // gris oscuro sólido
}, [type]);


  useEffect(() => {
    if (!visible) return;

    Animated.timing(anim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 160,
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
                  outputRange: [18, 0],
                }),
              },
            ],
          },
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
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
  width: "100%",
  maxWidth: 520,
  borderRadius: 16,
  paddingVertical: 14,
  paddingHorizontal: 18,

  shadowColor: "#000",
  shadowOpacity: 0.35,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 10,
},

  text: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
});
