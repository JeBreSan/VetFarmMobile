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
  TextInput,
  View,
} from "react-native";

import {
  apiActualizarMascota,
  apiCrearMascota,
  apiEliminarMascota,
  apiListarMascotas,
  type Mascota,
} from "../../src/services/mascotasService";

import { getSessionUser } from "../../src/storage/session";
import { useAppTheme } from "../../src/theme/ThemeProvider";

import { ConfirmDialog } from "../../src/ui/ConfirmDialog";
import { Toast } from "../../src/ui/Toast";

type Especie = "perro" | "gato" | "ave" | "roedor" | "reptil" | "otro";
const ESPECIES: Especie[] = ["perro", "gato", "ave", "roedor", "reptil", "otro"];

export default function MascotasScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  // ✅ el gradiente NO va en StyleSheet.create (rompe Web)
  const gradient =
    (((theme as any)?.colors?.gradient) ?? ["#6D28D9", "#2563EB", "#10B981"]) as any;

  const styles = useMemo(() => createStyles(theme), [theme]);

  // ✅ placeholder fuera de StyleSheet (para que NO rompa en web)
  const placeholderColor = "rgba(255,255,255,0.78)";

  const [usuarioNombre, setUsuarioNombre] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [selected, setSelected] = useState<Mascota | null>(null);

  // Modal Nueva
  const [showCrear, setShowCrear] = useState(false);
  const [cNombre, setCNombre] = useState("");
  const [cEspecie, setCEspecie] = useState<Especie>("perro");
  const [cRaza, setCRaza] = useState("");
  const [cEdad, setCEdad] = useState("");

  // Modal Ficha (Editar)
  const [showFicha, setShowFicha] = useState(false);
  const [eNombre, setENombre] = useState("");
  const [eRaza, setERaza] = useState("");
  const [eEdad, setEEdad] = useState("");

  // Toast
  const [toast, setToast] = useState<{
    visible: boolean;
    text: string;
    type: "success" | "error" | "info";
  }>({ visible: false, text: "", type: "info" });

  const toastOk = (text: string) => setToast({ visible: true, text, type: "success" });
  const toastErr = (text: string) => setToast({ visible: true, text, type: "error" });

  // ConfirmDialog
  const [confirm, setConfirm] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: null | (() => Promise<void> | void);
  }>({
    visible: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    onConfirm: null,
  });

  async function cargar() {
    try {
      setLoading(true);
      const u = await getSessionUser();
      setUsuarioNombre(u?.nombre ?? "");

      const data = await apiListarMascotas();
      setMascotas(data);

      // si la seleccionada ya no existe, limpiar
      if (selected) {
        const still = data.some((m) => m.id === selected.id);
        if (!still) setSelected(null);
      }
    } catch (e: any) {
      toastErr(e?.message ?? "No se pudo cargar mascotas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function seleccionarMascota(m: Mascota) {
    setSelected(m);
    setENombre(m.nombre);
    setERaza(m.raza ?? "");
    setEEdad(m.edad ?? "");
  }

  function abrirNueva() {
    setShowCrear(true);
    setCNombre("");
    setCEspecie("perro");
    setCRaza("");
    setCEdad("");
  }

  function abrirFicha() {
    if (!selected) return;
    setENombre(selected.nombre);
    setERaza(selected.raza ?? "");
    setEEdad(selected.edad ?? "");
    setShowFicha(true);
  }

  async function crearMascota() {
    if (!cNombre.trim()) return toastErr("Validación: el nombre es requerido.");
    if (!cEspecie) return toastErr("Validación: la especie es requerida.");

    try {
      setLoading(true);
      await apiCrearMascota({
        nombre: cNombre.trim(),
        especie: cEspecie,
        raza: cRaza.trim() ? cRaza.trim() : undefined,
        edad: cEdad.trim() ? cEdad.trim() : undefined,
      });

      setShowCrear(false);
      toastOk("Mascota creada correctamente.");
      await cargar();
    } catch (e: any) {
      toastErr(e?.message ?? "No se pudo crear");
    } finally {
      setLoading(false);
    }
  }

  async function guardarEdicion() {
    if (!selected) return;
    if (!eNombre.trim()) return toastErr("Validación: el nombre no puede estar vacío.");

    try {
      setLoading(true);

      // ✅ NO enviamos especie nunca
      const updated = await apiActualizarMascota(selected.id, {
        nombre: eNombre.trim(),
        raza: eRaza.trim() ? eRaza.trim() : undefined,
        edad: eEdad.trim() ? eEdad.trim() : undefined,
      });

      setSelected(updated);
      toastOk("Cambios guardados.");
      await cargar();
    } catch (e: any) {
      toastErr(e?.message ?? "No se pudo actualizar");
    } finally {
      setLoading(false);
    }
  }

  function eliminarMascota() {
    if (!selected) return;

    setConfirm({
      visible: true,
      title: "Eliminar mascota",
      message: `¿Desea eliminar a "${selected.nombre}"?`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        setConfirm((p) => ({ ...p, visible: false }));
        try {
          setLoading(true);
          await apiEliminarMascota(selected.id);
          setSelected(null);
          setShowFicha(false);
          toastOk("Mascota eliminada.");
          await cargar();
        } catch (e: any) {
          toastErr(e?.message ?? "No se pudo eliminar");
        } finally {
          setLoading(false);
        }
      },
    });
  }

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mascotas de {usuarioNombre || "Usuario"}</Text>
          <Text style={styles.subtitle}>Seleccioná una mascota y tocá “Ver ficha”.</Text>
        </View>

        <View style={styles.headerBtns}>
          <Pressable style={styles.btnGhost} onPress={() => router.push("/dashboard" as any)}>
            <Text style={styles.btnText}>Volver</Text>
          </Pressable>

          <Pressable style={styles.btnPrimary} onPress={abrirNueva}>
            <Text style={styles.btnText}>Nueva</Text>
          </Pressable>
        </View>
      </View>

      {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}

      {/* Lista + botón ver ficha */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mis mascotas</Text>

        <FlatList
          data={mascotas}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => {
            const active = selected?.id === item.id;
            return (
              <Pressable
                onPress={() => seleccionarMascota(item)}
                style={[styles.listItem, active ? styles.listItemActive : null]}
              >
                <Text style={styles.listTitle}>{item.nombre}</Text>
                <Text style={styles.listMeta}>
                  {item.especie} • {item.edad ? `${item.edad} años` : "—"}
                </Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            !loading ? <Text style={styles.empty}>Aún no tenés mascotas registradas.</Text> : null
          }
        />

        <View style={styles.row}>
          <Pressable
            style={[styles.btnGhost, { flex: 1, opacity: selected ? 1 : 0.45 }]}
            onPress={abrirFicha}
            disabled={!selected}
          >
            <Text style={styles.btnText}>Ver ficha</Text>
          </Pressable>
        </View>
      </View>

      {/* MODAL: NUEVA */}
      <Modal visible={showCrear} transparent animationType="fade" onRequestClose={() => setShowCrear(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nueva mascota</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              value={cNombre}
              onChangeText={setCNombre}
              style={styles.input}
              placeholder="Ej: Gordo"
              placeholderTextColor={placeholderColor}
            />

            <Text style={styles.label}>Especie *</Text>
            <View style={styles.chipsRow}>
              {ESPECIES.map((e) => {
                const active = cEspecie === e;
                return (
                  <Pressable
                    key={e}
                    onPress={() => setCEspecie(e)}
                    style={[styles.chip, active ? styles.chipActive : null]}
                  >
                    <Text style={styles.chipText}>{e}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Edad</Text>
                <TextInput
                  value={cEdad}
                  onChangeText={setCEdad}
                  style={styles.input}
                  placeholder="Ej: 2"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Raza</Text>
                <TextInput
                  value={cRaza}
                  onChangeText={setCRaza}
                  style={styles.input}
                  placeholder="Ej: criollo"
                  placeholderTextColor={placeholderColor}
                />
              </View>
            </View>

            <View style={styles.row}>
              <Pressable style={[styles.btnGhost, { flex: 1 }]} onPress={() => setShowCrear(false)} disabled={loading}>
                <Text style={styles.btnText}>Cancelar</Text>
              </Pressable>

              <Pressable style={[styles.btnPrimary, { flex: 1 }]} onPress={crearMascota} disabled={loading}>
                <Text style={styles.btnText}>Crear</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: FICHA */}
      <Modal visible={showFicha} transparent animationType="fade" onRequestClose={() => setShowFicha(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{selected?.nombre ?? "Ficha"}</Text>

            <Text style={styles.meta}>Especie: {selected?.especie}</Text>
            <Text style={styles.meta}>Raza: {selected?.raza ?? "—"}</Text>
            <Text style={styles.meta}>Edad: {selected?.edad ?? "—"}</Text>

            <View style={styles.divider} />

            <Text style={styles.formTitle}>Editar</Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={eNombre}
              onChangeText={setENombre}
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor={placeholderColor}
            />

            <Text style={styles.label}>Raza</Text>
            <TextInput
              value={eRaza}
              onChangeText={setERaza}
              style={styles.input}
              placeholder="Raza"
              placeholderTextColor={placeholderColor}
            />

            <Text style={styles.label}>Edad</Text>
            <TextInput
              value={eEdad}
              onChangeText={setEEdad}
              style={styles.input}
              placeholder="Edad"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
            />

            <View style={styles.row}>
              <Pressable style={[styles.btnGhost, { flex: 1 }]} onPress={() => setShowFicha(false)} disabled={loading}>
                <Text style={styles.btnText}>Cerrar</Text>
              </Pressable>

              <Pressable style={[styles.btnPrimary, { flex: 1 }]} onPress={guardarEdicion} disabled={loading}>
                <Text style={styles.btnText}>Guardar</Text>
              </Pressable>
            </View>

            <View style={{ marginTop: 10 }}>
              <Pressable style={styles.btnDanger} onPress={eliminarMascota} disabled={loading}>
                <Text style={styles.btnText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        text={toast.text}
        type={toast.type}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />

      <ConfirmDialog
        visible={confirm.visible}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        onCancel={() => setConfirm((p) => ({ ...p, visible: false }))}
        onConfirm={async () => {
          if (confirm.onConfirm) await confirm.onConfirm();
        }}
      />
    </LinearGradient>
  );
}

function createStyles(theme: any) {
  const text = theme?.colors?.text ?? "#FFFFFF";
  const muted = "rgba(255,255,255,0.85)";
  const border = "rgba(255,255,255,0.22)";
  const card = "rgba(255,255,255,0.14)";
  const modalBg = "rgba(20, 22, 34, 0.92)";

  return StyleSheet.create({
    screen: { flex: 1, padding: 16 },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    title: { color: text, fontSize: 22, fontWeight: "900" },
    subtitle: { color: muted, marginTop: 4 },

    headerBtns: { flexDirection: "row", gap: 10 },

    sectionTitle: { color: text, fontWeight: "900", marginBottom: 10 },

    card: {
      flex: 1,
      backgroundColor: card,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: border,
    },

    listItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "transparent",
      marginBottom: 10,
      backgroundColor: "rgba(255,255,255,0.10)",
    },
    listItemActive: {
      borderColor: "rgba(255,255,255,0.42)",
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    listTitle: { color: text, fontWeight: "900" },
    listMeta: { color: muted, marginTop: 4, fontSize: 12 },

    empty: { color: muted, paddingVertical: 10 },

    meta: { color: muted, marginTop: 6 },

    divider: { height: 1, backgroundColor: border, marginVertical: 12 },

    formTitle: { color: text, fontWeight: "900" },
    label: { color: muted, marginTop: 10, marginBottom: 6 },

    input: {
      borderWidth: 1,
      borderColor: border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: text,
      backgroundColor: "rgba(255,255,255,0.70)",
    },

    row: { flexDirection: "row", gap: 10, marginTop: 12 },

    btnPrimary: {
      padding: 10,
      borderRadius: 999,
      alignItems: "center",
      backgroundColor: "rgba(16,185,129,0.25)",
      borderWidth: 1,
      borderColor: "rgba(16,185,129,0.55)",
    },
    btnDanger: {
      padding: 10,
      borderRadius: 999,
      alignItems: "center",
      backgroundColor: "rgba(239,68,68,0.25)",
      borderWidth: 1,
      borderColor: "rgba(239,68,68,0.55)",
    },
    btnGhost: {
      padding: 10,
      borderRadius: 999,
      alignItems: "center",
      borderWidth: 1,
      borderColor: border,
      backgroundColor: "rgba(126, 85, 241, 0.7)",
    },
    btnText: { color: text, fontWeight: "900" },

    chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: "rgba(255,255,255,0.12)",
    },
    chipActive: {
      borderColor: "rgba(255,255,255,0.50)",
      backgroundColor: "rgba(255,255,255,0.70)",
    },
    chipText: { color: text, fontWeight: "800", textTransform: "capitalize" },

    modalWrap: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    modal: {
      width: "100%",
      maxWidth: 680,
      backgroundColor: modalBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      padding: 14,
    },
    modalTitle: { color: text, fontWeight: "900", fontSize: 16, marginBottom: 6 },
  });
}
