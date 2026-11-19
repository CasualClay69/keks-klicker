"use strict";
// =====================================================
//  ∞ UNENDLICH – die große Feier (Regeln: unendlich.js)
// =====================================================

function zeigeUnendlichFeier() {
  setzeText($("unText"), `Du hast 10³⁰⁸ ${waehrung().name} gesammelt – eine 1 mit 308 Nullen! Mehr Zahlen gibt es nicht. Du hast ${figurName()} Clicker durchgespielt!`);
  $("unendlichOverlay").hidden = false;
  sound.erfolg();
  setTimeout(() => sound.stern(), 400);
  setTimeout(() => sound.erfolg(), 900);
  const karte = $("unendlichOverlay").querySelector(".geschenkKarte");
  for (const ms of [0, 500, 1000, 1600, 2400]) {
    setTimeout(() => { konfetti(karte); konfetti($("spielfeld")); }, ms);
  }
  setTimeout(() => sag("unendlich", { wichtig: true }), 800);
}

// 1× pro Sekunde aus main.js
function pruefeUnendlich() {
  if (!pruefeUnendlichErreicht()) return;
  zeigeUnendlichFeier();
  pruefeErfolgeUndStatistik();
}

function richteUnendlichEin() {
  $("unZu").addEventListener("click", () => {
    $("unendlichOverlay").hidden = true;
    sound.klick();
  });
}
