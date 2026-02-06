import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";

import { apiLogin } from "../../src/services/authService";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { Input } from "../../src/ui/Input";
import { Toast } from "../../src/ui/Toast";

import { setSessionUser } from "../../src/storage/session";

export default function Login() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      usuario: usuario.length === 0 ? "Requerido" : "",
      password:
        password.length === 0 ? "Requerido" : password.length < 4 ? "Mínimo 4 caracteres" : "",
    };
  }, [usuario, password]);

  const canLogin = usuario && password && !errors.usuario && !errors.password;

  const onLogin = async () => {
    if (!canLogin) {
      setToast({ visible: true, text: "Completá identificación y contraseña.", type: "error" });
      return;
    }

    if (loading) return;
    setLoading(true);

    const result = await apiLogin(usuario.trim(), password);

    setLoading(false);

    if (!result.ok) {
      setToast({ visible: true, text: result.message || "Credenciales incorrectas.", type: "error" });
      return;
    }

    // ✅ Armamos datos mínimos (sin depender de cómo venga el API)
    const data: any = result.data ?? {};
    const u = data.user ?? data.usuario ?? data.data?.user ?? data.data?.usuario ?? data;

    const identificacion = String(u?.identificacion ?? usuario.trim());
    const nombre = String(u?.nombre ?? data?.nombre ?? "Usuario");
    const rol = (u?.rol === "admin" || data?.rol === "admin") ? "admin" : "usuario";
    const id = Number(u?.id ?? data?.id ?? 0);

    // ✅ Intento de guardar sesión (si falla, igual seguimos)
    const saved = await setSessionUser({
      id,
      identificacion,
      nombre,
      rol,
    });

    setToast({
      visible: true,
      text: result.data?.mensaje || "Inicio de sesión exitoso.",
      type: "success",
    });

    setTimeout(() => {
      // ✅ Si AsyncStorage falla (web a veces), pasamos params al dashboard
      if (!saved) {
        router.replace({ pathname: "/dashboard", params: { nombre, identificacion } } as any);
        return;
      }

      // ✅ normal
      router.replace("/dashboard");
    }, 250);
  };

  return (
    <LinearGradient
      colors={theme.gradients.brand as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]} />

      <View style={[styles.blob, { backgroundColor: "rgba(255,255,255,0.18)", top: -90, left: -60 }]} />
      <View style={[styles.blob, { backgroundColor: "rgba(0,0,0,0.16)", bottom: -110, right: -70 }]} />
      <View style={[styles.blobSmall, { backgroundColor: "rgba(255,255,255,0.12)", top: 120, right: -40 }]} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.container}>
          <Text style={[styles.brand, { color: "#FFF" }]}>VetFarm</Text>
          <Text style={[styles.subtitle, { color: "rgba(255,255,255,0.85)" }]}>
            Iniciá sesión para continuar
          </Text>

          <Card style={[{ marginTop: 18 }, styles.card]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Login</Text>
            <Text style={[styles.caption, { color: theme.colors.subText }]}>
              Ingresá tu identificación y contraseña.
            </Text>

            <View style={{ marginTop: 14 }}>
              <Input
                label="Usuario (Identificación)"
                value={usuario}
                onChangeText={setUsuario}
                placeholder="ej: 1-2345-6789"
                error={usuario.length > 0 ? errors.usuario : ""}
                autoCapitalize="none"
              />

              <Input
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                error={password.length > 0 ? errors.password : ""}
              />

              <Button
                title={loading ? "Ingresando..." : "Ingresar"}
                onPress={onLogin}
                disabled={!canLogin || loading}
                style={{ marginTop: 6 }}
              />

              <View style={{ marginTop: 12, alignItems: "center" }}>
                <Text style={{ color: theme.colors.subText, fontWeight: "700" }}>¿No tienes cuenta?</Text>
                <Button
                  title="Regístrate"
                  variant="ghost"
                  onPress={() => router.push("/registro")}
                  style={{ marginTop: 8 }}
                />
              </View>
            </View>
          </Card>

          <Text style={[styles.footer, { color: "rgba(255,255,255,0.78)" }]}>
            © {new Date().getFullYear()} VetFarmMobile
          </Text>
        </View>
      </KeyboardAvoidingView>

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
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 72,
    paddingBottom: 20,
  },
  brand: { fontSize: 36, fontWeight: "900", letterSpacing: 0.5 },
  subtitle: { marginTop: 6, fontSize: 14, fontWeight: "700" },
  title: { fontSize: 20, fontWeight: "900" },
  caption: { marginTop: 6, fontSize: 13, fontWeight: "600" },
  footer: { marginTop: 18, fontSize: 12, fontWeight: "700", textAlign: "center" },
  blob: { position: "absolute", width: 260, height: 260, borderRadius: 260 },
  blobSmall: { position: "absolute", width: 170, height: 170, borderRadius: 170 },
  card: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
});
