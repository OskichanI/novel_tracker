// middleware/validar.js — Middleware para manejar errores de express-validator
// Se usa después de los arrays de body() en las rutas para cortar la petición
// si hay campos inválidos antes de llegar al controlador.

import { validationResult } from "express-validator";

/**
 * Comprueba si hay errores de validación en la request.
 * Si los hay, responde con 422 y la lista de errores.
 * Si no, pasa al siguiente middleware/controlador.
 */
function validar(req, res, next) {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    return res.status(422).json({
      ok: false,
      mensaje: "Datos de entrada inválidos",
      errores: errores.array().map((e) => ({
        campo: e.path,
        mensaje: e.msg,
      })),
    });
  }

  next();
}

export default validar;
