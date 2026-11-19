"use strict";
// =====================================================
//  LAUFTEXT über dem Logo
//  Der Admin setzt ihn im Admin-Menü (Reiter 📜 Lauftext). Er läuft dann auf allen Geräten,
//  bis der Admin ihn wieder entfernt. Gibt es keinen, ist der Streifen ganz weg.
//  Datenbank: admin_lauftext / hole_lauftext (supabase/verwaltung.sql)
// =====================================================

const LAUFTEXT = {
  pxProSekunde: 65,          // gut lesbar: nicht zu langsam, nicht zu schnell
  wieOftPruefenMin: 5,       // so oft nachsehen, ob es einen neuen gibt oder er entfernt wurde
  speicherSchluessel: "marieClicker-lauftext",   // zuletzt bekannter Text – damit er sofort beim Start da ist
};

const holeLauftext = () => rufeBestenlisteAuf("hole_lauftext", {});
const adminLauftext = text => adminAufruf("admin_lauftext", { p_text: text });

let lauftextAktuell = "";

// Text anzeigen ("" = Streifen ausblenden)
function zeigeLauftext(text) {
  text = String(text || "").trim();
  const streifen = $("lauftext");
  if (!streifen) return;
  if (text === lauftextAktuell) return;
  lauftextAktuell = text;
  try {
    if (text) localStorage.setItem(LAUFTEXT.speicherSchluessel, text);
    else localStorage.removeItem(LAUFTEXT.speicherSchluessel);
  } catch (e) { /* egal */ }

  streifen.hidden = !text;
  document.documentElement.classList.toggle("lauftext-an", Boolean(text));
  $("lauftextInhalt").textContent = text;
  streifen.setAttribute("aria-label", text);
  richteLauftextTempoEin();
}

// Geschwindigkeit an Textlänge und Breite anpassen: immer gleich viele Pixel pro Sekunde
function richteLauftextTempoEin() {
  const streifen = $("lauftext");
  const inhalt = $("lauftextInhalt");
  if (!streifen || streifen.hidden) return;
  const breite = $("lauftextFenster").clientWidth;
  const weg = breite + inhalt.scrollWidth;
  inhalt.style.setProperty("--lauf-start", `${breite}px`);
  inhalt.style.setProperty("--lauf-ende", `${-inhalt.scrollWidth}px`);
  inhalt.style.animationDuration = `${Math.max(4, weg / LAUFTEXT.pxProSekunde)}s`;
  // Animation neu starten, damit der Text wieder von rechts kommt
  inhalt.classList.remove("laeuft");
  void inhalt.offsetWidth;
  inhalt.classList.add("laeuft");
}

async function pruefeLauftext() {
  if (!verwaltungMoeglich() || document.hidden) return;
  try {
    const l = await holeLauftext();
    zeigeLauftext(l && l.text);
  } catch (e) { /* offline oder noch nicht eingerichtet: alten Stand behalten */ }
}

function richteLauftextEin() {
  if (!verwaltungMoeglich()) return;
  try { zeigeLauftext(localStorage.getItem(LAUFTEXT.speicherSchluessel) || ""); } catch (e) { /* egal */ }
  pruefeLauftext();
  setInterval(pruefeLauftext, LAUFTEXT.wieOftPruefenMin * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) pruefeLauftext(); });
  let groesseTimer = null;
  window.addEventListener("resize", () => { clearTimeout(groesseTimer); groesseTimer = setTimeout(richteLauftextTempoEin, 200); });
  // Schriften laden manchmal etwas später -> Breite danach nochmal messen
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(richteLauftextTempoEin);
}

// ----- Admin-Reiter 📜 Lauftext (Hilfsfunktionen el/knopf/adminVersuche aus verwaltung-ui.js) -----
function adminLauftextZeigen(inhalt) {
  inhalt.append(el("p", "seitenInfo", "Läuft oben über dem Logo auf allen Geräten – so lange, bis du ihn hier entfernst."));
  const aktuell = el("div", "adminAktuell", "⏳ …");
  const text = el("textarea");
  text.rows = 2; text.maxLength = 200; text.placeholder = "z.B. Heute Abend gibt es Pizza! 🍕";
  const feld = el("label", "feld", "Lauftext");
  feld.append(text);
  const ladeAktuell = async () => {
    try {
      const l = await holeLauftext();
      aktuell.textContent = l && l.text ? `Läuft gerade: „${l.text}“` : "Gerade kein Lauftext.";
      zeigeLauftext(l && l.text);
    } catch (e) { aktuell.textContent = "⚠️ " + e.message; }
  };
  const reihe = el("div", "knopfReihe");
  reihe.append(
    knopf("📜 Anzeigen", () => adminVersuche(inhalt, async () => {
      if (!text.value.trim()) throw new Error("Bitte erst einen Text eintippen.");
      await adminLauftext(text.value);
      sound.erfolg();
      text.value = "";
      adminStatus(inhalt, "✓ Läuft jetzt bei allen!");
      await ladeAktuell();
    }), "knopf haupt"),
    knopf("🗑️ Entfernen", () => adminVersuche(inhalt, async () => {
      await adminLauftext("");
      adminStatus(inhalt, "✓ Entfernt.");
      await ladeAktuell();
    })),
  );
  inhalt.append(aktuell, feld, reihe);
  ladeAktuell();
}

richteLauftextEin();
