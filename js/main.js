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
    meldung(`${upgrade.medaille} ${upgrade.name}`, upgrade.beschr + "!");
  } else {
    sound.fehler();
  }
  aktualisiereAnzeige();
}

// ----- Klick (oder Tipp mit einem Finger) auf Marie -----

function klickAufMarie(position) {
  const plus = klickeMarie();
  sound.klick();
  marieFreutSich();
  zeigeSchwebeText(position, `+${format(plus)} 💖`);
  aktualisiereAnzeige();
}

// ----- Sternschnuppe: erscheinen, verschwinden, neu planen -----

let sternTimer = null;

function planeStern() {
  clearTimeout(sternTimer);
  const { minWartenSek, maxWartenSek } = KONFIG.stern;
  sternTimer = setTimeout(sternErscheint, zufallZwischen(minWartenSek, maxWartenSek) * 1000);
}

function sternErscheint() {
  zeigeStern();
  sternTimer = setTimeout(() => {
    versteckeStern();
    planeStern();
  }, KONFIG.stern.sichtbarSek * 1000);
}

function beimStern(ereignis) {
  const position = klickPosition(ereignis, ui.stern);
  versteckeStern();
  sound.stern();

  const { effekt, gewinn } = fangeStern();
  const text = effekt.typ === "sofort"
    ? `💖 Herzregen! +${format(gewinn)}`
    : `${effekt.name}! ${effekt.text}`;

  zeigeSchwebeText(position, text, true);
  marieFreutSich();
  aktualisiereAnzeige();
  planeStern();
}

// ----- Hintergrund-Musik -----

let musikFreigegeben = false;   // erst nach der ersten Berührung darf Ton abgespielt werden

// Musik läuft genau dann, wenn sie an ist, erlaubt ist und die App sichtbar ist
function aktualisiereMusik() {
  if (spiel.musikAn && musikFreigegeben && !document.hidden) starteMusik();
  else stoppeMusik();
}

// ----- Eingaben verbinden -----

function verbindeEreignisse() {
  // MULTITOUCH: "pointerdown" kommt für JEDEN Finger einzeln –
  // "click" dagegen gibt es bei mehreren Fingern gleichzeitig nicht.
  const aktiveFinger = new Set();

  ui.marie.addEventListener("pointerdown", ereignis => {
    if (ereignis.pointerType === "mouse" && ereignis.button !== 0) return;   // nur linke Maustaste
    ereignis.preventDefault();   // keine Browser-Gesten, keine nachgeahmten Maus-Ereignisse

    aktiveFinger.add(ereignis.pointerId);
    spiel.maxFinger = Math.max(spiel.maxFinger, aktiveFinger.size);
    klickAufMarie({ x: ereignis.clientX, y: ereignis.clientY });
  });

  const fingerWeg = ereignis => aktiveFinger.delete(ereignis.pointerId);
  document.addEventListener("pointerup", fingerWeg);
  document.addEventListener("pointercancel", fingerWeg);

  // Tastatur (Enter/Leertaste) löst nur "click" aus. detail === 0 heißt:
  // nicht von Maus oder Finger – die wurden oben schon gezählt.
  ui.marie.addEventListener("click", ereignis => {
    if (ereignis.detail === 0) klickAufMarie(klickPosition(ereignis, ui.marie));
  });

  ui.stern.addEventListener("click", beimStern);

  ui.tonBtn.addEventListener("click", () => {
    spiel.tonAn = !spiel.tonAn;
    zeigeTonStatus();
    sound.klick();
  });

  ui.musikBtn.addEventListener("click", () => {
    spiel.musikAn = !spiel.musikAn;
    zeigeTonStatus();
    aktualisiereMusik();
  });

  // Browser erlauben Ton erst nach der ersten Berührung -> dann Musik starten
  const freigeben = () => {
    musikFreigegeben = true;
    aktualisiereMusik();
  };
  document.addEventListener("pointerdown", freigeben, { once: true });
  document.addEventListener("keydown", freigeben, { once: true });

  // App im Hintergrund (anderer Tab, Handy gesperrt) -> Musik pausieren
  document.addEventListener("visibilitychange", aktualisiereMusik);

  for (const btn of ui.kaufModusBtns) {
    btn.addEventListener("click", () => {
      spiel.kaufModus = btn.dataset.modus;
      sound.klick();
      aktualisiereAnzeige();
    });
  }

  // Desktop: Tabs oben in der Seitenleiste
  for (const btn of ui.tabBtns) {
    btn.addEventListener("click", () => zeigeSeite(btn.dataset.seite));
  }

  // Handy: Symbolleiste unten
  for (const btn of ui.untenBtns) {
    btn.addEventListener("click", () => {
      const seite = btn.dataset.seite;
      // "Marie" oder nochmal auf das offene Symbol tippen -> Menü schließen
      if (!seite || (menueOffen && seite === aktuelleSeite)) {
        setzeMenue(false);
      } else {
        zeigeSeite(seite);
        setzeMenue(true);
      }
    });
  }
  $("sheetZu").addEventListener("click", () => setzeMenue(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setzeMenue(false); });

  $("reset").addEventListener("click", () => {
    if (!confirm("Wirklich alles löschen?")) return;
    zuruecksetzen();
    versteckeStern();
    planeStern();
    zeigeAlles();
    aktualisiereMusik();
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
    meldung(`🏆 ${erfolg.icon} ${erfolg.name}`, `${erfolg.beschr} (+${prozent} % Herzen)`);
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
    meldung("📲 Installiert!", "Du findest den Marie Clicker jetzt bei deinen Apps.");
  });
}

// ----- Start -----

function starte() {
  laden();
  baueOberflaeche({ kaufeItem: beimKaufen, kaufeUpgrade: beimUpgradeKaufen });
  verbindeEreignisse();
  richteAppEin();
  zeigeSeite("seiteShop");
  zeigeAlles();

  setInterval(tick, KONFIG.tickMs);
  setInterval(pruefeErfolgeUndStatistik, KONFIG.erfolgPruefenMs);
  setInterval(speichern, KONFIG.speichernMs);
  planeStern();
}

starte();
