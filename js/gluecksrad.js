"use strict";
// =====================================================
//  GLÜCKSRAD – einmal am Tag drehen und einen Bonus gewinnen
//  Gespeichert in spiel.gluecksrad = { letzterTag, gesamt }
//  Diese Datei fasst das HTML nicht an.
// =====================================================

// Die Felder im Uhrzeigersinn, beginnend oben. "gewicht" = relative Chance (Summe 100 = Prozent).
// "kurz" steht auf dem Rad (die Felder sind schmal), "text" ist der volle Name.
const GLUECKSRAD_FELDER = [
  { typ: "herzen",  faktor: 1,  icon: "💖", kurz: "Herzen",  text: "Herzen",        farbe: "#ffd1e6", gewicht: 22 },
  { typ: "rausch",              icon: "🔥", kurz: "Rausch",  text: "Glitzerrausch", farbe: "#e6d6ff", gewicht: 12,
    effekt: { name: "🔥 Glitzerrausch", text: "Herzen x7", prodFaktor: 7, klickFaktor: 1, dauerSek: 60 } },
  { typ: "herzen",  faktor: 2,  icon: "💗", kurz: "x2",      text: "Doppelt",       farbe: "#d4f5e4", gewicht: 16 },
  { typ: "stern",               icon: "🌟", kurz: "Stern",   text: "Sternschnuppe", farbe: "#fff1c9", gewicht: 12 },
  { typ: "season",              icon: "🎟️", kurz: "Season",  text: "Season",        farbe: "#ffd1e6", gewicht: 14 },
  { typ: "klick",               icon: "👆", kurz: "Klicks",  text: "Klickzauber",   farbe: "#e6d6ff", gewicht: 12,
    effekt: { name: "👆 Klickzauber", text: "x10 pro Klick", prodFaktor: 1, klickFaktor: 10, dauerSek: 30 } },
  { typ: "herzen",  faktor: 5,  icon: "💰", kurz: "x5",      text: "Großer Gewinn", farbe: "#d4f5e4", gewicht: 8 },
  { typ: "jackpot", faktor: 20, icon: "💎", kurz: "Jackpot", text: "Jackpot!",      farbe: "#fff1c9", gewicht: 4 },
];
const RAD_SEASON_PUNKTE = 500;
const RAD_JACKPOT_SEASON_PUNKTE = 1000;

function gluecksradStand() {
  if (!spiel.gluecksrad) spiel.gluecksrad = { letzterTag: null, gesamt: 0 };
  return spiel.gluecksrad;
}

// Darf heute noch gedreht werden?
function gluecksradBereit() {
  return gluecksradStand().letzterTag !== datumText();
}

// Grundwert für Herzen-Gewinne: Produktion von 10 Minuten + Wert von 100 Klicks (mind. 300)
function gluecksradBasis() {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  return Math.max(300, basisHps() * 600 + proKlick * 100);
}

// Dreht das Rad: Gewinn auswählen und sofort gutschreiben.
// Rückgabe: { index, feld, herzen, seasonPunkte, stufen } oder null (heute schon gedreht)
function dreheGluecksrad() {
  if (!gluecksradBereit()) return null;
  const feld = zufallGewichtet(GLUECKSRAD_FELDER);
  const index = GLUECKSRAD_FELDER.indexOf(feld);
  const stand = gluecksradStand();
  spiel.gluecksrad = { letzterTag: datumText(), gesamt: (stand.gesamt || 0) + 1 };

  const pass = aktiverSeasonPass();
  const basis = gluecksradBasis();
  let herzen = 0, seasonPunkte = 0;

  switch (feld.typ) {
    case "herzen":
      herzen = rundeHuebsch(basis * feld.faktor);
      break;
    case "jackpot":
      herzen = rundeHuebsch(basis * feld.faktor);
      seasonPunkte = pass ? RAD_JACKPOT_SEASON_PUNKTE : 0;
      break;
    case "season":
      if (pass) seasonPunkte = RAD_SEASON_PUNKTE;
      else herzen = rundeHuebsch(basis * 3);   // keine Season aktiv -> stattdessen Herzen
      break;
    case "rausch":
    case "klick":
      bonus = { ...feld.effekt, ende: Date.now() + feld.effekt.dauerSek * 1000 };
      break;
    // "stern": die Sternschnuppe lässt main.js erscheinen
  }

  if (herzen) herzenDazu(herzen);
  const stufen = seasonPunkte ? seasonKlick(seasonPunkte) : [];
  speichern();
  return { index, feld, herzen, seasonPunkte, stufen };
}
