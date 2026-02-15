import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { apiEliminarCita, apiListarProximasCitas, type Cita } from "../../src/services/citasService";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { Toast } from "../../src/ui/Toast";

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function ProximasCitas() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Cita[]>([]);
  const [toast, setToast] = useState<{ visible: boolean; text: string; type: "success" | "error" | "info" }>({
    visible: false,
    text: "",
    type: "info",
  });

  const load = async () => {
    try {
      setLoading(true);
      const list = await apiListarProximasCitas();
      setItems(list);
    } catch (e: any) {
      setToast({ visible: true, type: "error", text: e?.message || "Error cargando citas" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const eliminar = async (id: number) => {
    try {
      await apiEliminarCita(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setToast({ visible: true, type: "success", text: "Cita eliminada." });
    } catch (e: any) {
      setToast({ visible: true, type: "error", text: e?.message || "No se pudo eliminar" });
    }
  };

  return (
    <LinearGradient colors={theme.gradients.brand as any} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Próximas citas</Text>
        <Text style={styles.subtitle}>Tus citas agendadas para tus mascotas.</Text>
      </View>

      <Card style={styles.card}>
        {loading ? (
          <View style={{ marginTop: 10, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 10, color: "#fff", fontWeight: "800" }}>Cargando...</Text>
          </View>
        ) : items.length === 0 ? (
          <Text style={styles.empty}>No tenés citas próximas.</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>Cita #{item.id}</Text>
                  <Text style={styles.itemDesc}>Fecha/Hora: {formatDateTime(item.inicio)}</Text>
                </View>

                <Pressable onPress={() => eliminar(item.id)} style={styles.delBtn}>
                  <Text style={styles.delTxt}>Eliminar</Text>
                </Pressable>
              </View>
            )}
          />
        )}

        <View style={{ marginTop: 14, gap: 10 }}>
          <Button title="Refrescar" variant="secondary" onPress={load} />
          <Button title="Volver" variant="ghost" onPress={() => router.back()} />
        </View>
      </Card>

      <Toast visible={toast.visible} text={toast.text} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
    </LinearGradient>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    screen: { flex: 1, padding: 16 },
    header: { marginTop: 10, marginBottom: 14 },
    title: { color: "#fff", fontSize: 26, fontWeight: "900" },
    subtitle: { color: "rgba(255,255,255,0.9)", marginTop: 6 },

    card: { backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.18)" },
    empty: { color: "rgba(255,255,255,0.88)", fontWeight: "800" },

    item: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.08)",
    },
    itemTitle: { color: "#fff", fontWeight: "900" },
    itemDesc: { marginTop: 4, color: "rgba(255,255,255,0.85)", fontWeight: "700", fontSize: 12 },

    delBtn: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: "rgba(225,29,72,0.92)",
    },
    delTxt: { color: "#fff", fontWeight: "900" },
  });
}
