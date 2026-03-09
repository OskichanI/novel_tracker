// routes/capitulos.js — Rutas para el recurso Capitulo
import { Router } from "express";
import * as ctrl from "../controllers/capitulosController.js";
import validar from "../middleware/validar.js";
import { body } from "express-validator";

const router = Router();

// Validaciones para insertar un capítulo
const reglasCrear = [
  body("novela_id")
    .notEmpty()
    .isMongoId()
    .withMessage("novela_id debe ser un MongoID válido"),
  body("capitulo_num")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage("capitulo_num debe ser un número >= 0"),
];

// Validaciones para el endpoint "todo en uno"
const reglasGuardarCompleto = [
  body("dominio.nombre")
    .trim()
    .notEmpty()
    .withMessage("dominio.nombre es obligatorio"),
  body("dominio.regex_novela")
    .trim()
    .notEmpty()
    .withMessage("dominio.regex_novela es obligatorio"),
  body("dominio.regex_capitulo")
    .trim()
    .notEmpty()
    .withMessage("dominio.regex_capitulo es obligatorio"),
  body("novela.titulo")
    .trim()
    .notEmpty()
    .withMessage("novela.titulo es obligatorio"),
  body("novela.url_novela")
    .trim()
    .notEmpty()
    .withMessage("novela.url_novela es obligatorio"),
  body("capitulo.capitulo_num")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage("capitulo.capitulo_num es obligatorio"),
];

// GET    /api/capitulos              → listar capítulos de una novela (?novela_id=, ?page=, ?q=)
// GET    /api/capitulos/:id          → obtener un capítulo completo con contenido
// POST   /api/capitulos              → insertar capítulo (novela ya debe existir)
// POST   /api/capitulos/guardar-completo → endpoint principal de la extensión
// DELETE /api/capitulos/:id          → eliminar capítulo

// IMPORTANTE: la ruta estática "guardar-completo" debe ir ANTES de "/:id"
router.post(
  "/guardar-completo",
  reglasGuardarCompleto,
  validar,
  ctrl.guardarCompleto,
);

router.get("/", ctrl.listarCapitulos);
router.post("/", reglasCrear, validar, ctrl.crearCapitulo);
router.get("/:id", ctrl.obtenerCapitulo);
router.delete("/:id", ctrl.eliminarCapitulo);

export default router;
