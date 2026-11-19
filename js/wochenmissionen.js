"use strict";
// =====================================================
//  WOCHEN-MISSIONEN
//  Jede Woche (Montag bis Sonntag) 3 größere Aufgaben zusätzlich zu den Tagesaufgaben.
//  • jede Mission: ~1 Stunde Produktion, Season-Punkte und ein Sticker
//  • alle 3 geschafft: Bonus mit einem EXKLUSIVEN Sticker von der Album-Seite "Wochen-Schätze"
//    (die gibt es nur hier) und doppelten Herzen
//
//  Gezählt wird ohne eigene Ereignisse: Zu Wochenbeginn merken wir uns den Stand eines Zählers
//  (Klicks, Sternschnuppen, Minispiele …), der Fortschritt ist die Differenz dazu.
//
//  Gespeichert in spiel.wochenmissionen = { woche, liste: [...], bonusAbgeholt }
//  Diese Datei fasst das HTML nicht an.
// =====================================================

const WOCHEN = {
  anzahl: 3,
  seasonPunkte: 1500,        // pro Mission
  bonusSeasonPunkte: 3000,   // alle 3 geschafft
};

function stickerGesamt() {
  return Object.values(spiel.sticker || {}).reduce((summe, n) => summe + n, 0);
}

// wert(): der Zähler, der hochgeht · ziel(): wie viel mehr diese Woche · moeglich(): darf sie vorkommen?
const WOCHEN_VORLAGEN = [
  { typ: "klicks",        icon: "👆", wert: () => spiel.klicks,
    ziel: () => zufallAus([3000, 4000, 5000]),         text: z => `Klicke ${format(z)}-mal auf ${figurName()}` },
  { typ: "tagesaufgaben", icon: "📋", wert: () => spiel.aufgabenGesamt || 0,
    ziel: () => zufallAus([6, 8, 10]),                 text: z => `Schaffe ${z} Tagesaufgaben` },
  { typ: "sterne",        icon: "🌟", wert: () => spiel.sternKlicks || 0,
    ziel: () => zufallAus([6, 8, 10]),                 text: z => `Fange ${z} Sternschnuppen` },
  { typ: "minispiele",    icon: "🎮", wert: () => (spiel.minispiele && spiel.minispiele.anzahl) || 0,
    ziel: () => zufallAus([5, 8, 10]),                 text: z => `Spiele ${z} Minispiele` },
  { typ: "regen",         icon: "💖", wert: () => spiel.regenAnzahl || 0,
    ziel: () => zufallAus([3, 4, 5]),                  text: z => `Mach ${z}-mal beim Herzregen mit` },
  { typ: "sticker",       icon: "📒", wert: stickerGesamt,
    ziel: () => zufallAus([8, 10, 12]),                text: z => `Sammle ${z} Sticker (doppelte zählen auch)` },
  { typ: "spielzeit",     icon: "⏰", wert: () => spiel.spielzeit,
    ziel: () => zufallAus([45, 60, 90]) * 60,          text: z => `Spiele ${z / 60} Minuten` },
  { typ: "herzen",        icon: "🍯", wert: () => herzenAllerZeiten(),
    moeglich: () => herzenAllerZeiten() < 1e300,   // kurz vor ∞ wäre das Ziel nicht mehr zu schaffen
    ziel: () => {
      const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
      return rundeHuebsch(Math.max(20000, basisHps() * 3600 * 3 + proKlick * 3000));
    },                                                  text: z => `Sammle ${format(z)} Herzen` },
  { typ: "zimmer",        icon: "🏠", wert: () => anzahlZimmerTeile(),
    moeglich: () => anzahlZimmerTeileGesamt() - anzahlZimmerTeile() >= 3,
    ziel: () => 3,                                     text: () => "Kaufe 3 Teile für dein Zimmer" },
];

function wochenVorlage(m) {
  return WOCHEN_VORLAGEN.find(v => v.typ === m.typ);
}

function wochenText(m) {
  return wochenVorlage(m).text(m.ziel);
}

function wochenIcon(m) {
  return wochenVorlage(m).icon;
}

function wochenFortschrittText(m) {
  if (m.typ === "spielzeit") return `${Math.floor(m.fortschritt / 60)} / ${m.ziel / 60} Min.`;
  return `${format(m.fortschritt)} / ${format(m.ziel)}`;
}

// Kennung der Woche: Datum ihres Montags, z.B. "2026-11-16"
function wochenKennung(datum = new Date(Date.now())) {
  const tageSeitMontag = (datum.getDay() + 6) % 7;
  const montag = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate() - tageSeitMontag);
  return datumText(montag);
}

// Wie lange läuft die Woche noch? (bis Montag 0 Uhr)
function msBisWochenende(jetzt = new Date(Date.now())) {
  const tageSeitMontag = (jetzt.getDay() + 6) % 7;
  const naechsterMontag = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() - tageSeitMontag + 7);
  return naechsterMontag - jetzt;
}

function erzeugeWochenMissionen(woche) {
  const vorlagen = mische(WOCHEN_VORLAGEN.filter(v => !v.moeglich || v.moeglich())).slice(0, WOCHEN.anzahl);
  const liste = vorlagen.map(v => ({
    typ: v.typ, ziel: v.ziel(), start: v.wert(),
    fortschritt: 0, erledigt: false, abgeholt: false,
  }));
  return { woche, liste, bonusAbgeholt: false };
}

// Neue Woche? Dann neue Missionen. Geschaffte, aber nicht abgeholte Belohnungen der alten Woche
// werden automatisch gutgeschrieben. Rückgabe: { neu, nachgeholt: [Belohnungen] }
function pruefeWochenwechsel() {
  const diese = wochenKennung();
  const w = spiel.wochenmissionen;
  if (w && w.woche === diese) return { neu: false, nachgeholt: [] };
  const nachgeholt = [];
  if (w) {
    aktualisiereWochenMissionen();
    w.liste.forEach((m, i) => { if (m.erledigt && !m.abgeholt) nachgeholt.push(holeWochenMissionAb(i)); });
    if (wochenBonusAbholbar()) nachgeholt.push(holeWochenMissionAb("bonus"));
  }
  spiel.wochenmissionen = erzeugeWochenMissionen(diese);
  return { neu: true, nachgeholt: nachgeholt.filter(Boolean) };
}

// 1× pro Sekunde: Fortschritt nachrechnen. Rückgabe: gerade fertig gewordene Missionen
function aktualisiereWochenMissionen() {
  const fertig = [];
  const w = spiel.wochenmissionen;
  if (!w) return fertig;
  for (const m of w.liste) {
    if (m.erledigt) continue;
    m.fortschritt = Math.max(0, Math.min(m.ziel, wochenVorlage(m).wert() - m.start));
    if (m.fortschritt >= m.ziel) {
      m.erledigt = true;
      fertig.push(m);
    }
  }
  return fertig;
}

function wochenBonusAbholbar() {
  const w = spiel.wochenmissionen;
  return Boolean(w) && !w.bonusAbgeholt && w.liste.every(m => m.abgeholt);
}

function anzahlWochenAbholbar() {
  const w = spiel.wochenmissionen;
  if (!w) return 0;
  return w.liste.filter(m => m.erledigt && !m.abgeholt).length + (wochenBonusAbholbar() ? 1 : 0);
}

// Herzen: ~1 Std. Produktion + 1.000 Klicks (mind. 3.000), Bonus doppelt
function wochenBelohnung(istBonus = false) {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  const herzen = rundeHuebsch(Math.max(3000, basisHps() * 3600 + proKlick * 1000));
  const seasonPunkte = aktiverSeasonPass() ? (istBonus ? WOCHEN.bonusSeasonPunkte : WOCHEN.seasonPunkte) : 0;
  return { herzen: istBonus ? herzen * 2 : herzen, seasonPunkte };
}

// Abholen (index 0..2 oder "bonus").
// Rückgabe: { herzen, seasonPunkte, stufen, sticker (Ergebnis von gibSticker), istBonus } oder null
function holeWochenMissionAb(index) {
  const w = spiel.wochenmissionen;
  if (!w) return null;
  const istBonus = index === "bonus";
  if (istBonus) {
    if (!wochenBonusAbholbar()) return null;
    w.bonusAbgeholt = true;
    spiel.wochenBoni = (spiel.wochenBoni || 0) + 1;
  } else {
    const m = w.liste[index];
    if (!m || !m.erledigt || m.abgeholt) return null;
    m.abgeholt = true;
  }
  const belohnung = wochenBelohnung(istBonus);
  herzenDazu(belohnung.herzen);
  const stufen = belohnung.seasonPunkte ? seasonKlick(belohnung.seasonPunkte) : [];
  // Mission: ein normaler Sticker · Bonus: ein exklusiver Wochen-Schatz
  const sticker = istBonus
    ? gibSticker("woche", ALLE_STICKER.filter(s => s.seite.exklusiv))
    : gibSticker("woche");
  return { ...belohnung, stufen, sticker, istBonus };
}
