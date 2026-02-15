import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { clearSessionUser, getSessionUser } from "../../src/storage/session";
import { useAppTheme } from "../../src/theme/ThemeProvider";

export default function Dashboard() {
  const router = useRouter();
  const params = useLocalSearchParams<{ nombre?: string; identificacion?: string }>();
  const { theme } = useAppTheme();

  const [nombre, setNombre] = useState<string>("");

  useEffect(() => {
    (async () => {
      const u = await getSessionUser();

      if (u?.nombre) {
        setNombre(u.nombre);
        return;
      }

      // ✅ fallback por params (si AsyncStorage falló)
      if (params?.nombre) {
        setNombre(String(params.nombre));
        return;
      }

      // ✅ si no hay nada, al menos algo visible
      setNombre("");
    })();
  }, [params?.nombre]);

  const go = (href: Href) => router.push(href);

  const cerrarSesion = async () => {
    await clearSessionUser();
    router.replace("/login");
  };

  return (
    <LinearGradient
      colors={theme.gradients.brand as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]} />

      <View style={styles.container}>
        <Text style={styles.hola}>
          Hola{nombre ? `, ${nombre}` : ""} 👋
        </Text>
        <Text style={styles.sub}>Bienvenido a VetFarm</Text>

        <View style={styles.grid}>
          <Pressable
            onPress={() => go("/perfil" as Href)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.row}>
              <Text style={styles.icon}>👤</Text>
              <Text style={styles.cardTitle}>Mi Perfil</Text>
            </View>
            <Text style={styles.cardDesc}>
              Ver y actualizar datos (sin cambiar identificación).
            </Text>
            <Text style={styles.cardCta}>Abrir →</Text>
          </Pressable>

          <Pressable
            onPress={() => go("/mascotas" as Href)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.row}>
              <Text style={styles.icon}>🐾</Text>
              <Text style={styles.cardTitle}>Mis Mascotas</Text>
            </View>
            <Text style={styles.cardDesc}>
              Agregar, editar nombre y gestionar tus mascotas.
            </Text>
            <Text style={styles.cardCta}>Abrir →</Text>
          </Pressable>

          <Pressable
            onPress={() => go("/citas" as Href)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.row}>
              <Text style={styles.icon}>📅</Text>
              <Text style={styles.cardTitle}>Mis Citas</Text>
            </View>
            <Text style={styles.cardDesc}>
              Agendar y ver tus próximas citas.
            </Text>
            <Text style={styles.cardCta}>Abrir →</Text>
          </Pressable>

          {/* ✅ NUEVO: Historial Clínico */}
          <Pressable
            onPress={() => go("/historial-clinico" as Href)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.row}>
              <Text style={styles.icon}>🩺</Text>
              <Text style={styles.cardTitle}>Historial Clínico</Text>
            </View>
            <Text style={styles.cardDesc}>
              Consultas, diagnósticos y evolución de tus mascotas.
            </Text>
            <Text style={styles.cardCta}>Abrir →</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={cerrarSesion}
          style={({ pressed }) => [styles.logout, pressed && { opacity: 0.92 }]}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 18,
  },

  hola: { color: "#fff", fontSize: 26, fontWeight: "900" },
  sub: { marginTop: 6, color: "rgba(255,255,255,0.88)", fontWeight: "700" },

  grid: { flex: 1, gap: 12, marginTop: 14 },

  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardPressed: { transform: [{ scale: 0.99 }] },

  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { fontSize: 18 },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  cardDesc: {
    marginTop: 10,
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  cardCta: { marginTop: 12, textAlign: "right", color: "#fff", fontWeight: "900" },

  logout: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#E11D48",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
