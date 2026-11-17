"use strict";
// =====================================================
//  MAIN – verbindet Eingaben, Logik und Anzeige
//  und startet das Spiel.
// =====================================================

// ----- Aktionen aus dem Shop -----

function beimKaufen(item) {
  if (kaufeItem(item)) sound.kauf();
  else sound.fehler();
  aktualisiereAnzeige();
}

function beimUpgradeKaufen(upgrade) {
  if (kaufeUpgrade(upgrade)) {
    sound.kauf();
    meldung("⭐ " + upgrade.name, upgrade.beschr + "!");
  } else {
    sound.fehler();
  }
  aktualisiereAnzeige();
}

// ----- Goldener Keks: erscheinen, verschwinden, neu planen -----

let goldTimer = null;

function planeGoldKeks() {
  clearTimeout(goldTimer);
  const { minWartenSek, maxWartenSek } = KONFIG.gold;
  goldTimer = setTimeout(goldKeksErscheint, zufallZwischen(minWartenSek, maxWartenSek) * 1000);
}

function goldKeksErscheint() {
  zeigeGoldKeks();
  goldTimer = setTimeout(() => {
    versteckeGoldKeks();
    planeGoldKeks();
  }, KONFIG.gold.sichtbarSek * 1000);
}

function beimGoldKeks(ereignis) {
  const position = klickPosition(ereignis, ui.goldKeks);
  versteckeGoldKeks();
  sound.gold();

  const { effekt, gewinn } = fangeGoldKeks();
  const text = effekt.typ === "sofort"
    ? `Glückstreffer! +${format(gewinn)}`
    : `${effekt.name}! ${effekt.text}`;

  zeigeSchwebeText(position, text, true);
  aktualisiereAnzeige();
  planeGoldKeks();
}

// ----- Eingaben verbinden -----

function verbindeEreignisse() {
  ui.keks.addEventListener("click", ereignis => {
    const plus = klickeKeks();
    sound.klick();
    zeigeSchwebeText(klickPosition(ereignis, ui.keks), "+" + format(plus));
    aktualisiereAnzeige();
  });

  ui.goldKeks.addEventListener("click", beimGoldKeks);

  ui.tonBtn.addEventListener("click", () => {
    spiel.tonAn = !spiel.tonAn;
    zeigeTonStatus();
    sound.klick();
  });

  for (const btn of ui.kaufModusBtns) {
    btn.addEventListener("click", () => {
      spiel.kaufModus = btn.dataset.modus;
      sound.klick();
      aktualisiereAnzeige();
    });
  }

  for (const btn of document.querySelectorAll("#tabs button")) {
    btn.addEventListener("click", () => wechsleTab(btn));
  }

  $("reset").addEventListener("click", () => {
    if (!confirm("Wirklich alles löschen?")) return;
    zuruecksetzen();
    versteckeGoldKeks();
    planeGoldKeks();
    zeigeAlles();
  });

  window.addEventListener("beforeunload", speichern);
}

// ----- Spielschleife -----

// Wir messen die echte vergangene Zeit, statt fest 0,1 s pro Tick anzunehmen.
// Grund: In Hintergrund-Tabs bremst der Browser setInterval auf ~1× pro Sekunde –
// sonst würde dort viel zu wenig produziert.
let letzterTick = performance.now();

function tick() {
  const jetzt = performance.now();
  produziere((jetzt - letzterTick) / 1000);
  letzterTick = jetzt;
  aktualisiereAnzeige();
}

function pruefeErfolgeUndStatistik() {
  for (const erfolg of pruefeNeueErfolge()) {
    const prozent = Math.round(KONFIG.erfolgBonus * 100);
    meldung("🏆 Erfolg freigeschaltet: " + erfolg.name, `${erfolg.beschr} (+${prozent} % Produktion)`);
    sound.erfolg();
  }
  zeigeErfolge();
  zeigeStatistik();
}

// ----- App (PWA) -----

function richteAppEin() {
  // Service Worker nur über http(s) – beim Öffnen per Doppelklick (file://) geht das nicht
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(fehler =>
      console.warn("Service Worker konnte nicht registriert werden:", fehler));
  }

  // Chrome/Edge/Android melden, dass die App installiert werden kann.
  // Wir merken uns die Anfrage und zeigen dafür einen eigenen Knopf.
  let installAnfrage = null;

  window.addEventListener("beforeinstallprompt", ereignis => {
    ereignis.preventDefault();          // Standard-Hinweis des Browsers unterdrücken
    installAnfrage = ereignis;
    ui.installBtn.hidden = false;
  });

  ui.installBtn.addEventListener("click", async () => {
    if (!installAnfrage) return;
    installAnfrage.prompt();            // Installations-Dialog des Browsers öffnen
    await installAnfrage.userChoice;
    installAnfrage = null;
    ui.installBtn.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    ui.installBtn.hidden = true;
    meldung("📲 Installiert!", "Du findest den Keks-Klicker jetzt bei deinen Apps.");
  });
}

// ----- Start -----

function starte() {
  laden();
  baueOberflaeche({ kaufeItem: beimKaufen, kaufeUpgrade: beimUpgradeKaufen });
  verbindeEreignisse();
  richteAppEin();
  zeigeAlles();

  setInterval(tick, KONFIG.tickMs);
  setInterval(pruefeErfolgeUndStatistik, KONFIG.erfolgPruefenMs);
  setInterval(speichern, KONFIG.speichernMs);
  planeGoldKeks();
}

starte();
