"use strict";
// =====================================================
//  SPIELSTAND – was gespeichert wird, und Speichern/Laden
// =====================================================

function neuerSpielstand() {
  return {
    herzen: 0,         // aktuelle Herzen
    gesamt: 0,         // insgesamt gesammelte Herzen
    klicks: 0,         // Klicks auf Marie
    klickHerzen: 0,    // durch Klicks gesammelte Herzen
    sternKlicks: 0,    // gefangene Sternschnuppen
    spielzeit: 0,      // Sekunden
    anzahl: {},        // gekaufte Dinge, z.B. { teddy: 3 }
    erfolge: [],       // IDs freigeschalteter Erfolge
    upgrades: [],      // IDs gekaufter Upgrades
    kaufModus: "1",    // siehe KONFIG.kaufModi
    tonAn: true,
  };
}

let spiel = neuerSpielstand();

// Zeitlich begrenzter Bonus der Sternschnuppe (wird nicht gespeichert)
const KEIN_BONUS = Object.freeze({ prodFaktor: 1, klickFaktor: 1, ende: 0, name: "", text: "" });
let bonus = KEIN_BONUS;

function speichern() {
  try {
    localStorage.setItem(KONFIG.speicherSchluessel, JSON.stringify(spiel));
  } catch (e) { /* Speichern nicht möglich (z.B. privater Modus) */ }
}

function laden() {
  let daten;
  try {
    daten = JSON.parse(localStorage.getItem(KONFIG.speicherSchluessel));
  } catch (e) { return; }
  if (!daten) return;

  // Neue Felder behalten ihren Startwert, falls der Spielstand sie noch nicht kennt
  spiel = Object.assign(neuerSpielstand(), daten);

  if (!KONFIG.kaufModi.includes(spiel.kaufModus)) spiel.kaufModus = "1";
}

function zuruecksetzen() {
  spiel = neuerSpielstand();
  bonus = KEIN_BONUS;
  speichern();
}
