"use strict";
// =====================================================
//  HILFSFUNKTIONEN – allgemein, ohne Bezug zum Spiel
// =====================================================

// Große Zahlen lesbar machen: 1500000 -> "1,5 Mio."
// ----- Wie große Zahlen aussehen (Optionen-Menü ⚙️) -----
//  "worte": 1,5 Mio. · 2,3 Mrd.   "kurz": 1,5k · 2,3m · 4b · 7t   "wiss": 1,5e3 · 2,3e9
const ZAHLEN_ARTEN = ["worte", "kurz", "wiss"];
const ZAHLEN_SPEICHER = "marieClicker-zahlen";   // Einstellung des Geräts (bleibt auch beim "Spielstand löschen")
const KURZ_ENDUNGEN = ["k", "m", "b", "t", "qa", "qi", "sx", "sp", "oc", "no", "dc",
  "ud", "dd", "td", "qad", "qid", "sxd", "spd", "ocd", "nod", "vg"];   // bis 10⁶³, danach wissenschaftlich

let zahlenArt = (() => {
  try { const a = localStorage.getItem(ZAHLEN_SPEICHER); return ZAHLEN_ARTEN.includes(a) ? a : "worte"; } catch (e) { return "worte"; }
})();

function setzeZahlenArt(art) {
  zahlenArt = ZAHLEN_ARTEN.includes(art) ? art : "worte";
  try { localStorage.setItem(ZAHLEN_SPEICHER, zahlenArt); } catch (e) { /* egal */ }
}

// Ab welcher Größe abgekürzt wird (darunter: ganze Zahl mit Tausenderpunkt)
function abkuerzenAb() {
  return zahlenArt === "worte" ? 1e6 : 1e3;
}

const zweiStellen = x => x.toLocaleString("de-DE", { maximumFractionDigits: 2 });

function formatKurz(zahl) {
  let stufe = Math.min(KURZ_ENDUNGEN.length, Math.floor(Math.log10(zahl) / 3));
  let wert = Math.floor(zahl / 10 ** (stufe * 3) * 100 + 1e-9) / 100;   // abrunden: nie mehr zeigen, als man hat
  if (wert >= 1000 && stufe < KURZ_ENDUNGEN.length) { stufe++; wert = Math.round(wert / 10) / 100; }   // 999,999k -> 1m
  return zweiStellen(wert) + KURZ_ENDUNGEN[stufe - 1];
}

function formatWissenschaftlich(zahl) {
  let exp = Math.floor(Math.log10(zahl));
  let wert = Math.floor(zahl / 10 ** exp * 100 + 1e-9) / 100;
  if (wert >= 10) { exp++; wert = Math.round(wert * 10) / 100; }   // 9,999e5 -> 1e6
  return zweiStellen(wert) + "e" + exp;
}

// Ab 10³⁰⁸ ist Schluss: Unendlich (siehe unendlich.js)
function format(zahl) {
  if (!Number.isFinite(zahl) || zahl >= 1e308) return "∞";
  if (zahl >= 1e3 && zahlenArt === "kurz") return zahl < 1e66 ? formatKurz(zahl) : formatWissenschaftlich(zahl);
  if (zahl >= 1e3 && zahlenArt === "wiss") return formatWissenschaftlich(zahl);
  if (zahl >= 1e24) return formatWissenschaftlich(zahl);   // für noch größere Zahlen gibt es keine bekannten Wörter
  const stufen = [[1e21, " Trd."], [1e18, " Trill."], [1e15, " Brd."], [1e12, " Bio."], [1e9, " Mrd."], [1e6, " Mio."]];
  for (const [wert, name] of stufen) {
    if (zahl >= wert) {
      return (zahl / wert).toLocaleString("de-DE", { maximumFractionDigits: 2 }) + name;
    }
  }
  return Math.floor(zahl).toLocaleString("de-DE");
}

// Wie format(), aber kleine Zahlen mit einer Nachkommastelle: 0.1 -> "0,1"
function formatKomma(zahl) {
  return zahl < abkuerzenAb()
    ? zahl.toLocaleString("de-DE", { maximumFractionDigits: 1 })
    : format(zahl);
}

// Sekunden -> "1 Std. 5 Min. 12 Sek."
function formatZeit(sekunden) {
  const s = Math.floor(sekunden);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return (h ? `${h} Std. ` : "") + (h || m ? `${m} Min. ` : "") + `${s % 60} Sek.`;
}

// Datum als Text "2026-11-17" (Ortszeit) – z.B. für Tagesaufgaben und Dateinamen
function datumText(datum = new Date()) {
  const zweistellig = n => String(n).padStart(2, "0");
  return `${datum.getFullYear()}-${zweistellig(datum.getMonth() + 1)}-${zweistellig(datum.getDate())}`;
}

// Millisekunden bis Mitternacht (Ortszeit)
function msBisMitternacht() {
  const jetzt = new Date();
  const mitternacht = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() + 1);
  return mitternacht - jetzt;
}

function zufallAus(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

function ganzzahlZwischen(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function zufallZwischen(min, max) {
  return min + Math.random() * (max - min);
}

// Wählt ein Element zufällig aus, entsprechend seinem "gewicht"
function zufallGewichtet(liste) {
  const summe = liste.reduce((s, e) => s + e.gewicht, 0);
  let wurf = Math.random() * summe;
  for (const eintrag of liste) {
    wurf -= eintrag.gewicht;
    if (wurf < 0) return eintrag;
  }
  return liste[liste.length - 1];
}
