// content.js — Content Script de NovelTracker
// Se inyecta en todas las páginas web.
// Su única responsabilidad: detectar si la página es un capítulo de novela
// y enviar los datos extraídos al background script.
// NO hace fetch a la API directamente.

(async () => {
  // Pedimos al background los dominios cacheados
  const { dominios = [] } = await chrome.storage.local.get({ dominios: [] });

  const hostname = location.hostname;
  const path = location.pathname;

  const registro = dominios.find((d) => d.dominio === hostname);
  if (!registro) return; // Sitio no configurado → salir silenciosamente

  const matchNovela = path.match(new RegExp(registro.regexNovela));
  const matchCap = path.match(new RegExp(registro.regexCapitulo));

  if (!matchNovela || !matchCap) return; // URL no es un capítulo

  const capituloNum = parseFloat(matchCap[1]);
  if (isNaN(capituloNum)) return;

  // Extraer título limpio usando regex_titulo sobre document.title, si existe
  let tituloCapitulo = document.title || null;
  if (registro.regexTitulo && tituloCapitulo) {
    const matchTitulo = tituloCapitulo.match(new RegExp(registro.regexTitulo));
    if (matchTitulo?.[1]) tituloCapitulo = matchTitulo[1].trim();
  }

  // Construir la URL base de la novela a partir del match del regex
  const urlNovela = `${location.protocol}//${location.hostname}${matchNovela[0]}`;

  const payload = {
    tipo: "CAPITULO_DETECTADO",
    dominio: {
      nombre: hostname,
      regex_novela: registro.regexNovela,
      regex_capitulo: registro.regexCapitulo,
      regex_titulo: registro.regexTitulo || null,
      _id: registro._id || null,
    },
    novela: {
      titulo: tituloCapitulo || `Novela en ${hostname}`,
      url_novela: urlNovela,
    },
    capitulo: {
      capitulo_num: capituloNum,
      titulo: tituloCapitulo,
      url: location.href,
    },
  };

  // Notificar al background script con los datos extraídos
  chrome.runtime.sendMessage(payload);
})();
