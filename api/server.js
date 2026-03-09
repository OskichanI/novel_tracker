// server.js — Punto de entrada del servidor Express
// Carga variables de entorno, conecta a la DB y monta todas las rutas

import "dotenv/config"; // Carga el archivo .env en process.env

import express from "express";
import cors from "cors";
import conectarDB from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware global ──────────────────────────────────────────────────────────

// CORS: permite peticiones desde la extensión del navegador
// En producción reemplaza CORS_ORIGIN con la URL exacta o el ID de la extensión
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Parsear JSON en el body de las peticiones
app.use(express.json({ limit: "5mb" })); // 5mb para permitir capítulos largos

// Log básico de peticiones (útil en desarrollo)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Rutas de la API ────────────────────────────────────────────────────────────
import rutasDominios from "./routes/dominios.js";
import rutasNovelas from "./routes/novelas.js";
import rutasCapitulos from "./routes/capitulos.js";

app.use("/api/dominios", rutasDominios);
app.use("/api/novelas", rutasNovelas);
app.use("/api/capitulos", rutasCapitulos);

// Ruta de salud — útil para verificar que la API está viva
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mensaje: "NovelTracker API funcionando correctamente" });
});

// ── Manejo de errores 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, mensaje: "Ruta no encontrada" });
});

// ── Manejo de errores globales ─────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("❌ Error no controlado:", err);
  res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
});

// ── Arrancar ───────────────────────────────────────────────────────────────────
async function arrancar() {
  await conectarDB(); // Esperar la conexión a MongoDB antes de aceptar peticiones
  app.listen(PORT, () => {
    console.log(`🚀 NovelTracker API escuchando en http://localhost:${PORT}`);
  });
}

arrancar();
