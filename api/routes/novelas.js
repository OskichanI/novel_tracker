// routes/novelas.js — Rutas para el recurso Novela
import { Router } from "express";
import * as ctrl from "../controllers/novelasController.js";
import validar from "../middleware/validar.js";
import { body } from "express-validator";

const router = Router();

// Validaciones para crear una novela
const reglasCrear = [
  body("titulo").trim().notEmpty().withMessage("El título es obligatorio"),
  body("dominio_id")
    .notEmpty()
    .isMongoId()
    .withMessage("dominio_id debe ser un MongoID válido"),
  body("url_novela")
    .trim()
    .notEmpty()
    .isURL({ require_tld: false })
    .withMessage("Debe ser una URL válida"),
];

// GET    /api/novelas           → listar (con ?dominio_id=, ?q=, ?page=, ?limit=)
// POST   /api/novelas           → crear novela
// GET    /api/novelas/:id       → obtener una novela
// PUT    /api/novelas/:id       → actualizar título
// DELETE /api/novelas/:id       → eliminar novela y sus capítulos

router.get("/", ctrl.listarNovelas);
router.post("/", reglasCrear, validar, ctrl.crearNovela);
router.get("/:id", ctrl.obtenerNovela);
router.put(
  "/:id",
  [body("titulo").trim().notEmpty()],
  validar,
  ctrl.actualizarNovela,
);
router.delete("/:id", ctrl.eliminarNovela);

export default router;
