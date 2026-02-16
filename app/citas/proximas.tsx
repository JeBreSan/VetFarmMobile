import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAppTheme } from "../../src/theme/ThemeProvider";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { ConfirmDialog } from "../../src/ui/ConfirmDialog";
import { Toast } from "../../src/ui/Toast";

import {
    apiEliminarCita,
    apiListarCitasOcupadas,
    apiListarProximasCitas,
    apiListarReglasAgenda,
    apiReprogramarCita,
    type AgendaRegla,
    type Cita,
} from "../../src/services/citasService";

const SLOT_MIN = 30;
const LEAD_MIN = 30;

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function formatDateCR(d: Date) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function formatTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(24, 0, 0, 0);
  return x;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function buildSlotsForDay(day: Date) {
  const base = startOfDay(day);
  const slots: Date[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += SLOT_MIN) {
      const s = new Date(base);
      s.setHours(h, m, 0, 0);
      slots.push(s);
    }
  }
  return slots;
}
function intersects(slot: Date, rule: AgendaRegla) {
  if (!rule.inicio || !rule.fin) return false;
  const a = new Date(rule.inicio).getTime();
  const b = new Date(rule.fin).getTime();
  const x = slot.getTime();
  return x >= a && x < b;
}
function hasHorarioEspecialForDay(rules: AgendaRegla[], day: Date) {
  return rules.some((r) => r.tipo === "HORARIO_ESPECIAL" && r.inicio && r.fin && sameDay(new Date(r.inicio), day));
}
function isAllowedByRules(slot: Date, rules: AgendaRegla[], day: Date) {
  // CERRADO gana siempre
  const cerrado = rules.some((r) => r.tipo === "CERRADO" && intersects(slot, r));
  if (cerrado) return false;

  // Si hay HORARIO_ESPECIAL ese día => SOLO esos rangos valen
  const hasEspecial = hasHorarioEspecialForDay(rules, day);
  if (hasEspecial) return rules.some((r) => r.tipo === "HORARIO_ESPECIAL" && intersects(slot, r));

  // Si no hay especial, vale SIEMPRE_ABIERTO
  return rules.some((r) => r.tipo === "SIEMPRE_ABIERTO");
}

export default function ProximasCitas() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Cita[]>([]);

  const [selected, setSelected] = useState<Cita | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Reprogramación
  const [reprogOpen, setReprogOpen] = useState(false);
  const [diaSel, setDiaSel] = useState<Date>(() => startOfDay(new Date()));
  const [slotSel, setSlotSel] = useState<Date | null>(null);
  const [reglas, setReglas] = useState<AgendaRegla[]>([]);
  const [ocupadas, setOcupadas] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Delete confirm
  const [confirmDel, setConfirmDel] = useState(false);

  const [toast, setToast] = useState<{ visible: boolean; text: string; type: "success" | "error" | "info" }>({
    visible: false,
    text: "",
    type: "info",
  });

  const dias = useMemo(() => {
    const out: Date[] = [];
    const now = startOfDay(new Date());
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

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

  const openFicha = (c: Cita) => {
    setSelected(c);
    setModalOpen(true);
  };

  const closeFicha = () => {
    setModalOpen(false);
    setSelected(null);
    setConfirmDel(false);
    setReprogOpen(false);
    setSlotSel(null);
  };

  const eliminar = async () => {
    if (!selected) return;
    try {
      await apiEliminarCita(selected.id);
      setItems((prev) => prev.filter((x) => x.id !== selected.id));
      setToast({ visible: true, type: "success", text: "Cita eliminada." });
      closeFicha();
    } catch (e: any) {
      setToast({ visible: true, type: "error", text: e?.message || "No se pudo eliminar" });
    }
  };

  const loadSlots = async (day: Date) => {
    try {
      setLoadingSlots(true);
      setSlotSel(null);

      const ini = startOfDay(day).toISOString();
      const fin = endOfDay(day).toISOString();

      const [r, o] = await Promise.all([
        apiListarReglasAgenda(ini, fin),
        apiListarCitasOcupadas(ini, fin),
      ]);

      setReglas(r);
      const set = new Set<string>();
      for (const it of o) set.add(it.inicio);
      setOcupadas(set);
    } catch (e: any) {
      setToast({ visible: true, type: "error", text: e?.message || "Error cargando horarios" });
    } finally {
      setLoadingSlots(false);
    }
  };

  const abrirReprogramar = async () => {
    if (!selected) return;
    const base = startOfDay(new Date(selected.inicio));
    setDiaSel(base);
    setReprogOpen(true);
    await loadSlots(base);
  };

  useEffect(() => {
    if (!reprogOpen) return;
    loadSlots(diaSel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaSel]);

  const slots = useMemo(() => {
    const all = buildSlotsForDay(diaSel);

    const now = new Date();
    const lead = new Date(now.getTime() + LEAD_MIN * 60 * 1000);

    return all
      .filter((s) => s.getTime() >= lead.getTime())
      .filter((s) => isAllowedByRules(s, reglas, diaSel))
      .filter((s) => !ocupadas.has(s.toISOString()));
  }, [diaSel, reglas, ocupadas]);

  const confirmarReprog = async () => {
    if (!selected || !slotSel) return;
    try {
      const updated = await apiReprogramarCita(selected.id, slotSel.toISOString());

      setItems((prev) => prev.map((x) => (x.id === selected.id ? updated : x)));
      setSelected(updated);

      setToast({ visible: true, type: "success", text: "Cita reprogramada con éxito." });
      setReprogOpen(false);
      setSlotSel(null);
    } catch (e: any) {
      if (e?.message === "SLOT_OCUPADO") {
        setToast({ visible: true, type: "error", text: "Ese horario ya fue tomado. Elegí otro." });
        await loadSlots(diaSel);
        return;
      }
      setToast({ visible: true, type: "error", text: e?.message || "No se pudo reprogramar" });
    }
  };

  return (
    <LinearGradient colors={theme.gradients.brand as any} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Próximas citas</Text>
        <Text style={styles.subtitle}>Seleccioná una para ver su ficha.</Text>
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
            renderItem={({ item }) => {
              const d = new Date(item.inicio);
              return (
                <Pressable onPress={() => openFicha(item)} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>Cita #{item.id}</Text>
                    <Text style={styles.itemDesc}>
                      {formatDateCR(d)} — {formatTime(d)}
                    </Text>
                  </View>
                  <Text style={styles.itemCta}>Abrir →</Text>
                </Pressable>
              );
            }}
          />
        )}

        <View style={{ marginTop: 14, gap: 10 }}>
          <Button title="Refrescar" variant="secondary" onPress={load} />
          <Button title="Volver" variant="ghost" onPress={() => router.back()} />
        </View>
      </Card>

      {/* Ficha */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={closeFicha} />
        <View style={styles.center}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ficha de cita</Text>

            {selected ? (
              <>
                <View style={{ marginTop: 10, gap: 8 }}>
                  <View style={styles.row}>
                    <Text style={styles.label}>ID</Text>
                    <Text style={styles.value}>#{selected.id}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Fecha</Text>
                    <Text style={styles.value}>{formatDateCR(new Date(selected.inicio))}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Hora</Text>
                    <Text style={styles.value}>{formatTime(new Date(selected.inicio))}</Text>
                  </View>
                </View>

                <View style={{ marginTop: 16, gap: 10 }}>
                  <Button title="Reprogramar" variant="secondary" onPress={abrirReprogramar} />
                  <Button title="Eliminar" onPress={() => setConfirmDel(true)} />
                  <Button title="Cerrar" variant="ghost" onPress={closeFicha} />
                </View>
              </>
            ) : (
              <Text style={{ marginTop: 10, color: theme.colors.subText, fontWeight: "700" }}>
                Sin datos
              </Text>
            )}
          </Card>
        </View>
      </Modal>

      {/* Modal Reprogramar */}
      <Modal visible={reprogOpen} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setReprogOpen(false)} />
        <View style={styles.center}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reprogramar cita</Text>

            <Text style={[styles.small, { marginTop: 10 }]}>Elegí el día:</Text>
            <View style={styles.pills}>
              {dias.map((d) => {
                const active = sameDay(d, diaSel);
                return (
                  <Pressable
                    key={d.toISOString()}
                    onPress={() => setDiaSel(startOfDay(d))}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{formatDateCR(d)}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.small, { marginTop: 12 }]}>Hora disponible:</Text>

            {loadingSlots ? (
              <View style={{ marginTop: 12, alignItems: "center" }}>
                <ActivityIndicator />
                <Text style={{ marginTop: 10, color: "#fff", fontWeight: "800" }}>Cargando...</Text>
              </View>
            ) : slots.length === 0 ? (
              <Text style={[styles.small, { marginTop: 10 }]}>No hay horarios disponibles.</Text>
            ) : (
              <View style={{ marginTop: 10, gap: 8, maxHeight: 320 }}>
  <FlatList
    data={slots}
    keyExtractor={(it) => it.toISOString()}
    numColumns={4}
    scrollEnabled
    showsVerticalScrollIndicator
    columnWrapperStyle={{ gap: 8 }}
    contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
    renderItem={({ item }) => {
      const active = slotSel?.toISOString() === item.toISOString();
      return (
        <Pressable
          onPress={() => setSlotSel(item)}
          style={[styles.timeBox, active && styles.timeBoxActive]}
        >
          <Text style={[styles.timeText, active && styles.timeTextActive]}>{formatTime(item)}</Text>
        </Pressable>
      );
    }}
  />
</View>

            )}

            <View style={{ marginTop: 14, gap: 10 }}>
              <Button title="Confirmar reprogramación" disabled={!slotSel} onPress={confirmarReprog} />
              <Button title="Cancelar" variant="ghost" onPress={() => setReprogOpen(false)} />
            </View>
          </Card>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmDel}
        title="Eliminar cita"
        message="¿Seguro que deseas eliminar esta cita?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={eliminar}
        onCancel={() => setConfirmDel(false)}
      />

      <Toast
        visible={toast.visible}
        text={toast.text}
        type={toast.type}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
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
    itemCta: { color: "#fff", fontWeight: "900" },

    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    center: { flex: 1, padding: 18, alignItems: "center", justifyContent: "center" },
    modalCard: { width: "100%", maxWidth: 560, backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.18)" },
    modalTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },

    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    label: { width: 90, color: "rgba(255,255,255,0.8)", fontWeight: "800" },
    value: { flex: 1, color: "#fff", fontWeight: "900" },
    small: { color: "rgba(255,255,255,0.85)", fontWeight: "800", fontSize: 12 },

    pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    pill: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      backgroundColor: "rgba(255,255,255,0.10)",
    },
    pillActive: { backgroundColor: "rgba(255,255,255,0.22)", borderColor: "rgba(255,255,255,0.35)" },
    pillText: { color: "rgba(255,255,255,0.88)", fontWeight: "800", fontSize: 12 },
    pillTextActive: { color: "#fff" },

    timeBox: {
      flex: 1,
      minWidth: 72,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.20)",
      backgroundColor: "rgba(255,255,255,0.10)",
    },
    timeBoxActive: { backgroundColor: "rgba(255,255,255,0.22)", borderColor: "rgba(255,255,255,0.35)" },
    timeText: { color: "rgba(255,255,255,0.90)", fontWeight: "900" },
    timeTextActive: { color: "#fff" },
  });
}
