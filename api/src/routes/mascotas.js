// api/src/routes/mascotas.routes.js
import { Router } from "express";
import {
    actualizarMascota,
    crearMascota,
    eliminarMascota,
    listarMascotas,
} from "../controllers/mascotas.controller.js";

const router = Router();

router.get("/", listarMascotas);
router.post("/", crearMascota);
router.put("/:id", actualizarMascota);
router.delete("/:id", eliminarMascota);

export default router;
