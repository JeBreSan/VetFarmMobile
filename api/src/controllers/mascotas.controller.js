// api/src/controllers/mascotas.controller.js
import { pool } from "../config/db.js";

const ESPECIES_VALIDAS = new Set(["perro", "gato", "ave", "roedor", "reptil", "otro"]);

const t = (v) => (typeof v === "string" ? v.trim() : "");

export const listarMascotas = async (req, res) => {
  try {
    const { id, rol } = req.user;

    let sql = `
      select id, nombre, especie, raza, edad, propietario_id, created_at, updated_at, activo
      from public.mascotas
      where activo = true
    `;
    const params = [];

    if (rol !== "admin") {
      sql += " and propietario_id = $1";
      params.push(id);
    }

    sql += " order by created_at desc";

    const r = await pool.query(sql, params);
    return res.json(r.rows);
  } catch (e) {
    console.error("listarMascotas:", e);
    return res.status(500).json({ mensaje: "Error al obtener las mascotas." });
  }
};

export const crearMascota = async (req, res) => {
  try {
    const { id: propietario_id } = req.user;

    const nombre = t(req.body?.nombre);
    const especie = t(req.body?.especie).toLowerCase();
    const raza = t(req.body?.raza);
    const edad = t(req.body?.edad);

    if (!nombre || !especie) {
      return res.status(400).json({ mensaje: "Nombre y especie son obligatorios." });
    }

    if (!ESPECIES_VALIDAS.has(especie)) {
      return res.status(400).json({ mensaje: "Especie inválida." });
    }

    const r = await pool.query(
      `
      insert into public.mascotas (nombre, especie, raza, edad, propietario_id)
      values ($1, $2, $3, $4, $5)
      returning id, nombre, especie, raza, edad, propietario_id, created_at, updated_at, activo
      `,
      [nombre, especie, raza || null, edad || null, propietario_id]
    );

    return res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error("crearMascota:", e);
    return res.status(500).json({ mensaje: "Error al crear la mascota." });
  }
};

export const actualizarMascota = async (req, res) => {
  try {
    const mascotaId = Number(req.params.id);
    const { id: usuarioId, rol } = req.user;

    if (!mascotaId || mascotaId <= 0) {
      return res.status(400).json({ mensaje: "ID de mascota inválido." });
    }

    const r0 = await pool.query(
      `
      select id, nombre, especie, raza, edad, propietario_id
      from public.mascotas
      where id = $1 and activo = true
      `,
      [mascotaId]
    );

    if (r0.rows.length === 0) {
      return res.status(404).json({ mensaje: "Mascota no encontrada." });
    }

    const mascota = r0.rows[0];

    // Permisos por dueño (usuario) / admin
    if (rol !== "admin" && mascota.propietario_id !== usuarioId) {
      return res.status(403).json({ mensaje: "No tienes permiso para editar esta mascota." });
    }

    // Regla clave: usuario NO cambia especie
    const especieBody = t(req.body?.especie);
    if (rol !== "admin" && especieBody && especieBody.toLowerCase() !== mascota.especie) {
      return res.status(403).json({ mensaje: "No puedes cambiar la especie de la mascota." });
    }

    // Admin puede cambiar especie (validada)
    let especieFinal = mascota.especie;
    if (rol === "admin" && especieBody) {
      const esp = especieBody.toLowerCase();
      if (!ESPECIES_VALIDAS.has(esp)) {
        return res.status(400).json({ mensaje: "Especie inválida." });
      }
      especieFinal = esp;
    }

    const nombreBody = t(req.body?.nombre);
    const razaBody = t(req.body?.raza);
    const edadBody = t(req.body?.edad);

    const nombreFinal = nombreBody || mascota.nombre;
    const razaFinal = razaBody ? razaBody : (razaBody === "" ? null : mascota.raza);
    const edadFinal = edadBody ? edadBody : (edadBody === "" ? null : mascota.edad);

    const r1 = await pool.query(
      `
      update public.mascotas
      set nombre = $1,
          especie = $2,
          raza = $3,
          edad = $4
      where id = $5
      returning id, nombre, especie, raza, edad, propietario_id, created_at, updated_at, activo
      `,
      [nombreFinal, especieFinal, razaFinal, edadFinal, mascotaId]
    );

    return res.json(r1.rows[0]);
  } catch (e) {
    console.error("actualizarMascota:", e);
    return res.status(500).json({ mensaje: "Error al actualizar la mascota." });
  }
};

export const eliminarMascota = async (req, res) => {
  try {
    const mascotaId = Number(req.params.id);
    const { id: usuarioId, rol } = req.user;

    if (!mascotaId || mascotaId <= 0) {
      return res.status(400).json({ mensaje: "ID de mascota inválido." });
    }

    const r0 = await pool.query(
      `
      select id, propietario_id
      from public.mascotas
      where id = $1 and activo = true
      `,
      [mascotaId]
    );

    if (r0.rows.length === 0) {
      return res.status(404).json({ mensaje: "Mascota no encontrada." });
    }

    const mascota = r0.rows[0];

    if (rol !== "admin" && mascota.propietario_id !== usuarioId) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar esta mascota." });
    }

    await pool.query(
      `update public.mascotas set activo = false where id = $1`,
      [mascotaId]
    );

    return res.json({ mensaje: "Mascota eliminada correctamente." });
  } catch (e) {
    console.error("eliminarMascota:", e);
    return res.status(500).json({ mensaje: "Error al eliminar la mascota." });
  }
};
