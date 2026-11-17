"use strict";
// =====================================================
//  GEBURTSTAGS-EVENT
//  Jede Figur hat ihren eigenen Geburtstag (Marie 03.02, Hannah 08.02). Gefeiert wird
//  der Geburtstag der gewählten Figur: Konfetti-Regen, Partyhut, "Happy Birthday"
//  als Hintergrundmusik und ein großes Geschenk (inkl. Partyhut und Melodie als
//  dauerhafte Skins).
//  Gespeichert: spiel.geburtstagJahre = { figurId: Jahr, in dem das Geschenk geöffnet wurde }
//  (ältere Spielstände: spiel.geburtstagJahr gilt für Marie)
//  Diese Datei fasst das HTML nicht an.
// =====================================================

const GEBURTSTAG = {
  // Tag und Monat pro Figur (Figur-IDs aus skins.js)
  termine: {
    "figur-marie":  { tag: 3, monat: 2 },   // 3. Februar
    "figur-hannah": { tag: 8, monat: 2 },   // 8. Februar
  },
  seasonPunkte: 2000,
  skins: ["hut-partyhut", "musik-geburtstag"],
};

// Hat die gewählte Figur heute Geburtstag? (Ortszeit des Geräts)
function istGeburtstag(datum = new Date(Date.now()), figurId = aktiverSkin("figur").id) {
  const termin = GEBURTSTAG.termine[figurId];
  return Boolean(termin) && datum.getDate() === termin.tag && datum.getMonth() + 1 === termin.monat;
}

// In welchem Jahr hat die Figur ihr Geschenk zuletzt geöffnet?
function geburtstagGeoeffnetJahr(figurId) {
  const jahre = spiel.geburtstagJahre || {};
  if (jahre[figurId] !== undefined) return jahre[figurId];
  return figurId === "figur-marie" ? spiel.geburtstagJahr : null;   // alter Spielstand
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
  return istGeburtstag() && geburtstagGeoeffnetJahr(aktiverSkin("figur").id) !== new Date(Date.now()).getFullYear();
}

// Herzen: ~3 Std. Produktion + 3.000 Klicks, mindestens 50.000
function geburtstagsHerzen() {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  return rundeHuebsch(Math.max(50000, basisHps() * 3 * 3600 + proKlick * 3000));
}

// Geschenk öffnen. Rückgabe: { herzen, seasonPunkte, stufen, neueSkins } oder null
function oeffneGeburtstagsGeschenk() {
  if (!geburtstagsGeschenkWartet()) return null;
  spiel.geburtstagJahre = { ...(spiel.geburtstagJahre || {}), [aktiverSkin("figur").id]: new Date(Date.now()).getFullYear() };

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
