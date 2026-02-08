import { pool } from "../config/db.js";

/**
 * GET /mascotas
 * Usuario: solo sus mascotas
 * Admin: todas
 */
export const listarMascotas = async (req, res) => {
  try {
    const { id, rol } = req.user;

    let query = `
      select id, nombre, especie, raza, edad, propietario_id, created_at, updated_at
      from mascotas
      where activo = true
    `;
    const params = [];

    if (rol !== "admin") {
      query += " and propietario_id = $1";
      params.push(id);
    }

    query += " order by created_at desc";

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener las mascotas" });
  }
};

/**
 * POST /mascotas
 */
export const crearMascota = async (req, res) => {
  try {
    const { id: propietario_id } = req.user;
    const { nombre, especie, raza, edad } = req.body;

    if (!nombre || !especie) {
      return res
        .status(400)
        .json({ mensaje: "Nombre y especie son obligatorios" });
    }

    const { rows } = await pool.query(
      `
      insert into mascotas (nombre, especie, raza, edad, propietario_id)
      values ($1, $2, $3, $4, $5)
      returning *
      `,
      [nombre, especie, raza ?? null, edad ?? null, propietario_id]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear la mascota" });
  }
};

/**
 * PUT /mascotas/:id
 * Usuario NO puede cambiar especie
 */
export const actualizarMascota = async (req, res) => {
  try {
    const mascotaId = req.params.id;
    const { id: usuarioId, rol } = req.user;
    const { nombre, especie, raza, edad } = req.body;

    // Verificar existencia y dueño
    const { rows } = await pool.query(
      "select * from mascotas where id = $1 and activo = true",
      [mascotaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Mascota no encontrada" });
    }

    const mascota = rows[0];

    if (rol !== "admin" && mascota.propietario_id !== usuarioId) {
      return res
        .status(403)
        .json({ mensaje: "No tienes permiso para editar esta mascota" });
    }

    if (rol !== "admin" && especie && especie !== mascota.especie) {
      return res.status(403).json({
        mensaje: "No puedes cambiar la especie de la mascota",
      });
    }

    const { rows: updated } = await pool.query(
      `
      update mascotas
      set nombre = $1,
          raza = $2,
          edad = $3
      where id = $4
      returning *
      `,
      [
        nombre ?? mascota.nombre,
        raza ?? mascota.raza,
        edad ?? mascota.edad,
        mascotaId,
      ]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar la mascota" });
  }
};

/**
 * DELETE /mascotas/:id
 * Borrado lógico
 */
export const eliminarMascota = async (req, res) => {
  try {
    const mascotaId = req.params.id;
    const { id: usuarioId, rol } = req.user;

    const { rows } = await pool.query(
      "select * from mascotas where id = $1 and activo = true",
      [mascotaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Mascota no encontrada" });
    }

    const mascota = rows[0];

    if (rol !== "admin" && mascota.propietario_id !== usuarioId) {
      return res
        .status(403)
        .json({ mensaje: "No tienes permiso para eliminar esta mascota" });
    }

    await pool.query(
      "update mascotas set activo = false where id = $1",
      [mascotaId]
    );

    res.json({ mensaje: "Mascota eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar la mascota" });
  }
};
