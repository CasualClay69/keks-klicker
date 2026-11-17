"use strict";
// =====================================================
//  TÄGLICHES GESCHENK
//  Beim ersten Öffnen am Tag wartet ein Geschenk. Wer mehrere Tage hintereinander
//  kommt, bekommt ein immer größeres Geschenk (Tag 1 … 7, danach jeden Tag das große).
//  Gespeichert in spiel.geschenk = { letzterTag, serie, beste }
//  Diese Datei fasst das HTML nicht an.
// =====================================================

const GESCHENK_FAKTOREN      = [1, 1.5, 2, 2.5, 3, 4, 6];          // Herzen-Faktor für Tag 1 … 7
const GESCHENK_SEASON_PUNKTE = [100, 150, 200, 250, 300, 400, 700]; // Season-Fortschritt für Tag 1 … 7
const GESCHENK_TAGE = GESCHENK_FAKTOREN.length;

function gesternText() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return datumText(d);
}

function geschenkStand() {
  if (!spiel.geschenk) spiel.geschenk = { letzterTag: null, serie: 0, beste: 0 };
  return spiel.geschenk;
}

// Wartet heute noch ein Geschenk?
function geschenkWartet() {
  return geschenkStand().letzterTag !== datumText();
}

// Der wievielte Tag hintereinander wäre heute? (1 = Serie beginnt neu)
function geschenkSerieHeute() {
  const g = geschenkStand();
  if (g.letzterTag === datumText()) return g.serie;
  if (g.letzterTag === gesternText()) return g.serie + 1;
  return 1;
}

// Wurde die Serie unterbrochen? (es gab schon mal eine, aber nicht gestern)
function geschenkSerieUnterbrochen() {
  const g = geschenkStand();
  return g.serie > 1 && g.letzterTag !== gesternText() && g.letzterTag !== datumText();
}

// Tag 1 … 7 (ab Tag 7 bleibt es beim großen Geschenk)
function geschenkTag(serie) {
  return Math.min(Math.max(serie, 1), GESCHENK_TAGE);
}

// Grundwert: Produktion von 15 Minuten + Wert von 200 Klicks (mind. 500), mal Tages-Faktor
function geschenkBelohnung(serie) {
  const tag = geschenkTag(serie);
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  const basis = Math.max(500, basisHps() * 900 + proKlick * 200);
  return {
    tag,
    herzen: rundeHuebsch(basis * GESCHENK_FAKTOREN[tag - 1]),
    seasonPunkte: aktiverSeasonPass() ? GESCHENK_SEASON_PUNKTE[tag - 1] : 0,
  };
}

// Geschenk öffnen: Belohnung gutschreiben. Rückgabe: { tag, serie, herzen, seasonPunkte, stufen } oder null
function oeffneGeschenk() {
  if (!geschenkWartet()) return null;
  const serie = geschenkSerieHeute();
  const belohnung = geschenkBelohnung(serie);
  const g = geschenkStand();
  spiel.geschenk = { letzterTag: datumText(), serie, beste: Math.max(g.beste || 0, serie) };

  herzenDazu(belohnung.herzen);
  const stufen = belohnung.seasonPunkte ? seasonKlick(belohnung.seasonPunkte) : [];
  speichern();
  return { ...belohnung, serie, stufen };
}
