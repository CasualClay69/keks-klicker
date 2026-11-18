"use strict";
// =====================================================
//  ADVENTSKALENDER – Bildschirm
//  🎄-Knopf links (nur im Dezember, "!" = ein Türchen wartet), Fenster mit 24 Türchen.
//  Regeln: advent.js
// =====================================================

// Wild gemischt wie bei einem echten Kalender. Die 24 ist doppelt so breit (5 Spalten × 5 Reihen).
const ADVENT_REIHENFOLGE = [7, 15, 2, 20, 11, 3, 18, 9, 22, 5, 13, 1, 24, 17, 10, 21, 6, 14, 4, 19, 8, 16, 23, 12];
const ADVENT_FARBEN = ["rot", "gruen", "gold"];

function zeigeAdventKalender() {
  const raster = $("adventRaster");
  raster.textContent = "";
  const heute = adventHeute();
  ADVENT_REIHENFOLGE.forEach((tag, i) => {
    const tuer = document.createElement("button");
    tuer.type = "button";
    tuer.className = `adventTuer ${ADVENT_FARBEN[i % 3]}`;
    if (tag === 24) tuer.classList.add("gross");
    const offen = tuerOffen(tag);
    if (offen) {
      tuer.classList.add("offen");
      const teil = ADVENT_TEILE[tag];
      tuer.append(span("inhalt", teil ? teil.icon : "🎁"), span("nummer", String(tag)));
      tuer.setAttribute("aria-label", `Türchen ${tag} – schon offen`);
    } else {
      tuer.append(span("nummer", String(tag)));
      if (tag > heute) tuer.classList.add("zu");
      if (tuerBereit(tag)) tuer.classList.add(tag === heute ? "heute" : "verpasst");
      tuer.setAttribute("aria-label", tag > heute ? `Türchen ${tag} – noch ${tag - heute}-mal schlafen` : `Türchen ${tag} öffnen`);
    }
    tuer.addEventListener("click", () => tippeTuer(tag, tuer));
    raster.append(tuer);
  });

  const bereit = anzahlBereiteTueren();
  setzeText($("adventInfo"), heute > 24
    ? (bereit ? `Weihnachten ist vorbei – aber ${bereit} Türchen ${bereit === 1 ? "wartet" : "warten"} noch auf dich!` : "Alle Türchen sind offen. Frohe Weihnachten! 🎄")
    : heute === 24 ? "Heute ist Heiligabend! Das große Türchen wartet! 🎁"
    : `Noch ${24 - heute}-mal schlafen bis Heiligabend! ${bereit ? "✨ Ein Türchen wartet auf dich." : ""}`);
}

function tippeTuer(tag, tuer) {
  if (tuerOffen(tag)) { sound.klick(); return; }
  const heute = adventHeute();
  if (tag > heute) {
    sound.fehler();
    tuer.classList.remove("wackeln");
    void tuer.offsetWidth;
    tuer.classList.add("wackeln");
    const tage = tag - heute;
    setzeText($("adventInhalt"), `🔒 Türchen ${tag} ist noch zu – noch ${tage}-mal schlafen!`);
    $("adventInhalt").hidden = false;
    return;
  }
  const e = oeffneTuer(tag);
  if (!e) return;
  sound.stern();
  setTimeout(() => sound.erfolg(), 300);
  zeigeAdventKalender();
  konfetti($("adventOverlay").querySelector(".adventKarte"));

  const zeilen = [`${tag === 24 ? "🎄 Frohe Weihnachten! " : ""}Türchen ${tag}:`, `+${format(e.herzen)} ${herz()}`];
  if (e.test) zeilen.push("📒 Sticker (Test – nichts gutgeschrieben)");
  for (const s of e.sticker) zeilen.push(`📒 ${s.sticker.emoji} ${s.sticker.name}${s.neu ? " – neu!" : ""}`);
  if (e.seasonPunkte) zeilen.push(`+${format(e.seasonPunkte)} ${aktiverSeasonPass().icon}`);
  if (e.teil && e.teilNeu) zeilen.push(`🏠 ${e.teil.icon} ${e.teil.name} fürs Zimmer!`);
  $("adventInhalt").textContent = zeilen.map(inWaehrung).join("\n");
  $("adventInhalt").hidden = false;

  if (!e.test) {
    for (const stufe of e.stufen) meldeSeasonStufe(stufe);
    if (e.sticker.some(s => s.neu || s.seiteFertig)) albumSymbolFeiern();
    for (const s of e.sticker) {
      if (s.seiteFertig) meldung(`🎉 Seite „${s.seiteFertig.name}“ voll! ${s.seiteFertig.icon}`, `Belohnung: +${format(s.seitenHerzen)} ${herz()}`);
    }
    if (tag === 24) { konfetti($("spielfeld")); sag("advent24", { wichtig: true }); }
    pruefeErfolgeUndStatistik();
    aktualisiereAnzeige();
  }
  pruefeAdvent();
}

// 1× pro Sekunde aus main.js: Knopf nur im Dezember, "!" wenn ein Türchen wartet
function pruefeAdvent() {
  const knopf = $("adventBtn");
  knopf.hidden = !adventAktiv();
  if (knopf.hidden) return;
  $("adventBadge").hidden = anzahlBereiteTueren() === 0;
}

function richteAdventEin() {
  $("adventBtn").addEventListener("click", () => {
    sound.klick();
    $("adventInhalt").hidden = true;
    zeigeAdventKalender();
    $("adventOverlay").hidden = false;
    if (tuerBereit(adventHeute())) sag("advent", { wichtig: true });
  });
  $("adventZu").addEventListener("click", () => { $("adventOverlay").hidden = true; sound.klick(); });
  $("adventOverlay").addEventListener("click", e => { if (e.target.id === "adventOverlay") $("adventOverlay").hidden = true; });
  pruefeAdvent();
}
