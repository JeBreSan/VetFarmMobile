import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../src/theme/ThemeProvider";
import { Button } from "../../src/ui/Button";

export default function CitasIndex() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <LinearGradient colors={theme.gradients.brand as any} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Citas</Text>
        <Text style={styles.subtitle}>Elegí qué querés hacer:</Text>
      </View>

      <View style={styles.box}>
        <Button title="Agendar cita" variant="secondary" onPress={() => router.push("/citas/crear" as any)} style={styles.btn} />
        <Button title="Próximas citas" variant="secondary" onPress={() => router.push("/citas/proximas" as any)} style={styles.btn} />
        <Button title="Volver" variant="ghost" onPress={() => router.back()} style={[styles.btn, { marginTop: 8 }]} />
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    screen: { flex: 1, padding: 16 },
    header: { marginTop: 10, marginBottom: 14 },
    title: { color: "#fff", fontSize: 26, fontWeight: "900" },
    subtitle: { color: "rgba(255,255,255,0.9)", marginTop: 6 },
    box: {
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      borderRadius: 18,
      padding: 14,
      gap: 10,
    },
    btn: { marginTop: 6 },
  });
}
