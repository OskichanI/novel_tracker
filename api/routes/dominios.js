// routes/dominios.js — Rutas para el recurso Dominio
import { Router } from "express";
import * as ctrl from "../controllers/dominiosController.js";
import validar from "../middleware/validar.js";
import { body } from "express-validator";

const router = Router();

// Validaciones para crear/actualizar un dominio
const reglasCrear = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre del dominio es obligatorio"),
  body("regex_novela")
    .trim()
    .notEmpty()
    .withMessage("El regex de novela es obligatorio"),
  body("regex_capitulo")
    .trim()
    .notEmpty()
    .withMessage("El regex de capítulo es obligatorio"),
];

const reglasActualizar = [
  body("regex_novela").optional().trim().notEmpty(),
  body("regex_capitulo").optional().trim().notEmpty(),
];

// GET    /api/dominios        → listar todos
// POST   /api/dominios        → crear dominio
// GET    /api/dominios/:id    → obtener uno
// PUT    /api/dominios/:id    → actualizar regex
// DELETE /api/dominios/:id    → eliminar

router.get("/", ctrl.listarDominios);
router.post("/", reglasCrear, validar, ctrl.crearDominio);
router.get("/:id", ctrl.obtenerDominio);
router.put("/:id", reglasActualizar, validar, ctrl.actualizarDominio);
router.delete("/:id", ctrl.eliminarDominio);

export default router;
