// controllers/novelasController.js — Lógica de negocio para novelas

import Novela from "../models/Novela.js";
import Dominio from "../models/Dominio.js";
import Capitulo from "../models/Capitulo.js";

/**
 * GET /api/novelas
 * Lista todas las novelas con datos del dominio.
 * Query params:
 *   - dominio_id: filtrar por dominio
 *   - q: búsqueda de texto en título
 *   - page: página (default 1)
 *   - limit: resultados por página (default 20)
 */
export const listarNovelas = async (req, res) => {
  try {
    const { dominio_id, q, page = 1, limit = 20 } = req.query;
    const filtro = {};

    // Filtro por dominio
    if (dominio_id) {
      filtro.dominio_id = dominio_id;
    }

    // Búsqueda de texto en título usando índice text
    if (q) {
      filtro.$text = { $search: q };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [novelas, total] = await Promise.all([
      Novela.find(filtro)
        .populate("dominio_id", "nombre") // trae el nombre del dominio
        .sort({ titulo: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Novela.countDocuments(filtro),
    ]);

    res.json({
      ok: true,
      data: novelas,
      paginacion: {
        total,
        pagina: parseInt(page),
        paginas: Math.ceil(total / parseInt(limit)),
        limite: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

/**
 * GET /api/novelas/:id
 * Devuelve una novela con su dominio.
 */
export const obtenerNovela = async (req, res) => {
  try {
    const novela = await Novela.findById(req.params.id).populate(
      "dominio_id",
      "nombre regex_novela regex_capitulo",
    );
    if (!novela) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Novela no encontrada" });
    }
    res.json({ ok: true, data: novela });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

/**
 * POST /api/novelas
 * Crea una novela o devuelve la existente si la URL ya está registrada.
 * Este comportamiento "upsert ligero" evita duplicados desde la extensión.
 * Body: { titulo, dominio_id, url_novela }
 */
export const crearNovela = async (req, res) => {
  try {
    const { titulo, dominio_id, url_novela } = req.body;

    // Verificar que el dominio existe
    const dominio = await Dominio.findById(dominio_id);
    if (!dominio) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "El dominio indicado no existe" });
    }

    // findOneOrCreate: busca por URL única antes de insertar
    const existente = await Novela.findOne({ url_novela: url_novela.trim() });
    if (existente) {
      return res.status(200).json({ ok: true, data: existente, creada: false });
    }

    const novela = await Novela.create({ titulo, dominio_id, url_novela });
    res.status(201).json({ ok: true, data: novela, creada: true });
  } catch (error) {
    if (error.code === 11000) {
      const existente = await Novela.findOne({
        url_novela: req.body.url_novela,
      });
      return res.status(200).json({ ok: true, data: existente, creada: false });
    }
    res.status(400).json({ ok: false, mensaje: error.message });
  }
};

/**
 * PUT /api/novelas/:id
 * Actualiza el título de una novela.
 * Body: { titulo? }
 */
export const actualizarNovela = async (req, res) => {
  try {
    const { titulo } = req.body;

    const novela = await Novela.findByIdAndUpdate(
      req.params.id,
      { $set: { titulo } },
      { new: true, runValidators: true },
    );

    if (!novela) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Novela no encontrada" });
    }

    res.json({ ok: true, data: novela });
  } catch (error) {
    res.status(400).json({ ok: false, mensaje: error.message });
  }
};

/**
 * DELETE /api/novelas/:id
 * Elimina una novela y TODOS sus capítulos asociados.
 */
export const eliminarNovela = async (req, res) => {
  try {
    const novela = await Novela.findByIdAndDelete(req.params.id);
    if (!novela) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Novela no encontrada" });
    }

    // Eliminar capítulos en cascada
    const { deletedCount } = await Capitulo.deleteMany({
      novela_id: req.params.id,
    });

    res.json({
      ok: true,
      mensaje: `Novela eliminada junto con ${deletedCount} capítulo(s)`,
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};
