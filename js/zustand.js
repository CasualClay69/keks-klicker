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
    maxFinger: 0,      // meiste Finger gleichzeitig auf Marie (Multitouch)
    sternKlicks: 0,    // gefangene Sternschnuppen
    spielzeit: 0,      // Sekunden
    anzahl: {},        // gekaufte Dinge, z.B. { teddy: 3 }
    erfolge: [],       // IDs freigeschalteter Erfolge
    upgrades: [],      // IDs gekaufter Upgrades
    aufgaben: null,    // Tagesaufgaben (siehe aufgaben.js)
    aufgabenGesamt: 0, // insgesamt erledigte Tagesaufgaben
    kaufModus: "1",    // siehe KONFIG.kaufModi
    tonAn: true,       // Klang-Effekte
    musikAn: true,     // Hintergrund-Melodie
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
  speichereSkins();   // inkl. Season-Pass-Fortschritt
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

// "Spielstand löschen" setzt nur das Spiel zurück – Skins (z.B. aus Season-Pässen) bleiben
function zuruecksetzen() {
  spiel = neuerSpielstand();
  bonus = KEIN_BONUS;
  speichern();
}

// =====================================================
//  SKINS – eigener Speicher, unabhängig vom Spielstand
// =====================================================

// freigeschaltet: Skin-IDs · aktiv: gewählter Skin je Kategorie · seasons: Pass-Fortschritt je Pass-ID
let skinStand = { freigeschaltet: [], aktiv: {}, seasons: {} };

function speichereSkins() {
  try {
    localStorage.setItem(KONFIG.skinSchluessel, JSON.stringify(skinStand));
  } catch (e) { /* Speichern nicht möglich */ }
}

function ladeSkins() {
  try {
    const daten = JSON.parse(localStorage.getItem(KONFIG.skinSchluessel));
    if (daten) {
      skinStand = {
        freigeschaltet: Array.isArray(daten.freigeschaltet) ? daten.freigeschaltet : [],
        aktiv: daten.aktiv && typeof daten.aktiv === "object" ? daten.aktiv : {},
        seasons: daten.seasons && typeof daten.seasons === "object" ? daten.seasons : {},
      };
    }
  } catch (e) { /* kaputte Daten -> Standard behalten */ }
}
