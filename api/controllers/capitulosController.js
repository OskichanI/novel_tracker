// controllers/capitulosController.js — Lógica de negocio para capítulos

import Capitulo from "../models/Capitulo.js";
import Novela from "../models/Novela.js";
import Dominio from "../models/Dominio.js";

/**
 * GET /api/capitulos?novela_id=xxx&page=1&limit=50
 * Lista capítulos de una novela ordenados por número ascendente.
 * Query params:
 *   - novela_id (requerido): ID de la novela
 *   - page: página (default 1)
 *   - limit: resultados por página (default 50)
 *   - q: búsqueda de texto en título/contenido
 */
export const listarCapitulos = async (req, res) => {
  try {
    const { novela_id, page = 1, limit = 50, q } = req.query;

    if (!novela_id) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "El parámetro novela_id es requerido" });
    }

    const filtro = { novela_id };

    // Búsqueda full-text en título y contenido
    if (q) {
      filtro.$text = { $search: q };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [capitulos, total] = await Promise.all([
      Capitulo.find(filtro)
        .select("-contenido") // No devolver contenido en el listado para ahorrar ancho de banda
        .sort({ capitulo_num: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Capitulo.countDocuments(filtro),
    ]);

    res.json({
      ok: true,
      data: capitulos,
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
 * GET /api/capitulos/:id
 * Devuelve un capítulo completo incluyendo su contenido.
 */
export const obtenerCapitulo = async (req, res) => {
  try {
    const capitulo = await Capitulo.findById(req.params.id).populate(
      "novela_id",
      "titulo",
    );
    if (!capitulo) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Capítulo no encontrado" });
    }
    res.json({ ok: true, data: capitulo });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

/**
 * POST /api/capitulos
 * Inserta un capítulo nuevo. Si ya existe (misma novela + número), devuelve el existente.
 * Este es el endpoint principal que llamará la extensión al detectar un capítulo.
 *
 * Body: { novela_id, capitulo_num, titulo?, contenido?, url? }
 */
export const crearCapitulo = async (req, res) => {
  try {
    const { novela_id, capitulo_num, titulo, contenido, url } = req.body;

    // Verificar que la novela existe
    const novela = await Novela.findById(novela_id);
    if (!novela) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "La novela indicada no existe" });
    }

    // Intentar insertar — el índice único en {novela_id, capitulo_num} evita duplicados
    const capitulo = await Capitulo.create({
      novela_id,
      capitulo_num,
      titulo,
      contenido,
      url,
    });

    // Actualizar el campo de último capítulo guardado en la novela
    if (
      !novela.ultimo_capitulo_guardado ||
      capitulo_num > novela.ultimo_capitulo_guardado
    ) {
      await Novela.findByIdAndUpdate(novela_id, {
        ultimo_capitulo_guardado: capitulo_num,
      });
    }

    res.status(201).json({ ok: true, data: capitulo, creado: true });
  } catch (error) {
    // Código 11000: violación del índice único compuesto (capítulo ya existe)
    if (error.code === 11000) {
      const existente = await Capitulo.findOne({
        novela_id: req.body.novela_id,
        capitulo_num: req.body.capitulo_num,
      });
      return res
        .status(200)
        .json({
          ok: true,
          data: existente,
          creado: false,
          mensaje: "El capítulo ya existe",
        });
    }
    res.status(400).json({ ok: false, mensaje: error.message });
  }
};

/**
 * POST /api/capitulos/guardar-completo
 * Endpoint "todo en uno" pensado para la extensión:
 * Recibe todos los datos de una lectura (dominio, novela, capítulo) y los guarda
 * creando o reutilizando el dominio y la novela si ya existen.
 *
 * Body:
 * {
 *   dominio: { nombre, regex_novela, regex_capitulo, regex_titulo? },
 *   novela:  { titulo, url_novela },
 *   capitulo: { capitulo_num, titulo?, contenido?, url? }
 * }
 */
export const guardarCompleto = async (req, res) => {
  try {
    const {
      dominio: datosDominio,
      novela: datosNovela,
      capitulo: datosCapitulo,
    } = req.body;

    // ── 1. Dominio ──────────────────────────────────────────────────────────
    let dominio = await Dominio.findOne({
      nombre: datosDominio.nombre.trim().toLowerCase(),
    });

    if (!dominio) {
      dominio = await Dominio.create(datosDominio);
    }

    // ── 2. Novela ───────────────────────────────────────────────────────────
    let novela = await Novela.findOne({
      url_novela: datosNovela.url_novela.trim(),
    });

    if (!novela) {
      novela = await Novela.create({
        titulo: datosNovela.titulo,
        dominio_id: dominio._id,
        url_novela: datosNovela.url_novela,
      });
    }

    // ── 3. Capítulo ─────────────────────────────────────────────────────────
    let capitulo;
    let capituloCreado = false;

    try {
      capitulo = await Capitulo.create({
        novela_id: novela._id,
        ...datosCapitulo,
      });
      capituloCreado = true;

      // Actualizar último capítulo en la novela
      if (
        !novela.ultimo_capitulo_guardado ||
        datosCapitulo.capitulo_num > novela.ultimo_capitulo_guardado
      ) {
        await Novela.findByIdAndUpdate(novela._id, {
          ultimo_capitulo_guardado: datosCapitulo.capitulo_num,
        });
      }
    } catch (dupError) {
      if (dupError.code === 11000) {
        // El capítulo ya existía, devolver el existente
        capitulo = await Capitulo.findOne({
          novela_id: novela._id,
          capitulo_num: datosCapitulo.capitulo_num,
        });
      } else {
        throw dupError;
      }
    }

    res.status(capituloCreado ? 201 : 200).json({
      ok: true,
      data: {
        dominio: { _id: dominio._id, nombre: dominio.nombre },
        novela: { _id: novela._id, titulo: novela.titulo },
        capitulo,
      },
      capituloCreado,
    });
  } catch (error) {
    res.status(400).json({ ok: false, mensaje: error.message });
  }
};

/**
 * DELETE /api/capitulos/:id
 * Elimina un capítulo específico.
 */
export const eliminarCapitulo = async (req, res) => {
  try {
    const capitulo = await Capitulo.findByIdAndDelete(req.params.id);
    if (!capitulo) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Capítulo no encontrado" });
    }
    res.json({ ok: true, mensaje: "Capítulo eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};
