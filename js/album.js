"use strict";
// =====================================================
//  STICKER-ALBUM
//  Beim Klicken, beim Fangen von Sternschnuppen und bei Season-Stufen
//  fallen ab und zu Sticker heraus. 5 Grundseiten × 12 Sticker,
//  dazu je Season eine eigene Seite, die nur während der Season sammelbar ist.
//  Gespeichert in spiel.sticker = { stickerId: anzahl } und spiel.stickerNeu = [ids]
//  Diese Datei fasst das HTML nicht an.
// =====================================================

// Pro Seite: die ersten 7 sind normal, die nächsten 3 selten, die letzten 2 super-selten
const STICKER_SEITEN = [
  { id: "tiere", name: "Tiere", icon: "🐾", farbe: "#ffe3ef", sticker: [
    ["🐶", "Hündchen"], ["🐱", "Kätzchen"], ["🐰", "Häschen"], ["🐹", "Hamster"], ["🐸", "Frosch"], ["🐥", "Küken"], ["🐢", "Schildkröte"],
    ["🦊", "Fuchs"], ["🦔", "Igel"], ["🐨", "Koala"],
    ["🐼", "Panda"], ["🦋", "Schmetterling"] ] },
  { id: "blumen", name: "Blumen", icon: "🌸", farbe: "#e9f8e8", sticker: [
    ["🌸", "Kirschblüte"], ["🌷", "Tulpe"], ["🌼", "Gänseblümchen"], ["🌻", "Sonnenblume"], ["🍀", "Kleeblatt"], ["🌿", "Zweig"], ["🌵", "Kaktus"],
    ["🌹", "Rose"], ["🌺", "Hibiskus"], ["🍄", "Fliegenpilz"],
    ["💐", "Blumenstrauß"], ["🏵️", "Rosette"] ] },
  { id: "suesses", name: "Süßes", icon: "🍭", farbe: "#fff3d9", sticker: [
    ["🍬", "Bonbon"], ["🍭", "Lolli"], ["🍪", "Keks"], ["🍫", "Schokolade"], ["🍩", "Donut"], ["🍓", "Erdbeere"], ["🍒", "Kirschen"],
    ["🧁", "Cupcake"], ["🍦", "Eis"], ["🍰", "Torte"],
    ["🎂", "Geburtstagstorte"], ["🍨", "Eisbecher"] ] },
  { id: "meer", name: "Meer", icon: "🐚", farbe: "#e3f2ff", sticker: [
    ["🐠", "Fisch"], ["🐚", "Muschel"], ["🦀", "Krebs"], ["🐙", "Krake"], ["🐡", "Kugelfisch"], ["🦐", "Garnele"], ["⚓", "Anker"],
    ["🐬", "Delfin"], ["🦭", "Robbe"], ["🐳", "Wal"],
    ["🧜‍♀️", "Meerjungfrau"], ["🏝️", "Trauminsel"] ] },
  { id: "fantasie", name: "Fantasie", icon: "🦄", farbe: "#f1e6ff", sticker: [
    ["🌈", "Regenbogen"], ["⭐", "Stern"], ["🌙", "Mond"], ["🎈", "Luftballon"], ["🔮", "Zauberkugel"], ["🪄", "Zauberstab"], ["👑", "Krone"],
    ["🧚", "Fee"], ["🐉", "Drache"], ["🏰", "Schloss"],
    ["🦄", "Einhorn"], ["👸", "Prinzessin"] ] },

  // ───── Bonus-Seiten: werden nacheinander frei (siehe bonusSeiteFrei), danach ganz normal sammelbar ─────
  { id: "weltraum", bonus: 1, name: "Weltraum", icon: "🚀", farbe: "#e8e6ff", sticker: [
    ["🌍", "Erde"], ["🌕", "Vollmond"], ["☀️", "Sonne"], ["🛰️", "Satellit"], ["🔭", "Fernrohr"], ["☄️", "Komet"], ["🌌", "Milchstraße"],
    ["🚀", "Rakete"], ["🛸", "Ufo"], ["🌑", "Neumond"],
    ["👩‍🚀", "Astronautin"], ["👽", "Außerirdischer"] ] },
  { id: "dinos", bonus: 2, name: "Dinosaurier", icon: "🦕", farbe: "#e6f7dc", sticker: [
    ["🦕", "Langhals"], ["🦖", "T-Rex"], ["🥚", "Dino-Ei"], ["🌋", "Vulkan"], ["🦴", "Knochen"], ["🌴", "Palme"], ["🐊", "Krokodil"],
    ["🦎", "Eidechse"], ["🦤", "Dodo"], ["🪨", "Fossil"],
    ["🦣", "Mammut"], ["🐲", "Urzeit-Drache"] ] },
  { id: "berufe", bonus: 3, name: "Berufe", icon: "👩‍⚕️", farbe: "#e3f4ff", sticker: [
    ["👩‍⚕️", "Ärztin"], ["👩‍🍳", "Köchin"], ["👩‍🏫", "Lehrerin"], ["👩‍🚒", "Feuerwehrfrau"], ["👮‍♀️", "Polizistin"], ["👩‍🌾", "Bäuerin"], ["👩‍🎨", "Malerin"],
    ["👩‍🔬", "Forscherin"], ["👩‍✈️", "Pilotin"], ["👩‍🔧", "Mechanikerin"],
    ["👩‍🎤", "Sängerin"], ["🦸‍♀️", "Superheldin"] ] },
  { id: "musik", bonus: 4, name: "Musik", icon: "🎵", farbe: "#fff0f6", sticker: [
    ["🎵", "Note"], ["🎶", "Melodie"], ["🥁", "Trommel"], ["🎺", "Trompete"], ["🎸", "Gitarre"], ["🎤", "Mikrofon"], ["🪇", "Rassel"],
    ["🎹", "Klavier"], ["🎻", "Geige"], ["🪗", "Akkordeon"],
    ["🎷", "Saxofon"], ["🎼", "Notenschlüssel"] ] },
  { id: "fahrzeuge", bonus: 5, name: "Fahrzeuge", icon: "🚗", farbe: "#fff6dc", sticker: [
    ["🚗", "Auto"], ["🚲", "Fahrrad"], ["🚌", "Bus"], ["🚂", "Lokomotive"], ["🚜", "Traktor"], ["🛴", "Roller"], ["⛵", "Segelboot"],
    ["🚁", "Hubschrauber"], ["🚒", "Feuerwehrauto"], ["🚤", "Schnellboot"],
    ["✈️", "Flugzeug"], ["🏎️", "Rennauto"] ] },

  // ───── Exklusiv: nur als Bonus der Wochen-Missionen (wochenmissionen.js), alle super-selten ─────
  { id: "wochenschaetze", exklusiv: true, name: "Wochen-Schätze", icon: "🏆", farbe: "#fff4cc", sticker: [
    ["🏆", "Pokal"], ["🥇", "Goldmedaille"], ["💎", "Diamant"], ["🪅", "Piñata"], ["🎠", "Karussell"], ["🌠", "Sternschnuppe"],
    ["🧜‍♀️", "Meerjungfrau"], ["🪐", "Planet"], ["🦚", "Pfau"], ["🎡", "Riesenrad"],
    ["🧸", "Goldener Teddy"], ["💫", "Sternenstaub"] ] },

  // ───── Season-Seiten: erscheinen erst, wenn ihre Season beginnt, und sind nur dann sammelbar ─────
  { id: "s1-thanksgiving", season: "s1", thema: "thanksgiving", name: "Thanksgiving", icon: "🦃", farbe: "#ffe9d2", sticker: [
    ["🍂", "Herbstblatt"], ["🍁", "Ahornblatt"], ["🎃", "Kürbis"], ["🌽", "Maiskolben"], ["🍎", "Apfel"], ["🥧", "Kuchen"], ["🌰", "Kastanie"],
    ["🦃", "Truthahn"], ["🐿️", "Eichhörnchen"], ["🧺", "Erntekorb"],
    ["🎩", "Pilgerhut"], ["🍽️", "Festessen"] ] },
  { id: "s2-weihnachten", season: "s2", thema: "weihnachten", name: "Weihnachten", icon: "🎅", farbe: "#e6f0ff", sticker: [
    ["❄️", "Schneeflocke"], ["🔔", "Glöckchen"], ["🕯️", "Kerze"], ["🧦", "Strumpf"], ["🧤", "Handschuhe"], ["⛸️", "Schlittschuh"], ["🎀", "Schleife"],
    ["⛄", "Schneemann"], ["🦌", "Rentier"], ["🎁", "Geschenk"],
    ["🎅", "Weihnachtsmann"], ["🎄", "Tannenbaum"] ] },
];

const SELTENHEITEN = [
  { id: "normal", name: "",             gewicht: 75, wert: 1 },
  { id: "selten", name: "Selten",       gewicht: 20, wert: 3 },
  { id: "super",  name: "Super-selten", gewicht: 5,  wert: 10 },
];

// Wie oft ein Sticker herausfällt
const STICKER_CHANCE = {
  klick: 1 / 400,   // bei 2 Klicks/Sek. etwa alle 3–4 Minuten
  stern: 0.5,       // jede zweite Sternschnuppe
  season: 1,        // jede Season-Stufe
};
// Während einer Season: so oft kommt ein Sticker von der Season-Seite (Season-Stufen: immer)
const SEASON_STICKER_ANTEIL = 0.35;

// Die Sticker einer Seite: { id, seite, emoji, name, seltenheit }
function stickerDerSeite(seite) {
  return seite.sticker.map(([emoji, name], i) => ({
    id: `${seite.id}-${i}`,
    seite,
    emoji,
    name,
    seltenheit: seite.exklusiv ? "super" : i < 7 ? "normal" : i < 10 ? "selten" : "super",
  }));
}

// Alle Sticker als flache Liste
const ALLE_STICKER = STICKER_SEITEN.flatMap(stickerDerSeite);

// Für seasons.js: eine weitere Seite nachträglich hinzufügen
function fuegeStickerSeiteHinzu(seite) {
  STICKER_SEITEN.push(seite);
  ALLE_STICKER.push(...stickerDerSeite(seite));
}

// Die 60 Sticker der 5 Grundseiten (ohne Season-Seiten, Bonus-Seiten und exklusive Wochen-Schätze)
const GRUND_STICKER = ALLE_STICKER.filter(s => !s.seite.season && !s.seite.exklusiv && !s.seite.bonus);

function stickerAnzahl(sticker) {
  return (spiel.sticker && spiel.sticker[sticker.id]) || 0;
}

function anzahlVerschiedeneSticker(liste = ALLE_STICKER) {
  return liste.filter(s => stickerAnzahl(s) > 0).length;
}

// ----- Bonus-Seiten -----
// Die erste wird frei, wenn man BONUS_SEITEN.grundSticker verschiedene Sticker der 5 Grundseiten hat,
// jede weitere, wenn man auf der vorigen Bonus-Seite BONUS_SEITEN.vorigeSeite Sticker hat.
const BONUS_SEITEN = { grundSticker: 50, vorigeSeite: 10 };

function bonusSeiten() {
  return STICKER_SEITEN.filter(s => s.bonus).sort((a, b) => a.bonus - b.bonus);
}

function bonusSeiteFrei(seite) {
  if (!seite.bonus) return true;
  if (seite.bonus === 1) return anzahlVerschiedeneSticker(GRUND_STICKER) >= BONUS_SEITEN.grundSticker;
  const vorige = bonusSeiten().find(s => s.bonus === seite.bonus - 1);
  return Boolean(vorige) && bonusSeiteFrei(vorige) && seiteFortschritt(vorige) >= BONUS_SEITEN.vorigeSeite;
}

// Die nächste noch gesperrte Bonus-Seite und was dafür fehlt (oder null)
function naechsteBonusSeite() {
  const seite = bonusSeiten().find(s => !bonusSeiteFrei(s));
  if (!seite) return null;
  if (seite.bonus === 1) {
    return { seite, fehlt: BONUS_SEITEN.grundSticker - anzahlVerschiedeneSticker(GRUND_STICKER), wo: "auf den Grundseiten" };
  }
  const vorige = bonusSeiten().find(s => s.bonus === seite.bonus - 1);
  return { seite, fehlt: BONUS_SEITEN.vorigeSeite - seiteFortschritt(vorige), wo: `auf der Seite „${vorige.name}“` };
}

// Sticker, die beim Klicken usw. herausfallen können: Grundseiten + freie Bonus-Seiten
function stickerVorrat() {
  return [...GRUND_STICKER, ...ALLE_STICKER.filter(s => s.seite.bonus && bonusSeiteFrei(s.seite))];
}

// Season-Seiten erscheinen erst, wenn ihre Season begonnen hat (und bleiben danach als Andenken).
// Bonus-Seiten erst, wenn sie frei sind.
function seiteSichtbar(seite) {
  if (seite.bonus) return bonusSeiteFrei(seite);
  if (!seite.season) return true;
  const pass = SEASON_PAESSE.find(p => p.id === seite.season);
  return Boolean(pass) && Date.now() >= Date.parse(pass.start);
}

function sichtbareSeiten() {
  return STICKER_SEITEN.filter(seiteSichtbar);
}

function sichtbareSticker() {
  return ALLE_STICKER.filter(s => seiteSichtbar(s.seite));
}

// Die Sticker-Seite der gerade laufenden Season (oder undefined)
function aktuelleSeasonSeite() {
  const pass = aktiverSeasonPass();
  // Jahres-Varianten (z.B. "Ostern 2028") benutzen die Sticker-Seite ihres Themas
  return pass && STICKER_SEITEN.find(s => s.season === pass.id || (s.thema && s.thema === pass.thema));
}

function seiteFortschritt(seite) {
  return ALLE_STICKER.filter(s => s.seite === seite && stickerAnzahl(s) > 0).length;
}

function seiteVoll(seite) {
  return seiteFortschritt(seite) === seite.sticker.length;
}

function seltenheit(sticker) {
  return SELTENHEITEN.find(s => s.id === sticker.seltenheit);
}

// Herzen für einen doppelten Sticker: ~1 Min. Produktion + 20 Klicks, mal Seltenheit
function doppeltWert(sticker) {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  return rundeHuebsch(Math.max(100, basisHps() * 60 + proKlick * 20) * seltenheit(sticker).wert);
}

// Belohnung für eine volle Seite: ~1 Std. Produktion + 1.000 Klicks
function seitenBelohnung() {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  return rundeHuebsch(Math.max(5000, basisHps() * 3600 + proKlick * 1000));
}

// Würfelt, ob bei dieser Gelegenheit ein Sticker herausfällt ("klick", "stern", "season")
function versucheSticker(quelle) {
  const glueck = (typeof wunderStickerFaktor === "function" ? wunderStickerFaktor() : 1)   // Sticker-Glückstag (wunder.js)
    * (typeof skillStickerFaktor === "function" ? skillStickerFaktor() : 1);              // "Sticker-Magnet" (skills.js)
  if (Math.random() >= Math.min(1, STICKER_CHANCE[quelle] * glueck)) return null;
  return gibSticker(quelle);
}

// Gibt einen zufälligen Sticker. Rückgabe: { sticker, neu, herzen, seiteFertig, seitenHerzen }
// eigenerVorrat: nur aus dieser Liste, fehlende zuerst (z.B. die exklusiven Wochen-Schätze)
function gibSticker(quelle = "klick", eigenerVorrat = null) {
  if (!spiel.sticker) spiel.sticker = {};
  if (!spiel.stickerNeu) spiel.stickerNeu = [];

  let sticker;
  if (eigenerVorrat) {
    const fehlend = eigenerVorrat.filter(s => stickerAnzahl(s) === 0);
    sticker = zufallAus(fehlend.length ? fehlend : eigenerVorrat);
  } else {
    // Aus welchem Vorrat? Während einer Season manchmal (bei Season-Stufen immer) von der Season-Seite
    const seasonSeite = aktuelleSeasonSeite();
    const vonSeason = seasonSeite && (quelle === "season" || Math.random() < SEASON_STICKER_ANTEIL);
    const vorrat = vonSeason ? ALLE_STICKER.filter(s => s.seite === seasonSeite) : stickerVorrat();

    const stufe = zufallGewichtet(SELTENHEITEN);
    const kandidaten = vorrat.filter(s => s.seltenheit === stufe.id);
    // Zur Hälfte bevorzugt einen fehlenden Sticker – damit das Vollmachen nicht ewig dauert
    const fehlend = kandidaten.filter(s => stickerAnzahl(s) === 0);
    sticker = fehlend.length && Math.random() < 0.5 ? zufallAus(fehlend) : zufallAus(kandidaten);
  }
  return klebeStickerEin(sticker);
}

// Einen bestimmten Sticker ins Album kleben (neu -> evtl. Seite voll, doppelt -> Herzen).
// Rückgabe wie bei gibSticker
function klebeStickerEin(sticker) {
  if (!spiel.sticker) spiel.sticker = {};
  if (!spiel.stickerNeu) spiel.stickerNeu = [];
  const neu = stickerAnzahl(sticker) === 0;
  spiel.sticker[sticker.id] = stickerAnzahl(sticker) + 1;

  let herzen = 0, seiteFertig = null, seitenHerzen = 0;
  if (neu) {
    spiel.stickerNeu.push(sticker.id);
    if (seiteVoll(sticker.seite)) {
      seiteFertig = sticker.seite;
      seitenHerzen = seitenBelohnung();
      herzenDazu(seitenHerzen);
    }
  } else {
    herzen = doppeltWert(sticker);
    herzenDazu(herzen);
  }
  return { sticker, neu, herzen, seiteFertig, seitenHerzen };
}

// Neue Sticker einer Seite als "angeschaut" markieren. Gibt ihre IDs zurück (für die Markierung).
function markiereStickerGesehen(seite) {
  const neu = (spiel.stickerNeu || []).filter(id => id.startsWith(seite.id + "-"));
  spiel.stickerNeu = (spiel.stickerNeu || []).filter(id => !id.startsWith(seite.id + "-"));
  return neu;
}
