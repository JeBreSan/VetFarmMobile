import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { apiRegistro } from "../../src/services/authService";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { ConfirmDialog } from "../../src/ui/ConfirmDialog";
import { Input } from "../../src/ui/Input";
import { Toast } from "../../src/ui/Toast";

export default function Registro() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [identificacion, setIdentificacion] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Modal confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ✅ Para evitar doble submit
  const [loading, setLoading] = useState(false);

  // ✅ Toast elegante
  const [toast, setToast] = useState<{
    visible: boolean;
    text: string;
    type: "success" | "error" | "info";
  }>({
    visible: false,
    text: "",
    type: "info",
  });

  const errors = useMemo(() => {
    return {
      identificacion: identificacion.length === 0 ? "Requerido" : "",
      nombre: nombre.length === 0 ? "Requerido" : "",
      telefono: telefono.length === 0 ? "Requerido" : "",
      correo: correo.length === 0 ? "Requerido" : !correo.includes("@") ? "Correo inválido" : "",
      password: password.length === 0 ? "Requerido" : password.length < 4 ? "Mínimo 4 caracteres" : "",
    };
  }, [identificacion, nombre, telefono, correo, password]);

  const canSubmit =
    identificacion &&
    nombre &&
    telefono &&
    correo &&
    password &&
    !errors.identificacion &&
    !errors.nombre &&
    !errors.telefono &&
    !errors.correo &&
    !errors.password;

  // ✅ Registro REAL (API)
  const confirmarRegistro = async () => {
    if (loading) return;

    setConfirmOpen(false);
    setLoading(true);

    setToast({ visible: true, text: "Registrando...", type: "info" });

    const result = await apiRegistro({
      identificacion: identificacion.trim(),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
      password,
    });

    setLoading(false);

    if (!result.ok) {
      setToast({
        visible: true,
        text: result.message || "No se pudo completar el registro. Revise sus datos.",
        type: "error",
      });
      return;
    }

    setToast({
      visible: true,
      text: result.data?.mensaje || "Registro exitoso. Ya puede iniciar sesión.",
      type: "success",
    });

    setTimeout(() => {
      router.replace("/login");
    }, 700);
  };

  return (
    <LinearGradient
      colors={theme.gradients.brand as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]} />

      <View style={[styles.blob, { backgroundColor: "rgba(255,255,255,0.14)", top: -90, left: -70 }]} />
      <View style={[styles.blob, { backgroundColor: "rgba(0,0,0,0.16)", bottom: -120, right: -70 }]} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.brand, { color: "#FFF" }]}>VetFarm</Text>
          <Text style={[styles.subtitle, { color: "rgba(255,255,255,0.85)" }]}>Creá tu cuenta</Text>

          <Card style={[{ marginTop: 18 }, styles.card]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Registro</Text>
            <Text style={[styles.caption, { color: theme.colors.subText }]}>Completá tus datos.</Text>

            <View style={{ marginTop: 14 }}>
              <Input
                label="Identificación"
                value={identificacion}
                onChangeText={setIdentificacion}
                placeholder="ej: 1-2345-6789"
                error={identificacion ? errors.identificacion : ""}
                autoCapitalize="none"
              />

              <Input
                label="Nombre"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre completo"
                error={nombre ? errors.nombre : ""}
              />

              <Input
                label="Teléfono"
                value={telefono}
                onChangeText={setTelefono}
                placeholder="ej: 8888-8888"
                keyboardType="phone-pad"
                error={telefono ? errors.telefono : ""}
              />

              <Input
                label="Correo"
                value={correo}
                onChangeText={setCorreo}
                placeholder="ej: jere@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={correo ? errors.correo : ""}
              />

              <Input
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                error={password ? errors.password : ""}
              />

              <Button
                title={loading ? "Guardando..." : "Registrarme"}
                onPress={() => {
                  if (!canSubmit) {
                    setToast({
                      visible: true,
                      text: "Completá todos los campos correctamente.",
                      type: "error",
                    });
                    return;
                  }
                  setConfirmOpen(true);
                }}
                disabled={!canSubmit || loading}
                style={{ marginTop: 6 }}
              />

              <Button
                title="Volver al login"
                variant="ghost"
                onPress={() => router.back()}
                style={{ marginTop: 10 }}
              />
            </View>
          </Card>

          <Text style={[styles.footer, { color: "rgba(255,255,255,0.78)" }]}>
            Ahora el registro confirma tus datos antes de guardarlos ✅
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ✅ Confirmación antes de guardar */}
      <ConfirmDialog
        visible={confirmOpen}
        title="¿Tus datos son correctos?"
        message="Revisá antes de registrar. Si algo está mal, tocá “Editar”."
        details={[
          { label: "Identificación", value: identificacion },
          { label: "Nombre", value: nombre },
          { label: "Teléfono", value: telefono },
          { label: "Correo", value: correo },
        ]}
        confirmText={loading ? "Guardando..." : "Sí, registrar"}
        cancelText="Editar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmarRegistro}
      />

      {/* ✅ Toast elegante */}
      <Toast
        visible={toast.visible}
        text={toast.text}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  container: {
    paddingHorizontal: 18,
    paddingTop: 72,
    paddingBottom: 20,
  },
  brand: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
  },
  caption: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    marginTop: 18,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  blob: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 280,
  },
  card: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
});
