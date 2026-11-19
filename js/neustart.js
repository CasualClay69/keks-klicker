"use strict";
// =====================================================
//  NEUSTART MIT BONUS ("Prestige")
//  Wer jeden Helfer mindestens einmal hat, kann neu anfangen und bekommt
//  dafür Glitzersterne ⭐. Die Sterne sind Skillpunkte für die Sternen-Karte (skills.js).
//
//  Zurückgesetzt: Herzen, Helfer, Verbesserungen, Upgrades.
//  Bleibt: Erfolge, Skins, Sticker, Haustier, Season-Pass, Tagesaufgaben, Statistik.
//
//  Gespeichert: spiel.sterne, spiel.gesamtFrueher (Herzen früherer Durchgänge), spiel.neustarts
//  Diese Datei fasst das HTML nicht an.
// =====================================================

const NEUSTART = {
  stellenProStern: 3,   // Sterne insgesamt = (Stellen der Herzen aller Zeiten) / 3
                        // -> 1 Billion (10¹²) = 4 Sterne, ∞ (10³⁰⁸) = 102 Sterne – genug für die ganze Sternen-Karte (98)
};

// Alle jemals gesammelten Herzen (über alle Durchgänge) – zählt auch für die Bestenliste
function herzenAllerZeiten() {
  return Math.min(Number.MAX_VALUE, (spiel.gesamtFrueher || 0) + spiel.gesamt);
}

function glitzersterne() {
  return spiel.sterne || 0;
}

// So viele Sterne stehen einem insgesamt zu; neu dazu kommen nur die noch nicht erhaltenen
function moeglicheSterne() {
  const f = typeof skillNeustartFaktor === "function" ? skillNeustartFaktor() : 1;   // "Glitzerregen" (skills.js)
  const h = herzenAllerZeiten();
  if (!(h >= 10)) return 0;
  return Math.floor(Math.log10(h) / NEUSTART.stellenProStern * f + 1e-9);
}

function neueSterne() {
  return Math.max(0, moeglicheSterne() - glitzersterne());
}

function alleHelferGekauft() {
  return GEBAEUDE.every(g => anzahl(g) >= 1);
}

function neustartMoeglich() {
  return alleHelferGekauft() && neueSterne() > 0;
}

// Neustart durchführen. Rückgabe: Anzahl neuer Sterne oder null
function macheNeustart() {
  if (!neustartMoeglich()) return null;
  const neu = neueSterne();
  spiel.sterne = glitzersterne() + neu;
  spiel.gesamtFrueher = herzenAllerZeiten();
  spiel.neustarts = (spiel.neustarts || 0) + 1;

  spiel.herzen = 0;
  spiel.gesamt = 0;
  spiel.anzahl = {};
  spiel.upgrades = [];
  bonus = KEIN_BONUS;

  // Tagesaufgabe "Sammle X Herzen": bisherigen Fortschritt behalten
  if (spiel.aufgaben) {
    for (const a of spiel.aufgaben.liste) {
      if (a.typ === "herzen" && !a.erledigt) a.start = -a.fortschritt;
    }
  }
  speichern();
  return neu;
}
