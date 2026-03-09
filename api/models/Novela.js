// models/Novela.js — Esquema para las novelas registradas
// Cada novela pertenece a un dominio y tiene una URL canónica única

import mongoose from "mongoose";

const novelaSchema = new mongoose.Schema(
  {
    // Título de la novela
    titulo: {
      type: String,
      required: [true, "El título es obligatorio"],
      trim: true,
    },

    // Referencia al dominio donde vive esta novela
    dominio_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dominio",
      required: [true, "El dominio es obligatorio"],
    },

    // URL principal de la novela (tabla de contenidos), debe ser única
    url_novela: {
      type: String,
      required: [true, "La URL de la novela es obligatoria"],
      unique: true,
      trim: true,
    },

    // Última vez que se guardó un capítulo de esta novela
    ultimo_capitulo_guardado: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Índice de texto en título para búsqueda full-text
novelaSchema.index({ titulo: "text" });

export default mongoose.model("Novela", novelaSchema);
