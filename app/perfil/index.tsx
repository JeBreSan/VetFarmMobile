import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Perfil() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mi Perfil</Text>
      <Text style={styles.text}>Aquí vamos a mostrar y editar nombre/teléfono/correo.</Text>
      <Text style={styles.text}>Identificación NO se edita ✅</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#0B1220" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 8 },
  text: { color: "rgba(255,255,255,0.8)", marginTop: 6 },
});
