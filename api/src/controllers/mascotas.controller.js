import { pool } from "../config/db.js";

// Helpers
function getUser(req) {
  const id = Number(req.user?.id);
  const rol = String(req.user?.rol ?? "").toLowerCase();
  return { id, rol };
}

// GET /mascotas
export const listarMascotas = async (req, res) => {
  try {
    const { id: userId } = getUser(req);

    const r = await pool.query(
      `SELECT id, nombre, especie, raza, edad, propietario_id, created_at, updated_at, activo
       FROM mascotas
       WHERE propietario_id = $1 AND activo = true
       ORDER BY id DESC`,
      [userId]
    );

    return res.json(r.rows);
  } catch (e) {
    console.error("listarMascotas error:", e);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// POST /mascotas
export const crearMascota = async (req, res) => {
  try {
    const { id: userId } = getUser(req);
    const { nombre, especie, raza, edad } = req.body;

    if (!nombre?.trim() || !especie?.trim()) {
      return res.status(400).json({
        mensaje: "Datos incompletos. Nombre y especie son requeridos.",
      });
    }

    const r = await pool.query(
      `INSERT INTO mascotas (nombre, especie, raza, edad, propietario_id, activo)
       VALUES ($1,$2,$3,$4,$5,true)
       RETURNING id, nombre, especie, raza, edad, propietario_id, created_at, updated_at, activo`,
      [
        nombre.trim(),
        String(especie).trim().toLowerCase(),
        raza?.trim() ? raza.trim() : null,
        edad?.trim() ? edad.trim() : null,
        userId,
      ]
    );

    return res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error("crearMascota error:", e);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// PUT /mascotas/:id
export const actualizarMascota = async (req, res) => {
  try {
    const { id: userId, rol } = getUser(req);
    const mascotaId = Number(req.params.id);

    if (!Number.isFinite(mascotaId) || mascotaId <= 0) {
      return res.status(400).json({ mensaje: "Id inválido." });
    }

    const existe = await pool.query(
      `SELECT id, propietario_id, activo FROM mascotas WHERE id = $1 LIMIT 1`,
      [mascotaId]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({ mensaje: "Mascota no encontrada." });
    }

    const m = existe.rows[0];
    const ownerId = Number(m.propietario_id); // 👈 CLAVE

    if (!m.activo) {
      return res.status(404).json({ mensaje: "Mascota no encontrada." });
    }

    // Permisos: admin o dueño
    if (rol !== "admin" && ownerId !== userId) {
      // Debug útil (dejalo por ahora para confirmar en logs de Render)
      console.log("403 perms", { userId, ownerId, rol, mascotaId });
      return res.status(403).json({ mensaje: "Prohibido." });
    }

    const { nombre, edad, especie, raza } = req.body;

    // Usuario NO puede cambiar especie/raza
    if (rol !== "admin") {
      if (typeof especie !== "undefined" || typeof raza !== "undefined") {
        return res.status(403).json({
          mensaje: "Prohibido. No puede cambiar especie/raza.",
        });
      }
    }

    // Construir update dinámico
    const fields = [];
    const values = [];
    let idx = 1;

    if (typeof nombre !== "undefined") {
      const n = String(nombre).trim();
      if (!n) return res.status(400).json({ mensaje: "Nombre inválido." });
      fields.push(`nombre = $${idx++}`);
      values.push(n);
    }

    if (typeof edad !== "undefined") {
      const e = String(edad).trim();
      fields.push(`edad = $${idx++}`);
      values.push(e ? e : null);
    }

    if (rol === "admin") {
      if (typeof especie !== "undefined") {
        const s = String(especie).trim().toLowerCase();
        if (!s) return res.status(400).json({ mensaje: "Especie inválida." });
        fields.push(`especie = $${idx++}`);
        values.push(s);
      }

      if (typeof raza !== "undefined") {
        const rza = String(raza).trim();
        fields.push(`raza = $${idx++}`);
        values.push(rza ? rza : null);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ mensaje: "No hay campos para actualizar." });
    }

    fields.push(`updated_at = now()`);

    values.push(mascotaId);
    const q = `
      UPDATE mascotas
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, nombre, especie, raza, edad, propietario_id, created_at, updated_at, activo
    `;

    const updated = await pool.query(q, values);
    return res.json(updated.rows[0]);
  } catch (e) {
    console.error("actualizarMascota error:", e);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// DELETE /mascotas/:id (soft delete)
export const eliminarMascota = async (req, res) => {
  try {
    const { id: userId, rol } = getUser(req);
    const mascotaId = Number(req.params.id);

    if (!Number.isFinite(mascotaId) || mascotaId <= 0) {
      return res.status(400).json({ mensaje: "Id inválido." });
    }

    const existe = await pool.query(
      `SELECT id, propietario_id, activo FROM mascotas WHERE id = $1 LIMIT 1`,
      [mascotaId]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({ mensaje: "Mascota no encontrada." });
    }

    const m = existe.rows[0];
    const ownerId = Number(m.propietario_id); // 👈 CLAVE

    if (!m.activo) {
      return res.status(404).json({ mensaje: "Mascota no encontrada." });
    }

    if (rol !== "admin" && ownerId !== userId) {
      console.log("403 delete perms", { userId, ownerId, rol, mascotaId });
      return res.status(403).json({ mensaje: "Prohibido." });
    }

    await pool.query(
      `UPDATE mascotas SET activo = false, updated_at = now() WHERE id = $1`,
      [mascotaId]
    );

    return res.json({ mensaje: "Mascota eliminada." });
  } catch (e) {
    console.error("eliminarMascota error:", e);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};
