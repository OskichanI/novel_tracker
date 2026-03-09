// background.js — Service Worker de la extensión NovelTracker
// Detecta capítulos en páginas web y los envía a la API intermedia.
// NUNCA se conecta directamente a MongoDB.

// URL base de la API. Cambia esto si despliegas la API en otro servidor.
const API_BASE = "http://localhost:3000/api";

/**
 * Envía los datos de un capítulo detectado al endpoint "guardar-completo" de la API.
 * Ese endpoint crea el dominio, la novela y el capítulo si no existen.
 *
 * @param {object} datosDominio  - { nombre, regex_novela, regex_capitulo }
 * @param {object} datosNovela   - { titulo, url_novela }
 * @param {object} datosCapitulo - { capitulo_num, titulo?, contenido?, url? }
 */
async function guardarCapituloEnAPI(datosDominio, datosNovela, datosCapitulo) {
  try {
    const response = await fetch(`${API_BASE}/capitulos/guardar-completo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dominio: datosDominio,
        novela: datosNovela,
        capitulo: datosCapitulo,
      }),
    });

    const resultado = await response.json();

    if (!resultado.ok) {
      console.error("❌ Error al guardar en la API:", resultado.mensaje);
      return null;
    }

    const estado = resultado.capituloCreado ? "✅ Guardado" : "ℹ️  Ya existía";
    console.log(
      `${estado} — Novela: "${resultado.data.novela.titulo}" | Cap. ${datosCapitulo.capitulo_num}`,
    );
    return resultado.data;
  } catch (error) {
    console.error("❌ No se pudo conectar con la API:", error.message);
    return null;
  }
}

/**
 * Descarga los dominios configurados desde la API y los guarda en chrome.storage.local
 * para que estén disponibles sin necesidad de consultar la API en cada pestaña.
 */
async function sincronizarDominios() {
  try {
    const response = await fetch(`${API_BASE}/dominios`);
    const resultado = await response.json();

    if (resultado.ok && resultado.data.length > 0) {
      // Adaptar el formato de la API al formato que usa la extensión internamente
      const dominios = resultado.data.map((d) => ({
        dominio: d.nombre,
        regexNovela: d.regex_novela,
        regexCapitulo: d.regex_capitulo,
        regexTitulo: d.regex_titulo,
        _id: d._id,
      }));

      await chrome.storage.local.set({ dominios });
      console.log(
        `🔄 Dominios sincronizados desde la API (${dominios.length})`,
      );
    }
  } catch (error) {
    console.warn(
      "⚠️  No se pudo sincronizar dominios desde la API:",
      error.message,
    );
    // No bloqueante: la extensión usará los dominios guardados localmente si los hay
  }
}

// ── Listener principal ─────────────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  // Ignorar URLs internas del navegador
  if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) return;

  chrome.storage.local.get({ dominios: [] }, async (data) => {
    const url = new URL(tab.url);
    const hostname = url.hostname;

    // Buscar si este dominio está configurado
    const registro = data.dominios.find((d) => d.dominio === hostname);
    if (!registro) return;

    const path = url.pathname;
    const matchNovela = path.match(new RegExp(registro.regexNovela));
    const matchCap = path.match(new RegExp(registro.regexCapitulo));

    if (!matchNovela || !matchCap) return;

    // Número de capítulo extraído (grupo 1 del regex)
    const capituloNum = parseFloat(matchCap[1]);
    if (isNaN(capituloNum)) return;

    console.log(`📖 Detectado capítulo ${capituloNum} en "${hostname}"`);

    // Obtener el título de la pestaña para el capítulo
    const tituloPagina = tab.title || null;

    await guardarCapituloEnAPI(
      // Datos del dominio
      {
        nombre: hostname,
        regex_novela: registro.regexNovela,
        regex_capitulo: registro.regexCapitulo,
        regex_titulo: registro.regexTitulo || null,
      },
      // Datos de la novela (la URL de la novela se construye con el match del regex)
      {
        titulo: tituloPagina || `Novela en ${hostname}`,
        url_novela: `${url.protocol}//${url.hostname}${matchNovela[0]}`,
      },
      // Datos del capítulo
      {
        capitulo_num: capituloNum,
        titulo: tituloPagina,
        url: tab.url,
      },
    );
  });
});

// Sincronizar dominios al instalar/actualizar la extensión
chrome.runtime.onInstalled.addListener(() => {
  console.log("🚀 NovelTracker instalado. Sincronizando dominios...");
  sincronizarDominios();
});

// Re-sincronizar dominios una vez por hora
chrome.alarms.create("sincronizarDominios", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "sincronizarDominios") {
    sincronizarDominios();
  }
});
