"use strict";
// =====================================================
//  BACKSTUBE 🧁 – aus der Garten-Ernte werden Leckereien mit kleinen Boni
//  Jede Ernte kommt (zusätzlich zu den Herzen) in die Vorratskammer: spiel.garten.vorrat = { pflanzenId: Anzahl }
//  Boni laufen in echter Zeit (auch über einen Neustart der App) und verlängern sich, wenn man
//  dasselbe nochmal backt – höchstens BACKSTUBE.maxMinuten im Voraus.
//
//  Gespeichert: spiel.backBoni = { klick, prod, stern, zauber: Ende (ms) }, spiel.gebacken = { rezeptId: Anzahl }
//  Diese Datei fasst das HTML nicht an (Bildschirm: garten-ui.js).
// =====================================================

const BACKSTUBE = { maxMinuten: 60 };

// zutaten: { id } = genau diese Pflanze, { art } = irgendeine dieser Art (blume | obst | zauber)
const REZEPTE = [
  { id: "tee",          icon: "🍵", name: "Blumentee",       zutaten: [{ art: "blume", n: 2 }],
    wirkung: "Alle Haustiere werden ganz satt und freuen sich (+10 ⭐)", sofort: "tiere" },
  { id: "muffin",       icon: "🧁", name: "Erdbeer-Muffin",  zutaten: [{ id: "erdbeere", n: 1 }, { art: "blume", n: 1 }],
    wirkung: "10 Minuten doppelte Klicks", bonus: "klick", minuten: 10 },
  { id: "kuchen",       icon: "🥧", name: "Apfelkuchen",     zutaten: [{ id: "apfel", n: 2 }],
    wirkung: "10 Minuten: Helfer sammeln doppelt so viel", bonus: "prod", minuten: 10 },
  { id: "eis",          icon: "🍧", name: "Melonen-Eis",     zutaten: [{ id: "melone", n: 1 }, { id: "erdbeere", n: 1 }],
    wirkung: "15 Minuten Sternschnuppen-Party: viel mehr Sternschnuppen", bonus: "stern", minuten: 15 },
  { id: "zauberkuchen", icon: "🎂", name: "Zauberkuchen",    zutaten: [{ art: "zauber", n: 1 }, { id: "apfel", n: 1 }, { id: "rose", n: 1 }],
    wirkung: "20 Minuten: Klicks UND Helfer ×3", bonus: "zauber", minuten: 20 },
];

const BACK_BONI = {
  klick:  { icon: "🧁", text: "Klicks ×2" },
  prod:   { icon: "🥧", text: "Helfer ×2" },
  stern:  { icon: "🍧", text: "Sternschnuppen-Party" },
  zauber: { icon: "🎂", text: "Alles ×3" },
};

function vorrat() {
  const g = gartenStand();
  if (!g.vorrat) g.vorrat = {};
  return g.vorrat;
}

function vorratVon(zutat) {
  const v = vorrat();
  if (zutat.id) return v[zutat.id] || 0;
  return PFLANZEN.filter(p => p.art === zutat.art).reduce((summe, p) => summe + (v[p.id] || 0), 0);
}

function kannBacken(rezept) {
  return rezept.zutaten.every(z => vorratVon(z) >= z.n);
}

// Zutaten verbrauchen (bei "irgendeine Blume" immer die, von der man am meisten hat)
function verbrauche(zutat) {
  const v = vorrat();
  for (let i = 0; i < zutat.n; i++) {
    const id = zutat.id || PFLANZEN.filter(p => p.art === zutat.art && v[p.id] > 0)
      .sort((a, b) => v[b.id] - v[a.id])[0].id;
    v[id]--;
  }
}

// Backen. Rückgabe: { rezept, bisMs } oder null
function backe(rezeptId) {
  const r = REZEPTE.find(x => x.id === rezeptId);
  if (!r || !kannBacken(r)) return null;
  for (const z of r.zutaten) verbrauche(z);
  spiel.gebacken = { ...(spiel.gebacken || {}), [r.id]: ((spiel.gebacken || {})[r.id] || 0) + 1 };

  let bisMs = 0;
  if (r.bonus) {
    const boni = spiel.backBoni = { ...(spiel.backBoni || {}) };
    const jetzt = Date.now();
    bisMs = Math.min(jetzt + BACKSTUBE.maxMinuten * 60000, Math.max(jetzt, boni[r.bonus] || 0) + r.minuten * 60000);
    boni[r.bonus] = bisMs;
  }
  if (r.sofort === "tiere") {
    aktualisiereHunger();
    for (const t of alleHaustiere()) {
      if (t.ausflug) continue;
      t.sattheit = 100;
      gibTierXp(10, t);
    }
  }
  speichern();
  return { rezept: r, bisMs };
}

function backBonusAktiv(art) {
  return ((spiel.backBoni || {})[art] || 0) > Date.now();
}

function backBonusRestSek(art) {
  return Math.max(0, ((spiel.backBoni || {})[art] || 0) - Date.now()) / 1000;
}

// Faktoren für logik.js und wunder.js
function backKlickFaktor() { return (backBonusAktiv("klick") ? 2 : 1) * (backBonusAktiv("zauber") ? 3 : 1); }
function backProdFaktor()  { return (backBonusAktiv("prod") ? 2 : 1) * (backBonusAktiv("zauber") ? 3 : 1); }
function backSternFaktor() { return backBonusAktiv("stern") ? 0.3 : 1; }   // Wartezeit auf Sternschnuppen

// Text für die Anzeige unter dem Zähler. kurz: "🧁 9:41 · 🥧 3:05" (bei einem Bonus mit Beschreibung)
// lang (Tooltip): "🧁 Klicks ×2 9:41 · 🥧 Helfer ×2 3:05"
function backBoniText(lang = false) {
  const aktiv = Object.entries(BACK_BONI).filter(([art]) => backBonusAktiv(art));
  return aktiv.map(([art, b]) => {
    const s = Math.ceil(backBonusRestSek(art));
    const zeit = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    return lang || aktiv.length === 1 ? `${b.icon} ${b.text} ${zeit}` : `${b.icon} ${zeit}`;
  }).join(" · ");
}
