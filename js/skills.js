"use strict";
// =====================================================
//  STERNEN-KARTE (Skillbaum)
//  Glitzersterne ⭐ (vom "Neustart mit Bonus") sind Skillpunkte. Man gibt sie auf einer Karte aus:
//  In der Mitte ist der Start, von dort führen vier Wege nach außen:
//    ↑ 👆 Klick-Kraft   → 🏡 Helfer   ↓ 🤖 Automatik   ← 🍀 Glück
//  Eine Fähigkeit kann man lernen, wenn die vorige auf dem Weg schon gelernt ist.
//  Zurücksetzen ist kostenlos – alle Sterne kommen zurück.
//  Fähigkeiten bleiben beim Neustart erhalten (die Sterne gehören einem ja).
//
//  Gespeichert: spiel.skills = [IDs], spiel.automatik = { klick, kaufen, helfer, sterne, fuettern: true/false }
//  Diese Datei fasst das HTML nicht an (Bildschirm: skills-ui.js).
// =====================================================

// x/y: Platz auf der Karte (Mitte = 0/0, oben = negatives y). nach: welche Fähigkeit davor kommt.
// auto: Schlüssel in spiel.automatik (Automatik-Fähigkeiten kann man an-/ausschalten)
const SKILLS = [
  { id: "start", x: 0, y: 0, icon: "⭐", name: "Start", text: "Hier beginnt deine Reise. Wähle einen Weg!", kosten: 0 },

  // ↑ Klick-Kraft
  { id: "k1", ast: "klick", x: 0,  y: -1, nach: "start", kosten: 1, icon: "👆", name: "Starke Finger",     text: "Jeder Klick bringt doppelt so viel." },
  { id: "k2", ast: "klick", x: 0,  y: -2, nach: "k1",    kosten: 2, icon: "💥", name: "Volltreffer",       text: "Jeder 10. Klick (zufällig) ist ein Volltreffer und bringt 10× so viel." },
  { id: "k3", ast: "klick", x: -1, y: -3, nach: "k2",    kosten: 3, icon: "🤝", name: "Helfer-Hand",       text: "Jeder Klick bringt zusätzlich 1 % deiner Herzen pro Sekunde." },
  { id: "k4", ast: "klick", x: 1,  y: -3, nach: "k2",    kosten: 4, icon: "💪", name: "Mega-Finger",       text: "Jeder Klick bringt 5× so viel." },
  { id: "k5", ast: "klick", x: -1, y: -4, nach: "k3",    kosten: 8, icon: "✨", name: "Goldene Berührung", text: "Jeder Klick bringt zusätzlich 5 % deiner Herzen pro Sekunde." },
  { id: "k6", ast: "klick", x: 1,  y: -4, nach: "k4",    kosten: 8, icon: "🦾", name: "Riesen-Finger",     text: "Jeder Klick bringt 10× so viel." },

  // → Helfer
  { id: "h1", ast: "helfer", x: 1, y: 0,  nach: "start", kosten: 1, icon: "🏡", name: "Fleißige Helfer",   text: "Alle Helfer sammeln doppelt so viel." },
  { id: "h2", ast: "helfer", x: 2, y: 0,  nach: "h1",    kosten: 2, icon: "🏷️", name: "Schnäppchen",       text: "Alle Helfer kosten 10 % weniger." },
  { id: "h3", ast: "helfer", x: 3, y: -1, nach: "h2",    kosten: 3, icon: "🤗", name: "Teamgeist",         text: "Je 25 Helfer, die du insgesamt hast: +1 % Herzen pro Sekunde." },
  { id: "h4", ast: "helfer", x: 3, y: 1,  nach: "h2",    kosten: 4, icon: "🚀", name: "Super-Helfer",      text: "Alle Helfer sammeln 3× so viel." },
  { id: "h5", ast: "helfer", x: 4, y: -1, nach: "h3",    kosten: 8, icon: "🛒", name: "Großeinkauf",       text: "Alle Helfer kosten noch einmal 15 % weniger." },
  { id: "h6", ast: "helfer", x: 4, y: 1,  nach: "h4",    kosten: 8, icon: "👑", name: "Helfer-Königreich", text: "Alle Helfer sammeln 5× so viel." },

  // ↓ Automatik
  { id: "a1", ast: "auto", x: 0,  y: 1, nach: "start", kosten: 1, icon: "🤖", name: "Klick-Roboter",     text: "Ein kleiner Roboter klickt 2-mal pro Sekunde für dich.", auto: "klick" },
  { id: "a2", ast: "auto", x: 0,  y: 2, nach: "a1",    kosten: 3, icon: "⚡", name: "Turbo-Roboter",     text: "Der Roboter klickt jetzt 10-mal pro Sekunde." },
  { id: "a3", ast: "auto", x: -1, y: 3, nach: "a2",    kosten: 3, icon: "🛍️", name: "Auto-Einkauf",      text: "Kauft automatisch Upgrades und Verbesserungen, sobald du sie dir leisten kannst.", auto: "kaufen" },
  { id: "a4", ast: "auto", x: 1,  y: 3, nach: "a2",    kosten: 4, icon: "🥅", name: "Sternen-Netz",      text: "Fängt Sternschnuppen automatisch für dich.", auto: "sterne" },
  { id: "a5", ast: "auto", x: -1, y: 4, nach: "a3",    kosten: 6, icon: "🏗️", name: "Auto-Helfer",       text: "Kauft automatisch Helfer – immer den günstigsten.", auto: "helfer" },
  { id: "a6", ast: "auto", x: 1,  y: 4, nach: "a4",    kosten: 5, icon: "🍖", name: "Futter-Automat",    text: "Füttert deine Haustiere automatisch, wenn sie Hunger haben.", auto: "fuettern" },

  // ← Glück
  { id: "g1", ast: "glueck", x: -1, y: 0,  nach: "start", kosten: 1, icon: "🌠", name: "Sternenstaub",      text: "Sternschnuppen kommen viel öfter." },
  { id: "g2", ast: "glueck", x: -2, y: 0,  nach: "g1",    kosten: 2, icon: "🧲", name: "Sticker-Magnet",    text: "Sticker fallen doppelt so oft heraus." },
  { id: "g3", ast: "glueck", x: -3, y: -1, nach: "g2",    kosten: 3, icon: "⏳", name: "Lange Wünsche",     text: "Sternschnuppen-Boni dauern doppelt so lang." },
  { id: "g4", ast: "glueck", x: -3, y: 1,  nach: "g2",    kosten: 4, icon: "🛏️", name: "Traumkissen",       text: "Deine Helfer sammeln bis zu 16 Stunden, während das Spiel zu ist (statt 8)." },
  { id: "g5", ast: "glueck", x: -4, y: -1, nach: "g3",    kosten: 6, icon: "🎟️", name: "Season-Turbo",      text: "Im Season-Pass kommst du 50 % schneller voran." },
  { id: "g6", ast: "glueck", x: -4, y: 1,  nach: "g4",    kosten: 8, icon: "💫", name: "Glitzerregen",      text: "Beim Neustart gibt es 25 % mehr Glitzersterne." },
];

const SKILL_AESTE = {
  klick:  { name: "Klick-Kraft", icon: "👆", farbe: "#ff6fa8" },
  helfer: { name: "Helfer",      icon: "🏡", farbe: "#3fb36b" },
  auto:   { name: "Automatik",   icon: "🤖", farbe: "#4f9cff" },
  glueck: { name: "Glück",       icon: "🍀", farbe: "#f2b320" },
};

function skillNachId(id) {
  return SKILLS.find(s => s.id === id);
}

function hatSkill(id) {
  return id === "start" || (spiel.skills || []).includes(id);
}

function sternePunkteAusgegeben() {
  return (spiel.skills || []).reduce((summe, id) => summe + ((skillNachId(id) || {}).kosten || 0), 0);
}

function sternePunkteFrei() {
  return Math.max(0, glitzersterne() - sternePunkteAusgegeben());
}

// "gelernt" | "lernbar" | "zuTeuer" | "gesperrt"
function skillStatus(s) {
  if (hatSkill(s.id)) return "gelernt";
  if (!hatSkill(s.nach)) return "gesperrt";
  return sternePunkteFrei() >= s.kosten ? "lernbar" : "zuTeuer";
}

function lerneSkill(id) {
  const s = skillNachId(id);
  if (!s || skillStatus(s) !== "lernbar") return false;
  spiel.skills = [...(spiel.skills || []), id];
  if (s.auto) spiel.automatik = { ...(spiel.automatik || {}), [s.auto]: true };
  return true;
}

// Alles zurück – alle Sterne sind wieder frei
function vergissAlleSkills() {
  spiel.skills = [];
}

// Automatik an? (Fähigkeit gelernt UND nicht ausgeschaltet)
function automatikAn(schluessel) {
  const s = SKILLS.find(x => x.auto === schluessel);
  if (schluessel === "klick") return hatSkill("a1") && (spiel.automatik || {}).klick !== false;
  return Boolean(s) && hatSkill(s.id) && (spiel.automatik || {})[schluessel] !== false;
}

function schalteAutomatik(schluessel) {
  spiel.automatik = { ...(spiel.automatik || {}), [schluessel]: !automatikAn(schluessel) };
}

// ----- Wirkungen (werden von logik.js, album.js, wunder.js, skins.js, neustart.js abgefragt) -----

function skillKlickFaktor() {
  return (hatSkill("k1") ? 2 : 1) * (hatSkill("k4") ? 5 : 1) * (hatSkill("k6") ? 10 : 1);
}

// Anteil der Herzen pro Sekunde, der bei jedem Klick dazukommt
function skillKlickAnteil() {
  return (hatSkill("k3") ? 0.01 : 0) + (hatSkill("k5") ? 0.05 : 0);
}

function skillVolltrefferChance() {
  return hatSkill("k2") ? 0.1 : 0;
}

function skillProdFaktor() {
  let f = (hatSkill("h1") ? 2 : 1) * (hatSkill("h4") ? 3 : 1) * (hatSkill("h6") ? 5 : 1);
  if (hatSkill("h3")) f *= 1 + 0.01 * Math.floor(anzahlGebaeude() / 25);
  return f;
}

function skillHelferRabatt() {
  return (hatSkill("h2") ? 0.9 : 1) * (hatSkill("h5") ? 0.85 : 1);
}

function skillSternWarteFaktor()  { return hatSkill("g1") ? 0.6 : 1; }   // Wartezeit auf Sternschnuppen
function skillStickerFaktor()     { return hatSkill("g2") ? 2 : 1; }
function skillBonusDauerFaktor()  { return hatSkill("g3") ? 2 : 1; }
function skillOfflineStunden()    { return hatSkill("g4") ? 16 : KONFIG.offline.maxStunden; }
function skillSeasonFaktor()      { return hatSkill("g5") ? 1.5 : 1; }
function skillNeustartFaktor()    { return hatSkill("g6") ? 1.25 : 1; }

function roboterKlicksProSekunde() {
  if (!automatikAn("klick")) return 0;
  return hatSkill("a2") ? 10 : 2;
}

// ----- Automatik: 1× pro Sekunde (aus skills-ui.js) -----

// Kauft, was die Automatik kaufen darf. Rückgabe: Anzahl der Käufe
function automatikEinkauf() {
  let kaeufe = 0;
  if (automatikAn("kaufen")) {
    // Upgrades (das günstigste zuerst), dann Verbesserungen für Klicks
    for (const u of UPGRADES.filter(upgradeVerfuegbar).sort((a, b) => a.preis - b.preis)) {
      if (kaufeUpgrade(u)) kaeufe++;
    }
    for (let i = 0; i < 20; i++) {
      const k = [...KLICK_ITEMS].sort((a, b) => preis(a) - preis(b))[0];
      if (!k || spiel.herzen < preis(k)) break;
      spiel.herzen -= preis(k);
      spiel.anzahl[k.id] = anzahl(k) + 1;
      kaeufe++;
    }
  }
  if (automatikAn("helfer")) {
    for (let i = 0; i < 50; i++) {
      const g = [...GEBAEUDE].sort((a, b) => preis(a) - preis(b))[0];
      if (!g || spiel.herzen < preis(g)) break;
      spiel.herzen -= preis(g);
      spiel.anzahl[g.id] = anzahl(g) + 1;
      kaeufe++;
    }
  }
  return kaeufe;
}

// Futter-Automat: hungrige Tiere (unter 30 %) bekommen ein Leckerli
function automatikFuettern() {
  if (!automatikAn("fuettern")) return [];
  const gefuettert = [];
  for (const t of alleHaustiere()) {
    if (t.ausflug || t.sattheit >= 30) continue;
    const ergebnis = fuettere("leckerli", t);
    if (ergebnis.ok) gefuettert.push({ t, ergebnis });
  }
  return gefuettert;
}
