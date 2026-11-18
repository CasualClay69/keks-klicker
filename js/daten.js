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

  offline: {
    maxStunden: 8,       // so lange sammeln die Herzschenker, während die App zu ist
    anteil: 1,           // 1 = volle Produktion
    abSekunden: 120,     // erst ab 2 Minuten Abwesenheit gibt es das Willkommen-Fenster
  },

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
  { id: "karussell",  name: "Karussell",      mehrzahl: "Karussells",        icon: "🎠", basisPreis: 200e6,    hps: 50000 },
  { id: "mondpalast", name: "Mondpalast",     mehrzahl: "Mondpaläste",       icon: "🌙", basisPreis: 1.8e9,    hps: 320000 },
  { id: "planet",     name: "Glitzerplanet",  mehrzahl: "Glitzerplaneten",   icon: "🪐", basisPreis: 15e9,     hps: 2e6 },
  { id: "galaxie",    name: "Herzgalaxie",    mehrzahl: "Herzgalaxien",      icon: "🌌", basisPreis: 120e9,    hps: 12e6 },
  { id: "koenigreich", name: "Herzkönigreich", mehrzahl: "Herzkönigreiche",  icon: "👑", basisPreis: 1e12,     hps: 75e6 },
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
  { id: "tierSchick", icon: "🎀", name: "Schick gemacht",    beschr: "Zieh deinem Haustier Zubehör an",           bedingung: s => [s.haustier, s.haustier2].some(t => t && t.zubehoer && Object.keys(t.zubehoer).length) },
  { id: "tier50",     icon: "🏆", name: "Beste Freunde",     beschr: "Dein Haustier erreicht Level 50",           bedingung: s => Boolean(s.haustier) && s.haustier.level >= 50 },
  { id: "tier2",      icon: "🐾", name: "Doppelt kuschelig", beschr: "Adoptiere ein zweites Haustier",            bedingung: s => Boolean(s.haustier2) },
  { id: "regen40",    icon: "🧺", name: "Fang-Profi",        beschr: "Fange 40 Punkte in einem Herzregen",        bedingung: s => (s.regenBest || 0) >= 40 },
  { id: "neustart1",  icon: "🌟", name: "Neuanfang",         beschr: "Mache einen Neustart mit Bonus",            bedingung: s => (s.neustarts || 0) >= 1 },
  { id: "sterne25",   icon: "💫", name: "Sternenhimmel",     beschr: "Sammle 25 Glitzersterne",                   bedingung: s => (s.sterne || 0) >= 25 },
  { id: "offline8",   icon: "😴", name: "Über Nacht",        beschr: "Komm nach mindestens 8 Stunden zurück",     bedingung: s => (s.offlineMax || 0) >= 8 * 3600 },
  { id: "memory10",   icon: "🃏", name: "Gutes Gedächtnis",  beschr: "Schaffe das Sticker-Memory mit höchstens 10 Zügen", bedingung: s => (s.minispiele?.best?.memory ?? 99) <= 10 },
  { id: "finde15",    icon: "🔍", name: "Adlerauge",         beschr: "Finde Marie in allen 5 Runden in unter 15 Sekunden", bedingung: s => (s.minispiele?.best?.finde ?? 99) < 15 },
  { id: "fangen30",   icon: "🧺", name: "Leckerli-Profi",    beschr: "Fange 30 Punkte beim Leckerli-Fangen",       bedingung: s => (s.minispiele?.best?.fangen || 0) >= 30 },
  { id: "woche1",     icon: "🗓️", name: "Wochen-Champion",   beschr: "Schaffe alle 3 Wochen-Missionen einer Woche", bedingung: s => (s.wochenBoni || 0) >= 1 },
  { id: "wochenSchatz", icon: "🏆", name: "Schatzkammer",    beschr: "Sammle alle 12 Wochen-Schätze im Album",   bedingung: () => { const seite = STICKER_SEITEN.find(x => x.exklusiv); return Boolean(seite) && seiteVoll(seite); } },
  { id: "feiertage",  icon: "🎉", name: "Feiertagskind",     beschr: "Öffne die Geschenke von Nikolaus, Silvester und dem ersten Schnee", bedingung: s => ["nikolaus", "silvester", "schnee"].every(id => s.feiertage && s.feiertage[id]) },
  { id: "zimmer1",    icon: "🏠", name: "Eingezogen",        beschr: "Kaufe das erste Teil für Maries Zimmer",   bedingung: () => anzahlZimmerTeile() >= 1 },
  { id: "zimmer15",   icon: "🛋️", name: "Gemütlich",         beschr: "Besitze 15 Teile für Maries Zimmer",       bedingung: () => anzahlZimmerTeile() >= 15 },
  { id: "zimmerVoll", icon: "🏡", name: "Traumzimmer",       beschr: "Stelle auf jeden Platz im Zimmer etwas hin", bedingung: () => zimmerVoll() },
  { id: "zimmer40",   icon: "👑", name: "Einrichtungsprofi", beschr: "Besitze 40 Teile für Maries Zimmer",       bedingung: () => anzahlZimmerTeile() >= 40 },
  { id: "zeit30",    icon: "🫖", name: "Teeparty",          beschr: "Spiele 30 Minuten",                        bedingung: s => s.spielzeit >= 1800 },
];
