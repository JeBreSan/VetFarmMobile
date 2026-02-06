import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Citas() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mis Citas</Text>
      <Text style={styles.text}>Aquí va calendario + agendar + historial.</Text>
      <Text style={styles.text}>Solo futuro para usuario ✅</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#0B1220" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 8 },
  text: { color: "rgba(255,255,255,0.8)", marginTop: 6 },
});
