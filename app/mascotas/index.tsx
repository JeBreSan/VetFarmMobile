import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Mascotas() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mis Mascotas</Text>
      <Text style={styles.text}>Aquí va el CRUD de mascotas.</Text>
      <Text style={styles.text}>Usuario: puede editar nombre ✅</Text>
      <Text style={styles.text}>Admin: puede editar raza/especie ✅</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#0B1220" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 8 },
  text: { color: "rgba(255,255,255,0.8)", marginTop: 6 },
});
