"use strict";
// =====================================================
//  HILFSFUNKTIONEN – allgemein, ohne Bezug zum Spiel
// =====================================================

// Große Zahlen lesbar machen: 1500000 -> "1,5 Mio."
function format(zahl) {
  const stufen = [[1e12, " Bio."], [1e9, " Mrd."], [1e6, " Mio."]];
  for (const [wert, name] of stufen) {
    if (zahl >= wert) {
      return (zahl / wert).toLocaleString("de-DE", { maximumFractionDigits: 2 }) + name;
    }
  }
  return Math.floor(zahl).toLocaleString("de-DE");
}

// Wie format(), aber kleine Zahlen mit einer Nachkommastelle: 0.1 -> "0,1"
function formatKomma(zahl) {
  return zahl < 1e6
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
