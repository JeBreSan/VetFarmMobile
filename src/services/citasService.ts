import { getSessionUser } from "../storage/session";

const BASE_URL = "https://vetfarmmobile.onrender.com";

export type AgendaRegla = {
  id: number;
  tipo: "SIEMPRE_ABIERTO" | "CERRADO" | "HORARIO_ESPECIAL";
  inicio: string | null; // ISO timestamptz
  fin: string | null;    // ISO timestamptz
  activo: boolean;
  nota: string | null;
};

export type Cita = {
  id: number;
  propietario_id: number;
  mascota_id: number;
  inicio: string; // ISO timestamptz
  comentario: string | null;
  estado: "programada" | "cancelada" | "completada";
  created_at: string;
  updated_at: string;
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

export async function apiListarReglasAgenda(inicioISO: string, finISO: string): Promise<AgendaRegla[]> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/agenda/reglas?inicio=${encodeURIComponent(inicioISO)}&fin=${encodeURIComponent(finISO)}`, {
    method: "GET",
    headers,
  });
  if (!r.ok) throw new Error(await parseError(r));
  return (await r.json()) as AgendaRegla[];
}

export async function apiListarCitasOcupadas(inicioISO: string, finISO: string): Promise<Array<{ inicio: string }>> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/citas/ocupadas?inicio=${encodeURIComponent(inicioISO)}&fin=${encodeURIComponent(finISO)}`, {
    method: "GET",
    headers,
  });
  if (!r.ok) throw new Error(await parseError(r));
  return (await r.json()) as Array<{ inicio: string }>;
}

export async function apiCrearCita(data: {
  mascota_id: number;
  inicioISO: string;
  comentario?: string;
}): Promise<Cita> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/citas`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mascota_id: data.mascota_id,
      inicio: data.inicioISO,
      comentario: data.comentario ?? "",
    }),
  });

  if (!r.ok) {
    const msg = await parseError(r);
    // backend debería devolver 409 cuando el slot ya fue tomado
    if (r.status === 409) throw new Error("SLOT_OCUPADO");
    throw new Error(msg);
  }

  return (await r.json()) as Cita;
}

export async function apiListarProximasCitas(): Promise<Cita[]> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/citas/proximas`, { method: "GET", headers });
  if (!r.ok) throw new Error(await parseError(r));
  return (await r.json()) as Cita[];
}

export async function apiEliminarCita(id: number): Promise<void> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/citas/${id}`, { method: "DELETE", headers });
  if (!r.ok) throw new Error(await parseError(r));
}

export async function apiReprogramarCita(id: number, inicioISO: string): Promise<Cita> {
  const headers = await authHeaders();
  const r = await fetch(`${BASE_URL}/citas/${id}/reprogramar`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ inicio: inicioISO }),
  });
  if (!r.ok) {
    const msg = await parseError(r);
    if (r.status === 409) throw new Error("SLOT_OCUPADO");
    throw new Error(msg);
  }
  return (await r.json()) as Cita;
}
