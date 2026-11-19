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
    wochenmissionen: null, // die 3 Wochen-Missionen (siehe wochenmissionen.js)
    wochenBoni: 0,
    familienziele: [],
    feiertage: {},     // Feiertags-Geschenke: { nikolaus: 2026, … } (siehe feiertage.js)
    stickerVerschickt: 0,  // Sticker-Post (siehe stickerpost.js)
    wunderGesehen: "", // geheime Ereignisse: "Tag:id", wenn das Fenster schon kam (siehe wunder.js)
    wunderErlebt: {},
    ausfluegeGesamt: 0, // beendete Haustier-Ausflüge (siehe ausfluege.js)
    advent: null,      // Adventskalender: { jahr, offen: [Tage] } (siehe advent.js)
    unendlichAm: null, // wann 10³⁰⁸ Herzen erreicht wurden (siehe unendlich.js)
    skills: [],        // gelernte Fähigkeiten der Sternen-Karte (siehe skills.js)
    erklaert: [],      // welche Erklärungen Marie schon gegeben hat (siehe erklaerungen.js)
    automatik: {},     // Automatik an/aus: { klick, kaufen, helfer, sterne, fuettern }
    stickerBekommen: 0,
    geschenk: null,    // tägliches Geschenk: { letzterTag, serie, beste } (siehe geschenk.js)
    gluecksrad: null,  // Glücksrad: { letzterTag, gesamt } (siehe gluecksrad.js)
    sticker: {},       // Sticker-Album: { stickerId: anzahl } (siehe album.js)
    stickerNeu: [],    // neue, noch nicht angeschaute Sticker
    haustier: null,    // Maries Haustier (siehe haustier.js)
    geburtstagJahr: null, // alt: Jahr, in dem Marie ihr Geburtstagsgeschenk geöffnet hat
    geburtstagJahre: {},  // pro Figur: Jahr, in dem das Geburtstagsgeschenk geöffnet wurde (siehe geburtstag.js)
    regenBest: 0,      // bester Herzregen (Punkte)
    regenAnzahl: 0,    // so viele Herzregen gab es schon
    sterne: 0,         // Glitzersterne aus "Neustart mit Bonus" (siehe neustart.js)
    gesamtFrueher: 0,  // Herzen aus früheren Durchgängen
    neustarts: 0,
    zuletztAktiv: 0,   // Zeitpunkt (ms), zu dem das Spiel zuletzt lief – für den Offline-Fortschritt
    zimmer: { besitz: [], platz: {} },
    minispiele: null,
    haustier2: null,   // zweites Haustier (ab Level 50 des ersten, siehe haustier.js)
    tierZubehoer: [],  // gekauftes Tier-Zubehör
    bestenliste: null, // Anmeldung für die Online-Bestenliste (Kopie, siehe bestenliste.js)  // Minispiele: Rekorde und wie oft heute gespielt (siehe minispiele.js)   // Maries Zimmer (siehe zimmer.js)
    offlineMax: 0,     // längste Abwesenheit in Sekunden (für den Erfolg "Über Nacht")
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
  const standard = neuerSpielstand();
  spiel = Object.assign(standard, daten);

  // Reparatur: Zahlen, die kaputt gespeichert wurden (null/NaN), bekommen ihren Startwert zurück
  for (const [schluessel, start] of Object.entries(neuerSpielstand())) {
    if (typeof start === "number" && !Number.isFinite(spiel[schluessel])) {
      spiel[schluessel] = spiel[schluessel] === Infinity ? Number.MAX_VALUE : start;
    }
  }

  if (!KONFIG.kaufModi.includes(spiel.kaufModus)) spiel.kaufModus = "1";
}

// "Spielstand löschen" setzt nur das Spiel zurück – Skins (z.B. aus Season-Pässen) bleiben
function zuruecksetzen() {
  const anmeldung = spiel.bestenliste;   // in der Bestenliste bleibt man trotzdem angemeldet
  spiel = neuerSpielstand();
  spiel.bestenliste = anmeldung;
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
