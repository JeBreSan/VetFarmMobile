import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../src/theme/ThemeProvider";
import { Button } from "../../src/ui/Button";

export default function HistorialClinicoIndex() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <LinearGradient colors={theme.gradients.brand as any} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial Clínico</Text>
        <Text style={styles.subtitle}>
          (En construcción) Luego aquí vamos a ver diagnósticos y consultas por mascota.
        </Text>
      </View>

      <View style={styles.box}>
        <Button title="Volver" variant="ghost" onPress={() => router.back()} />
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    screen: { flex: 1, padding: 16 },
    header: { marginTop: 10, marginBottom: 14 },
    title: { color: "#fff", fontSize: 26, fontWeight: "900" },
    subtitle: { color: "rgba(255,255,255,0.9)", marginTop: 6, lineHeight: 18, fontWeight: "600" },
    box: {
      marginTop: 10,
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      borderRadius: 18,
      padding: 14,
      gap: 10,
    },
  });
}
