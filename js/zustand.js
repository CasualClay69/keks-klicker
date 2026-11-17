"use strict";
// =====================================================
//  SPIELSTAND – was gespeichert wird, und Speichern/Laden
// =====================================================

function neuerSpielstand() {
  return {
    kekse: 0,          // aktuelle Kekse
    gesamt: 0,         // insgesamt gebackene Kekse
    klicks: 0,         // Klicks auf den Keks
    klickKekse: 0,     // durch Klicks gebackene Kekse
    goldKlicks: 0,     // gefangene goldene Kekse
    spielzeit: 0,      // Sekunden
    anzahl: {},        // gekaufte Gebäude/Klick-Items, z.B. { helfer: 3 }
    erfolge: [],       // IDs freigeschalteter Erfolge
    upgrades: [],      // IDs gekaufter Gebäude-Upgrades
    kaufModus: "1",    // siehe KONFIG.kaufModi
    tonAn: true,
  };
}

let spiel = neuerSpielstand();

// Zeitlich begrenzter Bonus vom goldenen Keks (wird nicht gespeichert)
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

  // Ältere Spielstände hießen "ton" statt "tonAn"
  if ("ton" in daten) { daten.tonAn = daten.ton; delete daten.ton; }

  // Neue Felder behalten ihren Startwert, falls der Spielstand sie noch nicht kennt
  spiel = Object.assign(neuerSpielstand(), daten);

  if (!KONFIG.kaufModi.includes(spiel.kaufModus)) spiel.kaufModus = "1";
}

function zuruecksetzen() {
  spiel = neuerSpielstand();
  bonus = KEIN_BONUS;
  speichern();
}
