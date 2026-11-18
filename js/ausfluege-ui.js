"use strict";
// =====================================================
//  HAUSTIER-AUSFLÜGE – Bildschirm
//  Im Haustier-Fenster: Ziel wählen bzw. Fortschritt ansehen.
//  Kommt das Tier zurück: Fenster mit dem Inhalt des Rucksacks.
//  Regeln: ausfluege.js
// =====================================================

// Im Pflege-Fenster (aus zeigeTierPflege, also auch 1× pro Sekunde, solange es offen ist)
function zeigeAusflugBereich(t) {
  const weg = istUnterwegs(t);
  $("tierAusflug").hidden = weg;
  $("tierUnterwegs").hidden = !weg;
  $("tierFutter").hidden = weg;
  $("tierStreicheln").hidden = weg;
  $("tierGross").classList.toggle("unterwegs", weg);

  if (weg) {
    const ziel = ausflugZiel(t.ausflug.ziel) || AUSFLUG_ZIELE[0];
    setzeText($("tierLaune"), `${t.name} ist ${ziel.wohin} gelaufen und entdeckt dort ganz viel! 🎒`);
    setzeText($("ausflugOrt"), `${ziel.icon} ${ziel.name}`);
    $("ausflugBalken").style.width = (ausflugAnteil(t) * 100).toFixed(1) + "%";
    const rest = ausflugRestSekunden(t);
    setzeText($("ausflugRest"), rest > 0 ? `Zurück in ${formatDauer(rest)}` : "Gleich wieder da! 🐾");
    return;
  }

  const hindernis = ausflugHindernis(t);
  setzeText($("ausflugHinweis"), hindernis || "Je länger der Ausflug, desto voller ist der Rucksack! Klappt auch, wenn das Spiel zu ist.");
  $("ausflugHinweis").classList.toggle("warnung", Boolean(hindernis));
  for (const knopf of $("ausflugZiele").children) knopf.disabled = Boolean(hindernis);
}

// ----- Zurück! -----

function zeigeAusflugRueckkehr(e) {
  const t = e.tier;
  zeichneTier($("auTier"), t);
  setzeText($("auTitel"), `🎒 ${t.name} ist zurück!`);
  setzeText($("auText"), `${e.ziel.icon} ${t.name} kommt ${e.ziel.woher} und hat etwas mitgebracht:`);

  const zeilen = [`+${format(e.herzen)} ${herz()}`];
  for (const s of e.sticker) {
    zeilen.push(`📒 ${s.sticker.emoji} ${s.sticker.name}${s.neu ? " – neu!" : ` (doppelt: +${format(s.herzen)} ${herz()})`}`);
  }
  if (e.mitbringsel) zeilen.push(`🏠 ${e.mitbringsel.icon} ${e.mitbringsel.name} fürs Zimmer!`);
  zeilen.push(`⭐ +${AUSFLUG.xpProStunde * e.ziel.stunden} Erfahrung`);
  $("auBeute").textContent = zeilen.map(inWaehrung).join("\n");
  setzeText($("auHinweis"), e.mitbringsel ? "Tippe auf 🏠 und stell das Mitbringsel in dein Zimmer!" : "");

  $("ausflugOverlay").hidden = false;
  sound.erfolg();
  setTimeout(() => sound.stern(), 350);
  konfetti($("ausflugOverlay").querySelector(".geschenkKarte"));
  setTimeout(() => sag("ausflugZurueck", { wichtig: true }), 500);

  if (e.sticker.some(s => s.neu || s.seiteFertig)) albumSymbolFeiern();
  for (const s of e.sticker) {
    if (s.seiteFertig) meldung(`🎉 Seite „${s.seiteFertig.name}“ voll! ${s.seiteFertig.icon}`, `Belohnung: +${format(s.seitenHerzen)} ${herz()}`);
  }
  meldeTierWachstum(e.xp, t);
  zeigeHaustier();
  pruefeErfolgeUndStatistik();
  aktualisiereAnzeige();
}

// 1× pro Sekunde aus main.js: Ist ein Tier zurück? (Nicht über anderen Fenstern –
// außer dem Haustier-Fenster, das wird dafür geschlossen.)
function pruefeAusfluege() {
  const t = alleHaustiere().find(ausflugFertig);
  if (!t) return;
  const anderesFenster = [...document.querySelectorAll(".overlay")].some(el => !el.hidden && el.id !== "tierOverlay");
  if (anderesFenster) return;
  const ergebnis = beendeAusflug(t);
  if (!ergebnis) return;
  $("tierOverlay").hidden = true;
  zeigeAusflugRueckkehr(ergebnis);
}

function richteAusfluegeEin() {
  const ziele = $("ausflugZiele");
  for (const ziel of AUSFLUG_ZIELE) {
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "ausflugZiel";
    knopf.title = `${ziel.name} – ${ziel.stunden} ${ziel.stunden === 1 ? "Stunde" : "Stunden"}`;
    knopf.append(span("icon", ziel.icon), span("name", ziel.kurz), span("dauer", `${ziel.stunden} Std.`),
      span("beute", "📒".repeat(ziel.sticker)));
    knopf.addEventListener("click", () => {
      const t = haustier(fensterTierNr);
      if (!starteAusflug(t, ziel.id)) { sound.fehler(); return; }
      sound.erfolg();
      speichern();
      meldung(`🗺️ ${t.name} geht ${ziel.wohin}!`, `In ${ziel.stunden} ${ziel.stunden === 1 ? "Stunde" : "Stunden"} ist ${t.name} wieder da – mit vollem Rucksack.`, true);
      sag("ausflugLos", { wichtig: true });
      zeigeTierPflege();
      zeigeHaustier();
    });
    ziele.append(knopf);
  }
  $("auZu").addEventListener("click", () => {
    $("ausflugOverlay").hidden = true;
    sound.klick();
  });
}
