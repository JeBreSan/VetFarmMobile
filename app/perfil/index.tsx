import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "../../src/ui/Card";
import { Input } from "../../src/ui/Input";
import { Toast } from "../../src/ui/Toast";

import { API_BASE_URL } from "../../src/config/api";
import { getIdentificacion, getSessionUser, setSessionUser } from "../../src/storage/session";

type PerfilDTO = {
  identificacion: string;
  nombre: string;
  telefono: string;
  correo: string;
  rol: "admin" | "usuario";
};

export default function Perfil() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const [identificacion, setIdentificacion] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");

  const [toast, setToast] = useState<{
    visible: boolean;
    text: string;
    type: "success" | "error";
  }>({ visible: false, text: "", type: "success" });

  const hideToast = () => setToast((t) => ({ ...t, visible: false }));

  const showToast = (text: string, type: "success" | "error") => {
    setToast({ visible: true, text, type });
    setTimeout(hideToast, 2500);
  };

  const correoOk = useMemo(() => /\S+@\S+\.\S+/.test((correo || "").trim()), [correo]);

  async function cargarPerfil() {
    setLoading(true);
    try {
      const id = await getIdentificacion();

      if (!id) {
        showToast("Sesión no válida. Inicie sesión nuevamente.", "error");
        router.replace("/"); // si tu login está en otra ruta lo ajustamos luego
        return;
      }

      setIdentificacion(id);

      const resp = await fetch(`${API_BASE_URL}/perfil/${encodeURIComponent(id)}`);
      const data = await resp.json();

      if (!resp.ok) {
        showToast(data?.mensaje || "No se pudo cargar el perfil.", "error");
        return;
      }

      const perfil: PerfilDTO = data.perfil;

      setNombre(perfil.nombre ?? "");
      setTelefono(perfil.telefono ?? "");
      setCorreo(perfil.correo ?? "");
    } catch (e) {
      console.log("cargarPerfil error:", e);
      showToast("Error de conexión. Intente de nuevo.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Confirmación: WEB usa window.confirm / móvil usa Alert.alert
  function confirmarGuardar() {
    const msg = "¿Desea guardar los cambios realizados?";

    if (Platform.OS === "web") {
      const ok = window.confirm(msg);
      if (ok) guardarCambios();
      return;
    }

    Alert.alert(
      "Confirmación",
      msg,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, guardar", onPress: () => guardarCambios() },
      ],
      { cancelable: true }
    );
  }

  async function guardarCambios() {
    const n = nombre.trim();
    const t = telefono.trim();
    const c = correo.trim();

    if (!identificacion) return;

    if (!n || !t || !c) {
      showToast("Datos incompletos. Por favor complete todos los campos.", "error");
      return;
    }
    if (!correoOk) {
      showToast("Correo inválido. Revise sus datos.", "error");
      return;
    }

    setSaving(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/perfil/${encodeURIComponent(identificacion)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: n, telefono: t, correo: c }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        showToast(data?.mensaje || "No se pudo actualizar el perfil.", "error");
        return;
      }

      // ✅ refrescar sesión para que dashboard muestre nombre actualizado
      const u = await getSessionUser();
      if (u) {
        await setSessionUser({
          ...u,
          nombre: n,
          identificacion: u.identificacion ?? identificacion,
        });
      }

      showToast(data?.mensaje || "Perfil actualizado correctamente.", "success");
    } catch (e) {
      console.log("guardarCambios error:", e);
      showToast("Error de conexión. Intente de nuevo.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function cambiarContrasena() {
    const pa = passwordActual.trim();
    const pn = passwordNueva.trim();

    if (!identificacion) return;

    if (!pa || !pn) {
      showToast("Datos incompletos.", "error");
      return;
    }

    if (pn.length < 6) {
      showToast("La contraseña nueva debe tener al menos 6 caracteres.", "error");
      return;
    }

    setSavingPass(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/perfil/${encodeURIComponent(identificacion)}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordActual: pa, passwordNueva: pn }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        showToast(data?.mensaje || "No se pudo actualizar la contraseña.", "error");
        return;
      }

      setPasswordActual("");
      setPasswordNueva("");
      showToast(data?.mensaje || "Contraseña actualizada correctamente.", "success");
    } catch (e) {
      console.log("cambiarContrasena error:", e);
      showToast("Error de conexión. Intente de nuevo.", "error");
    } finally {
      setSavingPass(false);
    }
  }

  return (
    <LinearGradient
      colors={["#6d28d9", "#2563eb", "#34d399"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header: título + volver */}
          <View style={styles.header}>
            <Text style={styles.title}>Perfil</Text>

            <Pressable
              onPress={() => router.replace("/dashboard")}
              style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.backBtnText}>Volver</Text>
            </Pressable>
          </View>

          {/* Centrado + ancho máximo */}
          <View style={styles.centerWrap}>
            <View style={styles.panel}>
              <Card>
                <Text style={styles.sectionTitle}>Datos del usuario</Text>

                <Input label="Identificación" value={identificacion} editable={false} onChangeText={() => {}} />
                <Input label="Nombre" value={nombre} onChangeText={setNombre} />
                <Input label="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
                <Input
                  label="Correo"
                  value={correo}
                  onChangeText={setCorreo}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <View style={styles.btnRow}>
                  <Pressable
                    onPress={confirmarGuardar}
                    disabled={loading || saving}
                    style={({ pressed }) => [
                      styles.btnPrimary,
                      (loading || saving) && styles.btnDisabled,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.btnText}>
                      {loading ? "Cargando..." : saving ? "Guardando..." : "Guardar cambios"}
                    </Text>
                  </Pressable>
                </View>
              </Card>

              <View style={{ height: 14 }} />

              <Card>
                <Text style={styles.sectionTitle}>Cambiar contraseña</Text>

                <Input
                  label="Contraseña actual"
                  value={passwordActual}
                  onChangeText={setPasswordActual}
                  secureTextEntry
                />

                <Input
                  label="Contraseña nueva"
                  value={passwordNueva}
                  onChangeText={setPasswordNueva}
                  secureTextEntry
                />

                <Pressable
                  onPress={cambiarContrasena}
                  disabled={loading || savingPass}
                  style={({ pressed }) => [
                    styles.btnPrimary,
                    (loading || savingPass) && styles.btnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text style={styles.btnText}>
                    {savingPass ? "Actualizando..." : "Actualizar contraseña"}
                  </Text>
                </Pressable>
              </Card>
            </View>
          </View>
        </ScrollView>

        <Toast visible={toast.visible} text={toast.text} type={toast.type} onHide={hideToast} />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, backgroundColor: "transparent" },

  content: { padding: 16, gap: 12 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  title: { fontSize: 22, fontWeight: "700", color: "#fff" },

  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },

  centerWrap: { alignItems: "center" },
  panel: { width: "100%", maxWidth: 560 },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#fff" },
  btnRow: { marginTop: 10 },

  btnPrimary: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.95)",
  },

  btnDisabled: { opacity: 0.6 },
  btnPressed: { opacity: 0.85 },

  btnText: { color: "#fff", fontWeight: "700" },
});
