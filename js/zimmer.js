"use strict";
// =====================================================
//  MARIES / HANNAHS ZIMMER
//
//  Ein Zimmer mit festen Plätzen (Wand, Boden, Bett, Lampe …). Für jeden Platz gibt es
//  Teile, die man mit Herzen kauft – oder im Season-Pass (Stufe 15 und 45) bekommt.
//  Jedes Teil, das man besitzt, macht das Zimmer gemütlicher: +1 % Herzen.
//
//  Gespeichert:
//  • spiel.zimmer = { besitz: [gekaufte Teile], platz: { platzId: teilId } }
//    (bleibt beim "Neustart mit Bonus" erhalten)
//  • Season-Teile stehen wie Skins in skinStand.freigeschaltet (überleben "Spielstand löschen")
//
//  Diese Datei fasst das HTML nicht an – das Zimmer zeichnet anzeige.js.
//
//  ── Neues Teil ──────────────────────────────────────
//  Eintrag in ZIMMER_TEILE: { id, platz, name, icon, preis }
//  • wand/boden: farbe (CSS-Hintergrund), muster (Emoji als Tapetenmuster, optional)
//  • teppich:    farbe (CSS-Hintergrund der Teppich-Ellipse)
//  • fenster:    himmel (CSS-Hintergrund), icon = was man draußen sieht
//  • alle anderen: icon ist das Bild (oder svg = eigene Zeichnung, z.B. die Betten);
//    zusatz (kleines Emoji obendrauf) ist optional
// =====================================================

const ZIMMER = {
  bonusProTeil: 0.01,   // +1 % Herzen pro Teil
};

// Die Plätze im Zimmer. pflicht = kann nicht leer sein (Wand, Boden, Fenster)
const ZIMMER_PLAETZE = [
  { id: "wand",      name: "Wand",      icon: "🎨", pflicht: true },
  { id: "boden",     name: "Boden",     icon: "🟫", pflicht: true },
  { id: "fenster",   name: "Fenster",   icon: "🪟", pflicht: true },
  { id: "teppich",   name: "Teppich",   icon: "🟣" },
  { id: "bett",      name: "Bett",      icon: "🛏️" },
  { id: "moebel",    name: "Möbel",     icon: "🛋️" },
  { id: "lampe",     name: "Lampe",     icon: "💡" },
  { id: "wandbild",  name: "Wandbild",  icon: "🖼️" },
  { id: "regal",     name: "Regal",     icon: "📚" },
  { id: "pflanze",   name: "Pflanze",   icon: "🪴" },
  { id: "spielzeug", name: "Spielzeug", icon: "🧸" },
];

// Ein Bett als Zeichnung (Emojis lassen sich nicht zuverlässig umfärben)
function bettSvg(decke, rahmen, extra = "", muster = "") {
  return `<svg viewBox="0 -8 100 78" aria-hidden="true">
    ${extra}
    <rect x="4" y="10" width="14" height="50" rx="6" fill="${rahmen}"/>
    <rect x="84" y="28" width="12" height="32" rx="5" fill="${rahmen}"/>
    <rect x="8" y="56" width="7" height="12" rx="2" fill="${rahmen}"/><rect x="86" y="56" width="7" height="12" rx="2" fill="${rahmen}"/>
    <rect x="10" y="36" width="80" height="18" rx="5" fill="#fff"/>
    <ellipse cx="25" cy="34" rx="11" ry="7" fill="#fff" stroke="#eadbe6" stroke-width="1.5"/>
    <rect x="34" y="31" width="58" height="25" rx="7" fill="${decke}"/>
    ${muster}
    <path d="M34 38 Q63 34 92 38" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.5"/>
  </svg>`;
}
const BETT_PUNKTE = [44, 58, 72, 84].map((x, i) => `<circle cx="${x}" cy="${46 - (i % 2) * 4}" r="2.6" fill="#fff" opacity=".8"/>`).join("");
const BETT_HIMMEL = `<rect x="5" y="-6" width="3" height="66" fill="#d9a441"/><rect x="91" y="-6" width="3" height="66" fill="#d9a441"/>
    <path d="M3 -7 Q50 -14 97 -7 L97 0 Q50 -6 3 0 Z" fill="#c9b6ff"/>
    <path d="M6 -2 Q14 20 9 40 L5 40 Z M93 -2 Q85 20 90 40 L94 40 Z" fill="#e3d8ff" opacity=".9"/>`;

const ZIMMER_TEILE = [
  // ----- Wand -----
  { id: "wand-rosa",     platz: "wand", name: "Rosa",            icon: "🩷", preis: 0, farbe: "#ffe1ee" },
  { id: "wand-mint",     platz: "wand", name: "Mint",            icon: "🩵", preis: 500, farbe: "#dff7ee" },
  { id: "wand-flieder",  platz: "wand", name: "Flieder",         icon: "💜", preis: 5000, farbe: "#ece2ff" },
  { id: "wand-gelb",     platz: "wand", name: "Sonnengelb",      icon: "💛", preis: 50e3, farbe: "#fff5cc" },
  { id: "wand-sterne",   platz: "wand", name: "Sternchen-Tapete", icon: "⭐", preis: 5e6, farbe: "#e6ecff", muster: "⭐" },
  { id: "wand-wolken",   platz: "wand", name: "Wolken-Tapete",   icon: "☁️", preis: 500e6, farbe: "#dceeff", muster: "☁️" },
  { id: "wand-glitzer",  platz: "wand", name: "Glitzer-Tapete",  icon: "✨", preis: 50e9, farbe: "#fff0fa", muster: "✨" },

  // ----- Boden -----
  { id: "boden-holz",    platz: "boden", name: "Holzboden",      icon: "🪵", preis: 0,
    farbe: "repeating-linear-gradient(90deg, #e9c08f 0 18%, #dcae79 18% 19%)" },
  { id: "boden-rosa",    platz: "boden", name: "Rosa Teppichboden", icon: "🎀", preis: 2000, farbe: "#ffc7dd" },
  { id: "boden-schach",  platz: "boden", name: "Schachbrett",    icon: "🏁", preis: 200e3,
    farbe: "repeating-conic-gradient(#fff 0 25%, #ffd1e4 0 50%) 0 0 / 14% 28%" },
  { id: "boden-wolke",   platz: "boden", name: "Wolkenboden",    icon: "☁️", preis: 50e6,
    farbe: "radial-gradient(circle at 20% 40%, #fff 0 14%, transparent 15%), radial-gradient(circle at 70% 70%, #fff 0 12%, transparent 13%), #d9ecff" },
  { id: "boden-gold",    platz: "boden", name: "Goldparkett",    icon: "👑", preis: 20e9,
    farbe: "repeating-linear-gradient(90deg, #ffd977 0 12%, #f2c14e 12% 13%)" },

  // ----- Fenster (was man draußen sieht) -----
  { id: "fenster-tag",     platz: "fenster", name: "Sonniger Tag", icon: "☀️", preis: 0, himmel: "linear-gradient(#8fd3ff, #d6f0ff)" },
  { id: "fenster-regenbogen", platz: "fenster", name: "Regenbogen", icon: "🌈", preis: 80e3, himmel: "linear-gradient(#a8dcff, #eaf7ff)" },
  { id: "fenster-nacht",   platz: "fenster", name: "Sternennacht", icon: "🌙", preis: 8e6, himmel: "linear-gradient(#27306b, #5b4a9e)" },
  { id: "fenster-ballons", platz: "fenster", name: "Ballonfahrt",  icon: "🎈", preis: 800e6, himmel: "linear-gradient(#ffc1dc, #ffe9c7)" },

  // ----- Teppich -----
  { id: "teppich-rosa",    platz: "teppich", name: "Runder Teppich", icon: "🟣", preis: 300, farbe: "#ff9cc9" },
  { id: "teppich-herz",    platz: "teppich", name: "Herzchenteppich", icon: "💗", preis: 30e3,
    farbe: "radial-gradient(circle, #fff 0 8%, transparent 9%) 0 0 / 20% 34%, #ff7eb6" },
  { id: "teppich-regenbogen", platz: "teppich", name: "Regenbogenteppich", icon: "🌈", preis: 3e6,
    farbe: "radial-gradient(#fff 0 18%, #bdb2ff 19% 32%, #9bf6ff 33% 46%, #caffbf 47% 60%, #fdffb6 61% 74%, #ffb3d9 75%)" },
  { id: "teppich-flausch", platz: "teppich", name: "Flauschwolke", icon: "☁️", preis: 300e6,
    farbe: "radial-gradient(#ffffff, #f1e9ff)" },

  // ----- Bett -----
  { id: "bett-einfach",  platz: "bett", name: "Kuschelbett",    icon: "🛏️", preis: 1000, svg: bettSvg("#7fb6ff", "#c98b55") },
  { id: "bett-rosa",     platz: "bett", name: "Rosa Bett",      icon: "🛏️", preis: 100e3, svg: bettSvg("#ff8fbf", "#fff", "", BETT_PUNKTE) },
  { id: "bett-himmel",   platz: "bett", name: "Himmelbett",     icon: "🛏️", preis: 10e6, svg: bettSvg("#b89cff", "#f4e6c8", BETT_HIMMEL, BETT_PUNKTE) },
  { id: "bett-prinzessin", platz: "bett", name: "Prinzessinnenbett", icon: "🛏️", preis: 5e9,
    svg: bettSvg("#ff5c9e", "#ffd23f", BETT_HIMMEL, BETT_PUNKTE), zusatz: "👑" },

  // ----- Möbel -----
  { id: "moebel-stuhl",  platz: "moebel", name: "Stuhl",        icon: "🪑", preis: 200 },
  { id: "moebel-sofa",   platz: "moebel", name: "Sofa",         icon: "🛋️", preis: 20e3 },
  { id: "moebel-klavier", platz: "moebel", name: "Klavier",     icon: "🎹", preis: 2e6 },
  { id: "moebel-puppenhaus", platz: "moebel", name: "Puppenhaus", icon: "🏠", preis: 200e6 },
  { id: "moebel-schloss", platz: "moebel", name: "Spielschloss", icon: "🏰", preis: 50e9 },

  // ----- Lampe -----
  { id: "lampe-birne",   platz: "lampe", name: "Glühbirne",     icon: "💡", preis: 100 },
  { id: "lampe-laterne", platz: "lampe", name: "Laterne",       icon: "🏮", preis: 10e3 },
  { id: "lampe-stern",   platz: "lampe", name: "Sternlampe",    icon: "🌟", preis: 1e6 },
  { id: "lampe-disco",   platz: "lampe", name: "Discokugel",    icon: "🪩", preis: 100e6 },
  { id: "lampe-mond",    platz: "lampe", name: "Mondlampe",     icon: "🌙", preis: 10e9 },

  // ----- Wandbild -----
  { id: "bild-rahmen",   platz: "wandbild", name: "Bilderrahmen", icon: "🖼️", preis: 400 },
  { id: "bild-regenbogen", platz: "wandbild", name: "Regenbogenbild", icon: "🌈", preis: 40e3 },
  { id: "bild-einhorn",  platz: "wandbild", name: "Einhorn-Poster", icon: "🦄", preis: 4e6 },
  { id: "bild-sonne",    platz: "wandbild", name: "Sonnenuntergang", icon: "🌅", preis: 400e6 },
  { id: "bild-kunst",    platz: "wandbild", name: "Kunstwerk",     icon: "🎨", preis: 40e9 },

  // ----- Regal -----
  { id: "regal-buecher", platz: "regal", name: "Bücher",         icon: "📚", preis: 600 },
  { id: "regal-pokal",   platz: "regal", name: "Pokal",          icon: "🏆", preis: 60e3 },
  { id: "regal-geschenke", platz: "regal", name: "Geschenke",    icon: "🎁", preis: 6e6 },
  { id: "regal-kugel",   platz: "regal", name: "Zauberkugel",    icon: "🔮", preis: 600e6 },
  { id: "regal-krone",   platz: "regal", name: "Krone",          icon: "👑", preis: 60e9 },

  // ----- Pflanze -----
  { id: "pflanze-kaktus", platz: "pflanze", name: "Kaktus",      icon: "🌵", preis: 150 },
  { id: "pflanze-topf",  platz: "pflanze", name: "Topfpflanze",  icon: "🪴", preis: 15e3 },
  { id: "pflanze-sonne", platz: "pflanze", name: "Sonnenblume",  icon: "🌻", preis: 1.5e6 },
  { id: "pflanze-kirsch", platz: "pflanze", name: "Kirschblüten", icon: "🌸", preis: 150e6 },
  { id: "pflanze-baum",  platz: "pflanze", name: "Zauberbäumchen", icon: "🌳", preis: 15e9, zusatz: "✨" },

  // ----- Spielzeug -----
  { id: "spiel-teddy",   platz: "spielzeug", name: "Teddy",      icon: "🧸", preis: 250 },
  { id: "spiel-jojo",    platz: "spielzeug", name: "Jo-Jo",      icon: "🪀", preis: 25e3 },
  { id: "spiel-puppe",   platz: "spielzeug", name: "Matroschka", icon: "🪆", preis: 2.5e6 },
  { id: "spiel-karussell", platz: "spielzeug", name: "Karussell", icon: "🎠", preis: 250e6 },
  { id: "spiel-bahn",    platz: "spielzeug", name: "Eisenbahn",  icon: "🚂", preis: 25e9 },
];

// Season-Teile: Stufe 15 und 45 jedes Season-Passes (passend zum Thema)
const ZIMMER_SEASON = {
  s1: { 15: { platz: "spielzeug", name: "Kuschel-Truthahn", icon: "🦃" },
        45: { platz: "wand", name: "Herbstlaub-Tapete", icon: "🍂", farbe: "#fff0dc", muster: "🍂" } },
  s2: { 15: { platz: "pflanze", name: "Weihnachtsbaum", icon: "🎄", zusatz: "⭐" },
        45: { platz: "fenster", name: "Schneefenster", icon: "⛄", himmel: "linear-gradient(#b9d7f2, #f2f8ff)" } },
  s3: { 15: { platz: "spielzeug", name: "Kleiner Schneemann", icon: "☃️" },
        45: { platz: "teppich", name: "Eisteppich", icon: "❄️", farbe: "radial-gradient(#ffffff 0 30%, #bfe3ff 31% 60%, #8ec5ff 61%)" } },
  s4: { 15: { platz: "wandbild", name: "Herzbild", icon: "💝" },
        45: { platz: "wand", name: "Herzchen-Tapete", icon: "💕", farbe: "#ffe6ef", muster: "💕" } },
  s5: { 15: { platz: "spielzeug", name: "Osterhase", icon: "🐰" },
        45: { platz: "teppich", name: "Wiesenteppich", icon: "🌼",
              farbe: "radial-gradient(circle, #fff6a0 0 7%, transparent 8%) 0 0 / 22% 36%, #9be39b" } },
  s6: { 15: { platz: "lampe", name: "Regenbogenlampe", icon: "🌈" },
        45: { platz: "bett", name: "Einhornbett", icon: "🛏️", zusatz: "🦄",
              svg: bettSvg("#d6c2ff", "#fff", "", `<path d="M34 44 h58 v4 h-58 Z" fill="#ffb3d9"/><path d="M34 48 h58 v4 h-58 Z" fill="#9bf6ff"/>`) } },
  s7: { 15: { platz: "regal", name: "Muschelsammlung", icon: "🐚" },
        45: { platz: "fenster", name: "Meerblick", icon: "⛵", himmel: "linear-gradient(#8fd3ff 0 55%, #2f8fd8 56%)" } },
  s8: { 15: { platz: "pflanze", name: "Kürbislaterne", icon: "🎃" },
        45: { platz: "wand", name: "Gespenster-Tapete", icon: "👻", farbe: "#e9e1f7", muster: "👻" } },
};

// Trägt die Season-Teile als Belohnung im Pass ein (für Season 1 und 2 unten, 3–8 in seasons.js)
function registriereZimmerSeason(seasonId) {
  const pass = SEASON_PAESSE.find(p => p.id === seasonId);
  for (const [stufe, daten] of Object.entries(ZIMMER_SEASON[seasonId] || {})) {
    const id = `zimmer-${seasonId}-${stufe}`;
    ZIMMER_TEILE.push({ id, season: seasonId, preis: null, ...daten });
    pass.skinBelohnungen[stufe] = id;
  }
}
registriereZimmerSeason("s1");
registriereZimmerSeason("s2");

// =====================================================
//  ABFRAGEN & AKTIONEN
// =====================================================

function zimmerStand() {
  if (!spiel.zimmer) spiel.zimmer = { besitz: [], platz: {} };
  return spiel.zimmer;
}

function zimmerTeil(id) {
  return ZIMMER_TEILE.find(t => t.id === id);
}

function teileFuerPlatz(platzId) {
  return ZIMMER_TEILE.filter(t => t.platz === platzId);
}

// Besitzt man das Teil? (gekauft, gratis oder aus dem Season-Pass)
function zimmerTeilBesitzt(teil) {
  return teil.preis === 0 || zimmerStand().besitz.includes(teil.id) || skinStand.freigeschaltet.includes(teil.id);
}

// Wie viele Teile gehören einem? (Gratis-Teile zählen nicht für den Bonus)
function anzahlZimmerTeile() {
  return ZIMMER_TEILE.filter(t => t.preis !== 0 && zimmerTeilBesitzt(t)).length;
}

function anzahlZimmerTeileGesamt() {
  return ZIMMER_TEILE.filter(t => t.preis !== 0).length;
}

// Gemütlichkeits-Bonus für Herzen pro Sekunde und pro Klick
function zimmerFaktor() {
  return 1 + ZIMMER.bonusProTeil * anzahlZimmerTeile();
}

// Was steht gerade auf dem Platz? Pflicht-Plätze: sonst das Gratis-Teil. Andere: undefined = leer
function teilAufPlatz(platzId) {
  const teil = zimmerTeil(zimmerStand().platz[platzId]);
  if (teil && teil.platz === platzId && zimmerTeilBesitzt(teil)) return teil;
  const platz = ZIMMER_PLAETZE.find(p => p.id === platzId);
  return platz.pflicht ? teileFuerPlatz(platzId).find(t => t.preis === 0) : undefined;
}

// Sind alle Plätze belegt? (für den Erfolg "Traumzimmer")
function zimmerVoll() {
  return ZIMMER_PLAETZE.every(p => teilAufPlatz(p.id));
}

// Tippen auf ein Teil. Rückgabe: "gekauft" | "hingestellt" | "weggeraeumt" | "zuTeuer" | "gesperrt"
function waehleZimmerTeil(teil) {
  const stand = zimmerStand();
  const platz = ZIMMER_PLAETZE.find(p => p.id === teil.platz);
  if (zimmerTeilBesitzt(teil)) {
    if (teilAufPlatz(teil.platz) === teil) {
      if (platz.pflicht) return "hingestellt";
      delete stand.platz[teil.platz];
      return "weggeraeumt";
    }
    stand.platz[teil.platz] = teil.id;
    return "hingestellt";
  }
  if (teil.preis === null) return "gesperrt";          // nur im Season-Pass
  if (spiel.herzen < teil.preis) return "zuTeuer";
  spiel.herzen -= teil.preis;
  stand.besitz.push(teil.id);
  stand.platz[teil.platz] = teil.id;                     // gleich hinstellen
  return "gekauft";
}
