"use strict";
// =====================================================
//  MAIN – verbindet Eingaben, Logik und Anzeige
//  und startet das Spiel.
// =====================================================

// ----- Aktionen aus dem Shop -----

function beimKaufen(item) {
  const menge = kaufMenge(item);   // vorher merken – für Tagesaufgaben wie "Kaufe 3 Kuscheltiere"
  if (kaufeItem(item)) {
    sound.kauf();
    meldeAufgaben(aufgabenEreignis("kauf", menge, item.id));
    sag("kauf", { chance: 0.35 });
  } else {
    sound.fehler();
  }
  aktualisiereAnzeige();
}

function beimUpgradeKaufen(upgrade) {
  if (kaufeUpgrade(upgrade)) {
    sound.kauf();
    meldung(`${upgrade.medaille} ${upgrade.name}`, upgrade.beschr + "!");
    meldeAufgaben(aufgabenEreignis("upgrade"));
    sag("kauf", { chance: 0.5 });
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
  zeigeSchwebeText(position, `+${format(plus)} ${herz()}`);

  // Season-Pass: jeder Klick zählt
  for (const neueStufe of seasonKlick(1)) meldeSeasonStufe(neueStufe);
  meldeAufgaben(aufgabenEreignis("klick"));
  meldeSticker(versucheSticker("klick"), position);   // ab und zu fällt ein Sticker heraus

  // Marie sagt ab und zu etwas – und freut sich, wenn man nach einer Pause zurückkommt
  letzterKlick = Date.now();
  if (langweiligGesagt) {
    langweiligGesagt = false;
    sag("zurueck", { wichtig: true });
  } else {
    sag(istGeburtstag() && Math.random() < 0.5 ? "geburtstag" : "klick", { chance: 1 / 35 });
  }

  // Das Haustier hüpft mit – und alle 25 Klicks schickt es ein Herzchen
  haustierHopst();
  if (haustier() && spiel.klicks % 25 === 0) {
    const r = ui.haustier.getBoundingClientRect();
    zeigeSchwebeText({ x: r.left + r.width / 2, y: r.top }, "💕");
  }

  aktualisiereAnzeige();
}

// ----- Neustart mit Bonus -----

function richteNeustartEin() {
  $("neustartBtn").addEventListener("click", () => {
    const neu = neueSterne();
    if (!neustartMoeglich()) return;
    const frage = `🌟 Neustart mit Bonus?\n\n`
      + `Du bekommst ${neu} Glitzersterne – jeder gibt für immer +${NEUSTART.sternBonus * 100} % Herzen.\n\n`
      + `Deine Herzen, Herzschenker, Verbesserungen und Upgrades fangen wieder bei 0 an.\n`
      + `Erfolge, Skins, Sticker, Haustier und Season-Pass bleiben.`;
    if (!confirm(frage)) return;

    macheNeustart();
    sound.erfolg();
    setTimeout(() => sound.stern(), 400);
    meldung(`🌟 Neustart! +${neu} Glitzersterne`, `Jetzt +${Math.round(glitzersterne() * NEUSTART.sternBonus * 100)} % Herzen für immer. Viel Spaß!`);
    konfetti(ui.spielfeld);
    sag("erfolg", { wichtig: true });
    zeigeAlles();
  });
}

// ----- Herzregen-Minispiel -----

let regenTimer = null;
let regenLaeuft = false;

// Nächsten Regen in [min, max] Minuten planen
function planeRegen([minMin, maxMin]) {
  clearTimeout(regenTimer);
  regenTimer = setTimeout(versucheRegen, zufallZwischen(minMin, maxMin) * 60000);
}

// Nur starten, wenn gerade nichts im Weg ist – sonst in 30 Sek. nochmal versuchen
function versucheRegen() {
  if (regenLaeuft || !marieDarfSprechen()) {
    regenTimer = setTimeout(versucheRegen, 30000);
    return;
  }
  starteRegen();
}

function starteRegen() {
  regenLaeuft = true;
  const thema = regenThema();
  const ende = Date.now() + REGEN.dauerSek * 1000;
  let punkte = 0, treffer = 0;

  starteRegenAnzeige();
  aktualisiereRegenAnzeige(thema, 0, REGEN.dauerSek);
  sound.stern();
  const feld = ui.spielfeld.getBoundingClientRect();
  zeigeSchwebeText({ x: feld.left + feld.width / 2 - 60, y: feld.top + feld.height * 0.45 }, `${thema.icon} ${thema.name}!`, true);
  sag("regenStart", { wichtig: true });

  const beimFangen = (wert, position) => {
    punkte += wert;
    treffer++;
    // "Plopp" – wird mit jedem Treffer ein bisschen höher
    spieleTon(620 + Math.min(treffer, 40) * 22, 0.09, "sine", 0.12, 1500 + Math.min(treffer, 40) * 22);
    zeigeSchwebeText(position, wert > 1 ? `+${wert} ✨` : "+1");
    aktualisiereRegenAnzeige(thema, punkte, Math.max(0, Math.ceil((ende - Date.now()) / 1000)));
  };

  const fallen = setInterval(() => {
    if (!document.hidden) lasseRegenTeilFallen(thema, beimFangen);
  }, 1000 / REGEN.proSekunde);

  const uhr = setInterval(() => {
    const rest = Math.max(0, Math.ceil((ende - Date.now()) / 1000));
    aktualisiereRegenAnzeige(thema, punkte, rest);
    if (rest > 0) return;
    clearInterval(fallen);
    clearInterval(uhr);
    setTimeout(() => beendeRegenMitBonus(thema, punkte), 700);   // die letzten Teile noch fangen lassen
  }, 200);
}

function beendeRegenMitBonus(thema, punkte) {
  beendeRegenAnzeige();
  const ergebnis = beendeRegen(punkte);
  regenLaeuft = false;

  sound.erfolg();
  const pass = aktiverSeasonPass();
  let text = punkte ? `${punkte} Punkte → +${format(ergebnis.herzen)} ${herz()}` : "Diesmal nichts gefangen – beim nächsten Mal!";
  if (ergebnis.seasonPunkte) text += ` · +${ergebnis.seasonPunkte} ${pass.icon}`;
  meldung(`${thema.icon} ${thema.name} vorbei!`, text);
  if (ergebnis.rekord && punkte > 0) meldung("🏆 Neuer Rekord!", `So viel hast du noch nie gefangen: ${punkte} Punkte!`);
  for (const stufe of ergebnis.stufen) meldeSeasonStufe(stufe);
  sag(punkte >= 30 ? "regenGut" : "regenOk", { wichtig: true });

  aktualisiereAnzeige();
  planeRegen(REGEN.pauseMinuten);
}

// ----- Geburtstag -----

let warGeburtstag = null;   // um den Wechsel um Mitternacht zu bemerken

// Geschenk-Fenster am Geburtstag zeigen (falls noch nicht geöffnet und kein anderes Fenster offen)
function pruefeGeburtstag() {
  // Tageswechsel in den Geburtstag hinein oder hinaus: Hut, Konfetti und Musik umstellen
  const heute = istGeburtstag();
  if (warGeburtstag !== null && heute !== warGeburtstag) {
    wendeSkinsAn();
    stoppeMusik();
    aktualisiereMusik();
  }
  warGeburtstag = heute;

  const fensterOffen = [...document.querySelectorAll(".overlay")].some(el => !el.hidden);
  if (geburtstagsGeschenkWartet() && !fensterOffen) zeigeGeburtstagFenster();
}

function richteGeburtstagEin() {
  $("gbBox").addEventListener("click", () => {
    const ergebnis = oeffneGeburtstagsGeschenk();
    if (!ergebnis) return;
    sound.stern();
    setTimeout(() => sound.erfolg(), 400);
    zeigeGeburtstagInhalt(ergebnis);
    for (const stufe of ergebnis.stufen) meldeSeasonStufe(stufe);
    zeigeSkins();
    aktualisiereAnzeige();
  });
  $("gbZu").addEventListener("click", () => {
    $("geburtstagOverlay").hidden = true;
    sound.klick();
  });
}

// ----- Marie spricht -----

let letzteSprechblase = 0;        // wann Marie zuletzt etwas gesagt hat
let letzterKlick = Date.now();    // für "Mir ist langweilig…"
let langweiligGesagt = false;     // hat sie sich gelangweilt, seit zuletzt geklickt wurde?
let begruessungOffen = true;      // Begrüßung kommt, sobald kein Fenster mehr offen ist
let letzterHungerHinweis = 0;

// Kann Marie gerade sprechen? (nicht bei offenen Fenstern oder offenem Handy-Menü)
function marieDarfSprechen() {
  if (document.hidden) return false;
  if ([...document.querySelectorAll(".overlay")].some(el => !el.hidden)) return false;
  const handyMenue = document.body.classList.contains("menue-offen") && getComputedStyle($("untenNav")).display !== "none";
  return !handyMenue;
}

// art = Schlüssel in SPRUECHE. chance = Wahrscheinlichkeit. wichtig = auch kurz nach der letzten Blase
// Gibt true zurück, wenn Marie wirklich etwas gesagt hat.
function sag(art, { chance = 1, wichtig = false } = {}) {
  if (Math.random() > chance || !marieDarfSprechen()) return false;
  if (!wichtig && Date.now() - letzteSprechblase < 8000) return false;
  marieSagt(spruch(art));
  letzteSprechblase = Date.now();
  return true;
}

// 1× pro Sekunde: Begrüßung, Langeweile, hungriges Haustier
function pruefeMarieSpricht() {
  const jetzt = Date.now();
  if (begruessungOffen && marieDarfSprechen()) {
    begruessungOffen = false;
    setTimeout(() => sag(istGeburtstag() ? "geburtstag" : begruessungsArt(), { wichtig: true }), 700);
    return;
  }
  // Niemand klickt seit 45 Sekunden -> langweilig (danach höchstens jede Minute)
  if (jetzt - letzterKlick > 45000 && jetzt - letzteSprechblase > 60000) {
    if (sag("langweilig", { wichtig: true })) langweiligGesagt = true;
    return;
  }
  // Hungriges Haustier: höchstens alle 10 Minuten erinnern
  if (tierLaune() === "hungrig" || tierLaune() === "schlaeft") {
    if (jetzt - letzterHungerHinweis > 10 * 60000 && jetzt - letzterKlick < 45000) {
      letzterHungerHinweis = jetzt;
      sag("tierHunger");
    }
  }
}

// ----- Haustier -----

function meldeTierWachstum(ergebnis) {
  const t = haustier();
  if (ergebnis.gewachsen) {
    sound.erfolg();
    meldung(`🎉 ${t.name} ist gewachsen!`, `Jetzt: ${ergebnis.gewachsen.name} – und noch ein bisschen größer!`);
  } else if (ergebnis.aufgestiegen) {
    sound.stern();
    meldung(`⭐ ${t.name} ist jetzt Level ${t.level}!`, `+${Math.round(TIER.bonusProLevel * 100)} % Herzen mehr`);
  }
}

function richteHaustierEin() {
  ui.haustier.addEventListener("click", () => {
    sound.klick();
    zeigeTierFenster();
  });
  // Fenster zu – wurde gefüttert, freut sich Marie mit ("Lecker, oder, Mimi?")
  let gefuettert = false;
  $("tierZu").addEventListener("click", () => {
    $("tierOverlay").hidden = true;
    if (gefuettert) sag("fuettern", { wichtig: true });
    gefuettert = false;
  });

  $("tierAdoptieren").addEventListener("click", () => {
    if (!adoptiere(tierAuswahl.id, $("tierName").value)) return;
    sound.erfolg();
    meldung(`💕 Willkommen, ${haustier().name}!`, `Dein ${tierAuswahl.name} wohnt jetzt bei Marie. Vergiss nicht, es zu füttern!`);
    speichern();
    zeigeTierFenster();
    aktualisiereAnzeige();
  });

  const fuettern = sorte => {
    const ergebnis = fuettere(sorte);
    if (!ergebnis.ok) {
      sound.fehler();
      if (ergebnis.grund === "herzen") meldung("💖 Nicht genug Herzen", "Sammle noch ein paar Herzen und versuch es dann nochmal.");
      return;
    }
    sound.kauf();
    tierFreutSich();
    gefuettert = true;
    const t = haustier();
    const r = $("tierGross").getBoundingClientRect();
    zeigeSchwebeText({ x: r.left + r.width / 2, y: r.top }, `${tierArt(t)[sorte].icon} Mmmh!`);
    meldeTierWachstum(ergebnis);
    aktualisiereAnzeige();
  };
  $("tierLeckerli").addEventListener("click", () => fuettern("leckerli"));
  $("tierFestmahl").addEventListener("click", () => fuettern("festmahl"));

  const streicheln = () => {
    const ergebnis = streichle();
    if (!ergebnis.ok) return;
    spieleTon(900 + Math.random() * 200, 0.15, "sine", 0.1, 1300);   // zufriedenes "Schnurr-Pling"
    tierFreutSich();
    meldeTierWachstum(ergebnis);
    zeigeTierPflege();
  };
  $("tierStreicheln").addEventListener("click", streicheln);
  $("tierGross").addEventListener("click", streicheln);
}

// ----- Sticker-Album (Fortsetzung) -----

// ----- Sticker-Album -----

// Ein Sticker ist herausgefallen -> anzeigen (position = wo er aufploppt, optional)
function meldeSticker(ergebnis, position = null) {
  if (!ergebnis) return;
  const { sticker, neu, herzen, seiteFertig, seitenHerzen } = ergebnis;
  const art = seltenheit(sticker).name;

  if (position) zeigeSchwebeText(position, `${sticker.emoji} Sticker!`, true);
  albumSymbolFeiern();
  if (neu) {
    sound.stern();
    sag("sticker");
    meldung(`📒 Neuer Sticker! ${sticker.emoji}`, `${sticker.name}${art ? ` – ${art === "Super-selten" ? "🌟" : "✨"} ${art}!` : ""}`);
  } else {
    sound.kauf();
    meldung(`📒 Doppelt: ${sticker.emoji} ${sticker.name}`, `Dafür bekommst du +${format(herzen)} ${herz()}`);
  }
  if (seiteFertig) {
    setTimeout(() => sound.erfolg(), 400);
    meldung(`🎉 Seite „${seiteFertig.name}“ voll! ${seiteFertig.icon}`, `Belohnung: +${format(seitenHerzen)} ${herz()}`);
  }
  if (!$("seiteAlbum").hidden) zeigeAlbum();
}

// ----- Tagesaufgaben -----

// Gerade fertig gewordene Aufgaben melden
function meldeAufgaben(fertige) {
  for (const a of fertige) {
    sound.erfolg();
    aufgabenSymbolFeiern();
    meldung(`✅ Aufgabe geschafft! ${aufgabeIcon(a)}`, `${aufgabeText(a)} – tippe auf 📋 und hol dir deine Belohnung!`);
  }
}

// "Abholen"-Knopf (index 0..2 oder "bonus")
function beimAufgabeAbholen(index) {
  const ergebnis = holeAufgabeAb(index);
  if (!ergebnis) return;
  sound.stern();
  const pass = aktiverSeasonPass();
  const season = ergebnis.seasonPunkte ? ` · +${ergebnis.seasonPunkte} ${pass.icon}` : "";
  meldung(ergebnis.istBonus ? "🎁 Bonus abgeholt!" : "🎁 Belohnung abgeholt!", `+${format(ergebnis.herzen)} ${herz()}${season}`);
  for (const stufe of ergebnis.stufen) meldeSeasonStufe(stufe);
  aktualisiereAnzeige();
}

// Neuer Tag? -> neue Aufgaben, Vortags-Belohnungen automatisch gutschreiben
function pruefeTageswechsel() {
  const { neu, nachgeholt } = pruefeAufgabenTag();
  for (const b of nachgeholt) {
    if (!b) continue;
    meldung("🎁 Belohnung von gestern", `Automatisch gutgeschrieben: +${format(b.herzen)} ${herz()}`);
    for (const stufe of b.stufen) meldeSeasonStufe(stufe);
  }
  if (neu) {
    aufgabenSymbolFeiern();
    meldung("📋 Neue Tagesaufgaben!", "Tippe auf 📋 und schau, was heute zu tun ist.");
  }
}

// Neue Season-Stufe erreicht -> Meldung, Sound, Symbol leuchtet
function meldeSeasonStufe({ pass, stufe, belohnung }) {
  sound.erfolg();
  seasonSymbolFeiern();
  if (belohnung.typ === "herzen") {
    meldung(`${pass.icon} Season-Stufe ${stufe}!`, `+${format(belohnung.menge)} ${herz()}`);
  } else {
    const s = belohnung.skin;
    meldung(`${pass.icon} Stufe ${stufe}: Neuer Skin! ${s.icon}`, `„${s.name}“ – jetzt unter Skins auswählbar`);
    zeigeSkins();
  }
  meldeSticker(versucheSticker("season"));   // jede Season-Stufe bringt einen Sticker
  sag("season");
}

// ----- Skin auswählen -----

function beimSkinWaehlen(skin) {
  if (!waehleSkin(skin)) {
    sound.fehler();
    meldung("🔒 Noch gesperrt", `„${skin.name}“ gibt es mit ${seasonName(skin.season)}.`);
    return;
  }
  speichereSkins();
  wendeSkinsAn();
  zeigeSkins();
  sound.kauf();

  // Neues Musikstück: Musik neu starten (falls sie gerade läuft)
  if (skin.kategorie === "musik") {
    stoppeMusik();
    aktualisiereMusik();
  }
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
  sag("sternDa", { wichtig: true });
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
    ? `${herz()} Herzregen! +${format(gewinn)}`
    : `${effekt.name}! ${effekt.text}`;

  zeigeSchwebeText(position, text, true);
  marieFreutSich();
  sag("sternGefangen", { wichtig: true });
  meldeAufgaben(aufgabenEreignis("stern"));
  meldeSticker(versucheSticker("stern"));
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
    if (aktiveFinger.size === 3) sag("finger", { wichtig: true });
    meldeAufgaben(aufgabenEreignis("finger", aktiveFinger.size));
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

  // Season-Pass über das eigene Symbol öffnen (nochmal tippen = schließen)
  ui.seasonBtn.addEventListener("click", () => {
    if (menueOffen && aktuelleSeite === "seiteSeason") {
      setzeMenue(false);
      return;
    }
    zeigeSeite("seiteSeason");
    setzeMenue(true);
    zeigeSeason();
    scrolleZuAktuellerStufe();
  });

  // Sticker-Album über das 📒-Symbol öffnen (nochmal tippen = schließen)
  ui.albumBtn.addEventListener("click", () => {
    if (menueOffen && aktuelleSeite === "seiteAlbum") {
      setzeMenue(false);
      return;
    }
    // Seite mit neuen Stickern zuerst aufschlagen
    const neueSeite = STICKER_SEITEN.find(s => (spiel.stickerNeu || []).some(id => id.startsWith(s.id + "-")));
    if (neueSeite) albumSeite = neueSeite;
    zeigeSeite("seiteAlbum");
    setzeMenue(true);
    zeigeAlbum();
    $("seitenleiste").scrollTop = 0;
  });

  // Tagesaufgaben über das 📋-Symbol öffnen (nochmal tippen = schließen)
  ui.aufgabenBtn.addEventListener("click", () => {
    if (menueOffen && aktuelleSeite === "seiteAufgaben") {
      setzeMenue(false);
      return;
    }
    zeigeSeite("seiteAufgaben");
    setzeMenue(true);
    zeigeAufgaben();
    $("seitenleiste").scrollTop = 0;
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") setzeMenue(false); });

  $("reset").addEventListener("click", () => {
    if (!confirm("Wirklich alles löschen?")) return;
    zuruecksetzen();
    pruefeAufgabenTag();   // frische Tagesaufgaben für den neuen Spielstand
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
  aktualisiereHunger();   // das Haustier wird langsam hungrig
  pruefeTageswechsel();
  pruefeGeburtstag();     // Geburtstagsgeschenk hat Vorrang vor dem täglichen Geschenk
  pruefeGeschenk();       // auch nach Mitternacht, wenn das Spiel noch offen ist
  meldeAufgaben(aktualisiereZeitAufgaben());   // "Sammle X Herzen", "Spiele 10 Minuten"

  for (const erfolg of pruefeNeueErfolge()) {
    const prozent = Math.round(KONFIG.erfolgBonus * 100);
    meldung(`🏆 ${erfolg.icon} ${erfolg.name}`, `${erfolg.beschr} (+${prozent} % Herzen)`);
    sound.erfolg();
    sag("erfolg", { wichtig: true });
  }
  pruefeMarieSpricht();
  zeigeErfolge();
  zeigeStatistik();
}

// ----- Spielstand sichern & wiederherstellen -----

// In die Zwischenablage kopieren. Klappt das nicht (z.B. ohne https),
// steht der Code markiert im Textfeld zum Selber-Kopieren.
async function kopiereText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const feld = $("sicherungText");
    feld.value = text;
    feld.select();
    try { return document.execCommand("copy"); } catch (e2) { return false; }
  }
}

function ladeSicherung(code) {
  let daten;
  try {
    daten = leseSicherungsCode(code);
  } catch (fehler) {
    sound.fehler();
    meldung("⚠️ Laden nicht möglich", fehler.message);
    return;
  }
  const datum = daten.datum ? new Date(daten.datum).toLocaleString("de-DE") : "unbekannt";
  const frage = `Diesen Spielstand laden?\n\n💖 ${format(daten.spiel.herzen)} Herzen\n📅 gesichert am ${datum}\n\n`
              + `Dein jetziger Spielstand wird dadurch ersetzt. Deine Skins bleiben erhalten.`;
  if (!confirm(frage)) return;

  stelleSicherungWiederHer(daten);
  location.reload();   // alles mit dem neuen Spielstand frisch aufbauen
}

function richteSicherungEin() {
  $("sicherungKopieren").addEventListener("click", async () => {
    const ok = await kopiereText(erstelleSicherungsCode());
    if (ok) {
      merkeSicherungszeit();
      sound.kauf();
      meldung("📋 Code kopiert!", "Füge ihn z.B. in eine Nachricht an dich selbst ein und bewahre ihn gut auf.");
    } else {
      meldung("📋 Bitte selbst kopieren", "Der Code steht markiert im Textfeld unten.");
    }
    zeigeSicherungInfo();
  });

  $("sicherungDatei").addEventListener("click", () => {
    const datei = new Blob([erstelleSicherungsCode()], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(datei);
    link.download = `marie-clicker-${datumText()}.txt`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    merkeSicherungszeit();
    sound.kauf();
    meldung("💾 Datei gespeichert!", "Du findest sie bei deinen Downloads bzw. in der Dateien-App.");
    zeigeSicherungInfo();
  });

  $("sicherungLaden").addEventListener("click", () => ladeSicherung($("sicherungText").value));

  const dateiAuswahl = $("sicherungDateiInput");
  $("sicherungDateiLaden").addEventListener("click", () => dateiAuswahl.click());
  dateiAuswahl.addEventListener("change", async () => {
    const datei = dateiAuswahl.files[0];
    dateiAuswahl.value = "";   // gleiche Datei nochmal wählbar
    if (datei) ladeSicherung(await datei.text());
  });
}

// ----- Tägliches Geschenk -----

// Wartet heute ein Geschenk und ist gerade kein anderes Fenster offen? -> zeigen
function pruefeGeschenk() {
  const fensterOffen = [...document.querySelectorAll(".overlay")].some(el => !el.hidden);
  if (geschenkWartet() && !fensterOffen) zeigeGeschenkFenster();
}

function richteGeschenkEin() {
  $("geschenkBox").addEventListener("click", () => {
    const ergebnis = oeffneGeschenk();
    if (!ergebnis) return;
    sound.stern();
    setTimeout(() => sound.erfolg(), 350);
    zeigeGeschenkInhalt(ergebnis);
    for (const stufe of ergebnis.stufen) meldeSeasonStufe(stufe);
    aktualisiereAnzeige();
  });
  $("geschenkZu").addEventListener("click", () => {
    versteckeGeschenkFenster();
    sound.klick();
  });
}

// ----- Glücksrad -----

let radErgebnis = null;   // Gewinn der letzten Drehung (für die Sternschnuppe nach dem Schließen)

// Tick-Geräusche, die immer langsamer werden – wie bei einem echten Glücksrad
function radTicken(dauerMs) {
  let zeit = 0, abstand = 50;
  while (zeit < dauerMs - 300) {
    setTimeout(() => spieleTon(1200, 0.03, "square", 0.04), zeit);
    zeit += abstand;
    abstand *= 1.09;
  }
}

function schliesseRad() {
  $("radOverlay").hidden = true;
  // Sternschnuppe gewonnen? Erst nach dem Schließen erscheinen lassen, damit man sie sieht
  if (radErgebnis && radErgebnis.feld.typ === "stern") {
    clearTimeout(sternTimer);
    sternErscheint();
  }
  radErgebnis = null;
}

function richteGluecksradEin() {
  ui.radBtn.addEventListener("click", () => {
    sound.klick();
    zeigeRadFenster();
  });

  $("radDrehen").addEventListener("click", () => {
    const ergebnis = dreheGluecksrad();
    if (!ergebnis) return;
    radErgebnis = ergebnis;
    const dauer = dreheRadScheibe(ergebnis.index);
    radTicken(dauer);
    setTimeout(() => {
      sound.stern();
      if (ergebnis.feld.typ === "jackpot") setTimeout(() => sound.erfolg(), 300);
      zeigeRadErgebnis(ergebnis);
      for (const stufe of ergebnis.stufen) meldeSeasonStufe(stufe);
      aktualisiereAnzeige();
    }, dauer + 150);
  });

  $("radFertig").addEventListener("click", schliesseRad);
  $("radZu").addEventListener("click", schliesseRad);
}

// ----- Online-Bestenliste -----

let bestenlisteLaedt = false;

// Eigene Punkte senden und die Liste neu holen (nur wenn die Seite offen ist)
async function aktualisiereBestenliste() {
  zeigeBestenlisteBereich();
  if (!mitglied || bestenlisteLaedt) return;
  bestenlisteLaedt = true;
  setzeBestenlisteStatus("⏳ Lädt …");
  try {
    await sendePunkte();
    zeigeBestenlisteEintraege(await holeBestenliste());
    setzeBestenlisteStatus(`Aktualisiert um ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr`);
  } catch (fehler) {
    setzeBestenlisteStatus("⚠️ " + fehler.message);
  } finally {
    bestenlisteLaedt = false;
  }
}

function richteBestenlisteEin() {
  if (!bestenlisteEingerichtet()) return;   // ohne Supabase-Daten bleibt alles unsichtbar
  ladeMitgliedschaft();
  ui.bestenlisteBtn = $("bestenlisteBtn");
  ui.bestenlisteBtn.hidden = false;

  ui.bestenlisteBtn.addEventListener("click", () => {
    if (menueOffen && aktuelleSeite === "seiteBestenliste") {
      setzeMenue(false);
      return;
    }
    zeigeSeite("seiteBestenliste");
    setzeMenue(true);
    aktualisiereBestenliste();
  });

  $("blMitmachen").addEventListener("click", async () => {
    const knopf = $("blMitmachen");
    knopf.disabled = true;
    try {
      await trittBestenlisteBei($("blName").value);
      sound.erfolg();
      meldung("🏅 Du bist dabei!", `Viel Spaß, ${mitglied.name}!`);
      aktualisiereBestenliste();
    } catch (fehler) {
      sound.fehler();
      meldung("⚠️ Mitmachen nicht möglich", fehler.message);
    } finally {
      knopf.disabled = false;
    }
  });

  $("blAktualisieren").addEventListener("click", () => aktualisiereBestenliste());

  $("blAendern").addEventListener("click", async () => {
    const neu = prompt("Neuer Spitzname (höchstens 16 Zeichen):", mitglied.name);
    if (neu === null) return;
    try {
      await trittBestenlisteBei(neu);
      aktualisiereBestenliste();
    } catch (fehler) {
      meldung("⚠️ Ändern nicht möglich", fehler.message);
    }
  });

  $("blVerlassen").addEventListener("click", async () => {
    if (!confirm("Wirklich nicht mehr mitmachen? Dein Eintrag wird aus der Bestenliste gelöscht.")) return;
    try { await verlasseBestenliste(); } catch (e) { /* lokal trotzdem verlassen */ }
    $("blName").value = "";
    zeigeBestenlisteBereich();
  });

  // Wer früher einer Gruppe mit eigenem Code beigetreten ist, kommt in die gemeinsame Liste
  if (mitglied && mitglied.gruppe !== BESTENLISTE.gruppe) {
    trittBestenlisteBei(mitglied.name).catch(() => {});
  }

  // Regelmäßig die eigenen Punkte melden (und die Liste auffrischen, wenn sie offen ist)
  setInterval(() => {
    if (!mitglied || document.hidden) return;
    if (!$("seiteBestenliste").hidden) aktualisiereBestenliste();
    else sendePunkte().catch(() => {});
  }, BESTENLISTE.sendenAlleSek * 1000);

  // Beim Verlassen der App noch schnell den neuesten Stand senden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && mitglied) sendePunkte().catch(() => {});
  });
}

// ----- Neue Version verfügbar? -----

let updateSpaeter = false;   // "Später" gedrückt -> bis zum nächsten Start nicht mehr fragen

// "1.26" < "1.30" < "2.0" – Teil für Teil als Zahl vergleichen
function istNeuereVersion(server, lokal) {
  const a = server.split(".").map(Number), b = lokal.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}

// Fragt den Server nach der aktuellen Version (am Speicher der App vorbei, siehe sw.js "frisch")
async function pruefeAufUpdate() {
  if (updateSpaeter || !location.protocol.startsWith("http") || !$("updateOverlay").hidden) return;
  try {
    const antwort = await fetch(`js/version.js?frisch=${Date.now()}`, { cache: "no-store" });
    if (!antwort.ok) return;
    const text = await antwort.text();
    const version = (text.match(/APP_VERSION\s*=\s*"([^"]+)"/) || [])[1];
    const neu = (text.match(/APP_NEU\s*=\s*"([^"]*)"/) || [])[1] || "";
    if (version && istNeuereVersion(version, APP_VERSION)) zeigeUpdateFenster(version, neu);
  } catch (e) { /* offline -> später nochmal */ }
}

function zeigeUpdateFenster(version, neu) {
  setzeText($("updateVersionen"), `Du spielst Version ${APP_VERSION} – neu ist Version ${version}.`);
  setzeText($("updateNeu"), neu ? `🆕 ${neu}` : "");
  $("updateOverlay").hidden = false;
}

// Aktualisieren: gespeicherte App-Dateien löschen und neu laden.
// Der Spielstand liegt im localStorage und ist davon nicht betroffen.
async function aktualisiereApp() {
  $("updateJetzt").disabled = true;
  setzeText($("updateJetzt"), "⏳ Einen Moment …");
  speichern();
  try {
    const registrierung = await navigator.serviceWorker?.getRegistration();
    await registrierung?.update();
  } catch (e) { /* egal – der Speicher wird unten ohnehin geleert */ }
  try {
    const namen = await caches.keys();
    await Promise.all(namen.map(name => caches.delete(name)));
  } catch (e) { /* kein Cache-Zugriff */ }
  location.reload();
}

function richteUpdateEin() {
  $("updateJetzt").addEventListener("click", aktualisiereApp);
  $("updateSpaeter").addEventListener("click", () => {
    updateSpaeter = true;
    $("updateOverlay").hidden = true;
  });

  setTimeout(pruefeAufUpdate, 1500);                                  // kurz nach dem Start
  document.addEventListener("visibilitychange", () => {               // App wieder geöffnet
    if (!document.hidden) pruefeAufUpdate();
  });
  setInterval(pruefeAufUpdate, 30 * 60 * 1000);                        // und alle 30 Minuten
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
  $("version").textContent = "v" + APP_VERSION;
  laden();
  aktualisiereHunger();   // Hunger seit dem letzten Spielen nachrechnen
  ladeSkins();
  const nachgeliefert = seasonSkinsNachliefern();   // z.B. neues Logo für schon erreichte Stufe 40
  setzeAufgabenAbholAktion(beimAufgabeAbholen);
  wendeSkinsAn();
  baueOberflaeche({ kaufeItem: beimKaufen, kaufeUpgrade: beimUpgradeKaufen });
  baueSkinSeite(beimSkinWaehlen);
  zeigeSkins();
  verbindeEreignisse();
  richteSicherungEin();
  richteGeschenkEin();
  richteGluecksradEin();
  richteHaustierEin();
  richteGeburtstagEin();
  richteNeustartEin();
  richteBestenlisteEin();
  richteAppEin();
  richteUpdateEin();

  // Den Browser bitten, unsere Daten nicht automatisch zu löschen (z.B. bei Speicherplatzmangel)
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  zeigeSeite("seiteShop");
  pruefeTageswechsel();   // Tagesaufgaben für heute
  zeigeAlles();
  pruefeGeburtstag();     // Geburtstag? -> großes Geschenk zuerst
  pruefeGeschenk();       // erstes Öffnen heute? -> Geschenk zeigen (wartet, bis das Geburtstagsfenster zu ist)

  for (const skin of nachgeliefert) {
    meldung(`🎁 Neuer Skin: ${skin.icon} ${skin.name}`, "Für deine schon erreichte Season-Stufe – jetzt unter Skins auswählbar");
  }

  setInterval(tick, KONFIG.tickMs);
  setInterval(pruefeErfolgeUndStatistik, KONFIG.erfolgPruefenMs);
  setInterval(speichern, KONFIG.speichernMs);
  planeStern();
  planeRegen(REGEN.ersteMinuten);
}

starte();
