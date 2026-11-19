"use strict";
// =====================================================
//  WOLKEN-MONSTER ☁️ – ab und zu taucht eine kleine Wolke auf, die man in 30 Sekunden
//  "wegkitzeln" muss (schnell antippen, jeder Finger zählt einzeln).
//  Schwierigkeit: Mit 2 Fingern reichen ~2 Tipps pro Finger und Sekunde, mit 6 Fingern
//  ist es in ~10 Sekunden geschafft. Wer es in der halben Zeit schafft: ⚡ Blitz-Bonus.
//  Jeder Tipp zählt auch als echter Klick (Klick-Stufe), bringt aber selbst keine Herzen.
//  Verlieren kann man nichts – die Wolke fliegt dann einfach weiter.
//
//  Gespeichert: spiel.monster = { besiegt, entkommen, schnellste (Sekunden) }
//  Diese Datei fasst das HTML nicht an (Bildschirm: monster-ui.js).
// =====================================================

const MONSTER = {
  sekunden: 30,
  wartenMin: [8, 15],      // Minuten bis zum nächsten Monster (nur während gespielt wird)
  ersteNachMin: [2, 4],
  blitzAnteil: 0.5,        // in der halben Zeit geschafft -> Blitz-Bonus
};

const MONSTER_ARTEN = [
  { id: "grummel",    icon: "🌥️", name: "Grummelwölkchen",     tipps: 100, gewicht: 60, herzFaktor: 1 },
  { id: "donner",     icon: "⛈️", name: "Donnerwolke",          tipps: 140, gewicht: 30, herzFaktor: 1.5 },
  { id: "regenbogen", icon: "🌈", name: "Regenbogen-Wölkchen",  tipps: 120, gewicht: 10, herzFaktor: 2, zaubersamen: true },
];

// Gesicht je nach Fortschritt (0 … 1): erst grummelig, dann immer kicheriger
function monsterGesicht(anteil) {
  return anteil < 0.25 ? "😠" : anteil < 0.5 ? "😣" : anteil < 0.8 ? "😆" : "🤣";
}

function monsterStand() {
  if (!spiel.monster) spiel.monster = { besiegt: 0, entkommen: 0, schnellste: null };
  return spiel.monster;
}

function zufallsMonster() {
  return zufallGewichtet(MONSTER_ARTEN);
}

// Belohnung: ~15 Min. Produktion + 300 Klicks, mal Art, ⚡ doppelt. Dazu ein Sticker.
function monsterBelohnung(art, blitz) {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  const herzen = rundeHuebsch(Math.max(1000, (basisHps() * 900 + proKlick * 300) * art.herzFaktor * (blitz ? 2 : 1)));
  herzenDazu(herzen);
  const sticker = gibSticker("monster");
  let zaubersamen = false;
  if (art.zaubersamen && typeof gartenStand === "function") {
    gartenStand().zaubersamen++;
    zaubersamen = true;
  }
  const seasonPunkte = aktiverSeasonPass() ? 300 : 0;
  const stufen = seasonPunkte ? seasonKlick(seasonPunkte) : [];
  return { herzen, sticker, zaubersamen, seasonPunkte, stufen };
}

function merkeMonsterSieg(sekunden) {
  const m = monsterStand();
  m.besiegt++;
  if (m.schnellste === null || sekunden < m.schnellste) m.schnellste = Math.round(sekunden * 10) / 10;
}

function merkeMonsterEntkommen() {
  monsterStand().entkommen++;
}
