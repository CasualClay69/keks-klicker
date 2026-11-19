"use strict";
// =====================================================
//  SPIELLOGIK
//  Berechnungen und Aktionen. Diese Datei fasst das HTML
//  nicht an – das macht anzeige.js.
// =====================================================

// ----- Abfragen -----

function anzahl(item) {
  return spiel.anzahl[item.id] || 0;
}

function anzahlGebaeude() {
  return GEBAEUDE.reduce((summe, g) => summe + anzahl(g), 0);
}

function istGebaeude(item) {
  return GEBAEUDE.includes(item);
}

// Preis für "menge" Stück: Jedes weitere Stück kostet 15 % mehr, die Einzelpreise werden addiert
// skillHelferRabatt(): Helfer werden mit der Sternen-Karte billiger (skills.js)
function preis(item, menge = 1) {
  const n = anzahl(item);
  const rabatt = istGebaeude(item) && typeof skillHelferRabatt === "function" ? skillHelferRabatt() : 1;
  let summe = 0;
  for (let i = 0; i < menge; i++) {
    summe += Math.ceil(item.basisPreis * Math.pow(KONFIG.preisAnstieg, n + i) * rabatt);
  }
  return summe;
}

// ----- Mitwachsende Preise (Zimmer-Teile, Tier-Zubehör) -----
// Bis 100 Mrd. Herzen aller Zeiten gelten die Preise aus den Listen. Danach wachsen sie im
// gleichen Verhältnis wie die Herzen aller Zeiten mit – so bleibt z.B. ein 25-Mrd.-Teil immer
// ein Sparziel von etwa einer Viertelstunde (6 Finger) bis einer Stunde (2 Finger).
// Herzen aller Zeiten sinken nie (auch nicht beim Neustart) -> die Preise auch nicht.
const PREIS_WACHSTUM_AB = 1e11;

function mitwachsenderPreis(basis) {
  if (!basis) return basis;   // 0 = gratis, null = gesperrt
  const h = typeof herzenAllerZeiten === "function" ? herzenAllerZeiten() : 0;
  const f = h > PREIS_WACHSTUM_AB ? h / PREIS_WACHSTUM_AB : 1;
  return f === 1 ? basis : Math.min(1e307, rundeHuebsch(basis * f));
}

// Nächste Upgrade-Stufe, die für diese Sorte noch nicht freigeschaltet ist
function naechsteStufe(gebaeude) {
  return UPGRADE_STUFEN.find(stufe => stufe.ab > anzahl(gebaeude));
}

// Kann man sich den nächsten Meilenstein (nächste Upgrade-Stufe) dieser Sorte gerade leisten?
// Nur bei Sorten, die man schon hat – sonst würde jeder billige erste Kauf zählen.
function meilensteinLeistbar(gebaeude) {
  const stufe = naechsteStufe(gebaeude);
  const n = anzahl(gebaeude);
  return n > 0 && Boolean(stufe) && spiel.herzen >= preis(gebaeude, stufe.ab - n);
}

// Wie viele Stück ein Klick im Shop kauft (0 = im Modus "next" nichts mehr zu erreichen)
function kaufMenge(item) {
  if (!istGebaeude(item)) return 1;                 // Klick-Items immer einzeln
  if (spiel.kaufModus !== "next") return Number(spiel.kaufModus);
  const stufe = naechsteStufe(item);
  return stufe ? stufe.ab - anzahl(item) : 0;
}

function upgradeGekauft(upgrade) {
  return spiel.upgrades.includes(upgrade.id);
}

function upgradeVerfuegbar(upgrade) {
  return !upgradeGekauft(upgrade) && anzahl(upgrade.gebaeude) >= upgrade.ab;
}

// Der Sternschnuppen-Bonus zählt nur, solange er nicht abgelaufen ist
function aktuellerBonus() {
  return Date.now() < bonus.ende ? bonus : KEIN_BONUS;
}

function bonusRestSekunden() {
  return Math.max(0, Math.ceil((aktuellerBonus().ende - Date.now()) / 1000));
}

// ----- Produktion -----

function erfolgFaktor() {
  return 1 + spiel.erfolge.length * KONFIG.erfolgBonus;
}

// Jedes gekaufte Upgrade verdoppelt: 1, 2, 4, 8, 16 …
function gebaeudeFaktor(gebaeude) {
  const gekauft = UPGRADES.filter(u => u.gebaeude === gebaeude && upgradeGekauft(u)).length;
  return Math.pow(2, gekauft);
}

// Herzen pro Sekunde von EINEM Stück dieser Sorte (ohne Sternschnuppen-Bonus).
// haustierFaktor(): ein sattes Haustier gibt +1 % pro Level (siehe haustier.js)
function hpsProStueck(gebaeude) {
  const tier = typeof haustierFaktor === "function" ? haustierFaktor() : 1;
  const skills = typeof skillProdFaktor === "function" ? skillProdFaktor() : 1;   // Sternen-Karte (skills.js)
  const zimmer = typeof zimmerFaktor === "function" ? zimmerFaktor() : 1;   // Zimmer-Teile (zimmer.js)
  const stufe = typeof klickStufeFaktor === "function" ? klickStufeFaktor() : 1;   // Klick-Stufe (klickstufe.js)
  return deckel(gebaeude.hps * gebaeudeFaktor(gebaeude) * erfolgFaktor() * tier * skills * zimmer * stufe);
}

// Herzen pro Sekunde insgesamt, ohne Sternschnuppen-Bonus
function basisHps() {
  return deckel(GEBAEUDE.reduce((summe, g) => summe + (anzahl(g) ? anzahl(g) * hpsProStueck(g) : 0), 0));
}

// wunderProdFaktor(): Regenbogen-Tag zählt doppelt (wunder.js)
function herzenProSekunde() {
  const wunder = typeof wunderProdFaktor === "function" ? wunderProdFaktor() : 1;
  const backen = typeof backProdFaktor === "function" ? backProdFaktor() : 1;   // Apfelkuchen/Zauberkuchen (backstube.js)
  return deckel(basisHps() * aktuellerBonus().prodFaktor * wunder * backen);
}

function herzenProKlick() {
  const basis = 1 + KLICK_ITEMS.reduce((summe, k) => summe + anzahl(k) * k.proKlick, 0);
  const skills = (typeof skillKlickFaktor === "function" ? skillKlickFaktor() : 1)   // Sternen-Karte (skills.js)
    * (typeof klickStufeFaktor === "function" ? klickStufeFaktor() : 1);            // Klick-Stufe (klickstufe.js)
  const zimmer = typeof zimmerFaktor === "function" ? zimmerFaktor() : 1;   // Zimmer-Teile (zimmer.js)
  const wunder = (typeof wunderKlickFaktor === "function" ? wunderKlickFaktor() : 1)   // Regenbogen-Tag (wunder.js)
    * (typeof backKlickFaktor === "function" ? backKlickFaktor() : 1);                // Muffin/Zauberkuchen (backstube.js)
  // Sternen-Karte: ein Anteil der Herzen pro Sekunde kommt bei jedem Klick dazu
  const anteil = typeof skillKlickAnteil === "function" ? skillKlickAnteil() : 0;
  return deckel(basis * skills * zimmer * aktuellerBonus().klickFaktor * wunder + (anteil ? anteil * herzenProSekunde() : 0));
}

// ----- Aktionen (verändern den Spielstand) -----

// Größer als Number.MAX_VALUE (≈ 1,8 · 10³⁰⁸) wird "Infinity" – das würde den Spielstand
// kaputt machen (Infinity − Infinity = NaN, JSON speichert es als null). Darum hier deckeln.
const deckel = x => (Number.isFinite(x) ? Math.min(x, Number.MAX_VALUE) : (x > 0 ? Number.MAX_VALUE : 0));

function herzenDazu(menge) {
  if (!(menge > 0)) return;
  spiel.herzen = deckel(spiel.herzen + menge);
  spiel.gesamt = deckel(spiel.gesamt + menge);
}

// Läuft die Zeit weiter: Produktion und Spielzeit dazurechnen
function produziere(sekunden) {
  herzenDazu(herzenProSekunde() * sekunden);
  spiel.spielzeit += sekunden;
}

// Offline-Fortschritt: Was haben die Helfer in "sekunden" Abwesenheit gesammelt?
// Höchstens KONFIG.offline.maxStunden (mit "Traumkissen" 16). Ohne Sternschnuppen-Bonus, zählt nicht als Spielzeit.
// Rückgabe: { sekunden (gesamt weg), gezaehlt (angerechnet), herzen, gekappt }
function berechneOffline(sekunden) {
  const max = (typeof skillOfflineStunden === "function" ? skillOfflineStunden() : KONFIG.offline.maxStunden) * 3600;
  const gezaehlt = Math.min(Math.max(0, sekunden), max);
  return {
    sekunden,
    gezaehlt,
    herzen: basisHps() * gezaehlt * KONFIG.offline.anteil,
    gekappt: sekunden > max,
  };
}

// Gibt zurück, wie viele Herzen der Klick gebracht hat.
// "Volltreffer" (Sternen-Karte): manchmal 10× so viel – dann ist letzterKlickVolltreffer = true
let letzterKlickVolltreffer = false;
function klickeMarie() {
  const chance = typeof skillVolltrefferChance === "function" ? skillVolltrefferChance() : 0;
  letzterKlickVolltreffer = chance > 0 && Math.random() < chance;
  const plus = deckel(herzenProKlick() * (letzterKlickVolltreffer ? 10 : 1));
  herzenDazu(plus);
  spiel.klicks++;
  spiel.klickHerzen = deckel(spiel.klickHerzen + plus);
  return plus;
}

// Gibt true zurück, wenn der Kauf geklappt hat
function kaufeItem(item) {
  const menge = kaufMenge(item);
  if (menge === 0) return false;
  const kosten = preis(item, menge);
  if (spiel.herzen < kosten) return false;

  spiel.herzen -= kosten;
  spiel.anzahl[item.id] = anzahl(item) + menge;
  return true;
}

function kaufeUpgrade(upgrade) {
  if (!upgradeVerfuegbar(upgrade) || spiel.herzen < upgrade.preis) return false;
  spiel.herzen -= upgrade.preis;
  spiel.upgrades.push(upgrade.id);
  return true;
}

// Wendet einen zufälligen Sternschnuppen-Effekt an. Rückgabe: { effekt, gewinn }
function fangeStern() {
  spiel.sternKlicks++;
  const effekt = zufallGewichtet(STERN_EFFEKTE);

  if (effekt.typ === "sofort") {
    const s = KONFIG.stern;
    const gewinn = Math.max(s.sofortMinimum,
      herzenProSekunde() * s.sofortSekunden + herzenProKlick() * s.sofortKlicks);
    herzenDazu(gewinn);
    return { effekt, gewinn };
  }

  const dauer = typeof skillBonusDauerFaktor === "function" ? skillBonusDauerFaktor() : 1;   // "Lange Wünsche"
  bonus = { ...effekt, ende: Date.now() + effekt.dauerSek * dauer * 1000 };
  return { effekt, gewinn: 0 };
}

// Schaltet geschaffte Erfolge frei und gibt die neuen zurück
function pruefeNeueErfolge() {
  const neu = ERFOLGE.filter(e => !spiel.erfolge.includes(e.id) && e.bedingung(spiel));
  for (const e of neu) spiel.erfolge.push(e.id);
  return neu;
}
