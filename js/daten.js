"use strict";
// =====================================================
//  SPIELDATEN
//  Hier steht alles, was man zum Balancing ändern möchte.
//  Diese Datei enthält nur Daten – keine Spiellogik.
// =====================================================

const KONFIG = {
  preisAnstieg: 1.15,        // jedes weitere Gebäude kostet 15 % mehr
  erfolgBonus: 0.01,         // jeder Erfolg: +1 % Produktion
  tickMs: 100,               // wie oft die Anzeige aktualisiert wird
  erfolgPruefenMs: 1000,
  speichernMs: 5000,
  speicherSchluessel: "keksKlicker",
  kaufModi: ["1", "10", "100", "next"],

  gold: {
    minWartenSek: 30,        // goldener Keks erscheint nach 30–90 Sekunden
    maxWartenSek: 90,
    sichtbarSek: 12,         // … und bleibt 12 Sekunden
    sofortSekunden: 120,     // Glückstreffer = 2 Minuten Produktion
    sofortKlicks: 30,        //   + 30 Klicks
    sofortMinimum: 100,
  },
};

// Gebäude produzieren automatisch Kekse pro Sekunde (kps)
const GEBAEUDE = [
  { id: "helfer", name: "Backhelfer",  mehrzahl: "Backhelfer",   icon: "🧑‍🍳", basisPreis: 15,       kps: 0.1  },
  { id: "ofen",   name: "Steinofen",   mehrzahl: "Steinöfen",    icon: "🔥",   basisPreis: 100,      kps: 1    },
  { id: "laden",  name: "Bäckerei",    mehrzahl: "Bäckereien",   icon: "🏪",   basisPreis: 1100,     kps: 8    },
  { id: "fabrik", name: "Keksfabrik",  mehrzahl: "Keksfabriken", icon: "🏭",   basisPreis: 12000,    kps: 47   },
  { id: "mine",   name: "Teig-Mine",   mehrzahl: "Teig-Minen",   icon: "⛏️",   basisPreis: 130000,   kps: 260  },
  { id: "labor",  name: "Zuckerlabor", mehrzahl: "Zuckerlabore", icon: "🧪",   basisPreis: 1400000,  kps: 1400 },
  { id: "rakete", name: "Keks-Rakete", mehrzahl: "Keks-Raketen", icon: "🚀",   basisPreis: 20000000, kps: 7800 },
];

// Klick-Verbesserungen: erhöhen die Kekse pro Klick
const KLICK_ITEMS = [
  { id: "k1", name: "Stärkerer Finger",   icon: "👆", basisPreis: 50,    proKlick: 1   },
  { id: "k2", name: "Goldener Handschuh", icon: "🧤", basisPreis: 2000,  proKlick: 10  },
  { id: "k3", name: "Magischer Stab",     icon: "🪄", basisPreis: 50000, proKlick: 100 },
];

// Upgrade-Stufen: "ab" = so viele Gebäude braucht man, damit das Upgrade erscheint.
// Jedes gekaufte Upgrade verdoppelt die Produktion dieses Gebäudes.
const UPGRADE_STUFEN = [
  { ab: 1,  preisFaktor: 10,    medaille: "🥉", titel: "Bronze-Ausrüstung"  },
  { ab: 10, preisFaktor: 100,   medaille: "🥈", titel: "Silber-Ausrüstung"  },
  { ab: 25, preisFaktor: 1000,  medaille: "🥇", titel: "Gold-Ausrüstung"    },
  { ab: 50, preisFaktor: 20000, medaille: "💎", titel: "Diamant-Ausrüstung" },
];

// Alle Upgrades = jedes Gebäude × jede Stufe, billigste zuerst
const UPGRADES = GEBAEUDE
  .flatMap(g => UPGRADE_STUFEN.map((stufe, i) => ({
    id: `${g.id}_u${i + 1}`,          // z.B. "ofen_u2"
    gebaeude: g,
    ab: stufe.ab,
    preis: g.basisPreis * stufe.preisFaktor,
    icon: g.icon,
    medaille: stufe.medaille,
    name: `${stufe.titel}: ${g.name}`,
    beschr: `${g.mehrzahl} produzieren doppelt so viel`,
  })))
  .sort((a, b) => a.preis - b.preis);

// Was ein goldener Keks bewirken kann. "gewicht" = relative Wahrscheinlichkeit.
const GOLD_EFFEKTE = [
  { gewicht: 45, typ: "sofort" },
  { gewicht: 35, typ: "bonus", name: "🔥 Backrausch",  text: "Produktion x7", prodFaktor: 7, klickFaktor: 1,  dauerSek: 30 },
  { gewicht: 20, typ: "bonus", name: "👆 Klickrausch", text: "x10 pro Klick", prodFaktor: 1, klickFaktor: 10, dauerSek: 15 },
];

// Erfolge: "bedingung" bekommt den Spielstand und liefert true, sobald der Erfolg geschafft ist.
const ERFOLGE = [
  { id: "klick1",    icon: "👶", name: "Erster Biss",       beschr: "Klicke den Keks zum ersten Mal",          bedingung: s => s.klicks >= 1 },
  { id: "klick100",  icon: "👉", name: "Fleißiger Finger",  beschr: "Klicke 100 Mal",                          bedingung: s => s.klicks >= 100 },
  { id: "klick1000", icon: "🦾", name: "Klick-Maschine",    beschr: "Klicke 1.000 Mal",                        bedingung: s => s.klicks >= 1000 },
  { id: "keks100",   icon: "🍪", name: "Ein Häufchen",      beschr: "Backe insgesamt 100 Kekse",               bedingung: s => s.gesamt >= 100 },
  { id: "keks1k",    icon: "🧺", name: "Ein Körbchen voll", beschr: "Backe insgesamt 1.000 Kekse",             bedingung: s => s.gesamt >= 1e3 },
  { id: "keks100k",  icon: "📦", name: "Kistenweise",       beschr: "Backe insgesamt 100.000 Kekse",           bedingung: s => s.gesamt >= 1e5 },
  { id: "keks1m",    icon: "🏔️", name: "Keksberg",          beschr: "Backe insgesamt 1 Million Kekse",         bedingung: s => s.gesamt >= 1e6 },
  { id: "keks1b",    icon: "🌍", name: "Keksplanet",        beschr: "Backe insgesamt 1 Milliarde Kekse",       bedingung: s => s.gesamt >= 1e9 },
  { id: "kps10",     icon: "⚙️", name: "Es läuft",          beschr: "Erreiche 10 Kekse pro Sekunde",           bedingung: () => basisKps() >= 10 },
  { id: "kps100",    icon: "🏎️", name: "Volle Fahrt",       beschr: "Erreiche 100 Kekse pro Sekunde",          bedingung: () => basisKps() >= 100 },
  { id: "kps1000",   icon: "⚡", name: "Keks-Turbo",        beschr: "Erreiche 1.000 Kekse pro Sekunde",        bedingung: () => basisKps() >= 1000 },
  { id: "gold1",     icon: "✨", name: "Glückspilz",        beschr: "Fange einen goldenen Keks",               bedingung: s => s.goldKlicks >= 1 },
  { id: "gold10",    icon: "👑", name: "Goldjäger",         beschr: "Fange 10 goldene Kekse",                  bedingung: s => s.goldKlicks >= 10 },
  { id: "alle",      icon: "🏘️", name: "Von allem etwas",   beschr: "Besitze jedes Gebäude mindestens einmal", bedingung: () => GEBAEUDE.every(g => anzahl(g) >= 1) },
  { id: "geb50",     icon: "🏙️", name: "Keks-Imperium",     beschr: "Besitze insgesamt 50 Gebäude",            bedingung: () => anzahlGebaeude() >= 50 },
  { id: "upg1",      icon: "🔧", name: "Handwerker",        beschr: "Kaufe dein erstes Gebäude-Upgrade",       bedingung: s => s.upgrades.length >= 1 },
  { id: "upg10",     icon: "🛠️", name: "Meisterbäcker",     beschr: "Kaufe 10 Gebäude-Upgrades",               bedingung: s => s.upgrades.length >= 10 },
  { id: "upgAlle",   icon: "💎", name: "Perfektionist",     beschr: "Kaufe alle Gebäude-Upgrades",             bedingung: s => s.upgrades.length >= UPGRADES.length },
  { id: "zeit30",    icon: "⏰", name: "Dranbleiben",       beschr: "Spiele 30 Minuten",                       bedingung: s => s.spielzeit >= 1800 },
];
