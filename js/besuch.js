"use strict";
// =====================================================
//  ZU BESUCH – die Zimmer der anderen Spieler ansehen
//  Jedes Gerät meldet (wenn sich etwas geändert hat) ein kleines "Profil" an die Bestenliste:
//  Figur, Kleid, Frisur, Haarfarbe, Hut, was im Zimmer steht, und die Haustiere.
//  Es stehen nur IDs drin – gezeichnet wird mit den eigenen Spieldaten. Deshalb
//  kann ein fremdes Profil nichts Unerwünschtes anzeigen (nur Teile, die es im Spiel gibt).
//  Datenbank-Regeln: supabase/bestenliste.sql (melde_profil, hole_profil)
//
//  Diese Datei fasst das HTML nicht an (Bildschirm: besuch-ui.js).
// =====================================================

const PROFIL_SPEICHER = "marieClicker-profilGesendet";

// Das eigene Profil (klein halten – die Datenbank nimmt höchstens 6.000 Zeichen)
function eigenesProfil() {
  const skin = kategorie => aktiverSkin(kategorie).id;
  return {
    v: 1,
    figur: skin("figur"), kleid: skin("kleid"), frisur: skin("frisur"), haarfarbe: skin("haarfarbe"), hut: skin("hut"),
    zimmer: Object.fromEntries(ZIMMER_PLAETZE.map(p => [p.id, (teilAufPlatz(p.id) || {}).id || null])),
    tiere: alleHaustiere().map(t => ({
      art: t.art, name: t.name, level: t.level,
      zubehoer: Object.fromEntries(ZUBEHOER_TYPEN.map(z => [z.id, (tierTraegt(t, z.id) || {}).id || null])),
      weg: Boolean(t.ausflug),
    })),
    sticker: anzahlVerschiedeneSticker(),
    zimmerTeile: anzahlZimmerTeile(),
  };
}

// Profil senden, aber nur wenn es sich seit dem letzten Mal geändert hat
async function sendeProfil() {
  if (!mitglied || !bestenlisteEingerichtet()) return;
  const profil = eigenesProfil();
  const text = JSON.stringify(profil);
  let zuletzt = "";
  try { zuletzt = localStorage.getItem(PROFIL_SPEICHER) || ""; } catch (e) { /* egal */ }
  if (text === zuletzt) return;
  await rufeBestenlisteAuf("melde_profil", {
    p_gruppe: mitglied.gruppe, p_spieler_id: mitglied.spielerId, p_geheimnis: mitglied.geheimnis, p_profil: profil,
  });
  try { localStorage.setItem(PROFIL_SPEICHER, text); } catch (e) { /* egal */ }
}

// Das Profil eines anderen Spielers holen. Rückgabe: { name, profil } (profil kann null sein)
async function holeProfil(spielerId) {
  return rufeBestenlisteAuf("hole_profil", { p_gruppe: mitglied.gruppe, p_spieler_id: spielerId });
}

// ----- Besuchs-Herzen -----

// Ein Herz im besuchten Zimmer dalassen (1× pro Zimmer und Tag). Wirft Fehler mit verständlicher Meldung.
async function lasseHerz(spielerId) {
  const antwort = await rufeBestenlisteAuf("lasse_herz", {
    p_gruppe: mitglied.gruppe, p_spieler_id: mitglied.spielerId, p_geheimnis: mitglied.geheimnis, p_an: spielerId,
  });
  if (!antwort || antwort.fehler) throw new Error((antwort && antwort.fehler) || "Das hat leider nicht geklappt.");
  spiel.herzenVerschenkt = (spiel.herzenVerschenkt || 0) + 1;
  speichern();
  return antwort.an;
}

// Neue Besuchs-Herzen abholen. Jedes bringt eine kleine Freude: ~5 Min. Produktion.
// Rückgabe: { von: [Namen], herzen }
async function holeBesuchsHerzen() {
  if (!mitglied) return { von: [], herzen: 0 };
  const neu = (await rufeBestenlisteAuf("hole_besuchsherzen", {
    p_gruppe: mitglied.gruppe, p_spieler_id: mitglied.spielerId, p_geheimnis: mitglied.geheimnis,
  })) || [];
  if (!neu.length) return { von: [], herzen: 0 };
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  const herzen = rundeHuebsch(Math.max(500, basisHps() * 300 + proKlick * 50) * neu.length);
  herzenDazu(herzen);
  spiel.besuchsHerzen = (spiel.besuchsHerzen || 0) + neu.length;
  speichern();
  return { von: neu.map(h => String(h.von || "Jemand")), herzen };
}

// ----- Fremde Daten sicher in Spiel-Dinge übersetzen (alles Unbekannte -> Standard) -----

function profilSkin(kategorie, id) {
  return SKINS.find(s => s.kategorie === kategorie && s.id === id) || SKINS.find(s => s.kategorie === kategorie && s.standard);
}

function profilZimmerTeil(profil, platzId) {
  const teil = zimmerTeil(profil && profil.zimmer && profil.zimmer[platzId]);
  if (teil && teil.platz === platzId) return teil;
  const platz = ZIMMER_PLAETZE.find(p => p.id === platzId);
  return platz.pflicht ? teileFuerPlatz(platzId).find(t => t.preis === 0) : undefined;
}

// Ein Tier aus dem Profil – "fremd" heißt: Zubehör nicht mit dem eigenen Besitz abgleichen
function profilTier(roh) {
  if (!roh || typeof roh !== "object") return null;
  const art = HAUSTIER_ARTEN.find(a => a.id === roh.art) || HAUSTIER_ARTEN[0];
  const zubehoer = {};
  for (const typ of ZUBEHOER_TYPEN) {
    const id = roh.zubehoer && roh.zubehoer[typ.id];
    if (TIER_ZUBEHOER.some(z => z.id === id && z.typ === typ.id)) zubehoer[typ.id] = id;
  }
  return {
    art: art.id, fremd: true, zubehoer,
    name: String(roh.name || art.name).slice(0, 12),
    level: Math.max(1, Math.min(TIER.maxLevel, Math.floor(Number(roh.level) || 1))),
    weg: Boolean(roh.weg),
  };
}
