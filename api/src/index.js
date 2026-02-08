import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";

import { pool } from "./config/db.js";
import { requireUser } from "./middlewares/requireUser.js";
import authRoutes from "./routes/auth.routes.js";
import mascotasRoutes from "./routes/mascotas.routes.js";
import perfilRoutes from "./routes/perfil.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// 🔹 Endpoint base (NO TOCAR)
app.get("/", (req, res) => {
  res.json({ mensaje: "API VetFarm funcionando correctamente" });
});

// 🔎 Health check (BD)
app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("select now() as now");
    res.json({ ok: true, dbTime: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// 🧪 Endpoint de versión (TEMPORAL para Render)
app.get("/version", (req, res) => {
  res.json({ version: "mascotas-v1" });
});

// 🔐 AUTH
app.use("/auth", authRoutes);

// 👤 PERFIL
app.use("/perfil", perfilRoutes);

// 🐶 MASCOTAS (PROTEGIDO)
app.use("/mascotas", requireUser, mascotasRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API corriendo en puerto ${PORT}`);
});
