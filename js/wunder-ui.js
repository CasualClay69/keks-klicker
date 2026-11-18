"use strict";
// =====================================================
//  GEHEIME EREIGNISSE – Bildschirm
//  Regenbogen hinter der Figur, Nachthimmel mit Funkeln, fallende Kleeblätter
//  und das Überraschungs-Fenster. Regeln: wunder.js
// =====================================================

let wunderEffektArt;   // undefined = noch nie gezeichnet

function zeigeWunderEffekt(w) {
  const art = w ? w.id : null;
  if (art === wunderEffektArt) return;
  wunderEffektArt = art;
  const feld = $("wunderEffekt");
  feld.textContent = "";
  feld.className = "wunderEffekt" + (art ? ` ${art}` : "");
  feld.hidden = !art;
  if (!art) return;
  const bewegt = !matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (art === "regenbogen") {
    feld.append(Object.assign(document.createElement("div"), { className: "regenbogenBogen" }));
  }
  if (art === "sternennacht") {
    for (let i = 0; i < 26; i++) {
      const funkeln = document.createElement("i");
      funkeln.className = "nachtFunkeln";
      funkeln.textContent = i % 4 ? "✦" : "⭐";
      funkeln.style.left = `${Math.random() * 100}%`;
      funkeln.style.top = `${Math.random() * 60}%`;
      funkeln.style.fontSize = `${6 + Math.random() * 10}px`;
      funkeln.style.animationDelay = `${-Math.random() * 3}s`;
      feld.append(funkeln);
    }
  }
  if (art === "stickerglueck" && bewegt) {
    for (let i = 0; i < 14; i++) {
      const blatt = document.createElement("i");
      blatt.className = "flocke glueckBlatt";
      blatt.textContent = i % 3 ? "🍀" : "✨";
      blatt.style.left = `${Math.random() * 100}%`;
      blatt.style.fontSize = `${12 + Math.random() * 12}px`;
      blatt.style.animationDuration = `${8 + Math.random() * 7}s, ${2 + Math.random() * 2}s`;
      blatt.style.animationDelay = `${-Math.random() * 15}s, 0s`;
      feld.append(blatt);
    }
  }
}

function zeigeWunderFenster(w) {
  $("wuIcon").textContent = w.icon;
  setzeText($("wuTitel"), w.titel);
  setzeText($("wuText"), w.text);
  $("wunderOverlay").hidden = false;
  merkeWunderGesehen();
  sound.stern();
  setTimeout(() => sound.erfolg(), 350);
  konfetti($("wunderOverlay").querySelector(".geschenkKarte"));
  pruefeErfolgeUndStatistik();
}

// 1× pro Sekunde aus main.js
let warWunder;

function pruefeWunder() {
  const w = aktivesWunder();
  if (w !== warWunder) {
    const vorher = warWunder;
    warWunder = w;
    zeigeWunderEffekt(w);
    // Sternschnuppen-Nacht beginnt oder endet: nächste Sternschnuppe neu planen (nicht, wenn gerade eine da ist)
    if (vorher !== undefined && ((w && w.sternWarten) || (vorher && vorher.sternWarten)) && ui.stern.hidden) planeStern();
  }
  const fensterOffen = [...document.querySelectorAll(".overlay")].some(el => !el.hidden);
  if (wunderNochNichtGesehen() && !fensterOffen) {
    zeigeWunderFenster(w);
    setTimeout(() => sag(w.id, { wichtig: true }), 600);
  }
}

function richteWunderEin() {
  $("wuZu").addEventListener("click", () => {
    $("wunderOverlay").hidden = true;
    sound.klick();
  });
}
