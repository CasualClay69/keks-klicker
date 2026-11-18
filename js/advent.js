"use strict";
// =====================================================
//  ADVENTSKALENDER (1.–24. Dezember)
//  Jeden Tag ein Türchen: Herzen, ein Sticker (im Dezember von der Weihnachts-Seite)
//  und Season-Punkte. An jedem 4. Tag ein Weihnachts-Teil fürs Zimmer,
//  am 24. etwas Großes: der prächtige Christbaum, 3 Sticker und viele Herzen.
//  Verpasste Türchen kann man bis Silvester nachholen – Türchen aus der Zukunft bleiben zu.
//
//  Gespeichert: spiel.advent = { jahr, offen: [Tage] }
//  Diese Datei fasst das HTML nicht an (Bildschirm: advent-ui.js).
// =====================================================

const ADVENT = {
  seasonPunkte: 300,
  heiligabendFaktor: 5,   // Türchen 24: 5× Herzen, 3 Sticker, 5× Season-Punkte
};

// Weihnachts-Teile fürs Zimmer – nur aus dem Adventskalender
const ADVENT_TEILE = {
  4:  { id: "zimmer-adventskranz",  platz: "regal",     name: "Adventskranz",       icon: "🕯️", zusatz: "🌲" },
  8:  { id: "zimmer-plaetzchen",    platz: "spielzeug", name: "Plätzchenteller",    icon: "🍪", zusatz: "⭐" },
  12: { id: "zimmer-lichtertapete", platz: "wand",      name: "Lichterketten-Tapete", icon: "✨", farbe: "#fff3e0", muster: "✨" },
  16: { id: "zimmer-sternenlampe",  platz: "lampe",     name: "Sternenlampe",       icon: "🌟" },
  20: { id: "zimmer-weihnachtsnacht", platz: "fenster", name: "Weihnachtsnacht",    icon: "🎅", himmel: "linear-gradient(#1c2a5a, #4a5fa0)" },
  24: { id: "zimmer-christbaum",    platz: "pflanze",   name: "Prächtiger Christbaum", icon: "🎄", zusatz: "🎁" },
};
for (const [tag, teil] of Object.entries(ADVENT_TEILE)) {
  ZIMMER_TEILE.push({ ...teil, preis: null, advent: Number(tag) });
}

// Admin-Menü: so tun, als wäre heute der n-te Dezember (ohne Belohnungen, nicht gespeichert)
let adventTestTag = null;
let adventTestOffen = [];

// Der wievielte Dezember ist heute? 0 = nicht Dezember
function adventHeute(datum = new Date(Date.now())) {
  if (adventTestTag) return adventTestTag;
  return datum.getMonth() === 11 ? datum.getDate() : 0;
}

function adventAktiv() {
  return adventHeute() > 0;
}

function adventStand() {
  if (adventTestTag) return { jahr: 0, offen: adventTestOffen };
  const jahr = new Date(Date.now()).getFullYear();
  if (!spiel.advent || spiel.advent.jahr !== jahr) spiel.advent = { jahr, offen: [] };
  return spiel.advent;
}

function tuerOffen(tag) {
  return adventStand().offen.includes(tag);
}

// Darf man dieses Türchen jetzt öffnen? (heute oder verpasst, noch zu)
function tuerBereit(tag) {
  return adventAktiv() && tag <= adventHeute() && !tuerOffen(tag);
}

function anzahlBereiteTueren() {
  let n = 0;
  for (let tag = 1; tag <= 24; tag++) if (tuerBereit(tag)) n++;
  return n;
}

// Herzen hinter dem Türchen: ~30 Min. Produktion + 300 Klicks, wird bis Weihnachten mehr
function adventHerzen(tag) {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  const basis = Math.max(1000, basisHps() * 1800 + proKlick * 300) * (1 + tag / 12);
  return rundeHuebsch(basis * (tag === 24 ? ADVENT.heiligabendFaktor : 1));
}

// Türchen öffnen. Rückgabe: { tag, herzen, sticker: [...], seasonPunkte, stufen, teil, test } oder null
function oeffneTuer(tag) {
  if (!tuerBereit(tag)) return null;
  const test = Boolean(adventTestTag);
  adventStand().offen.push(tag);
  const herzen = adventHerzen(tag);
  const teilDaten = ADVENT_TEILE[tag];
  const teil = teilDaten && ZIMMER_TEILE.find(t => t.id === teilDaten.id);

  if (test) return { tag, herzen, sticker: [], seasonPunkte: 0, stufen: [], teil, test, teilNeu: Boolean(teil) };

  herzenDazu(herzen);
  const sticker = [];
  for (let i = 0; i < (tag === 24 ? 3 : 1); i++) sticker.push(gibSticker("season"));   // im Dezember: Weihnachts-Sticker
  const seasonPunkte = aktiverSeasonPass() ? ADVENT.seasonPunkte * (tag === 24 ? ADVENT.heiligabendFaktor : 1) : 0;
  const stufen = seasonPunkte ? seasonKlick(seasonPunkte) : [];

  let teilNeu = false;
  if (teil && !skinStand.freigeschaltet.includes(teil.id)) {
    schalteSkinFrei(teil.id);
    speichereSkins();
    teilNeu = true;
  }
  speichern();
  return { tag, herzen, sticker, seasonPunkte, stufen, teil, teilNeu, test };
}
