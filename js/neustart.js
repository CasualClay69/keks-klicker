"use strict";
// =====================================================
//  NEUSTART MIT BONUS ("Prestige")
//  Wer jeden Helfer mindestens einmal hat, kann neu anfangen und bekommt
//  dafür Glitzersterne ⭐. Jeder Stern gibt für immer +10 % Herzen (Produktion und Klicks).
//
//  Zurückgesetzt: Herzen, Helfer, Verbesserungen, Upgrades.
//  Bleibt: Erfolge, Skins, Sticker, Haustier, Season-Pass, Tagesaufgaben, Statistik.
//
//  Gespeichert: spiel.sterne, spiel.gesamtFrueher (Herzen früherer Durchgänge), spiel.neustarts
//  Diese Datei fasst das HTML nicht an.
// =====================================================

const NEUSTART = {
  sternBonus: 0.10,   // +10 % Herzen pro Glitzerstern
  teiler: 2.5e10,     // Sterne insgesamt = Wurzel(Herzen aller Zeiten / 25 Mrd.)
                      // -> erster Neustart nach ~20 Std. Spielzeit bringt ~11 Sterne (+110 %)
};

// Alle jemals gesammelten Herzen (über alle Durchgänge) – zählt auch für die Bestenliste
function herzenAllerZeiten() {
  return (spiel.gesamtFrueher || 0) + spiel.gesamt;
}

function glitzersterne() {
  return spiel.sterne || 0;
}

function sternFaktor() {
  return 1 + glitzersterne() * NEUSTART.sternBonus;
}

// So viele Sterne stehen einem insgesamt zu; neu dazu kommen nur die noch nicht erhaltenen
function moeglicheSterne() {
  return Math.floor(Math.sqrt(herzenAllerZeiten() / NEUSTART.teiler));
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
