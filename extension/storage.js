// storage.js — Funciones auxiliares para interactuar con la API y chrome.storage.local
// Centraliza todas las llamadas fetch y el acceso a storage para background.js y popup.js

const API_BASE_DEFAULT = "https://novel-tracker-wqec.onrender.com/api";

// ── URL de la API (configurable desde storage) ─────────────────────────────────

async function getApiBase() {
  const { apiBase } = await chrome.storage.local.get({
    apiBase: API_BASE_DEFAULT,
  });
  return apiBase;
}

async function setApiBase(url) {
  await chrome.storage.local.set({ apiBase: url });
}

// ── Caché de dominios ──────────────────────────────────────────────────────────

async function getDominiosCacheados() {
  const { dominios = [] } = await chrome.storage.local.get({ dominios: [] });
  return dominios;
}

async function setDominiosCacheados(dominios) {
  await chrome.storage.local.set({ dominios });
}

// ── Últimos capítulos guardados (historial local) ──────────────────────────────

async function getHistorial() {
  const { historial = [] } = await chrome.storage.local.get({ historial: [] });
  return historial;
}

async function agregarAlHistorial(entrada) {
  const historial = await getHistorial();
  // Máximo 50 entradas, más reciente primero
  const nuevo = [{ ...entrada, savedAt: Date.now() }, ...historial].slice(
    0,
    50,
  );
  await chrome.storage.local.set({ historial: nuevo });
}

// ── Llamadas a la API ──────────────────────────────────────────────────────────

async function getDominios() {
  const base = await getApiBase();
  const res = await fetch(`${base}/dominios`);
  const json = await res.json();
  return json.ok ? json.data : [];
}

async function crearDominio(dominio) {
  const base = await getApiBase();
  const res = await fetch(`${base}/dominios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dominio),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.mensaje);
  return json.data;
}

async function actualizarDominio(id, cambios) {
  const base = await getApiBase();
  const res = await fetch(`${base}/dominios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cambios),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.mensaje);
  return json.data;
}

async function getNovelas(filtros = {}) {
  const base = await getApiBase();
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${base}/novelas?${params}`);
  const json = await res.json();
  return json.ok ? json : { data: [], paginacion: {} };
}

async function getCapitulos(novelaId, opciones = {}) {
  const base = await getApiBase();
  const params = new URLSearchParams({
    novela_id: novelaId,
    ...opciones,
  }).toString();
  const res = await fetch(`${base}/capitulos?${params}`);
  const json = await res.json();
  return json.ok ? json : { data: [], paginacion: {} };
}

async function guardarCompleto(payload) {
  const base = await getApiBase();
  const res = await fetch(`${base}/capitulos/guardar-completo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (json.ok && json.capituloCreado) {
    await agregarAlHistorial({
      novela: json.data.novela.titulo,
      capitulo: payload.capitulo.capitulo_num,
      url: payload.capitulo.url,
    });
  }
  return json;
}

// ── Exportar al scope global (MV3 Service Worker no usa ES modules) ────────────
globalThis.NovelStorage = {
  getApiBase,
  setApiBase,
  getDominiosCacheados,
  setDominiosCacheados,
  getHistorial,
  getDominios,
  crearDominio,
  actualizarDominio,
  getNovelas,
  getCapitulos,
  guardarCompleto,
};
