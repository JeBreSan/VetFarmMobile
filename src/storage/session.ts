import AsyncStorage from "@react-native-async-storage/async-storage";

export type SessionUser = {
  id: number;
  identificacion?: string;
  nombre: string;
  rol: "admin" | "usuario";
};

const KEY = "vf_session_user";

export async function setSessionUser(user: SessionUser): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(user));

    // ✅ verificación inmediata
    const raw = await AsyncStorage.getItem(KEY);
    return !!raw;
  } catch (e) {
    console.log("AsyncStorage setItem error:", e);
    return false;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch (e) {
    console.log("AsyncStorage getItem error:", e);
    return null;
  }
}

export async function clearSessionUser() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.log("AsyncStorage removeItem error:", e);
  }
  
}
export async function getIdentificacion(): Promise<string | null> {
  const u = await getSessionUser();
  return u?.identificacion ?? null;
}

export async function getUserId(): Promise<number | null> {
  const u = await getSessionUser();
  return typeof u?.id === "number" && u.id > 0 ? u.id : null;
}
