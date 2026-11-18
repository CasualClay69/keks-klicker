"use strict";
// =====================================================
//  STICKER-POST
//  Sticker, die man doppelt hat, kann man an andere Spieler aus der Bestenliste schicken.
//  Ein Exemplar bleibt immer im eigenen Album.
//  Der Empfänger bekommt die Post beim nächsten Nachsehen (beim Start und jede Minute).
//  Datenbank-Regeln: supabase/bestenliste.sql (sende_sticker, hole_sticker_post)
//
//  Diese Datei fasst das HTML nicht an (Bildschirm: stickerpost-ui.js).
// =====================================================

// Wie viele Exemplare dieses Stickers man verschicken kann (eins bleibt immer da)
function stickerUebrig(sticker) {
  return Math.max(0, stickerAnzahl(sticker) - 1);
}

// Alle Sticker, die man gerade verschicken kann
function verschickbareSticker() {
  return ALLE_STICKER.filter(s => stickerUebrig(s) > 0);
}

// Einen Sticker an einen anderen Spieler schicken. Wirft einen Fehler mit verständlicher Meldung.
// Rückgabe: Name des Empfängers
async function schickeSticker(anId, sticker) {
  if (!mitglied) throw new Error("Bitte mach erst bei der Bestenliste mit.");
  if (stickerUebrig(sticker) < 1) throw new Error("Diesen Sticker hast du nicht doppelt.");
  const antwort = await rufeBestenlisteAuf("sende_sticker", {
    p_gruppe: mitglied.gruppe,
    p_spieler_id: mitglied.spielerId,
    p_geheimnis: mitglied.geheimnis,
    p_an: anId,
    p_sticker: sticker.id,
  });
  if (!antwort || antwort.fehler) throw new Error((antwort && antwort.fehler) || "Das hat leider nicht geklappt.");

  // erst abziehen, wenn der Server "ok" gesagt hat – so geht nichts verloren
  spiel.sticker[sticker.id] = stickerAnzahl(sticker) - 1;
  spiel.stickerVerschickt = (spiel.stickerVerschickt || 0) + 1;
  speichern();
  return antwort.an;
}

// Post abholen und einkleben.
// Rückgabe: [{ von, ergebnis }] – ergebnis wie bei gibSticker, oder null bei einem
// Sticker, den diese Version noch nicht kennt (er wird trotzdem aufgehoben)
let postWirdGeholt = false;

async function holeStickerPost() {
  if (!mitglied || postWirdGeholt) return [];
  postWirdGeholt = true;
  try {
    const post = (await rufeBestenlisteAuf("hole_sticker_post", {
      p_gruppe: mitglied.gruppe,
      p_spieler_id: mitglied.spielerId,
      p_geheimnis: mitglied.geheimnis,
    })) || [];
    const angekommen = post.map(brief => {
      const sticker = ALLE_STICKER.find(s => s.id === brief.sticker);
      spiel.stickerBekommen = (spiel.stickerBekommen || 0) + 1;
      if (!sticker) {
        if (!spiel.sticker) spiel.sticker = {};
        spiel.sticker[brief.sticker] = (spiel.sticker[brief.sticker] || 0) + 1;
        return { von: brief.von, ergebnis: null };
      }
      return { von: brief.von, ergebnis: klebeStickerEin(sticker) };
    });
    if (angekommen.length) speichern();
    return angekommen;
  } finally {
    postWirdGeholt = false;
  }
}
