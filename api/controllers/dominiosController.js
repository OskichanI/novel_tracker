// controllers/dominiosController.js — Lógica de negocio para dominios
// Un dominio define cómo extraer datos de un sitio web específico

import Dominio from "../models/Dominio.js";
import Novela from "../models/Novela.js";

/**
 * GET /api/dominios
 * Devuelve todos los dominios registrados.
 * La extensión los descarga al iniciarse para saber qué sitios rastrear.
 */
export const listarDominios = async (req, res) => {
  try {
    const dominios = await Dominio.find().sort({ nombre: 1 });
    res.json({ ok: true, data: dominios });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

/**
 * GET /api/dominios/:id
 * Devuelve un dominio por su ID.
 */
export const obtenerDominio = async (req, res) => {
  try {
    const dominio = await Dominio.findById(req.params.id);
    if (!dominio) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Dominio no encontrado" });
    }
    res.json({ ok: true, data: dominio });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

/**
 * POST /api/dominios
 * Crea un nuevo dominio. Si ya existe (por nombre único), devuelve el existente.
 * Body: { nombre, regex_novela, regex_capitulo, regex_titulo? }
 */
export const crearDominio = async (req, res) => {
  try {
    const { nombre, regex_novela, regex_capitulo, regex_titulo } = req.body;

    // Intentar encontrar uno existente antes de crear
    const existente = await Dominio.findOne({
      nombre: nombre.trim().toLowerCase(),
    });
    if (existente) {
      return res.status(200).json({ ok: true, data: existente, creado: false });
    }

    const dominio = await Dominio.create({
      nombre,
      regex_novela,
      regex_capitulo,
      regex_titulo,
    });
    res.status(201).json({ ok: true, data: dominio, creado: true });
  } catch (error) {
    // Error 11000 = violación de índice único de MongoDB
    if (error.code === 11000) {
      const existente = await Dominio.findOne({ nombre: req.body.nombre });
      return res.status(200).json({ ok: true, data: existente, creado: false });
    }
    res.status(400).json({ ok: false, mensaje: error.message });
  }
};

/**
 * PUT /api/dominios/:id
 * Actualiza los regex de un dominio cuando el sitio web cambia su estructura de URLs.
 * Body: { regex_novela?, regex_capitulo?, regex_titulo? }
 */
export const actualizarDominio = async (req, res) => {
  try {
    const { regex_novela, regex_capitulo, regex_titulo } = req.body;

    const dominio = await Dominio.findByIdAndUpdate(
      req.params.id,
      { $set: { regex_novela, regex_capitulo, regex_titulo } },
      { new: true, runValidators: true },
    );

    if (!dominio) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Dominio no encontrado" });
    }

    res.json({ ok: true, data: dominio });
  } catch (error) {
    res.status(400).json({ ok: false, mensaje: error.message });
  }
};

/**
 * DELETE /api/dominios/:id
 * Elimina un dominio (solo si no tiene novelas asociadas).
 */
export const eliminarDominio = async (req, res) => {
  try {
    const novelas = await Novela.countDocuments({ dominio_id: req.params.id });

    if (novelas > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: `No se puede eliminar: hay ${novelas} novela(s) asociadas a este dominio`,
      });
    }

    await Dominio.findByIdAndDelete(req.params.id);
    res.json({ ok: true, mensaje: "Dominio eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};
