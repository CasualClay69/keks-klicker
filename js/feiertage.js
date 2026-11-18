"use strict";
// =====================================================
//  FEIERTAGS-EVENTS – wie der Geburtstag, nur kürzer
//  • Nikolaus (6.12.):        Weihnachtsmütze, goldene Sterne, Geschenk im Stiefel
//  • Silvester (31.12./1.1.): Partyhut, Feuerwerk, Glücksbringer
//  • Erster Schnee:           Schneefall, Geschenk vom Schneemann – löst der Admin aus
//                             (Admin-Menü), dann schneit es an dem Tag auf allen Geräten
//  Jedes Geschenk gibt es einmal pro Jahr (Schnee: einmal pro Winter), beim ersten Mal
//  dazu ein Andenken fürs Zimmer.
//
//  Gespeichert: spiel.feiertage = { feiertagId: Kennung (Jahr bzw. Winter) }
//  Diese Datei fasst das HTML nicht an (Bildschirm: feiertage-ui.js).
// =====================================================

const FEIERTAGE = [
  { id: "nikolaus", name: "Nikolaus", icon: "🎅", tage: [[6, 12]],
    titel: "Der Nikolaus war da! 🎅", text: "Er hat dir etwas in den Stiefel gesteckt – tippe drauf!",
    box: "🥾", deko: "⭐🎅🍫🥾⭐", hut: "hut-weihnachtsmuetze", effekt: "sterne",
    andenken: "zimmer-nikolausstiefel", stunden: 2 },
  { id: "silvester", name: "Silvester", icon: "🎆", tage: [[31, 12], [1, 1]],
    titel: "Guten Rutsch! 🎆", text: "Ein Glücksbringer für das neue Jahr – tippe drauf!",
    box: "🍀", deko: "🎆🥂🍀🐷🎆", hut: "hut-partyhut", effekt: "feuerwerk",
    andenken: "zimmer-gluecksschwein", stunden: 3 },
  { id: "schnee", name: "Erster Schnee", icon: "❄️", serverEreignis: true,
    titel: "Es schneit! ❄️", text: "Der erste Schnee ist da – und der Schneemann hat dir etwas mitgebracht!",
    box: "☃️", deko: "❄️⛄🌨️⛄❄️", hut: null, effekt: "schnee",
    andenken: "zimmer-schneebild", stunden: 2 },
];

const FEIERTAG = {
  seasonPunkte: 1000,
  schneeSchluessel: "marieClicker-schneeTag",   // an welchem Tag der Admin "Erster Schnee" ausgelöst hat
};

// Andenken fürs Zimmer (nur als Feiertags-Geschenk zu bekommen)
ZIMMER_TEILE.push(
  { id: "zimmer-nikolausstiefel", platz: "regal",     name: "Nikolausstiefel",     icon: "🥾", preis: null, feiertag: "nikolaus" },
  { id: "zimmer-gluecksschwein",  platz: "spielzeug", name: "Glücksschwein",       icon: "🐷", preis: null, feiertag: "silvester" },
  { id: "zimmer-schneebild",      platz: "wandbild",  name: "Schneeflocken-Bild",  icon: "❄️", preis: null, feiertag: "schnee" },
);

// Nur zum Ansehen aus dem Admin-Menü (ohne Geschenk, nicht gespeichert)
let feiertagTest = null;

// ----- Erster Schnee: Tag vom Server merken -----

function schneeTag() {
  try { return localStorage.getItem(FEIERTAG.schneeSchluessel) || ""; } catch (e) { return ""; }
}

function setzeSchneeTag(tag) {
  try { localStorage.setItem(FEIERTAG.schneeSchluessel, tag); } catch (e) { /* egal */ }
}

// ----- Welcher Feiertag ist heute? -----

function aktiverFeiertag(datum = new Date(Date.now())) {
  if (feiertagTest) return FEIERTAGE.find(f => f.id === feiertagTest);
  return FEIERTAGE.find(f => f.serverEreignis
    ? schneeTag() === datumText(datum)
    : f.tage.some(([tag, monat]) => datum.getDate() === tag && datum.getMonth() + 1 === monat));
}

// Kennung für "schon geöffnet": Jahr (Silvester: Jahr des 31.12.), Schnee: Winter (Juli bis Juni)
function feiertagKennung(f, datum = new Date(Date.now())) {
  const jahr = datum.getFullYear(), monat = datum.getMonth() + 1;
  if (f.id === "silvester" && monat === 1) return jahr - 1;
  if (f.serverEreignis) return monat >= 7 ? jahr : jahr - 1;
  return jahr;
}

function feiertagGeschenkWartet() {
  const f = aktiverFeiertag();
  if (!f || feiertagTest) return false;
  return (spiel.feiertage || {})[f.id] !== feiertagKennung(f);
}

// Hut am Feiertag (der Geburtstag hat Vorrang, siehe geburtstag.js)
function feiertagHut() {
  const f = aktiverFeiertag();
  return f && f.hut ? SKINS.find(s => s.id === f.hut) : null;
}

// Herzen: ~2–3 Std. Produktion + Klicks (mind. 5.000)
function feiertagHerzen(f) {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  return rundeHuebsch(Math.max(5000, basisHps() * 3600 * f.stunden + proKlick * 1000 * f.stunden));
}

// Geschenk öffnen. Rückgabe: { feiertag, herzen, seasonPunkte, stufen, sticker, andenken } oder null
function oeffneFeiertagsGeschenk() {
  if (!feiertagGeschenkWartet()) return null;
  const f = aktiverFeiertag();
  spiel.feiertage = { ...(spiel.feiertage || {}), [f.id]: feiertagKennung(f) };

  const herzen = feiertagHerzen(f);
  herzenDazu(herzen);
  const seasonPunkte = aktiverSeasonPass() ? FEIERTAG.seasonPunkte : 0;
  const stufen = seasonPunkte ? seasonKlick(seasonPunkte) : [];
  const sticker = gibSticker("feiertag");

  // Andenken nur beim ersten Mal
  let andenken = null;
  if (!skinStand.freigeschaltet.includes(f.andenken)) {
    schalteSkinFrei(f.andenken);
    andenken = ZIMMER_TEILE.find(t => t.id === f.andenken);
    speichereSkins();
  }
  speichern();
  return { feiertag: f, herzen, seasonPunkte, stufen, sticker, andenken };
}
