"use strict";
// =====================================================
//  SKINS & SEASON-PÄSSE
//
//  Vier Kategorien: Hintergrund, Hut, HUD, Musik.
//  Am Anfang ist nur der "normale" Skin jeder Kategorie freigeschaltet
//  (standard: true). Weitere Skins kommen später über Season-Pässe.
//
//  ── So fügst du einen neuen Skin hinzu ──────────────
//  1. Eintrag in SKINS anlegen, mit season: "<id des Season-Passes>"
//  2. Je nach Kategorie:
//     • hintergrund: CSS-Regeln für body[data-hintergrund="<wert>"] in style.css
//     • hut:         SVG-Code im Feld "svg" (Koordinaten wie in Maries Zeichnung,
//                    viewBox -10 0 220 220, Kopf-Oberkante bei etwa y = 34)
//     • hud:         Farben im Feld "farben" (CSS-Variablen aus style.css :root)
//     • musik:       Noten im Feld "musik" (wie SPIELUHR unten)
//  3. Die Skin-ID beim Season-Pass in SEASON_PAESSE eintragen.
//  4. In sw.js die VERSION erhöhen.
// =====================================================

const SKIN_KATEGORIEN = [
  { id: "hintergrund", name: "Hintergrund",   icon: "🖼️" },
  { id: "hut",         name: "Hut für Marie", icon: "👒" },
  { id: "hud",         name: "HUD-Farben",    icon: "🎨" },
  { id: "musik",       name: "Musik",         icon: "🎵" },
];

// ----- Musikstücke -----
// Noten als [Name, Länge in Achteln]. null = Pause. Jeder Takt = 8 Achtel.

// "Spieluhr" – Akkorde: C – Am – F – G | C – Am – F/G – C
const SPIELUHR = {
  achtelSek: 0.27,
  melodie: [
    ["E5", 1], ["G5", 1], ["C6", 2], ["G5", 1], ["E5", 1], ["G5", 2],   // C
    ["A5", 1], ["C6", 1], ["E5", 2], ["A5", 2], ["G5", 2],              // Am
    ["F5", 1], ["A5", 1], ["C6", 2], ["A5", 1], ["F5", 1], ["A5", 2],   // F
    ["G5", 2], ["B5", 1], ["D6", 1], ["B5", 2], ["G5", 2],              // G
    ["E5", 1], ["G5", 1], ["C6", 2], ["D6", 1], ["C6", 1], ["B5", 1], ["A5", 1],   // C
    ["A5", 2], ["E5", 2], ["C6", 2], ["A5", 2],                         // Am
    ["F5", 1], ["A5", 1], ["C6", 1], ["A5", 1], ["G5", 1], ["B5", 1], ["D6", 1], ["B5", 1],   // F – G
    ["C6", 4], ["G5", 2], [null, 2],                                    // C
  ],
  // Bass: Grundton und Quinte
  bass: [
    ["C3", 4], ["G3", 4],  ["A2", 4], ["E3", 4],
    ["F2", 4], ["C3", 4],  ["G2", 4], ["D3", 4],
    ["C3", 4], ["G3", 4],  ["A2", 4], ["E3", 4],
    ["F2", 4], ["G2", 4],  ["C3", 4], ["C3", 4],
  ],
};

// ----- Alle Skins -----

const SKINS = [
  // Hintergrund – das Aussehen steht in style.css (body[data-hintergrund="..."])
  { id: "hintergrund-normal", kategorie: "hintergrund", standard: true,
    name: "Herzchen-Wolke", icon: "💗", wert: "normal" },

  // Hut – SVG-Code, der auf Maries Kopf gezeichnet wird
  { id: "hut-normal", kategorie: "hut", standard: true,
    name: "Rosa Schleife", icon: "🎀",
    svg: `<g transform="translate(140 46) rotate(20)">
            <path d="M0 0 L-24 -14 Q-29 0 -24 14 Z" fill="#ff4f9a"/>
            <path d="M0 0 L24 -14 Q29 0 24 14 Z" fill="#ff4f9a"/>
            <path d="M-20 -8 Q-23 0 -20 8 M20 -8 Q23 0 20 8" stroke="#ff9cc9" stroke-width="2" fill="none"/>
            <circle r="7" fill="#ff7eb6"/>
          </g>` },

  // HUD – Farben der Oberfläche. Leer = die Standardfarben aus style.css
  { id: "hud-normal", kategorie: "hud", standard: true,
    name: "Zuckerwatte", icon: "🍬", farben: {} },

  // Musik
  { id: "musik-normal", kategorie: "musik", standard: true,
    name: "Spieluhr", icon: "🎶", musik: SPIELUHR },

  // ── Beispiel für einen späteren Season-Skin (auskommentiert) ──
  // { id: "hud-minze", kategorie: "hud", season: "s1",
  //   name: "Minz-Eis", icon: "🍦",
  //   farben: { "--akzent": "#2ec4a6", "--akzent-dunkel": "#178f78", "--rand": "#b5eadf",
  //             "--hintergrund": "#e3fbf5", "--hintergrund-2": "#e8f0ff", "--panel": "#f4fffc" } },
];

// ----- Season-Pässe (kommen später) -----
// Beispiel:
// { id: "s1", name: "Season 1: Frühlingszauber", icon: "🌸", skins: ["hud-minze"] },
const SEASON_PAESSE = [];

// =====================================================
//  ABFRAGEN & AKTIONEN (Spielstand der Skins steht in zustand.js: skinStand)
// =====================================================

function skinsDerKategorie(kategorie) {
  return SKINS.filter(s => s.kategorie === kategorie);
}

function skinFreigeschaltet(skin) {
  return skin.standard || skinStand.freigeschaltet.includes(skin.id);
}

// Der gewählte Skin einer Kategorie – oder der normale, falls nichts (Gültiges) gewählt ist
function aktiverSkin(kategorie) {
  const gewaehlt = SKINS.find(s => s.id === skinStand.aktiv[kategorie] && s.kategorie === kategorie);
  if (gewaehlt && skinFreigeschaltet(gewaehlt)) return gewaehlt;
  return SKINS.find(s => s.kategorie === kategorie && s.standard);
}

// Gibt true zurück, wenn der Skin gewählt werden konnte
function waehleSkin(skin) {
  if (!skinFreigeschaltet(skin)) return false;
  skinStand.aktiv[skin.kategorie] = skin.id;
  return true;
}

// Für später: schaltet alle Skins eines Season-Passes frei
function schalteSeasonFrei(seasonId) {
  const pass = SEASON_PAESSE.find(p => p.id === seasonId);
  if (!pass) return false;
  for (const id of pass.skins) {
    if (!skinStand.freigeschaltet.includes(id)) skinStand.freigeschaltet.push(id);
  }
  speichereSkins();
  return true;
}

function seasonName(seasonId) {
  const pass = SEASON_PAESSE.find(p => p.id === seasonId);
  return pass ? pass.name : "Season-Pass";
}
