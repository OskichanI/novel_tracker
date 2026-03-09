// background.js — Service Worker de NovelTracker
// Responsabilidades:
//   1. Sincronizar dominios desde la API al arrancar y cada hora
//   2. Recibir mensajes del content script con datos del capítulo detectado
//   3. Guardar el capítulo en la API y notificar al popup el resultado
//   4. Responder al popup con el estado de la pestaña activa

const API_BASE = "https://novel-tracker-wqec.onrender.com/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getApiBase() {
  const { apiBase } = await chrome.storage.local.get({ apiBase: API_BASE });
  return apiBase;
}

async function guardarCapituloEnAPI(payload) {
  const base = await getApiBase();
  try {
    const response = await fetch(`${base}/capitulos/guardar-completo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch {
    return { ok: false, mensaje: "No se pudo conectar con la API" };
  }
}

async function sincronizarDominios() {
  const base = await getApiBase();
  try {
    const response = await fetch(`${base}/dominios`);
    const resultado = await response.json();
    if (!resultado.ok || !resultado.data.length) return;

    const dominios = resultado.data.map((d) => ({
      dominio: d.nombre,
      regexNovela: d.regex_novela,
      regexCapitulo: d.regex_capitulo,
      regexTitulo: d.regex_titulo || null,
      _id: d._id,
    }));

    await chrome.storage.local.set({ dominios });
    console.log(`🔄 Dominios sincronizados (${dominios.length})`);
  } catch (e) {
    console.warn("⚠️ No se pudo sincronizar dominios:", e.message);
  }
}

// ── Estado por pestaña ─────────────────────────────────────────────────────────
// Guarda el último payload detectado por tabId para que el popup lo consulte
const estadoPorTab = new Map();

// ── Mensajes desde content script o popup ─────────────────────────────────────
chrome.runtime.onMessage.addListener((mensaje, sender, sendResponse) => {
  // — El content script detectó un capítulo —
  if (mensaje.tipo === "CAPITULO_DETECTADO") {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    // Guardar estado para que el popup pueda consultarlo
    estadoPorTab.set(tabId, {
      estado: "detectado",
      ...mensaje,
    });

    // Auto-guardar en la API
    guardarCapituloEnAPI({
      dominio: mensaje.dominio,
      novela: mensaje.novela,
      capitulo: mensaje.capitulo,
    }).then((resultado) => {
      const nuevoEstado = resultado.ok
        ? resultado.capituloCreado
          ? "guardado"
          : "ya_existia"
        : "error";

      estadoPorTab.set(tabId, {
        estado: nuevoEstado,
        mensaje: resultado.mensaje || null,
        ...mensaje,
      });

      // Notificar al popup si está abierto
      chrome.runtime
        .sendMessage({
          tipo: "ESTADO_ACTUALIZADO",
          tabId,
          estado: nuevoEstado,
        })
        .catch(() => {}); // El popup puede no estar abierto, ignorar error
    });

    sendResponse({ ok: true });
    return true;
  }

  // — El popup consulta el estado de la pestaña activa —
  if (mensaje.tipo === "GET_ESTADO_TAB") {
    const datos = estadoPorTab.get(mensaje.tabId) || { estado: "sin_detectar" };
    sendResponse(datos);
    return true;
  }

  // — El popup pide guardar manualmente —
  if (mensaje.tipo === "GUARDAR_MANUAL") {
    guardarCapituloEnAPI({
      dominio: mensaje.dominio,
      novela: mensaje.novela,
      capitulo: mensaje.capitulo,
    }).then((resultado) => {
      sendResponse(resultado);
    });
    return true; // Mantiene el canal abierto para respuesta asíncrona
  }
});

// ── Sincronización al instalar y cada hora ─────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  console.log("🚀 NovelTracker instalado.");
  sincronizarDominios();
  chrome.alarms.create("sincronizarDominios", { periodInMinutes: 60 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "sincronizarDominios") sincronizarDominios();
});

// Limpiar estado cuando se cierra una pestaña
chrome.tabs.onRemoved.addListener((tabId) => {
  estadoPorTab.delete(tabId);
});
