// models/Capitulo.js — Esquema para los capítulos guardados
// Índice compuesto único en novela_id + capitulo_num para evitar duplicados

import mongoose from "mongoose";

const capituloSchema = new mongoose.Schema(
  {
    // Referencia a la novela a la que pertenece este capítulo
    novela_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Novela",
      required: [true, "El ID de la novela es obligatorio"],
    },

    // Número de capítulo (puede ser decimal para capítulos como 10.5)
    capitulo_num: {
      type: Number,
      required: [true, "El número de capítulo es obligatorio"],
      min: [0, "El número de capítulo no puede ser negativo"],
    },

    // Título del capítulo extraído de la página
    titulo: {
      type: String,
      trim: true,
      default: null,
    },

    // Contenido completo del capítulo
    contenido: {
      type: String,
      default: null,
    },

    // URL original donde se leyó el capítulo
    url: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Índice compuesto único: no se puede guardar el mismo capítulo dos veces para la misma novela
capituloSchema.index({ novela_id: 1, capitulo_num: 1 }, { unique: true });

// Índice de texto en título y contenido para búsqueda full-text
capituloSchema.index({ titulo: "text", contenido: "text" });

export default mongoose.model("Capitulo", capituloSchema);
