"use strict";
// =====================================================
//  ONLINE-BESTENLISTE (Supabase) – für Familie & Freunde
//
//  Wer denselben Gruppen-Code eingibt, landet in derselben Liste.
//  Gespeichert werden nur: Spitzname, Herzen insgesamt, Herzen/Sek., Season-Stufe, Anzahl Erfolge.
//  Datenbank-Regeln: supabase/bestenliste.sql
//
//  Diese Datei fasst das HTML nicht an.
// =====================================================

const BESTENLISTE = {
  // Beides ist öffentlich und darf im Code stehen. Den geheimen "Secret key" NIE hier eintragen!
  url: "https://tpbsqfivdkgkqpktqnlv.supabase.co",            // Supabase-Projekt-Adresse
  schluessel: "sb_publishable_Penidm4iDwsdKhpk74WUvg_kpA5A7S-", // öffentlicher Schlüssel ("Publishable key")
  sendenAlleSek: 60,
};
const BESTENLISTE_SPEICHER = "marieClicker-bestenliste";

// Solange url/schluessel leer sind, ist die Bestenliste unsichtbar
function bestenlisteEingerichtet() {
  return Boolean(BESTENLISTE.url && BESTENLISTE.schluessel);
}

// ----- Mitgliedschaft (auf diesem Gerät) -----
// { gruppe, name, spielerId, geheimnis }  – das Geheimnis schützt den eigenen Eintrag
let mitglied = null;

function ladeMitgliedschaft() {
  try {
    const d = JSON.parse(localStorage.getItem(BESTENLISTE_SPEICHER));
    if (d && d.gruppe && d.name && d.spielerId && d.geheimnis) mitglied = d;
  } catch (e) { /* nichts gespeichert */ }
}

function speichereMitgliedschaft() {
  try {
    if (mitglied) localStorage.setItem(BESTENLISTE_SPEICHER, JSON.stringify(mitglied));
    else localStorage.removeItem(BESTENLISTE_SPEICHER);
  } catch (e) { /* Speichern nicht möglich */ }
}

// ----- Zufällige IDs -----

function zufallsHex(bytes) {
  const werte = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(werte, b => b.toString(16).padStart(2, "0")).join("");
}

function zufallsUuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const h = zufallsHex(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// Gut lesbarer Code ohne verwechselbare Zeichen (kein 0/O, 1/I/L), z.B. "HERZ-7K3P"
function neuerGruppenCode() {
  const zeichen = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const werte = crypto.getRandomValues(new Uint8Array(4));
  return "HERZ-" + Array.from(werte, w => zeichen[w % zeichen.length]).join("");
}

// ----- Verbindung zu Supabase -----

// Ruft eine der Datenbank-Funktionen auf. Wirft Fehler mit verständlicher Meldung.
async function rufeBestenlisteAuf(funktion, parameter) {
  const kopf = { apikey: BESTENLISTE.schluessel, "Content-Type": "application/json" };
  // Ältere "anon"-Schlüssel (beginnen mit eyJ) brauchen zusätzlich diesen Kopf
  if (BESTENLISTE.schluessel.startsWith("eyJ")) kopf.Authorization = "Bearer " + BESTENLISTE.schluessel;

  let antwort;
  try {
    antwort = await fetch(`${BESTENLISTE.url}/rest/v1/rpc/${funktion}`, {
      method: "POST", headers: kopf, body: JSON.stringify(parameter),
    });
  } catch (e) {
    throw new Error("Keine Internetverbindung.");
  }
  if (!antwort.ok) {
    let text = "";
    try { text = (await antwort.json()).message || ""; } catch (e) { /* keine Details */ }
    // Unsere eigenen Meldungen aus der SQL-Datei sind deutsch und verständlich -> durchreichen
    if (antwort.status === 400 && text) throw new Error(text);
    throw new Error("Die Bestenliste ist gerade nicht erreichbar.");
  }
  const inhalt = await antwort.text();
  return inhalt ? JSON.parse(inhalt) : null;
}

function meinePunkte() {
  const pass = aktiverSeasonPass();
  return {
    p_herzen_gesamt: Math.floor(spiel.gesamt),
    p_hps: Math.round(basisHps() * 10) / 10,
    p_season_stufe: pass ? seasonStand(pass).stufe : 0,
    p_erfolge: spiel.erfolge.length,
  };
}

async function sendePunkte() {
  if (!mitglied || !bestenlisteEingerichtet()) return;
  await rufeBestenlisteAuf("melde_punkte", {
    p_gruppe: mitglied.gruppe,
    p_spieler_id: mitglied.spielerId,
    p_geheimnis: mitglied.geheimnis,
    p_name: mitglied.name,
    ...meinePunkte(),
  });
}

async function holeBestenliste() {
  if (!mitglied) return [];
  return (await rufeBestenlisteAuf("hole_bestenliste", { p_gruppe: mitglied.gruppe })) || [];
}

// Einer Gruppe beitreten (oder Spitzname/Gruppe wechseln)
async function trittBestenlisteBei(name, gruppe) {
  name = String(name).trim();
  gruppe = String(gruppe).trim().toLowerCase();
  if (name.length < 1 || name.length > 16) throw new Error("Bitte gib einen Spitznamen mit 1 bis 16 Zeichen ein.");
  if (gruppe.length < 4 || gruppe.length > 32) throw new Error("Der Gruppen-Code muss 4 bis 32 Zeichen lang sein.");

  const vorher = mitglied;
  mitglied = {
    gruppe, name,
    spielerId: vorher?.gruppe === gruppe ? vorher.spielerId : zufallsUuid(),
    geheimnis: vorher?.gruppe === gruppe ? vorher.geheimnis : zufallsHex(24),
  };
  try {
    await sendePunkte();
  } catch (e) {
    mitglied = vorher;   // hat nicht geklappt -> alles wie vorher
    throw e;
  }
  speichereMitgliedschaft();

  // Gruppe gewechselt? Dann den alten Eintrag in der alten Gruppe aufräumen
  if (vorher && vorher.gruppe !== gruppe) {
    rufeBestenlisteAuf("verlasse_bestenliste", {
      p_gruppe: vorher.gruppe, p_spieler_id: vorher.spielerId, p_geheimnis: vorher.geheimnis,
    }).catch(() => {});
  }
}

async function verlasseBestenliste() {
  if (!mitglied) return;
  try {
    await rufeBestenlisteAuf("verlasse_bestenliste", {
      p_gruppe: mitglied.gruppe, p_spieler_id: mitglied.spielerId, p_geheimnis: mitglied.geheimnis,
    });
  } finally {
    mitglied = null;
    speichereMitgliedschaft();
  }
}
