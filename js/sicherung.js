"use strict";
// =====================================================
//  SPIELSTAND SICHERN & WIEDERHERSTELLEN
//
//  Der Code sieht so aus:   MARIE1:<Inhalt>:<Prüfsumme>
//  • Inhalt     = Spielstand + Skins als JSON, Base64-kodiert
//  • Prüfsumme  = erkennt, wenn der Code abgeschnitten oder falsch kopiert wurde
//
//  Diese Datei fasst das HTML nicht an – die Knöpfe verbindet main.js.
// =====================================================

const SICHERUNG_PREFIX = "MARIE1";
const SICHERUNG_ZEIT_SCHLUESSEL = "marieClicker-letzteSicherung";

// Text <-> Base64 (mit Umlauten und Emojis, daher über UTF-8-Bytes)
function zuBase64(text) {
  let binaer = "";
  for (const byte of new TextEncoder().encode(text)) binaer += String.fromCharCode(byte);
  return btoa(binaer);
}

function vonBase64(base64) {
  const bytes = Uint8Array.from(atob(base64), zeichen => zeichen.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// Kurze Prüfsumme (FNV-1a), 8 Hex-Zeichen
function pruefsumme(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function erstelleSicherungsCode() {
  const daten = {
    version: APP_VERSION,
    datum: new Date().toISOString(),
    spiel,
    skins: skinStand,
  };
  const inhalt = zuBase64(JSON.stringify(daten));
  return `${SICHERUNG_PREFIX}:${inhalt}:${pruefsumme(inhalt)}`;
}

// Liest einen Code. Wirft einen Fehler mit kindgerechter Meldung, wenn etwas nicht stimmt.
function leseSicherungsCode(code) {
  const teile = String(code).replace(/\s+/g, "").split(":");
  if (teile[0] !== SICHERUNG_PREFIX) {
    throw new Error("Das ist kein Marie-Clicker-Code.");
  }
  if (teile.length !== 3 || pruefsumme(teile[1]) !== teile[2]) {
    throw new Error("Der Code ist unvollständig oder falsch kopiert. Bitte den ganzen Code kopieren.");
  }
  let daten;
  try {
    daten = JSON.parse(vonBase64(teile[1]));
  } catch (e) {
    throw new Error("Der Code ist beschädigt.");
  }
  if (!daten || !daten.spiel || typeof daten.spiel.herzen !== "number") {
    throw new Error("In dem Code ist kein gültiger Spielstand.");
  }
  return daten;
}

// Übernimmt eine Sicherung. Der Spielstand wird ersetzt,
// Skins und Season-Fortschritt werden zusammengeführt – es geht nichts verloren.
function stelleSicherungWiederHer(daten) {
  spiel = Object.assign(neuerSpielstand(), daten.spiel);
  if (!KONFIG.kaufModi.includes(spiel.kaufModus)) spiel.kaufModus = "1";
  spiel.zuletztAktiv = Date.now();   // die Zeit seit der Sicherung zählt nicht als Offline-Zeit

  const s = daten.skins || {};
  const freigeschaltet = new Set([
    ...skinStand.freigeschaltet,
    ...(Array.isArray(s.freigeschaltet) ? s.freigeschaltet : []),
  ]);

  // Pro Season den weiteren Fortschritt behalten
  const seasons = { ...skinStand.seasons };
  for (const [id, st] of Object.entries(s.seasons || {})) {
    const hier = seasons[id];
    if (!hier || st.stufe > hier.stufe || (st.stufe === hier.stufe && st.xp > hier.xp)) {
      seasons[id] = st;
    }
  }

  skinStand = {
    freigeschaltet: [...freigeschaltet],
    aktiv: { ...skinStand.aktiv, ...(s.aktiv || {}) },
    seasons,
  };
  speichern();   // speichert Spielstand und Skins
}

// ----- Wann wurde zuletzt gesichert? -----

function merkeSicherungszeit() {
  try { localStorage.setItem(SICHERUNG_ZEIT_SCHLUESSEL, String(Date.now())); } catch (e) {}
}

function letzteSicherung() {
  try { return Number(localStorage.getItem(SICHERUNG_ZEIT_SCHLUESSEL)) || 0; } catch (e) { return 0; }
}
