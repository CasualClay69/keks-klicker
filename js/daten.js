"use strict";
// =====================================================
//  SPIELDATEN
//  Hier steht alles, was man zum Balancing ändern möchte.
//  Diese Datei enthält nur Daten – keine Spiellogik.
// =====================================================

const KONFIG = {
  preisAnstieg: 1.15,        // jedes weitere Stück kostet 15 % mehr
  erfolgBonus: 0.01,         // jeder Erfolg: +1 % Herzen pro Sekunde
  tickMs: 100,               // wie oft die Anzeige aktualisiert wird
  erfolgPruefenMs: 1000,
  speichernMs: 5000,
  speicherSchluessel: "marieClicker",
  skinSchluessel: "marieClicker-skins",   // eigener Speicher: bleibt beim Spielstand-Löschen erhalten
  kaufModi: ["1", "10", "100", "next"],

  stern: {
    minWartenSek: 30,        // Sternschnuppe erscheint nach 30–90 Sekunden
    maxWartenSek: 90,
    sichtbarSek: 12,         // … und bleibt 12 Sekunden
    sofortSekunden: 120,     // Herzregen = 2 Minuten Produktion
    sofortKlicks: 30,        //   + 30 Klicks
    sofortMinimum: 100,
  },
};

// Alles, was automatisch Herzen pro Sekunde (hps) schenkt
const GEBAEUDE = [
  { id: "freundin",   name: "Beste Freundin", mehrzahl: "Beste Freundinnen", icon: "👭", basisPreis: 15,       hps: 0.1  },
  { id: "teddy",      name: "Kuscheltier",    mehrzahl: "Kuscheltiere",      icon: "🧸", basisPreis: 100,      hps: 1    },
  { id: "kaetzchen",  name: "Kätzchen",       mehrzahl: "Kätzchen",          icon: "🐱", basisPreis: 1100,     hps: 8    },
  { id: "garten",     name: "Blumengarten",   mehrzahl: "Blumengärten",      icon: "🌷", basisPreis: 12000,    hps: 47   },
  { id: "einhorn",    name: "Einhorn",        mehrzahl: "Einhörner",         icon: "🦄", basisPreis: 130000,   hps: 260  },
  { id: "schloss",    name: "Feenschloss",    mehrzahl: "Feenschlösser",     icon: "🏰", basisPreis: 1400000,  hps: 1400 },
  { id: "regenbogen", name: "Regenbogen",     mehrzahl: "Regenbögen",        icon: "🌈", basisPreis: 20000000, hps: 7800 },
];

// Verbesserungen für mehr Herzen pro Klick
const KLICK_ITEMS = [
  { id: "nagellack",   name: "Glitzer-Nagellack", icon: "💅", basisPreis: 50,    proKlick: 1   },
  { id: "haarschleife", name: "Haarschleife",     icon: "🎀", basisPreis: 2000,  proKlick: 10  },
  { id: "zauberstab",  name: "Feen-Zauberstab",   icon: "🪄", basisPreis: 50000, proKlick: 100 },
];

// Upgrade-Stufen: "ab" = so viele Stück braucht man, damit das Upgrade erscheint.
// Jedes gekaufte Upgrade verdoppelt die Herzen dieser Sorte.
const UPGRADE_STUFEN = [
  { ab: 1,  preisFaktor: 10,    medaille: "🎀", titel: "Rosa Schleife"       },
  { ab: 10, preisFaktor: 100,   medaille: "🌸", titel: "Blütenzauber"        },
  { ab: 25, preisFaktor: 1000,  medaille: "👑", titel: "Prinzessinnen-Krone" },
  { ab: 50, preisFaktor: 20000, medaille: "💎", titel: "Diamant-Glitzer"     },
];

// Alle Upgrades = jede Sorte × jede Stufe, günstigste zuerst
const UPGRADES = GEBAEUDE
  .flatMap(g => UPGRADE_STUFEN.map((stufe, i) => ({
    id: `${g.id}_u${i + 1}`,          // z.B. "teddy_u2"
    gebaeude: g,
    ab: stufe.ab,
    preis: g.basisPreis * stufe.preisFaktor,
    icon: g.icon,
    medaille: stufe.medaille,
    name: `${stufe.titel}: ${g.name}`,
    beschr: `${g.mehrzahl} schenken doppelt so viele Herzen`,
  })))
  .sort((a, b) => a.preis - b.preis);

// Was eine Sternschnuppe bewirken kann. "gewicht" = relative Wahrscheinlichkeit.
const STERN_EFFEKTE = [
  { gewicht: 45, typ: "sofort" },
  { gewicht: 35, typ: "bonus", name: "✨ Glitzerrausch", text: "Herzen x7",     prodFaktor: 7, klickFaktor: 1,  dauerSek: 30 },
  { gewicht: 20, typ: "bonus", name: "💅 Klickzauber",   text: "x10 pro Klick", prodFaktor: 1, klickFaktor: 10, dauerSek: 15 },
];

// Erfolge: "bedingung" bekommt den Spielstand und liefert true, sobald der Erfolg geschafft ist.
const ERFOLGE = [
  { id: "klick1",    icon: "👋", name: "Hallo Marie!",      beschr: "Klicke Marie zum ersten Mal",              bedingung: s => s.klicks >= 1 },
  { id: "klick100",  icon: "🤝", name: "Unzertrennlich",    beschr: "Klicke 100 Mal",                           bedingung: s => s.klicks >= 100 },
  { id: "klick1000", icon: "📣", name: "Fan Nr. 1",         beschr: "Klicke 1.000 Mal",                         bedingung: s => s.klicks >= 1000 },
  { id: "finger3",   icon: "🖐️", name: "Fingerakrobatin",   beschr: "Tippe mit 3 Fingern gleichzeitig auf Marie", bedingung: s => s.maxFinger >= 3 },
  { id: "herz100",   icon: "💗", name: "Herzchen",          beschr: "Sammle insgesamt 100 Herzen",              bedingung: s => s.gesamt >= 100 },
  { id: "herz1k",    icon: "💓", name: "Herzklopfen",       beschr: "Sammle insgesamt 1.000 Herzen",            bedingung: s => s.gesamt >= 1e3 },
  { id: "herz100k",  icon: "💌", name: "Liebesbriefe",      beschr: "Sammle insgesamt 100.000 Herzen",          bedingung: s => s.gesamt >= 1e5 },
  { id: "herz1m",    icon: "💘", name: "Herzensbrecherin",  beschr: "Sammle insgesamt 1 Million Herzen",        bedingung: s => s.gesamt >= 1e6 },
  { id: "herz1b",    icon: "👸", name: "Herzkönigin",       beschr: "Sammle insgesamt 1 Milliarde Herzen",      bedingung: s => s.gesamt >= 1e9 },
  { id: "hps10",     icon: "✨", name: "Es funkelt",        beschr: "Erreiche 10 Herzen pro Sekunde",           bedingung: () => basisHps() >= 10 },
  { id: "hps100",    icon: "🌟", name: "Glitzersturm",      beschr: "Erreiche 100 Herzen pro Sekunde",          bedingung: () => basisHps() >= 100 },
  { id: "hps1000",   icon: "🎆", name: "Feuerwerk",         beschr: "Erreiche 1.000 Herzen pro Sekunde",        bedingung: () => basisHps() >= 1000 },
  { id: "stern1",    icon: "🌠", name: "Wunsch frei",       beschr: "Fange eine Sternschnuppe",                 bedingung: s => s.sternKlicks >= 1 },
  { id: "stern10",   icon: "💫", name: "Sternensammlerin",  beschr: "Fange 10 Sternschnuppen",                  bedingung: s => s.sternKlicks >= 10 },
  { id: "alle",      icon: "🎁", name: "Von allem etwas",   beschr: "Besitze jede Sorte mindestens einmal",     bedingung: () => GEBAEUDE.every(g => anzahl(g) >= 1) },
  { id: "geb50",     icon: "🌸", name: "Traumwelt",         beschr: "Besitze insgesamt 50 Herzschenker",        bedingung: () => anzahlGebaeude() >= 50 },
  { id: "upg1",      icon: "🎀", name: "Erste Schleife",    beschr: "Kaufe dein erstes Upgrade",                bedingung: s => s.upgrades.length >= 1 },
  { id: "upg10",     icon: "💄", name: "Stylistin",         beschr: "Kaufe 10 Upgrades",                        bedingung: s => s.upgrades.length >= 10 },
  { id: "upgAlle",   icon: "👑", name: "Prinzessin",        beschr: "Kaufe alle Upgrades",                      bedingung: s => s.upgrades.length >= UPGRADES.length },
  { id: "aufg10",    icon: "🐝", name: "Fleißige Biene",    beschr: "Erledige 10 Tagesaufgaben",                bedingung: s => (s.aufgabenGesamt || 0) >= 10 },
  { id: "aufg50",    icon: "🏅", name: "Aufgaben-Profi",    beschr: "Erledige 50 Tagesaufgaben",                bedingung: s => (s.aufgabenGesamt || 0) >= 50 },
  { id: "serie7",    icon: "📅", name: "Jeden Tag dabei",   beschr: "Hole dir 7 Tage hintereinander dein Geschenk", bedingung: s => ((s.geschenk && s.geschenk.beste) || 0) >= 7 },
  { id: "rad10",     icon: "🍀", name: "Glückskind",        beschr: "Drehe 10-mal am Glücksrad",                bedingung: s => ((s.gluecksrad && s.gluecksrad.gesamt) || 0) >= 10 },
  { id: "sticker10",  icon: "📒", name: "Sticker-Fan",       beschr: "Sammle 10 verschiedene Sticker",           bedingung: () => anzahlVerschiedeneSticker() >= 10 },
  { id: "seite1",     icon: "📗", name: "Seite voll!",       beschr: "Mache eine Album-Seite voll",              bedingung: () => STICKER_SEITEN.some(seiteVoll) },
  { id: "albumVoll",  icon: "📚", name: "Album komplett",    beschr: "Sammle alle 60 Sticker der 5 Grundseiten", bedingung: () => anzahlVerschiedeneSticker(GRUND_STICKER) >= GRUND_STICKER.length },
  { id: "seasonSeite", icon: "🎟️", name: "Season-Sammelprofi", beschr: "Mache eine Season-Sticker-Seite voll",   bedingung: () => STICKER_SEITEN.some(s => s.season && seiteVoll(s)) },
  { id: "tier1",      icon: "🐾", name: "Tierfreund",        beschr: "Adoptiere ein Haustier für Marie",         bedingung: s => Boolean(s.haustier) },
  { id: "tierGross",  icon: "🎉", name: "Groß geworden",     beschr: "Dein Haustier ist ausgewachsen (Level 10)", bedingung: s => Boolean(s.haustier) && s.haustier.level >= 10 },
  { id: "regen40",    icon: "🧺", name: "Fang-Profi",        beschr: "Fange 40 Punkte in einem Herzregen",        bedingung: s => (s.regenBest || 0) >= 40 },
  { id: "zeit30",    icon: "🫖", name: "Teeparty",          beschr: "Spiele 30 Minuten",                        bedingung: s => s.spielzeit >= 1800 },
];
