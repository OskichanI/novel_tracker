// storage.js — Funciones auxiliares para interactuar con la API desde la extensión
// Centraliza todas las llamadas fetch para que popup.js y background.js las reutilicen

const API_BASE = "http://localhost:3000/api";

// ── Dominios ───────────────────────────────────────────────────────────────────

/**
 * Obtiene todos los dominios registrados en la API.
 * @returns {Promise<Array>} Lista de dominios
 */
async function getDominios() {
  const res = await fetch(`${API_BASE}/dominios`);
  const json = await res.json();
  return json.ok ? json.data : [];
}

/**
 * Registra un nuevo dominio en la API.
 * Si ya existe, devuelve el existente sin error.
 * @param {object} dominio - { nombre, regex_novela, regex_capitulo, regex_titulo? }
 * @returns {Promise<object>} El dominio creado o existente
 */
async function crearDominio(dominio) {
  const res = await fetch(`${API_BASE}/dominios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dominio),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.mensaje);
  return json.data;
}

/**
 * Actualiza los regex de un dominio existente.
 * Útil cuando el sitio web cambia su estructura de URLs.
 * @param {string} id - MongoDB ObjectId del dominio
 * @param {object} cambios - { regex_novela?, regex_capitulo?, regex_titulo? }
 */
async function actualizarDominio(id, cambios) {
  const res = await fetch(`${API_BASE}/dominios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cambios),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.mensaje);
  return json.data;
}

// ── Novelas ────────────────────────────────────────────────────────────────────

/**
 * Lista novelas con soporte de filtros.
 * @param {object} filtros - { dominio_id?, q?, page?, limit? }
 * @returns {Promise<object>} { data, paginacion }
 */
async function getNovelas(filtros = {}) {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_BASE}/novelas?${params}`);
  const json = await res.json();
  return json.ok ? json : { data: [], paginacion: {} };
}

// ── Capítulos ──────────────────────────────────────────────────────────────────

/**
 * Lista capítulos de una novela ordenados por número.
 * @param {string} novelaId - MongoDB ObjectId de la novela
 * @param {object} opciones - { page?, limit?, q? }
 * @returns {Promise<object>} { data, paginacion }
 */
async function getCapitulos(novelaId, opciones = {}) {
  const params = new URLSearchParams({
    novela_id: novelaId,
    ...opciones,
  }).toString();
  const res = await fetch(`${API_BASE}/capitulos?${params}`);
  const json = await res.json();
  return json.ok ? json : { data: [], paginacion: {} };
}

/**
 * Guarda dominio + novela + capítulo en un solo request.
 * Este es el método principal que debe llamar la extensión al detectar un capítulo.
 * @param {object} payload - { dominio, novela, capitulo }
 * @returns {Promise<object>} Resultado con { dominio, novela, capitulo, capituloCreado }
 */
async function guardarCompleto(payload) {
  const res = await fetch(`${API_BASE}/capitulos/guardar-completo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.mensaje);
  return json;
}

// ── Exportar para uso en popup.js y background.js ─────────────────────────────
// En un Service Worker de MV3 no hay módulos ES, así que asignamos al scope global

if (typeof globalThis !== "undefined") {
  globalThis.NovelAPI = {
    getDominios,
    crearDominio,
    actualizarDominio,
    getNovelas,
    getCapitulos,
    guardarCompleto,
  };
}
