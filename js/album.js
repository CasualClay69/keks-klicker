"use strict";
// =====================================================
//  STICKER-ALBUM
//  Beim Klicken, beim Fangen von Sternschnuppen und bei Season-Stufen
//  fallen ab und zu Sticker heraus. 5 Seiten × 12 Sticker.
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

// Alle Sticker als flache Liste: { id, seite, emoji, name, seltenheit }
const ALLE_STICKER = STICKER_SEITEN.flatMap(seite => seite.sticker.map(([emoji, name], i) => ({
  id: `${seite.id}-${i}`,
  seite,
  emoji,
  name,
  seltenheit: i < 7 ? "normal" : i < 10 ? "selten" : "super",
})));

function stickerAnzahl(sticker) {
  return (spiel.sticker && spiel.sticker[sticker.id]) || 0;
}

function anzahlVerschiedeneSticker() {
  return ALLE_STICKER.filter(s => stickerAnzahl(s) > 0).length;
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
  if (Math.random() >= STICKER_CHANCE[quelle]) return null;
  return gibSticker();
}

// Gibt einen zufälligen Sticker. Rückgabe: { sticker, neu, herzen, seiteFertig, seitenHerzen }
function gibSticker() {
  if (!spiel.sticker) spiel.sticker = {};
  if (!spiel.stickerNeu) spiel.stickerNeu = [];

  const stufe = zufallGewichtet(SELTENHEITEN);
  const kandidaten = ALLE_STICKER.filter(s => s.seltenheit === stufe.id);
  // Zur Hälfte bevorzugt einen fehlenden Sticker – damit das Vollmachen nicht ewig dauert
  const fehlend = kandidaten.filter(s => stickerAnzahl(s) === 0);
  const sticker = fehlend.length && Math.random() < 0.5 ? zufallAus(fehlend) : zufallAus(kandidaten);

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
