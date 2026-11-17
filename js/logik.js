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
function preis(item, menge = 1) {
  const n = anzahl(item);
  let summe = 0;
  for (let i = 0; i < menge; i++) {
    summe += Math.ceil(item.basisPreis * Math.pow(KONFIG.preisAnstieg, n + i));
  }
  return summe;
}

// Nächste Upgrade-Stufe, die für diese Sorte noch nicht freigeschaltet ist
function naechsteStufe(gebaeude) {
  return UPGRADE_STUFEN.find(stufe => stufe.ab > anzahl(gebaeude));
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

// Herzen pro Sekunde von EINEM Stück dieser Sorte (ohne Sternschnuppen-Bonus)
function hpsProStueck(gebaeude) {
  return gebaeude.hps * gebaeudeFaktor(gebaeude) * erfolgFaktor();
}

// Herzen pro Sekunde insgesamt, ohne Sternschnuppen-Bonus
function basisHps() {
  return GEBAEUDE.reduce((summe, g) => summe + anzahl(g) * hpsProStueck(g), 0);
}

function herzenProSekunde() {
  return basisHps() * aktuellerBonus().prodFaktor;
}

function herzenProKlick() {
  const basis = 1 + KLICK_ITEMS.reduce((summe, k) => summe + anzahl(k) * k.proKlick, 0);
  return basis * aktuellerBonus().klickFaktor;
}

// ----- Aktionen (verändern den Spielstand) -----

function herzenDazu(menge) {
  spiel.herzen += menge;
  spiel.gesamt += menge;
}

// Läuft die Zeit weiter: Produktion und Spielzeit dazurechnen
function produziere(sekunden) {
  herzenDazu(herzenProSekunde() * sekunden);
  spiel.spielzeit += sekunden;
}

// Gibt zurück, wie viele Herzen der Klick gebracht hat
function klickeMarie() {
  const plus = herzenProKlick();
  herzenDazu(plus);
  spiel.klicks++;
  spiel.klickHerzen += plus;
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

  bonus = { ...effekt, ende: Date.now() + effekt.dauerSek * 1000 };
  return { effekt, gewinn: 0 };
}

// Schaltet geschaffte Erfolge frei und gibt die neuen zurück
function pruefeNeueErfolge() {
  const neu = ERFOLGE.filter(e => !spiel.erfolge.includes(e.id) && e.bedingung(spiel));
  for (const e of neu) spiel.erfolge.push(e.id);
  return neu;
}
