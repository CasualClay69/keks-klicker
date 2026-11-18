"use strict";
// =====================================================
//  STICKER-POST – Bildschirm
//  🎁 neben jedem anderen Spieler in der Bestenliste -> Fenster mit den eigenen
//  doppelten Stickern -> antippen -> verschicken.
//  Regeln: stickerpost.js
// =====================================================

let postEmpfaenger = null;   // { id, name }
let postSendet = false;

function zeigePostFenster(id, name) {
  postEmpfaenger = { id, name };
  $("postTitel").textContent = `🎁 Sticker an ${name}`;
  $("postStatus").textContent = "";
  zeichnePostRaster();
  $("postOverlay").hidden = false;
  $("postRaster").scrollTop = 0;
}

function zeichnePostRaster() {
  const raster = $("postRaster");
  raster.textContent = "";
  const sticker = verschickbareSticker();
  $("postInfo").textContent = sticker.length
    ? "Tippe auf einen Sticker, den du doppelt hast. Einer bleibt immer in deinem Album!"
    : "Du hast gerade keine doppelten Sticker. Sammle weiter – dann kannst du welche verschicken! 📒";
  for (const s of sticker) {
    const feld = document.createElement("button");
    feld.type = "button";
    feld.className = `stickerFeld ${s.seltenheit}`;
    feld.style.setProperty("--seiten-farbe", s.seite.farbe);
    feld.append(span("emoji", s.emoji), span("name", s.name), span("anzahl", `${stickerUebrig(s)}×`));
    feld.title = `${s.name} – ${stickerUebrig(s)} übrig zum Verschicken`;
    feld.addEventListener("click", () => sendePostSticker(s));
    raster.append(feld);
  }
}

async function sendePostSticker(sticker) {
  if (postSendet || !postEmpfaenger) return;
  const empfaenger = postEmpfaenger;
  if (!confirm(`${sticker.emoji} ${sticker.name} an ${empfaenger.name} schicken?`)) return;
  postSendet = true;
  for (const knopf of $("postRaster").children) knopf.disabled = true;
  $("postStatus").textContent = "💌 Wird verschickt …";
  try {
    const an = await schickeSticker(empfaenger.id, sticker);
    sound.erfolg();
    $("postStatus").textContent = `✓ ${sticker.emoji} ist unterwegs zu ${an || empfaenger.name}!`;
    konfetti($("postOverlay").querySelector(".postKarte"));
    pruefeErfolgeUndStatistik();
    if (!$("seiteAlbum").hidden) zeigeAlbum();
  } catch (fehler) {
    sound.fehler();
    $("postStatus").textContent = "⚠️ " + fehler.message;
  } finally {
    postSendet = false;
    const status = $("postStatus").textContent;
    zeichnePostRaster();
    $("postStatus").textContent = status;
  }
}

// Post abholen und zeigen (beim Start und jede Minute aus main.js)
async function pruefeStickerPost() {
  let angekommen;
  try { angekommen = await holeStickerPost(); } catch (e) { return; }   // offline – später nochmal
  if (!angekommen.length) return;

  sound.stern();
  albumSymbolFeiern();
  konfetti($("spielfeld"));
  for (const { von, ergebnis } of angekommen) {
    if (!ergebnis) {
      meldung(`💌 Post von ${von}!`, "Ein neuer Sticker – aktualisiere das Spiel, um ihn zu sehen.", true);
      continue;
    }
    const { sticker, neu, herzen, seiteFertig, seitenHerzen } = ergebnis;
    meldung(`💌 Post von ${von}!`,
      `${sticker.emoji} ${sticker.name}${neu ? " – neu in deinem Album!" : ` – doppelt: +${format(herzen)} ${herz()}`}`, true);
    if (seiteFertig) {
      setTimeout(() => sound.erfolg(), 400);
      meldung(`🎉 Seite „${seiteFertig.name}“ voll! ${seiteFertig.icon}`, `Belohnung: +${format(seitenHerzen)} ${herz()}`);
    }
  }
  pruefeErfolgeUndStatistik();
  aktualisiereAnzeige();
  if (!$("seiteAlbum").hidden) zeigeAlbum();
}

function richteStickerPostEin() {
  // 🎁 in der Liste (die Zeilen werden immer wieder neu gezeichnet -> ein Klick-Empfänger für alle)
  $("blListe").addEventListener("click", e => {
    const knopf = e.target.closest(".blPost");
    if (!knopf) return;
    sound.klick();
    zeigePostFenster(knopf.dataset.id, knopf.dataset.name);
  });
  const schliessen = () => { $("postOverlay").hidden = true; postEmpfaenger = null; };
  $("postZu").addEventListener("click", () => { sound.klick(); schliessen(); });
  $("postOverlay").addEventListener("click", e => { if (e.target.id === "postOverlay") schliessen(); });
}
