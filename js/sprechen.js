"use strict";
// =====================================================
//  MARIE SPRICHT – kleine Sprechblasen
//  Hier stehen nur die Sprüche und die Auswahl. Anzeigen: anzeige.js, wann: main.js.
//  {tier} wird durch den Namen des Haustiers ersetzt.
// =====================================================

const SPRUECHE = {
  klick:         ["Juhu!", "Hihi, das kitzelt! 😄", "Noch mal!", "Yay! 💖", "Du bist toll!", "Mehr Herzen! 💕", "Hui!", "Das macht Spaß!"],
  langweilig:    ["Mir ist langweilig…", "Huhu? Bist du noch da?", "Spielst du mit mir? 🥺", "Klick mich doch! 💕", "Hallooo? 👀", "Ich warte auf dich…"],
  zurueck:       ["Da bist du ja wieder! 💖", "Juhu, du bist zurück!", "Endlich! 🥰"],
  morgen:        ["Guten Morgen! ☀️", "Morgen! Schön, dass du da bist! 🌸"],
  tag:           ["Hallo! 💕", "Hi! Lass uns Herzen sammeln!", "Schön, dass du da bist! 🥰"],
  abend:         ["Guten Abend! 🌙", "Hallo! Noch ein bisschen spielen? 💕"],
  nacht:         ["Ich bin schon müde… 😴", "Psst… es ist schon spät! 🌙"],
  kauf:          ["Danke! 💖", "Oh, wie schön!", "Super Wahl! ✨", "Juhu, noch mehr Herzen!"],
  sternDa:       ["Schau mal, eine Sternschnuppe! 🌟", "Schnell, fang den Stern! ⭐"],
  sternGefangen: ["Wünsch dir was! ✨", "Gefangen! Super! 🌟"],
  erfolg:        ["Wir haben es geschafft! 🏆", "Wow, ein Erfolg! 🎉", "Du bist spitze! 🏆"],
  season:        ["Juhu, neue Stufe! 🎉", "Weiter so! ⭐"],
  sticker:       ["Ein neuer Sticker! 📒", "Oh, ein Sticker! Wie süß!"],
  fuettern:      ["Lecker, oder, {tier}? 😋", "{tier} freut sich! 💕", "Guten Appetit, {tier}!"],
  tierHunger:    ["{tier} hat Hunger! 🥺", "Ich glaube, {tier} möchte etwas essen…"],
  finger:        ["Wow, so viele Finger! 🖐️", "Hihi, das sind ja ganz viele!"],
  regenStart:    ["Schnell, fang sie alle! 💨", "Wow, es regnet! Fang sie!", "Los geht's! 🧺"],
  regenGut:      ["Wow, so viele! 🤩", "Du bist super schnell! ⚡", "Toll gefangen! 🧺"],
  regenOk:       ["Gut gemacht! 💕", "Das hat Spaß gemacht!", "Beim nächsten Mal noch mehr!"],
  nikolaus:      ["Der Nikolaus war da! 🎅", "Schau mal in den Stiefel! 🥾", "Ich war ganz brav! 😇"],
  silvester:     ["Guten Rutsch! 🎆", "Ein frohes neues Jahr! 🥂", "Wow, Feuerwerk! 🎇"],
  schnee:        ["Es schneit! ❄️", "Juhu, Schnee! ⛄", "Lass uns einen Schneemann bauen! ☃️"],
  geburtstag:    ["Heute ist mein Geburtstag! 🎂", "Danke für die Glückwünsche! 🥳", "Party! 🎉🎈", "Juhu, ich habe Geburtstag! 🎁"],
};

let letzterSpruch = "";

// Einen zufälligen Spruch der Art holen – nicht zweimal hintereinander denselben
function spruch(art) {
  const liste = SPRUECHE[art] || [];
  if (!liste.length) return "";
  let text;
  do { text = zufallAus(liste); } while (liste.length > 1 && text === letzterSpruch);
  letzterSpruch = text;
  const t = typeof haustier === "function" ? haustier() : null;
  return text.replace(/\{tier\}/g, t ? t.name : "dein Tier");
}

// Begrüßung je nach Tageszeit
function begruessungsArt(stunde = new Date().getHours()) {
  if (stunde >= 5 && stunde < 11) return "morgen";
  if (stunde >= 11 && stunde < 18) return "tag";
  if (stunde >= 18 && stunde < 22) return "abend";
  return "nacht";
}
