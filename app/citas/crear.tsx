import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    apiCrearCita,
    apiListarCitasOcupadas,
    apiListarReglasAgenda,
    type AgendaRegla,
} from "../../src/services/citasService";
import { apiListarMascotas, type Mascota } from "../../src/services/mascotasService";

import { useAppTheme } from "../../src/theme/ThemeProvider";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { ConfirmDialog } from "../../src/ui/ConfirmDialog";
import { Toast } from "../../src/ui/Toast";

const SLOT_MIN = 30;
const LEAD_MIN = 30;
const DIAS_A_MOSTRAR = 14;

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
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

function toISO(d: Date) {
  return d.toISOString();
}

function formatDateCR(d: Date) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
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
  const cerrado = rules.some((r) => r.tipo === "CERRADO" && intersects(slot, r));
  if (cerrado) return false;

  const hasEspecial = hasHorarioEspecialForDay(rules, day);
  if (hasEspecial) return rules.some((r) => r.tipo === "HORARIO_ESPECIAL" && intersects(slot, r));

  return rules.some((r) => r.tipo === "SIEMPRE_ABIERTO");
}

export default function CrearCita() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [mascotaId, setMascotaId] = useState<number | null>(null);

  const [diaSel, setDiaSel] = useState<Date>(() => startOfDay(new Date()));
  const [ocupadas, setOcupadas] = useState<Set<string>>(new Set());
  const [reglas, setReglas] = useState<AgendaRegla[]>([]);

  const [slotSel, setSlotSel] = useState<Date | null>(null);
  const [comentario, setComentario] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [toast, setToast] = useState<{ visible: boolean; text: string; type: "success" | "error" | "info" }>({
    visible: false,
    text: "",
    type: "info",
  });

  const dias = useMemo(() => {
    const out: Date[] = [];
    const now = startOfDay(new Date());
    for (let i = 0; i < DIAS_A_MOSTRAR; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  const mascotaSel = useMemo(() => mascotas.find((m) => m.id === mascotaId) ?? null, [mascotas, mascotaId]);

  const canConfirm = !!mascotaId && !!slotSel;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await apiListarMascotas();
        setMascotas(list);
        if (list.length > 0) setMascotaId(list[0].id);
      } catch (e: any) {
        setToast({ visible: true, text: e?.message || "Error cargando mascotas", type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setSlotSel(null);
        const ini = startOfDay(diaSel);
        const fin = endOfDay(diaSel);
        const iniISO = toISO(ini);
        const finISO = toISO(fin);

        const [r, o] = await Promise.all([apiListarReglasAgenda(iniISO, finISO), apiListarCitasOcupadas(iniISO, finISO)]);

        setReglas(r);

        const set = new Set<string>();
        for (const it of o) set.add(it.inicio);
        setOcupadas(set);
      } catch (e: any) {
        setToast({ visible: true, text: e?.message || "Error cargando disponibilidad", type: "error" });
      }
    })();
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

  const crear = async () => {
    if (!mascotaId || !slotSel) return;

    try {
      setConfirmOpen(false);

      const created = await apiCrearCita({
        mascota_id: mascotaId,
        inicioISO: slotSel.toISOString(),
        comentario: comentario.trim(),
      });

      const fechaTxt = formatDateCR(new Date(created.inicio));
      const horaTxt = formatTime(new Date(created.inicio));
      const nomMasc = mascotaSel?.nombre ?? "tu mascota";

      setToast({
        visible: true,
        type: "success",
        text: `✅ Cita creada con éxito.\nSu cita para "${nomMasc}" quedó agendada para el ${fechaTxt} a las ${horaTxt}. Recuerde llegar 15 minutos antes.`,
      });

      setOcupadas((prev) => {
        const n = new Set(prev);
        n.add(created.inicio);
        return n;
      });

      setSlotSel(null);
      setComentario("");
    } catch (e: any) {
      if (e?.message === "SLOT_OCUPADO") {
        setToast({ visible: true, type: "error", text: "Ese horario ya fue tomado. Elegí otro por favor." });
        setDiaSel((d) => new Date(d));
        return;
      }
      setToast({ visible: true, type: "error", text: e?.message || "Error creando cita" });
    }
  };

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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Agendar cita</Text>
            <Text style={styles.subtitle}>Seleccioná mascota, día y hora disponible.</Text>
          </View>

          <Card style={styles.card}>
            <Text style={styles.section}>Mascota</Text>
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

            <Text style={[styles.section, { marginTop: 14 }]}>Día</Text>
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

            <Text style={[styles.section, { marginTop: 14 }]}>Hora disponible</Text>

            {slots.length === 0 ? (
              <Text style={styles.empty}>No hay horarios disponibles para este día.</Text>
            ) : (
              <View style={styles.hoursBox}>
                <FlatList
                  data={slots}
                  keyExtractor={(it) => it.toISOString()}
                  numColumns={4}
                  scrollEnabled
                  showsVerticalScrollIndicator
                  columnWrapperStyle={{ gap: 8 }}
                  contentContainerStyle={{ gap: 8, marginTop: 8, paddingBottom: 8 }}
                  renderItem={({ item }) => {
                    const active = slotSel?.toISOString() === item.toISOString();
                    return (
                      <Pressable onPress={() => setSlotSel(item)} style={[styles.timeBox, active && styles.timeBoxActive]}>
                        <Text style={[styles.timeText, active && styles.timeTextActive]}>{formatTime(item)}</Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
            )}

            <Text style={[styles.section, { marginTop: 14 }]}>Comentarios</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={comentario}
                onChangeText={setComentario}
                placeholder="Ej: vómitos, dolor, revisión general..."
                placeholderTextColor={theme.isDark ? "rgba(230,234,242,0.35)" : "rgba(16,24,40,0.35)"}
                style={[styles.input, { color: theme.colors.text }]}
                multiline
              />
            </View>

            <View style={{ marginTop: 14, gap: 10 }}>
              <Button title="Confirmar cita" disabled={!canConfirm} onPress={() => setConfirmOpen(true)} />
              <Button title="Volver" variant="ghost" onPress={() => router.back()} />
            </View>
          </Card>

          <View style={{ height: 18 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={confirmOpen}
        title="Confirmar cita"
        message="Revisá los datos antes de agendar:"
        details={[
          { label: "Mascota", value: mascotaSel?.nombre ?? "-" },
          { label: "Fecha", value: slotSel ? formatDateCR(slotSel) : "-" },
          { label: "Hora", value: slotSel ? formatTime(slotSel) : "-" },
        ]}
        confirmText="Agendar"
        cancelText="Editar"
        onConfirm={crear}
        onCancel={() => setConfirmOpen(false)}
      />

      <Toast visible={toast.visible} text={toast.text} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
    </LinearGradient>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    screen: { flex: 1, padding: 16 },
    scrollContent: { paddingBottom: 24 },

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
    pillActive: {
      backgroundColor: "rgba(255,255,255,0.22)",
      borderColor: "rgba(255,255,255,0.35)",
    },
    pillText: { color: "rgba(255,255,255,0.88)", fontWeight: "800", fontSize: 12 },
    pillTextActive: { color: "#fff" },

    hoursBox: {
      marginTop: 8,
      maxHeight: 320, // ✅ clave: evita que tape botones
    },

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
    timeBoxActive: {
      backgroundColor: "rgba(255,255,255,0.22)",
      borderColor: "rgba(255,255,255,0.35)",
    },
    timeText: { color: "rgba(255,255,255,0.90)", fontWeight: "900" },
    timeTextActive: { color: "#fff" },

    inputWrap: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    input: { minHeight: 70, fontWeight: "700" },
  });
}
