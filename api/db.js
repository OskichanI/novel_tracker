// db.js — Conexión a MongoDB Atlas usando Mongoose
// La URI se lee desde el archivo .env para no exponer credenciales en el código

import mongoose from "mongoose";

/**
 * Conecta a MongoDB Atlas. Llama a esta función al arrancar el servidor.
 * Usa el patrón singleton: si ya hay conexión activa, no crea una nueva.
 */
async function conectarDB() {
  // Si ya está conectado, no hacemos nada
  if (mongoose.connection.readyState !== 0) {
    console.log("ℹ️  Mongoose ya está conectado.");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB Atlas");
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB Atlas:", error.message);
    // Terminar el proceso si no hay DB — la API no puede funcionar sin ella
    process.exit(1);
  }
}

// Eventos de la conexión para monitoreo
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  Mongoose desconectado de MongoDB Atlas");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 Mongoose reconectado a MongoDB Atlas");
});

export default conectarDB;
