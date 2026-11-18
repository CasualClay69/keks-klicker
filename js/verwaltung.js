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

// Code einlösen und Belohnung gutschreiben.
// Rückgabe: { text, herzen, sticker: [Ergebnisse von gibSticker], stufen: [Season-Stufen] }
async function loeseCodeEin(code) {
  const wer = (typeof mitglied !== "undefined" && mitglied) ? mitglied.name : figurName();
  const b = await rufeBestenlisteAuf("loese_code", { p_code: String(code), p_wer: wer });
  const ergebnis = { text: b.text || "", herzen: 0, sticker: [], stufen: [], seasonPunkte: 0 };
  if (b.art === "herzen") {
    const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
    ergebnis.herzen = rundeHuebsch(Math.max(1000, basisHps() * 3600 * b.menge + proKlick * 500 * b.menge));
    herzenDazu(ergebnis.herzen);
  } else if (b.art === "sticker") {
    for (let i = 0; i < b.menge; i++) ergebnis.sticker.push(gibSticker("code"));
  } else if (b.art === "season") {
    if (aktiverSeasonPass()) {
      ergebnis.seasonPunkte = b.menge;
      ergebnis.stufen = seasonKlick(b.menge);
    } else {
      // gerade keine Season -> stattdessen 2 Stunden Produktion
      const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
      ergebnis.herzen = rundeHuebsch(Math.max(1000, basisHps() * 7200 + proKlick * 1000));
      herzenDazu(ergebnis.herzen);
    }
  }
  speichern();
  return ergebnis;
}
