import { getSessionUser } from "../storage/session";

const BASE_URL = "https://vetfarmmobile.onrender.com";

export type Mascota = {
  id: number;
  nombre: string;
  especie: string;
  raza: string | null;
  edad: string | null;
  propietario_id: number;
  created_at: string;
  updated_at: string;
  activo: boolean;
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

    // si viene JSON con {message: "..."} o {error: "..."}
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


export async function apiListarMascotas(): Promise<Mascota[]> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/mascotas`, { method: "GET", headers });
  if (!r.ok) throw new Error(await parseError(r));
  return (await r.json()) as Mascota[];
}

export async function apiCrearMascota(data: {
  nombre: string;
  especie: string; // perro | gato | ave | roedor | reptil | otro
  raza?: string;
  edad?: string;
}): Promise<Mascota> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/mascotas`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return (await r.json()) as Mascota;
}

export async function apiActualizarMascota(
  id: number,
  data: Partial<{ nombre: string; especie: string; raza: string; edad: string }>
): Promise<Mascota> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/mascotas/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return (await r.json()) as Mascota;
}

export async function apiEliminarMascota(id: number): Promise<void> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/mascotas/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!r.ok) throw new Error(await parseError(r));
}
