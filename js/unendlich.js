"use strict";
// =====================================================
//  ∞ UNENDLICH – das ultimative Ziel
//  Größer als etwa 1,8 · 10³⁰⁸ kann der Computer keine Zahl speichern, danach kommt nur noch
//  "Infinity". Wer 10³⁰⁸ Herzen (aller Zeiten) gesammelt hat, hat das Spiel durchgespielt:
//  große Feier, Erfolg "Unendlich!" und der Unendlichkeits-Pokal fürs Zimmer.
//
//  Gespeichert: spiel.unendlichAm = Zeitpunkt (ms), wann es geschafft wurde
//  Der Pokal steht wie Season-Teile in skinStand.freigeschaltet (überlebt auch "Spielstand löschen").
//  Diese Datei fasst das HTML nicht an (Bildschirm: unendlich-ui.js).
// =====================================================

const UNENDLICH = {
  ziel: 1e308,
  pokal: "zimmer-unendlich",
};

ZIMMER_TEILE.push(
  { id: UNENDLICH.pokal, platz: "regal", name: "Unendlichkeits-Pokal", icon: "🏆", zusatz: "♾️", preis: null, unendlich: true },
);

function unendlichErreicht() {
  return herzenAllerZeiten() >= UNENDLICH.ziel;
}

// Wie weit ist man? 0 … 1 – logarithmisch (jede Stelle mehr zählt gleich viel)
function wegZurUnendlichkeit() {
  const h = herzenAllerZeiten();
  if (h <= 1) return 0;
  return Math.min(1, Math.log10(h) / 308);
}

// Gerade geschafft? Dann merken und Pokal freischalten. Rückgabe: true beim ersten Mal
function pruefeUnendlichErreicht() {
  if (spiel.unendlichAm || !unendlichErreicht()) return false;
  spiel.unendlichAm = Date.now();
  if (!skinStand.freigeschaltet.includes(UNENDLICH.pokal)) {
    schalteSkinFrei(UNENDLICH.pokal);
    speichereSkins();
  }
  speichern();
  return true;
}
