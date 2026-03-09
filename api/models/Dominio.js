// models/Dominio.js — Esquema para los dominios de novelas
// Almacena el hostname y las expresiones regulares para extraer datos del URL

import mongoose from "mongoose";

const dominioSchema = new mongoose.Schema(
  {
    // Nombre del dominio, ej: "www.wuxiaworld.com"
    nombre: {
      type: String,
      required: [true, "El nombre del dominio es obligatorio"],
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Regex para extraer el slug/id de la novela del pathname
    // Ejemplo: "^/novel/([^/]+)" captura el slug en grupo 1
    regex_novela: {
      type: String,
      required: [true, "El regex de novela es obligatorio"],
      trim: true,
    },

    // Regex para extraer el número de capítulo del pathname
    // Ejemplo: "chapter-(\\d+)" captura el número en grupo 1
    regex_capitulo: {
      type: String,
      required: [true, "El regex de capítulo es obligatorio"],
      trim: true,
    },

    // Regex para extraer el título de la página (se aplica al document.title)
    regex_titulo: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt y updatedAt automáticos
  },
);

export default mongoose.model("Dominio", dominioSchema);
