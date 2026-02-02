import { API_BASE_URL, API_ENDPOINTS } from "../config/api";

type ApiOk<T> = { ok: true; data: T };
type ApiFail = { ok: false; message: string; status?: number };

async function postJson<T>(path: string, body: any): Promise<ApiOk<T> | ApiFail> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    let json: any = null;

    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: json?.mensaje || "Ocurrió un error. Intente de nuevo.",
      };
    }

    return { ok: true, data: (json as T) ?? ({} as T) };
  } catch {
    return {
      ok: false,
      message: "No se pudo conectar al servidor. Revise que el API esté encendido.",
    };
  }
}

export function apiLogin(identificacion: string, password: string) {
  return postJson<{
    mensaje: string;
    usuario: {
      id: number;
      identificacion: string;
      nombre: string;
      telefono: string;
      correo: string;
      rol: string;
    };
  }>(API_ENDPOINTS.login, { identificacion, password });
}

export function apiRegistro(payload: {
  identificacion: string;
  nombre: string;
  telefono: string;
  correo: string;
  password: string;
}) {
  return postJson<{ mensaje: string }>(API_ENDPOINTS.registro, payload);
}
