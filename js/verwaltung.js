"use strict";
// =====================================================
//  VERWALTUNG – Admin-Menü, Belohnungs-Codes, Nachricht an alle, Umfragen
//  Alles läuft über die Datenbank-Funktionen aus supabase/verwaltung.sql
//  (gleicher Zugang wie die Bestenliste: rufeBestenlisteAuf in bestenliste.js).
//
//  Die Admin-PIN steht NICHT im Code – die Datenbank prüft sie bei jedem Admin-Aufruf.
//  Nach erfolgreicher Anmeldung merkt sich das Spiel die PIN nur, solange die Seite offen ist.
//  Diese Datei fasst das HTML nicht an (Bildschirm: verwaltung-ui.js).
// =====================================================

const VERWALTUNG = {
  wieOftPruefenMin: 30,      // so oft nach neuer Nachricht / Umfrage fragen
  waehlerSchluessel: "marieClicker-waehler",
  gesehenSchluessel: "marieClicker-nachrichtGesehen",
  // Belohnungen, die das Admin-Menü anbietet
  codeBelohnungen: [
    { art: "herzen",  menge: 1,    text: "💖 1 Stunde Produktion" },
    { art: "herzen",  menge: 3,    text: "💖 3 Stunden Produktion" },
    { art: "herzen",  menge: 8,    text: "💖 8 Stunden Produktion" },
    { art: "sticker", menge: 3,    text: "📒 3 Sticker" },
    { art: "sticker", menge: 6,    text: "📒 6 Sticker" },
    { art: "season",  menge: 1000, text: "🎟️ 1.000 Season-Punkte" },
    { art: "season",  menge: 3000, text: "🎟️ 3.000 Season-Punkte" },
  ],
};

let adminPin = null;   // nur im Speicher, solange die Seite offen ist

function verwaltungMoeglich() {
  return bestenlisteEingerichtet() && location.protocol.startsWith("http");
}

// ----- Admin -----

// Admin-Funktion aufrufen. Die Datenbank antwortet mit { fehler } bei falscher PIN.
async function adminAufruf(funktion, parameter = {}) {
  const antwort = await rufeBestenlisteAuf(funktion, { p_pin: adminPin, ...parameter });
  if (antwort && antwort.fehler) throw new Error(antwort.fehler);
  return antwort;
}

async function adminAnmelden(pin) {
  const antwort = await rufeBestenlisteAuf("admin_anmelden", { p_pin: String(pin) });
  if (antwort && antwort.fehler) throw new Error(antwort.fehler);
  adminPin = String(pin);
}

function adminAbmelden() {
  adminPin = null;
}

const adminCodeErstellen = (art, menge, text) => adminAufruf("admin_code_erstellen", { p_art: art, p_menge: menge, p_text: text });
const adminCodes         = () => adminAufruf("admin_codes");
const adminNachricht     = (text, tage) => adminAufruf("admin_nachricht", { p_text: text, p_tage: tage });
const adminUmfrageStarten = (frage, antworten) => adminAufruf("admin_umfrage_starten", { p_frage: frage, p_antworten: antworten });
const adminUmfrageBeenden = () => adminAufruf("admin_umfrage_beenden");
const adminEintragLoeschen   = spielerId => adminAufruf("admin_eintrag_loeschen", { p_spieler_id: spielerId });
const adminEintragUmbenennen = (spielerId, name) => adminAufruf("admin_eintrag_umbenennen", { p_spieler_id: spielerId, p_name: name });

// Code schön lesbar: ABCD-EFGH
function codeAnzeige(code) {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

function codeBelohnungText(art, menge) {
  const b = VERWALTUNG.codeBelohnungen.find(x => x.art === art && x.menge === menge);
  return b ? b.text : `${art} ${menge}`;
}

// ----- Für alle: Nachricht, Umfrage, Codes -----

// Eine zufällige Kennung pro Gerät, damit jedes Gerät bei einer Umfrage einmal abstimmt
function waehlerId() {
  try {
    let id = localStorage.getItem(VERWALTUNG.waehlerSchluessel);
    if (!id) {
      id = zufallsUuid();
      localStorage.setItem(VERWALTUNG.waehlerSchluessel, id);
    }
    return id;
  } catch (e) {
    return zufallsUuid();
  }
}

const holeNachricht = () => rufeBestenlisteAuf("hole_nachricht", {});
const holeUmfrage   = () => rufeBestenlisteAuf("hole_umfrage", { p_waehler: waehlerId() });
const stimmeAb      = (umfrageId, antwort) => rufeBestenlisteAuf("stimme_ab", { p_umfrage: umfrageId, p_waehler: waehlerId(), p_antwort: antwort });

// Nachricht schon gesehen? (pro Gerät, nach ID)
function nachrichtGesehen(id) {
  try { return localStorage.getItem(VERWALTUNG.gesehenSchluessel) === String(id); } catch (e) { return false; }
}
function merkeNachrichtGesehen(id) {
  try { localStorage.setItem(VERWALTUNG.gesehenSchluessel, String(id)); } catch (e) { /* egal */ }
}

// Eine Belohnung gutschreiben (für Codes und das Gemeinschaftsziel).
// art: herzen (Stunden Produktion) | sticker (Anzahl) | season (Punkte)
// Rückgabe: { herzen, sticker: [Ergebnisse von gibSticker], stufen: [Season-Stufen], seasonPunkte }
function wendeBelohnungAn(art, menge, stickerQuelle = "code") {
  const ergebnis = { herzen: 0, sticker: [], stufen: [], seasonPunkte: 0 };
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  if (art === "herzen") {
    ergebnis.herzen = rundeHuebsch(Math.max(1000, basisHps() * 3600 * menge + proKlick * 500 * menge));
    herzenDazu(ergebnis.herzen);
  } else if (art === "sticker") {
    for (let i = 0; i < menge; i++) ergebnis.sticker.push(gibSticker(stickerQuelle));
  } else if (art === "season") {
    if (aktiverSeasonPass()) {
      ergebnis.seasonPunkte = menge;
      ergebnis.stufen = seasonKlick(menge);
    } else {
      // gerade keine Season -> stattdessen 2 Stunden Produktion
      ergebnis.herzen = rundeHuebsch(Math.max(1000, basisHps() * 7200 + proKlick * 1000));
      herzenDazu(ergebnis.herzen);
    }
  }
  speichern();
  return ergebnis;
}

// Code einlösen und Belohnung gutschreiben. Rückgabe wie wendeBelohnungAn, dazu text
async function loeseCodeEin(code) {
  const wer = (typeof mitglied !== "undefined" && mitglied) ? mitglied.name : figurName();
  const b = await rufeBestenlisteAuf("loese_code", { p_code: String(code), p_wer: wer });
  return { text: b.text || "", ...wendeBelohnungAn(b.art, b.menge) };
}

// ----- Ereignisse für alle (z.B. "Erster Schnee") -----

const adminEreignis = art => adminAufruf("admin_ereignis", { p_art: art });
const holeEreignis  = art => rufeBestenlisteAuf("hole_ereignis", { p_art: art });

// Hat der Admin heute "Erster Schnee" ausgelöst? Dann den Tag merken (feiertage.js)
async function pruefeSchneeEreignis() {
  const e = await holeEreignis("schnee");
  if (e && e.tag) setzeSchneeTag(e.tag);
}

// ----- Gemeinschaftsziel -----

const holeGemeinschaftsziel = () => rufeBestenlisteAuf("hole_familienziel", {});
const adminGemeinschaftsziel = (titel, ziel, art, menge) =>
  adminAufruf("admin_familienziel", { p_titel: titel, p_ziel: ziel, p_art: art, p_menge: menge });
const adminGemeinschaftszielBeenden = () => adminAufruf("admin_familienziel_beenden");

// Mögliche Zielgrößen im Admin-Menü
const GEMEINSCHAFTSZIEL_GROESSEN = [1e8, 1e9, 1e10, 1e11, 1e12, 1e13];

function gemeinschaftszielAbgeholt(z) {
  return (spiel.familienziele || []).includes(z.id);
}

// Darf dieses Gerät die Belohnung abholen? (Ziel erreicht, in der Bestenliste dabei, noch nicht abgeholt)
function gemeinschaftszielAbholbar(z) {
  return Boolean(z && z.erreicht_am && mitglied && !gemeinschaftszielAbgeholt(z));
}

function holeGemeinschaftsBelohnung(z) {
  if (!gemeinschaftszielAbholbar(z)) return null;
  spiel.familienziele = [...(spiel.familienziele || []), z.id];
  return wendeBelohnungAn(z.art, z.menge, "gemeinschaft");
}
