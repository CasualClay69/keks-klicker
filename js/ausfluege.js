"use strict";
// =====================================================
//  HAUSTIER-AUSFLÜGE
//  Das Tier geht für 1–8 Stunden auf Entdeckungstour – auch wenn die App zu ist –
//  und bringt Herzen, Sticker, Erfahrung und manchmal ein Mitbringsel fürs Zimmer mit.
//  Je länger der Ausflug, desto mehr ist im Rucksack.
//  Während des Ausflugs kann man das Tier nicht füttern oder streicheln; sein Herzen-Bonus
//  gilt aber weiter. Zu hungrige Tiere bleiben lieber zu Hause.
//
//  Gespeichert: t.ausflug = { ziel, start, ende }  (am Tier, siehe haustier.js)
//               spiel.ausfluegeGesamt = Anzahl beendeter Ausflüge
//  Diese Datei fasst das HTML nicht an (Bildschirm: ausfluege-ui.js).
// =====================================================

const AUSFLUG_ZIELE = [
  { id: "wiese",  kurz: "Wiese",  name: "Blumenwiese",      icon: "🌼", wohin: "auf die Blumenwiese", woher: "von der Blumenwiese", stunden: 1, sticker: 1, mitbringselChance: 0.15,
    mitbringsel: "zimmer-blumenkranz" },
  { id: "wald",   kurz: "Wald",   name: "Zauberwald",       icon: "🌲", wohin: "in den Zauberwald", woher: "aus dem Zauberwald", stunden: 2, sticker: 1, mitbringselChance: 0.3,
    mitbringsel: "zimmer-tannenzapfen" },
  { id: "strand", kurz: "Strand", name: "Strand",           icon: "🏖️", wohin: "an den Strand", woher: "vom Strand", stunden: 4, sticker: 2, mitbringselChance: 0.5,
    mitbringsel: "zimmer-muscheln" },
  { id: "berge",  kurz: "Berge",  name: "Regenbogen-Berge", icon: "⛰️", wohin: "in die Regenbogen-Berge", woher: "aus den Regenbogen-Bergen", stunden: 8, sticker: 3, mitbringselChance: 0.75,
    mitbringsel: "zimmer-bergkristall" },
];

const AUSFLUG = {
  mindestSatt: 30,     // hungrigere Tiere gehen nicht los
  xpProStunde: 8,
};

// Mitbringsel fürs Zimmer (nur von Ausflügen)
ZIMMER_TEILE.push(
  { id: "zimmer-blumenkranz",  platz: "wandbild",  name: "Blumenkranz",      icon: "💮", preis: null, ausflug: "wiese" },
  { id: "zimmer-tannenzapfen", platz: "regal",     name: "Tannenzapfen",     icon: "🌰", preis: null, ausflug: "wald" },
  { id: "zimmer-muscheln",     platz: "spielzeug", name: "Muschel-Schatz",   icon: "🐚", preis: null, ausflug: "strand" },
  { id: "zimmer-bergkristall", platz: "pflanze",   name: "Bergkristall",     icon: "💎", preis: null, ausflug: "berge" },
);

function ausflugZiel(id) {
  return AUSFLUG_ZIELE.find(z => z.id === id);
}

function istUnterwegs(t) {
  return Boolean(t && t.ausflug);
}

// Ist der Ausflug vorbei (Tier wartet mit vollem Rucksack)?
function ausflugFertig(t) {
  return istUnterwegs(t) && Date.now() >= t.ausflug.ende;
}

function ausflugRestSekunden(t) {
  return istUnterwegs(t) ? Math.max(0, (t.ausflug.ende - Date.now()) / 1000) : 0;
}

function ausflugAnteil(t) {
  if (!istUnterwegs(t)) return 0;
  const { start, ende } = t.ausflug;
  return Math.min(1, Math.max(0, (Date.now() - start) / (ende - start)));
}

// Darf das Tier los? Rückgabe: null (ja) oder der Grund als Text
function ausflugHindernis(t) {
  if (!t) return "Kein Haustier.";
  if (istUnterwegs(t)) return `${t.name} ist schon unterwegs.`;
  aktualisiereHunger();
  if (t.sattheit < AUSFLUG.mindestSatt) return `${t.name} hat zu großen Hunger für einen Ausflug – füttere es erst!`;
  return null;
}

function starteAusflug(t, zielId) {
  const ziel = ausflugZiel(zielId);
  if (!ziel || ausflugHindernis(t)) return false;
  const jetzt = Date.now();
  t.ausflug = { ziel: ziel.id, start: jetzt, ende: jetzt + ziel.stunden * 3600000 };
  return true;
}

// Herzen im Rucksack: ~15 Min. Produktion + 150 Klicks pro Stunde (mind. 500 pro Stunde)
function ausflugHerzen(ziel) {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  return rundeHuebsch(Math.max(500, basisHps() * 900 + proKlick * 150) * ziel.stunden);
}

// Ausflug beenden und Rucksack auspacken.
// Rückgabe: { tier, ziel, herzen, sticker: [Ergebnisse], mitbringsel, xp: {aufgestiegen, gewachsen} } oder null
function beendeAusflug(t) {
  if (!ausflugFertig(t)) return null;
  const ziel = ausflugZiel(t.ausflug.ziel) || AUSFLUG_ZIELE[0];
  delete t.ausflug;

  let herzen = ausflugHerzen(ziel);
  const sticker = [];
  for (let i = 0; i < ziel.sticker; i++) sticker.push(gibSticker("ausflug"));

  // Mitbringsel: nur, wenn man es noch nicht hat – sonst gibt es stattdessen extra Herzen
  let mitbringsel = null;
  if (Math.random() < ziel.mitbringselChance) {
    if (!skinStand.freigeschaltet.includes(ziel.mitbringsel)) {
      schalteSkinFrei(ziel.mitbringsel);
      speichereSkins();
      mitbringsel = ZIMMER_TEILE.find(z => z.id === ziel.mitbringsel);
    } else {
      herzen *= 2;
    }
  }
  herzenDazu(herzen);
  const xp = gibTierXp(AUSFLUG.xpProStunde * ziel.stunden, t);
  spiel.ausfluegeGesamt = (spiel.ausfluegeGesamt || 0) + 1;
  speichern();
  return { tier: t, ziel, herzen, sticker, mitbringsel, xp };
}
