"use strict";
// =====================================================
//  MINISPIELE – Regeln und Belohnungen
//  • Sticker-Memory:   6 Paare aus den eigenen Stickern – weniger Züge = mehr Herzen
//  • Finde Marie/Hannah: die echte Figur zwischen Doppelgängerinnen finden (5 Runden, auf Zeit)
//  • Leckerli-Fangen:  mit dem Haustier 30 Sekunden lang Leckerli fangen
//
//  Belohnung wie beim Herzregen (wächst mit der Produktion). Pro Spiel gibt es
//  MINISPIELE.volleProTag-mal am Tag die volle Belohnung, danach nur noch einen Teil.
//
//  Gespeichert: spiel.minispiele = { tag, gespielt: {id: n}, best: {id: wert}, anzahl }
//  Diese Datei fasst das HTML nicht an – die Spiele selbst stehen in spielhalle.js.
// =====================================================

const MINISPIELE = {
  volleProTag: 5,          // so oft pro Spiel und Tag die volle Belohnung …
  restAnteil: 0.2,         // … danach nur noch 20 %
  maxPunkte: 40,
  seasonPunkteProPunkt: 5,
  memory: { paare: 6 },
  finde:  { figuren: [8, 12, 16, 22, 28], strafeSek: 2 },   // Figuren pro Runde, Strafe für falsches Tippen
  fangen: { dauerSek: 30, festmahlChance: 0.1, chiliChance: 0.15 },
};

const MINISPIEL_LISTE = [
  { id: "memory", icon: "🃏", name: "Sticker-Memory",
    beschr: "Finde die Paare – mit deinen eigenen Stickern!" },
  { id: "finde",  icon: "🔍", name: "Finde Marie",
    beschr: "Wo steckt Marie? Tippe sie schnell an – 5 Runden." },
  { id: "fangen", icon: "🧺", name: "Leckerli-Fangen",
    beschr: "Fange mit deinem Haustier die Leckerli – aber keine Chilis!" },
];

function minispielStand() {
  if (!spiel.minispiele) spiel.minispiele = { tag: "", gespielt: {}, best: {}, anzahl: 0 };
  const m = spiel.minispiele;
  if (m.tag !== datumText()) { m.tag = datumText(); m.gespielt = {}; }   // neuer Tag
  return m;
}

// Wie oft gibt es heute noch die volle Belohnung?
function volleBelohnungenUebrig(id) {
  return Math.max(0, MINISPIELE.volleProTag - (minispielStand().gespielt[id] || 0));
}

// Kann das Spiel gestartet werden? Rückgabe: null (ja) oder ein Grund als Text
function minispielGesperrt(id) {
  if (id === "memory") {
    const n = eigeneSticker().length;
    if (n < MINISPIELE.memory.paare) return `Sammle erst ${MINISPIELE.memory.paare} verschiedene Sticker (du hast ${n}).`;
  }
  if (id === "fangen" && !haustier()) return "Adoptiere zuerst ein Haustier (das Ei neben der Figur).";
  return null;
}

// ----- Sticker-Memory -----

function eigeneSticker() {
  return ALLE_STICKER.filter(s => stickerAnzahl(s) > 0);
}

// Gemischte Karten: jede Sticker-ID zweimal
function memoryKarten() {
  const auswahl = mische(eigeneSticker()).slice(0, MINISPIELE.memory.paare);
  return mische([...auswahl, ...auswahl]);
}

// Punkte: 6 Züge (perfekt) = 40, jeder Zug mehr -2, mindestens 6
function memoryPunkte(zuege) {
  return Math.max(6, MINISPIELE.maxPunkte - (zuege - MINISPIELE.memory.paare) * 2);
}

// ----- Finde die Figur -----

// Punkte: ~10 Sekunden für alle 5 Runden = 40, jede Sekunde mehr -1, mindestens 6
function findePunkte(sekunden) {
  return Math.max(6, Math.min(MINISPIELE.maxPunkte, Math.round(50 - sekunden)));
}

// Haarfarben für die Doppelgängerinnen
const FINDE_HAARFARBEN = [
  ["#d4a373", "#b07d4f"], ["#fbe39a", "#e3b14f"], ["#e9764f", "#b8452c"], ["#5a3e2b", "#2f1f15"],
  ["#ffbfd9", "#f27aa8"], ["#dcc0ff", "#9b6cf0"], ["#56679f", "#262f63"], ["#c9c9c9", "#8a8a8a"],
];

// ----- Leckerli-Fangen -----

function fangenPunkte(gefangen) {
  return Math.max(0, Math.min(MINISPIELE.maxPunkte, gefangen));
}

// ----- Hilfen -----

function mische(liste) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ----- Ende eines Spiels: Belohnung -----

// wert: Memory = Züge, Finde = Sekunden, Fangen = gefangene Punkte
// Rückgabe: { punkte, herzen, seasonPunkte, stufen, rekord, voll, tier }
function beendeMinispiel(id, wert) {
  const m = minispielStand();
  const punkte = id === "memory" ? memoryPunkte(wert) : id === "finde" ? findePunkte(wert) : fangenPunkte(wert);
  const voll = volleBelohnungenUebrig(id) > 0;
  const anteil = voll ? 1 : MINISPIELE.restAnteil;

  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  const proPunkt = Math.max(20, basisHps() * 10 + proKlick * 3);   // wie beim Herzregen
  const herzen = punkte > 0 ? rundeHuebsch(punkte * proPunkt * anteil) : 0;
  if (herzen) herzenDazu(herzen);
  const seasonPunkte = aktiverSeasonPass() ? Math.round(punkte * MINISPIELE.seasonPunkteProPunkt * anteil) : 0;
  const stufen = seasonPunkte ? seasonKlick(seasonPunkte) : [];

  // Rekord: Memory/Finde = weniger ist besser, Fangen = mehr ist besser
  const bisher = m.best[id];
  const besser = id === "fangen" ? wert > (bisher || 0) : bisher === undefined || wert < bisher;
  if (besser) m.best[id] = wert;
  m.gespielt[id] = (m.gespielt[id] || 0) + 1;
  m.anzahl = (m.anzahl || 0) + 1;

  // Leckerli-Fangen macht das Haustier satt und bringt Erfahrung
  let tier = null;
  if (id === "fangen" && haustier() && wert > 0) {
    aktualisiereHunger();
    const t = haustier();
    t.sattheit = Math.min(100, t.sattheit + Math.min(40, wert * 2));
    tier = gibTierXp(Math.ceil(wert / 3));
  }
  return { punkte, herzen, seasonPunkte, stufen, rekord: besser && bisher !== undefined, voll, tier };
}
