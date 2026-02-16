import { getSessionUser } from "../storage/session";

const BASE_URL = "https://vetfarmmobile.onrender.com";

export type HistorialItem = {
  id: number;
  propietario_id: number;
  mascota_id: number;
  tipo: string;
  fecha: string;
  titulo: string;
  detalle: string | null;
};

export type MascotaMini = {
  id: number;
  nombre: string;
  especie: string;
  raza: string | null;
  edad: string | null;
};

async function authHeaders(): Promise<Record<string, string>> {
  const u = await getSessionUser();
  if (!u) throw new Error("Sesión no encontrada. Inicie sesión nuevamente.");

  return {
    "x-user-id": String(u.id),
    "x-user-rol": u.rol,
    "Content-Type": "application/json",
  };
}

async function parseError(r: Response) {
  try {
    const txt = await r.text();
    try {
      const j = JSON.parse(txt);
      return j?.message || j?.error || txt || `Error HTTP ${r.status}`;
    } catch {
      return txt || `Error HTTP ${r.status}`;
    }
  } catch {
    return `Error HTTP ${r.status}`;
  }
}

export async function apiListarMascotasHistorial(): Promise<MascotaMini[]> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/historial/mascotas`, { method: "GET", headers });
  if (!r.ok) throw new Error(await parseError(r));
  return (await r.json()) as MascotaMini[];
}

export async function apiListarHistorialPorMascota(mascotaId: number): Promise<HistorialItem[]> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/historial/${mascotaId}`, { method: "GET", headers });
  if (!r.ok) throw new Error(await parseError(r));
  return (await r.json()) as HistorialItem[];
}
