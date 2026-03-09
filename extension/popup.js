document.getElementById("guardar").addEventListener("click", () => {
  const dominio = document.getElementById("dominio").value;
  const regexNovela = document.getElementById("regexNovela").value;
  const regexCapitulo = document.getElementById("regexCapitulo").value;

  chrome.storage.local.get({ dominios: [] }, (data) => {
    const nuevos = [...data.dominios, { dominio, regexNovela, regexCapitulo }];
    chrome.storage.local.set({ dominios: nuevos }, () => {
      alert("Dominio guardado");
    });
  });
});
