"use strict";
// =====================================================
//  TAGESAUFGABEN
//  Jeden Tag 3 zufällige Aufgaben. Belohnung: Herzen + Season-Pass-Fortschritt.
//  Gespeichert in spiel.aufgaben = { tag, liste: [...], bonusAbgeholt }
//  Diese Datei fasst das HTML nicht an.
// =====================================================

const AUFGABEN_PRO_TAG = 3;
const AUFGABE_SEASON_PUNKTE = 300;   // zählt wie 300 Klicks im Season-Pass
const BONUS_SEASON_PUNKTE = 500;     // wenn alle 3 geschafft sind

// Ist das ein Touch-Gerät? (Mehrfinger-Aufgabe nur dort)
const IST_TOUCH = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;

// Das am weitesten freigeschaltete Gebäude (Index), -1 = noch keins
function hoechstesGebaeude() {
  return GEBAEUDE.reduce((hoechstes, g, i) => (anzahl(g) > 0 ? i : hoechstes), -1);
}

// ----- Der Vorrat an Aufgaben -----
// moeglich(): darf die Aufgabe heute vorkommen?   erstelle(): Ziel (und ggf. Parameter)
const AUFGABEN_VORLAGEN = [
  { typ: "klicks", icon: "👆",
    moeglich: () => true,
    erstelle: () => ({ ziel: zufallAus([200, 300, 400, 500]) }) },

  { typ: "kaufeSorte",
    moeglich: () => true,
    erstelle: () => {
      const index = Math.max(0, hoechstesGebaeude() - ganzzahlZwischen(0, 2));
      return { param: GEBAEUDE[index].id, ziel: ganzzahlZwischen(2, 4) };
    } },

  { typ: "kaufeIrgendwas", icon: "🏡",
    moeglich: () => true,
    erstelle: () => ({ ziel: ganzzahlZwischen(5, 10) }) },

  { typ: "stern", icon: "🌟",
    moeglich: () => true,
    erstelle: () => ({ ziel: zufallAus([1, 1, 2]) }) },

  { typ: "herzen", icon: "💖",
    moeglich: () => herzenAllerZeiten() < 1e300,   // kurz vor ∞ wäre das Ziel nicht mehr zu schaffen
    erstelle: () => {
      const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
      return { ziel: rundeHuebsch(Math.max(1000, basisHps() * 900 + proKlick * 300)), start: spiel.gesamt };
    } },

  { typ: "upgrade", icon: "✨",
    moeglich: () => UPGRADES.some(upgradeVerfuegbar),   // nur wenn gerade eins zu haben ist
    erstelle: () => ({ ziel: 1 }) },

  { typ: "spielzeit", icon: "⏰",
    moeglich: () => true,
    erstelle: () => ({ ziel: zufallAus([5, 10]) * 60, start: spiel.spielzeit }) },

  { typ: "finger", icon: "🖐️",
    moeglich: () => IST_TOUCH,
    erstelle: () => ({ ziel: 3 }) },
];

// ----- Texte -----

function aufgabeIcon(a) {
  if (a.typ === "kaufeSorte") return GEBAEUDE.find(g => g.id === a.param).icon;
  return AUFGABEN_VORLAGEN.find(v => v.typ === a.typ).icon;
}

function aufgabeText(a) {
  switch (a.typ) {
    case "klicks":         return `Klicke ${a.ziel}-mal auf ${figurName()}`;
    case "kaufeSorte": {
      const g = GEBAEUDE.find(x => x.id === a.param);
      return `Kaufe ${a.ziel} ${a.ziel === 1 ? g.name : g.mehrzahl}`;
    }
    case "kaufeIrgendwas": return `Kaufe ${a.ziel} Helfer`;
    case "stern":          return a.ziel === 1 ? "Fange eine Sternschnuppe" : `Fange ${a.ziel} Sternschnuppen`;
    case "herzen":         return `Sammle ${format(a.ziel)} Herzen`;
    case "upgrade":        return "Kaufe ein Upgrade";
    case "spielzeit":      return `Spiele ${a.ziel / 60} Minuten`;
    case "finger":         return `Tippe mit 3 Fingern gleichzeitig auf ${figurName()}`;
  }
  return "";
}

// "123 / 300" – Spielzeit in Minuten
function aufgabeFortschrittText(a) {
  if (a.typ === "spielzeit") return `${Math.floor(a.fortschritt / 60)} / ${a.ziel / 60} Min.`;
  return `${format(a.fortschritt)} / ${format(a.ziel)}`;
}

// ----- Erzeugen & Tageswechsel -----

function erzeugeAufgaben(tag) {
  const vorlagen = AUFGABEN_VORLAGEN.filter(v => v.moeglich());
  // Mischen und die ersten 3 nehmen – so kommt jeder Typ höchstens einmal vor
  for (let i = vorlagen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [vorlagen[i], vorlagen[j]] = [vorlagen[j], vorlagen[i]];
  }
  const liste = vorlagen.slice(0, AUFGABEN_PRO_TAG).map(v => ({
    typ: v.typ, param: null, start: 0,
    ...v.erstelle(),
    fortschritt: 0, erledigt: false, abgeholt: false,
  }));
  return { tag, liste, bonusAbgeholt: false };
}

// Prüft, ob ein neuer Tag begonnen hat. Nicht abgeholte Belohnungen vom Vortag
// werden dann automatisch gutgeschrieben. Rückgabe: { neu, nachgeholt: [Belohnungen] }
function pruefeAufgabenTag() {
  const heute = datumText();
  if (spiel.aufgaben && spiel.aufgaben.tag === heute) return { neu: false, nachgeholt: [] };

  const nachgeholt = [];
  if (spiel.aufgaben) {
    spiel.aufgaben.liste.forEach((a, i) => {
      if (a.erledigt && !a.abgeholt) nachgeholt.push(holeAufgabeAb(i));
    });
    if (bonusAbholbar()) nachgeholt.push(holeAufgabeAb("bonus"));
  }
  spiel.aufgaben = erzeugeAufgaben(heute);
  return { neu: true, nachgeholt };
}

// ----- Fortschritt -----

function markiereErledigt(a, fertig) {
  if (!a.erledigt && a.fortschritt >= a.ziel) {
    a.fortschritt = a.ziel;
    a.erledigt = true;
    spiel.aufgabenGesamt = (spiel.aufgabenGesamt || 0) + 1;
    fertig.push(a);
  }
}

// Ein Ereignis im Spiel: "klick", "kauf" (menge, gebaeudeId), "stern", "upgrade", "finger" (anzahl)
// Gibt die Aufgaben zurück, die dadurch gerade fertig geworden sind.
function aufgabenEreignis(typ, menge = 1, param = null) {
  const fertig = [];
  if (!spiel.aufgaben) return fertig;
  const istGebaeudeKauf = typ === "kauf" && GEBAEUDE.some(g => g.id === param);

  for (const a of spiel.aufgaben.liste) {
    if (a.erledigt) continue;
    let passt = false;
    if (typ === "klick")   passt = a.typ === "klicks";
    if (typ === "stern")   passt = a.typ === "stern";
    if (typ === "upgrade") passt = a.typ === "upgrade";
    if (typ === "finger")  passt = a.typ === "finger";
    if (istGebaeudeKauf)   passt = a.typ === "kaufeIrgendwas" || (a.typ === "kaufeSorte" && a.param === param);
    if (!passt) continue;

    if (typ === "finger") a.fortschritt = Math.max(a.fortschritt, menge);
    else a.fortschritt += menge;
    markiereErledigt(a, fertig);
  }
  return fertig;
}

// Aufgaben, die über die Zeit zählen (Herzen sammeln, Spielzeit) – 1× pro Sekunde
function aktualisiereZeitAufgaben() {
  const fertig = [];
  if (!spiel.aufgaben) return fertig;
  for (const a of spiel.aufgaben.liste) {
    if (a.erledigt) continue;
    if (a.typ === "herzen")    a.fortschritt = Math.max(0, spiel.gesamt - a.start);
    if (a.typ === "spielzeit") a.fortschritt = Math.max(0, spiel.spielzeit - a.start);
    markiereErledigt(a, fertig);
  }
  return fertig;
}

// ----- Belohnungen -----

// Herzen: Produktion von 10 Minuten + Wert von 100 Klicks (mind. 300). Bonus: doppelt.
function aufgabenBelohnung(istBonus = false) {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  const herzen = rundeHuebsch(Math.max(300, basisHps() * 600 + proKlick * 100));
  const seasonPunkte = aktiverSeasonPass() ? (istBonus ? BONUS_SEASON_PUNKTE : AUFGABE_SEASON_PUNKTE) : 0;
  return { herzen: istBonus ? herzen * 2 : herzen, seasonPunkte };
}

function bonusAbholbar() {
  const a = spiel.aufgaben;
  return !!a && !a.bonusAbgeholt && a.liste.every(x => x.abgeholt);
}

function anzahlAbholbar() {
  if (!spiel.aufgaben) return 0;
  return spiel.aufgaben.liste.filter(a => a.erledigt && !a.abgeholt).length + (bonusAbholbar() ? 1 : 0);
}

// Belohnung abholen (index = 0..2 oder "bonus").
// Rückgabe: { herzen, seasonPunkte, stufen } oder null, wenn nichts abzuholen ist
function holeAufgabeAb(index) {
  const a = spiel.aufgaben;
  if (!a) return null;
  let istBonus = false;
  if (index === "bonus") {
    if (!bonusAbholbar()) return null;
    a.bonusAbgeholt = true;
    istBonus = true;
  } else {
    const aufgabe = a.liste[index];
    if (!aufgabe || !aufgabe.erledigt || aufgabe.abgeholt) return null;
    aufgabe.abgeholt = true;
  }
  const belohnung = aufgabenBelohnung(istBonus);
  herzenDazu(belohnung.herzen);
  const stufen = belohnung.seasonPunkte ? seasonKlick(belohnung.seasonPunkte) : [];
  return { ...belohnung, stufen, istBonus };
}
