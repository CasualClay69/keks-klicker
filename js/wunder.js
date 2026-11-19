"use strict";
// =====================================================
//  GEHEIME EREIGNISSE – seltene Überraschungen, die nirgends angekündigt werden
//  • 🌈 Regenbogen-Tag:       den ganzen Tag zählt alles doppelt (Klicks und Helfer)
//  • 🌠 Sternschnuppen-Nacht: abends (17–22 Uhr) kommen ganz oft Sternschnuppen
//  • 🍀 Sticker-Glückstag:    den ganzen Tag fallen 4× so oft Sticker heraus
//
//  Ob heute so ein Tag ist, wird aus dem Datum ausgerechnet – so erleben alle Geräte
//  der Familie die Überraschung am selben Tag, ganz ohne Server. Etwa 2–3× im Monat.
//
//  Gespeichert: spiel.wunderGesehen = "2026-11-18:regenbogen" (Fenster schon gezeigt)
//               spiel.wunderErlebt  = { regenbogen: 2, … }
//  Diese Datei fasst das HTML nicht an (Bildschirm: wunder-ui.js).
// =====================================================

const WUNDER = [
  { id: "regenbogen", icon: "🌈", name: "Regenbogen-Tag", anteil: 30,
    titel: "Ein Regenbogen-Tag!", text: "Psst, heute ist etwas Besonderes: Den ganzen Tag zählt ALLES doppelt – jeder Klick und alle Helfer!",
    kurz: "🌈 Regenbogen-Tag: alles ×2!", klickFaktor: 2, prodFaktor: 2 },
  { id: "sternennacht", icon: "🌠", name: "Sternschnuppen-Nacht", anteil: 30, vonStunde: 17, bisStunde: 22,
    titel: "Sternschnuppen-Nacht!", text: "Schau mal in den Himmel! Heute Abend fliegen ganz viele Sternschnuppen vorbei – fang sie alle!",
    kurz: "🌠 Sternschnuppen-Nacht!", sternWarten: [6, 16] },
  { id: "stickerglueck", icon: "🍀", name: "Sticker-Glückstag", anteil: 25,
    titel: "Sticker-Glückstag!", text: "Heute ist dein Glückstag: Es fallen viel öfter Sticker heraus. Klick, was das Zeug hält!",
    kurz: "🍀 Glückstag: Sticker ×4!", stickerFaktor: 4 },
];

// Nur zum Ansehen aus dem Admin-Menü (nicht gespeichert)
let wunderTest = null;

// Kleine Prüfsumme aus dem Datum (FNV-1a): 0 … 999, für jedes Datum immer gleich
function wunderZahl(tag) {
  let h = 2166136261;
  for (const zeichen of `wunder|${tag}`) {
    h ^= zeichen.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % 1000;
}

// Welches Ereignis wäre an diesem Tag dran (unabhängig von der Uhrzeit)?
function wunderDesTages(tag) {
  let zahl = wunderZahl(tag);
  for (const w of WUNDER) {
    if (zahl < w.anteil) return w;
    zahl -= w.anteil;
  }
  return null;
}

// Das gerade laufende Ereignis (oder null)
function aktivesWunder(datum = new Date(Date.now())) {
  if (wunderTest) return WUNDER.find(w => w.id === wunderTest) || null;
  const w = wunderDesTages(datumText(datum));
  if (!w) return null;
  if (w.vonStunde !== undefined) {
    const stunde = datum.getHours();
    if (stunde < w.vonStunde || stunde >= w.bisStunde) return null;
  }
  return w;
}

// Faktoren für logik.js und album.js
function wunderKlickFaktor()   { const w = aktivesWunder(); return (w && w.klickFaktor) || 1; }
function wunderProdFaktor()    { const w = aktivesWunder(); return (w && w.prodFaktor) || 1; }
function wunderStickerFaktor() { const w = aktivesWunder(); return (w && w.stickerFaktor) || 1; }

// Wartezeit bis zur nächsten Sternschnuppe: [min, max] in Sekunden
function sternWartezeit() {
  const w = aktivesWunder();
  if (w && w.sternWarten) return w.sternWarten;
  const f = typeof skillSternWarteFaktor === "function" ? skillSternWarteFaktor() : 1;   // "Sternenstaub" (skills.js)
  return [KONFIG.stern.minWartenSek * f, KONFIG.stern.maxWartenSek * f];
}

// Soll das Überraschungs-Fenster kommen? (einmal pro Ereignis und Tag)
function wunderNochNichtGesehen() {
  const w = aktivesWunder();
  if (!w || wunderTest) return false;
  return spiel.wunderGesehen !== `${datumText()}:${w.id}`;
}

function merkeWunderGesehen() {
  const w = aktivesWunder();
  if (!w) return;
  spiel.wunderGesehen = `${datumText()}:${w.id}`;
  spiel.wunderErlebt = { ...(spiel.wunderErlebt || {}), [w.id]: ((spiel.wunderErlebt || {})[w.id] || 0) + 1 };
  speichern();
}
