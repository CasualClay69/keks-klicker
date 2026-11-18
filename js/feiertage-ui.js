"use strict";
// =====================================================
//  FEIERTAGS-EVENTS – Bildschirm
//  Effekte über dem Spielfeld (Schnee, goldene Sterne, Feuerwerk) und das Geschenk-Fenster.
//  Regeln und Belohnungen: feiertage.js
// =====================================================

let feiertagEffektArt = null;
let feuerwerkTimer = null;

// Effekt über dem Spielfeld an- oder ausschalten (null = aus)
function zeigeFeiertagEffekt(f) {
  const art = f ? f.effekt : null;
  if (art === feiertagEffektArt) return;
  feiertagEffektArt = art;
  const feld = $("feiertagEffekt");
  feld.textContent = "";
  clearInterval(feuerwerkTimer);
  feld.hidden = !art;
  if (!art || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  if (art === "schnee" || art === "sterne") {
    const anzahl = art === "schnee" ? 40 : 16;
    for (let i = 0; i < anzahl; i++) {
      const flocke = document.createElement("i");
      flocke.className = art === "schnee" ? "flocke" : "goldstern";
      flocke.textContent = art === "schnee" ? (i % 3 ? "•" : "❄") : "⭐";
      flocke.style.left = `${Math.random() * 100}%`;
      flocke.style.fontSize = `${(art === "schnee" ? 10 : 12) + Math.random() * 14}px`;
      flocke.style.animationDuration = `${7 + Math.random() * 7}s, ${2 + Math.random() * 2}s`;
      flocke.style.animationDelay = `${-Math.random() * 14}s, 0s`;
      feld.append(flocke);
    }
  }

  if (art === "feuerwerk") {
    const farben = ["#ff2d7a", "#ffc400", "#2f8cff", "#1fc46a", "#9b4dff", "#ff7a1a"];
    const knall = () => {
      if (document.hidden) return;
      const burst = document.createElement("div");
      burst.className = "feuerwerk";
      burst.style.left = `${12 + Math.random() * 76}%`;
      burst.style.top = `${10 + Math.random() * 45}%`;
      const farbe = zufallAus(farben), farbe2 = zufallAus(farben);
      for (let i = 0; i < 24; i++) {
        const funke = document.createElement("i");
        const winkel = (i / 24) * Math.PI * 2, weite = 70 + Math.random() * 45;
        funke.style.setProperty("--dx", `${Math.cos(winkel) * weite}px`);
        funke.style.setProperty("--dy", `${Math.sin(winkel) * weite}px`);
        funke.style.background = i % 2 ? farbe : farbe2;
        burst.append(funke);
      }
      feld.append(burst);
      setTimeout(() => burst.remove(), 1500);
    };
    knall();
    feuerwerkTimer = setInterval(knall, 1400);
  }
}

// ----- Geschenk-Fenster -----

function zeigeFeiertagFenster(f) {
  setzeText($("ftDeko"), f.deko);
  setzeText($("ftTitel"), f.titel);
  setzeText($("ftText"), f.text);
  const box = $("ftBox");
  box.textContent = f.box;
  box.classList.remove("offen");
  box.disabled = false;
  $("ftHinweis").hidden = false;
  $("ftInhalt").hidden = true;
  $("feiertagOverlay").hidden = false;
}

function zeigeFeiertagInhalt(e) {
  const box = $("ftBox");
  box.textContent = "🎁";
  box.classList.add("offen");
  box.disabled = true;
  $("ftHinweis").hidden = true;
  const zeilen = [`+${format(e.herzen)} ${herz()}`];
  if (e.seasonPunkte) zeilen.push(`+${format(e.seasonPunkte)} ${aktiverSeasonPass().icon}`);
  if (e.sticker) zeilen.push(`📒 ${e.sticker.sticker.emoji} ${e.sticker.sticker.name}`);
  $("ftBetrag").textContent = zeilen.join("\n");
  setzeText($("ftAndenken"), e.andenken ? `Und fürs Zimmer: ${e.andenken.icon} ${e.andenken.name} – tippe auf 🏠 und stell es auf!` : "");
  $("ftInhalt").hidden = false;
  const karte = $("feiertagOverlay").querySelector(".geschenkKarte");
  konfetti(karte);
  setTimeout(() => konfetti(karte), 500);
}

// ----- Prüfen (1× pro Sekunde aus main.js) -----

let warFeiertag;   // um den Wechsel um Mitternacht zu bemerken

function pruefeFeiertag() {
  const f = aktiverFeiertag() || null;
  if (f !== warFeiertag) {
    warFeiertag = f;
    wendeSkinsAn();   // Hut am Feiertag
    zeigeFeiertagEffekt(f);
  }
  const fensterOffen = [...document.querySelectorAll(".overlay")].some(el => !el.hidden);
  if (feiertagGeschenkWartet() && !fensterOffen) zeigeFeiertagFenster(f);
}

// beimOeffnen(ergebnis): Meldungen für Season-Stufen usw. (aus main.js)
function richteFeiertageEin(beimOeffnen) {
  $("ftBox").addEventListener("click", () => {
    const ergebnis = oeffneFeiertagsGeschenk();
    if (!ergebnis) return;
    sound.stern();
    setTimeout(() => sound.erfolg(), 400);
    zeigeFeiertagInhalt(ergebnis);
    beimOeffnen(ergebnis);
  });
  $("ftZu").addEventListener("click", () => {
    $("feiertagOverlay").hidden = true;
    sound.klick();
  });
}
