"use strict";
// =====================================================
//  ONLINE-BESTENLISTE (Supabase)
//
//  Es gibt genau EINE gemeinsame Liste für alle Spieler (feste Gruppe, siehe unten).
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
  gruppe: "marie-clicker",   // die eine, gemeinsame Bestenliste
};
const BESTENLISTE_SPEICHER = "marieClicker-bestenliste";

// Solange url/schluessel leer sind, ist die Bestenliste unsichtbar
function bestenlisteEingerichtet() {
  return Boolean(BESTENLISTE.url && BESTENLISTE.schluessel);
}

// ----- Mitgliedschaft (auf diesem Gerät) -----
// { gruppe, name, spielerId, geheimnis }  – das Geheimnis schützt den eigenen Eintrag
let mitglied = null;

// Die Anmeldung steht an zwei Stellen: unter eigenem Schlüssel und zusätzlich im Spielstand
// (spiel.bestenliste). So geht sie auch mit "Spielstand sichern/wiederherstellen" mit,
// und wenn eine der beiden Stellen verloren geht, gibt es noch die andere.
function gueltigeMitgliedschaft(d) {
  return Boolean(d && d.gruppe && d.name && d.spielerId && d.geheimnis);
}

function ladeMitgliedschaft() {
  try {
    const d = JSON.parse(localStorage.getItem(BESTENLISTE_SPEICHER));
    if (gueltigeMitgliedschaft(d)) mitglied = d;
  } catch (e) { /* nichts gespeichert */ }
  if (!mitglied && gueltigeMitgliedschaft(spiel.bestenliste)) mitglied = { ...spiel.bestenliste };
  if (mitglied) speichereMitgliedschaft();   // beide Stellen wieder auf denselben Stand bringen
}

function speichereMitgliedschaft() {
  try {
    if (mitglied) localStorage.setItem(BESTENLISTE_SPEICHER, JSON.stringify(mitglied));
    else localStorage.removeItem(BESTENLISTE_SPEICHER);
  } catch (e) { /* Speichern nicht möglich */ }
  spiel.bestenliste = mitglied ? { ...mitglied } : null;
  speichern();
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
    p_herzen_gesamt: deckel(Math.floor(herzenAllerZeiten())),   // inkl. früherer Durchgänge (Neustart)
    p_hps: deckel(Math.round(basisHps() * 10) / 10),
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

// ----- Wochen-Wettbewerb -----
// Die Wochenwerte rechnet die Datenbank aus (Montag 0 Uhr bis Sonntag 24 Uhr, deutsche Zeit).

// Liefert die Datenbank schon Wochenwerte? (erst nachdem supabase/bestenliste.sql neu ausgeführt wurde)
function hatWochenwerte(eintraege) {
  return eintraege.length > 0 && "woche_herzen" in eintraege[0];
}

// Wann endet die Woche? Nächster Montag, 0 Uhr (Uhr des Geräts)
function wochenEnde(jetzt = new Date(Date.now())) {
  const tageSeitMontag = (jetzt.getDay() + 6) % 7;
  return new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() - tageSeitMontag + 7);
}

// Kennung der letzten Woche, z.B. "2026-11-09" (deren Montag) – damit die Sieg-Meldung nur einmal kommt
function letzteWocheKennung() {
  const montag = wochenEnde();
  montag.setDate(montag.getDate() - 14);
  return datumText(montag);
}

// Habe ich letzte Woche gewonnen und das noch nicht erfahren? Dann den Eintrag zurückgeben.
function neuerWochenSieg(eintraege) {
  if (!mitglied || !hatWochenwerte(eintraege)) return null;
  const ich = eintraege.find(e => e.spieler_id === mitglied.spielerId && e.wochen_sieger);
  if (!ich) return null;
  const schluessel = BESTENLISTE_SPEICHER + "-sieg";
  try {
    if (localStorage.getItem(schluessel) === letzteWocheKennung()) return null;
    localStorage.setItem(schluessel, letzteWocheKennung());
  } catch (e) { return null; }
  return ich;
}

async function holeBestenliste() {
  if (!mitglied) return [];
  return (await rufeBestenlisteAuf("hole_bestenliste", { p_gruppe: mitglied.gruppe })) || [];
}

// Der Bestenliste beitreten (oder den Spitznamen ändern)
async function trittBestenlisteBei(name) {
  name = String(name).trim();
  const gruppe = BESTENLISTE.gruppe;
  if (name.length < 1 || name.length > 16) throw new Error("Bitte gib einen Spitznamen mit 1 bis 16 Zeichen ein.");

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

  // Früher gab es mehrere Gruppen: alten Eintrag in der alten Gruppe aufräumen
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
