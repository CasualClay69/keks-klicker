"use strict";
// =====================================================
//  HERZREGEN – Minispiel
//  Ab und zu fallen 20 Sekunden lang Herzen vom Himmel. Jedes angetippte zählt,
//  am Ende gibt es einen Bonus. Während einer Season fällt etwas Passendes
//  (siehe "regen" bei den Season-Pässen in skins.js).
//  Gespeichert: spiel.regenBest (bester Regen), spiel.regenAnzahl
//  Diese Datei fasst das HTML nicht an.
// =====================================================

const REGEN = {
  dauerSek: 20,
  proSekunde: 3,           // so viele Teile fallen pro Sekunde
  fallSekMin: 2.6,         // langsamstes / schnellstes Fallen
  fallSekMax: 4.4,
  goldChance: 0.08,        // so oft fällt ein goldenes Teil …
  goldPunkte: 5,           // … das so viele Punkte zählt
  ersteMinuten: [3, 6],    // erster Regen nach 3–6 Minuten
  pauseMinuten: [6, 12],   // danach alle 6–12 Minuten
  seasonPunkteProPunkt: 5,
};

// Ohne Season: Herzen
const REGEN_NORMAL = {
  name: "Herzregen", icon: "💖",
  teile: ["💖", "💗", "💕", "💓"], gold: "💎",
};

// Was gerade fällt: Thema der laufenden Season oder Herzen
function regenThema() {
  const pass = aktiverSeasonPass();
  return (pass && pass.regen) || REGEN_NORMAL;
}

// Bonus am Ende: pro Punkt ~10 Sek. Produktion + 3 Klicks (mind. 20 Herzen pro Punkt)
// -> 30 Punkte ≈ 5 Minuten Produktion
function regenBelohnung(punkte) {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  const proPunkt = Math.max(20, basisHps() * 10 + proKlick * 3);
  return {
    herzen: punkte > 0 ? rundeHuebsch(punkte * proPunkt) : 0,
    seasonPunkte: aktiverSeasonPass() ? punkte * REGEN.seasonPunkteProPunkt : 0,
  };
}

// Regen beenden: Bonus gutschreiben, Rekord merken. Rückgabe: { punkte, herzen, seasonPunkte, stufen, rekord }
function beendeRegen(punkte) {
  const belohnung = regenBelohnung(punkte);
  if (belohnung.herzen) herzenDazu(belohnung.herzen);
  const stufen = belohnung.seasonPunkte ? seasonKlick(belohnung.seasonPunkte) : [];
  const rekord = punkte > (spiel.regenBest || 0);
  spiel.regenBest = Math.max(spiel.regenBest || 0, punkte);
  spiel.regenAnzahl = (spiel.regenAnzahl || 0) + 1;
  return { punkte, ...belohnung, stufen, rekord };
}
