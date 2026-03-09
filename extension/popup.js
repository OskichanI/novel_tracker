// popup.js — Lógica del popup de NovelTracker
// Consulta al background el estado de la pestaña activa y gestiona el botón de guardado.

const elSite = document.getElementById("site");
const elNovel = document.getElementById("novel");
const elChapter = document.getElementById("chapter");
const btnSave = document.getElementById("btn-save");
const elStatus = document.getElementById("status");
const elNotChapter = document.getElementById("not-chapter");

let datosActuales = null; // Payload del capítulo detectado

// ── Helpers UI ─────────────────────────────────────────────────────────────────

function setStatus(tipo, texto) {
  elStatus.className = `show ${tipo}`;
  elStatus.textContent = texto;
}

function clearStatus() {
  elStatus.className = "";
  elStatus.textContent = "";
}

function setInfo(site, novel, chapter) {
  elSite.textContent = site || "—";
  elNovel.textContent = novel || "—";
  elChapter.textContent = chapter !== undefined ? `Chapter ${chapter}` : "—";

  const hayDatos = site && novel && chapter !== undefined;
  elSite.classList.toggle("dim", !site);
  elNovel.classList.toggle("dim", !novel);
  elChapter.classList.toggle("dim", !chapter);
  return hayDatos;
}

// ── Truncar texto largo para la UI ────────────────────────────────────────────
function truncar(texto, max = 28) {
  if (!texto) return texto;
  return texto.length > max ? texto.slice(0, max) + "…" : texto;
}

// ── Cargar estado desde el background ─────────────────────────────────────────
async function cargarEstado() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const datos = await chrome.runtime.sendMessage({
    tipo: "GET_ESTADO_TAB",
    tabId: tab.id,
  });

  if (!datos || datos.estado === "sin_detectar") {
    elNotChapter.style.display = "block";
    setInfo(tab.url ? new URL(tab.url).hostname : null, null, null);
    btnSave.disabled = true;
    return;
  }

  // Hay datos del capítulo detectado
  datosActuales = datos;
  elNotChapter.style.display = "none";

  const novelaSlug = datos.novela?.titulo || datos.novela?.url_novela || null;
  setInfo(
    datos.dominio?.nombre,
    truncar(novelaSlug),
    datos.capitulo?.capitulo_num,
  );

  // Mostrar estado según lo que ya hizo el auto-save
  switch (datos.estado) {
    case "guardado":
      btnSave.disabled = true;
      setStatus("saved", "✅ Saved!");
      break;
    case "ya_existia":
      btnSave.disabled = true;
      setStatus("exists", "ℹ️ Already saved");
      break;
    case "error":
      btnSave.disabled = false;
      setStatus("error", "⚠️ Error — tap to retry");
      break;
    case "detectado":
    default:
      // Auto-save en curso, habilitar botón por si quiere forzarlo
      btnSave.disabled = false;
      clearStatus();
  }
}

// ── Botón guardar ──────────────────────────────────────────────────────────────
btnSave.addEventListener("click", async () => {
  if (!datosActuales) return;

  btnSave.disabled = true;
  setStatus("loading", "Saving…");

  const resultado = await chrome.runtime.sendMessage({
    tipo: "GUARDAR_MANUAL",
    dominio: datosActuales.dominio,
    novela: datosActuales.novela,
    capitulo: datosActuales.capitulo,
  });

  if (!resultado) {
    setStatus("error", "⚠️ No response from API");
    btnSave.disabled = false;
    return;
  }

  if (resultado.ok) {
    setStatus(
      resultado.capituloCreado ? "saved" : "exists",
      resultado.capituloCreado ? "✅ Saved!" : "ℹ️ Already saved",
    );
  } else {
    setStatus("error", `⚠️ ${resultado.mensaje || "Unknown error"}`);
    btnSave.disabled = false;
  }
});

// ── Escuchar actualizaciones en tiempo real desde el background ────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.tipo === "ESTADO_ACTUALIZADO") {
    cargarEstado(); // Refrescar al recibir notificación del background
  }
});

// ── Init ───────────────────────────────────────────────────────────────────────
cargarEstado();
