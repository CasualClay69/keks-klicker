"use strict";
// =====================================================
//  GEBURTSTAGS-EVENT
//  Jedes Jahr an Maries Geburtstag: Konfetti-Regen, Partyhut, "Happy Birthday"
//  als Hintergrundmusik und ein großes Geschenk (inkl. Partyhut und Melodie als
//  dauerhafte Skins).
//  Gespeichert: spiel.geburtstagJahr = Jahr, in dem das Geschenk geöffnet wurde
//  Diese Datei fasst das HTML nicht an.
// =====================================================

const GEBURTSTAG = {
  tag: 3,
  monat: 2,          // Februar
  name: "Marie",
  seasonPunkte: 2000,
  skins: ["hut-partyhut", "musik-geburtstag"],
};

// Ist heute Geburtstag? (Ortszeit des Geräts)
function istGeburtstag(datum = new Date(Date.now())) {
  return datum.getDate() === GEBURTSTAG.tag && datum.getMonth() + 1 === GEBURTSTAG.monat;
}

// Hut und Musik: am Geburtstag immer Partyhut und "Happy Birthday"
function aktuellerHut() {
  return istGeburtstag() ? SKINS.find(s => s.id === "hut-partyhut") : aktiverSkin("hut");
}

function aktuellesMusikStueck() {
  return istGeburtstag() ? HAPPY_BIRTHDAY : aktiverSkin("musik").musik;
}

// Wartet heute das Geburtstagsgeschenk?
function geburtstagsGeschenkWartet() {
  return istGeburtstag() && spiel.geburtstagJahr !== new Date(Date.now()).getFullYear();
}

// Herzen: ~3 Std. Produktion + 3.000 Klicks, mindestens 50.000
function geburtstagsHerzen() {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  return rundeHuebsch(Math.max(50000, basisHps() * 3 * 3600 + proKlick * 3000));
}

// Geschenk öffnen. Rückgabe: { herzen, seasonPunkte, stufen, neueSkins } oder null
function oeffneGeburtstagsGeschenk() {
  if (!geburtstagsGeschenkWartet()) return null;
  spiel.geburtstagJahr = new Date(Date.now()).getFullYear();

  const herzen = geburtstagsHerzen();
  herzenDazu(herzen);
  const seasonPunkte = aktiverSeasonPass() ? GEBURTSTAG.seasonPunkte : 0;
  const stufen = seasonPunkte ? seasonKlick(seasonPunkte) : [];

  const neueSkins = GEBURTSTAG.skins
    .filter(id => !skinStand.freigeschaltet.includes(id))
    .map(id => { schalteSkinFrei(id); return SKINS.find(s => s.id === id); });
  speichereSkins();
  speichern();
  return { herzen, seasonPunkte, stufen, neueSkins };
}
