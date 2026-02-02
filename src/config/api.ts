import { Platform } from "react-native";

// ✅ WEB (Expo Web)
const API_HOST_WEB = "http://localhost:3000";

// ✅ MÓVIL (Android/iOS real)
// Cambiá esta IP por la de TU PC en la misma red WiFi.
// Ejemplo: "http://192.168.100.25:3000"
const API_HOST_MOBILE = "http://192.168.100.176:3000";

export const API_BASE_URL = Platform.OS === "web" ? API_HOST_WEB : API_HOST_MOBILE;

export const API_ENDPOINTS = {
  login: "/auth/login",
  registro: "/auth/registro",
};
