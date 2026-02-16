import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../src/theme/ThemeProvider";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { Toast } from "../../src/ui/Toast";

import {
  apiListarHistorialPorMascota,
  apiListarMascotasHistorial,
  type HistorialItem,
  type MascotaMini,
} from "../../src/services/historialService";

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function formatDateCR(d: Date) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function formatTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function badge(tipo: string) {
  const t = (tipo || "").toLowerCase();
  if (t === "consulta") return "🩺 Consulta";
  if (t === "diagnostico") return "📋 Diagnóstico";
  if (t === "vacuna") return "💉 Vacuna";
  if (t === "resultado") return "🧪 Resultado";
  if (t === "procedimiento") return "🛠️ Procedimiento";
  return "📝 Nota";
}

export default function HistorialClinico() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [loadingHist, setLoadingHist] = useState(false);

  const [mascotas, setMascotas] = useState<MascotaMini[]>([]);
  const [mascotaId, setMascotaId] = useState<number | null>(null);

  const [items, setItems] = useState<HistorialItem[]>([]);

  const [toast, setToast] = useState<{ visible: boolean; text: string; type: "success" | "error" | "info" }>({
    visible: false,
    text: "",
    type: "info",
  });

  const mascotaSel = useMemo(() => mascotas.find((m) => m.id === mascotaId) ?? null, [mascotas, mascotaId]);

  const loadMascotas = async () => {
    try {
      setLoading(true);
      const list = await apiListarMascotasHistorial();
      setMascotas(list);
      if (list.length > 0) setMascotaId(list[0].id);
    } catch (e: any) {
      setToast({ visible: true, type: "error", text: e?.message || "Error cargando mascotas" });
    } finally {
      setLoading(false);
    }
  };

  const loadHistorial = async (id: number) => {
    try {
      setLoadingHist(true);
      const list = await apiListarHistorialPorMascota(id);
      setItems(list);
    } catch (e: any) {
      setToast({ visible: true, type: "error", text: e?.message || "Error cargando historial" });
    } finally {
      setLoadingHist(false);
    }
  };

  useEffect(() => {
    loadMascotas();
  }, []);

  useEffect(() => {
    if (!mascotaId) return;
    loadHistorial(mascotaId);
  }, [mascotaId]);

  if (loading) {
    return (
      <LinearGradient colors={theme.gradients.brand as any} style={styles.screen}>
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: "#fff", fontWeight: "800" }}>Cargando...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.gradients.brand as any} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial Clínico</Text>
        <Text style={styles.subtitle}>Seleccioná una mascota y revisá sus entradas.</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.section}>Mascota</Text>

        {mascotas.length === 0 ? (
          <Text style={styles.empty}>No tenés mascotas registradas.</Text>
        ) : (
          <View style={styles.pills}>
            {mascotas.map((m) => {
              const active = m.id === mascotaId;
              return (
                <Pressable key={m.id} onPress={() => setMascotaId(m.id)} style={[styles.pill, active && styles.pillActive]}>
                  <Text style={[styles.pillText, active && styles.pillTextActive]} numberOfLines={1}>
                    {m.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ marginTop: 14 }}>
          <Text style={styles.section}>Entradas</Text>

          {loadingHist ? (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 10, color: "#fff", fontWeight: "800" }}>Cargando historial...</Text>
            </View>
          ) : items.length === 0 ? (
            <Text style={styles.empty}>
              {mascotaSel ? `No hay historial para "${mascotaSel.nombre}".` : "Seleccioná una mascota."}
            </Text>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it) => String(it.id)}
              contentContainerStyle={{ gap: 10, paddingTop: 10 }}
              renderItem={({ item }) => {
                const d = new Date(item.fecha);
                return (
                  <View style={styles.item}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemBadge}>{badge(item.tipo)}</Text>
                      <Text style={styles.itemTitle}>{item.titulo}</Text>
                      <Text style={styles.itemMeta}>
                        {formatDateCR(d)} — {formatTime(d)}
                      </Text>
                      {!!item.detalle && <Text style={styles.itemDesc}>{item.detalle}</Text>}
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          <Button
            title="Refrescar"
            variant="secondary"
            onPress={() => {
              if (!mascotaId) return;
              loadHistorial(mascotaId);
            }}
          />
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

    card: {
      backgroundColor: "rgba(255,255,255,0.12)",
      borderColor: "rgba(255,255,255,0.18)",
    },

    section: { color: "#fff", fontWeight: "900", marginTop: 6 },
    empty: { marginTop: 10, color: "rgba(255,255,255,0.85)", fontWeight: "700" },

    pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    pill: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      backgroundColor: "rgba(255,255,255,0.10)",
      maxWidth: 140,
    },
    pillActive: { backgroundColor: "rgba(255,255,255,0.22)", borderColor: "rgba(255,255,255,0.35)" },
    pillText: { color: "rgba(255,255,255,0.88)", fontWeight: "800", fontSize: 12 },
    pillTextActive: { color: "#fff" },

    item: {
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.08)",
    },
    itemBadge: { color: "rgba(255,255,255,0.9)", fontWeight: "900", fontSize: 12 },
    itemTitle: { marginTop: 4, color: "#fff", fontWeight: "900", fontSize: 14 },
    itemMeta: { marginTop: 6, color: "rgba(255,255,255,0.85)", fontWeight: "700", fontSize: 12 },
    itemDesc: { marginTop: 8, color: "rgba(255,255,255,0.88)", fontWeight: "700", fontSize: 12, lineHeight: 18 },
  });
}
