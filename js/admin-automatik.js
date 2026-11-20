"use strict";
// =====================================================
//  ADMIN-AUTOMATIK – Reiter "🤖 Auto" im Admin-Menü (nur mit PIN erreichbar)
//  Gilt nur auf DIESEM Gerät (eigener Speicher, nicht im Spielstand) und bleibt an,
//  bis man sie im Admin-Menü wieder ausschaltet.
//
//  • Auto-Klicker: 30 Klicks pro Sekunde auf Marie (zählen wie echte Klicks)
//  • Auto-Kaufen: immer das, was am meisten bringt (Herzen pro Sekunde je ausgegebenem Herz)
//  • Wolken-Monster wegkitzeln, Herzregen fangen, Sternschnuppen fangen
//  • Tagesaufgaben abholen, Haustiere füttern, Garten gießen und ernten
// =====================================================

const ADMIN_AUTO = {
  schluessel: "marieClicker-adminAutomatik",
  klicksProSekunde: 30,
  maxWarteSek: 30,   // so lange darf das Auto-Kaufen auf etwas Besseres sparen
  schalter: [
    { id: "klick",    icon: "👆", name: "Auto-Klicker",        text: "30 Klicks pro Sekunde auf Marie" },
    { id: "kaufen",   icon: "🛍️", name: "Auto-Kaufen",         text: "Kauft immer die besten Verbesserungen und Helfer" },
    { id: "wolke",    icon: "☁️", name: "Wolken-Monster",      text: "Kitzelt Wolken-Monster automatisch weg" },
    { id: "regen",    icon: "💖", name: "Herzregen",            text: "Fängt alles, was beim Herzregen fällt" },
    { id: "sterne",   icon: "🌠", name: "Sternschnuppen",       text: "Fängt Sternschnuppen sofort" },
    { id: "aufgaben", icon: "📋", name: "Tagesaufgaben",        text: "Holt fertige Aufgaben-Belohnungen ab" },
    { id: "fuettern", icon: "🍖", name: "Haustiere füttern",    text: "Füttert hungrige Tiere mit Leckerli" },
    { id: "garten",   icon: "🌱", name: "Garten",               text: "Gießt durstige Beete und erntet Reifes" },
  ],
};

let adminAuto = {};
try { adminAuto = JSON.parse(localStorage.getItem(ADMIN_AUTO.schluessel) || "{}") || {}; } catch (e) { adminAuto = {}; }
const adminAutoAn = id => Boolean(adminAuto[id]);
function speichereAdminAuto() {
  try { localStorage.setItem(ADMIN_AUTO.schluessel, JSON.stringify(adminAuto)); } catch (e) { /* egal */ }
}

// ----- Auto-Klicker -----
let autoKlickZaehler = 0;
function autoKlicks(anzahl) {
  const r = ui.marie.getBoundingClientRect();
  const position = { x: r.left + r.width / 2, y: r.top + r.height * 0.35 };
  for (let i = 0; i < anzahl; i++) {
    const stufeVorher = klickStufe();
    const plus = klickeMarie();
    if (klickStufe() > stufeVorher) feiereKlickStufe();
    for (const neueStufe of seasonKlick(1)) meldeSeasonStufe(neueStufe);
    meldeAufgaben(aufgabenEreignis("klick"));
    meldeSticker(versucheSticker("klick"), position);
    // nicht jeden Klick anzeigen – sonst wird es zu unruhig
    if (++autoKlickZaehler % 6 === 0) {
      zeigeSchwebeText({ x: position.x + (Math.random() - 0.5) * r.width * 0.5, y: position.y }, `+${format(plus)} ${herz()}`);
      marieFreutSich();
      haustierHopst();
    }
  }
  letzterKlick = Date.now();
}

// ----- Auto-Kaufen: was bringt am meisten pro Herz? -----
function autoKaufWert(item) {
  if (GEBAEUDE.includes(item)) return hpsProStueck(item);
  // Klick-Verbesserung: zusätzliche Herzen pro Klick × Klicks pro Sekunde
  const klicks = adminAutoAn("klick") ? ADMIN_AUTO.klicksProSekunde : 3;
  return item.proKlick * klickStufeFaktor() * klicks;
}
function autoKaufen() {
  let kaeufe = 0;
  for (const u of UPGRADES.filter(upgradeVerfuegbar).sort((a, b) => a.preis - b.preis)) {
    if (kaufeUpgrade(u)) kaeufe++;
  }
  for (let i = 0; i < 300; i++) {
    const kandidaten = [...GEBAEUDE, ...KLICK_ITEMS].map(item => ({ item, p: preis(item), w: autoKaufWert(item) })).filter(k => k.w > 0 && isFinite(k.p));
    if (!kandidaten.length) break;
    kandidaten.sort((a, b) => b.w / b.p - a.w / a.p);
    let wahl = kandidaten[0];
    if (spiel.herzen < wahl.p) {
      // Sparen lohnt sich nur, wenn es nicht zu lange dauert – sonst das Beste, was schon geht
      const hps = herzenProSekunde() + (adminAutoAn("klick") ? herzenProKlick() * ADMIN_AUTO.klicksProSekunde : 0);
      const warten = hps > 0 ? (wahl.p - spiel.herzen) / hps : Infinity;
      if (warten <= ADMIN_AUTO.maxWarteSek) break;
      wahl = kandidaten.find(k => k.p <= spiel.herzen);
      if (!wahl) break;
    }
    spiel.herzen -= wahl.p;
    spiel.anzahl[wahl.item.id] = anzahl(wahl.item) + 1;
    kaeufe++;
  }
  if (kaeufe) zeigeAlles();
}

// ----- Wolken-Monster und Herzregen: "antippen" wie mit dem Finger -----
function tippeAn(el, n = 1) {
  const r = el.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "touch", button: 0,
      clientX: r.left + r.width * (0.3 + Math.random() * 0.4), clientY: r.top + r.height * (0.3 + Math.random() * 0.4) }));
  }
}
function autoWolke() {
  if (typeof monsterAktiv === "undefined" || !monsterAktiv || monsterAktiv.fertig) return;
  const el = $("monster");
  if (el && !el.hidden) tippeAn(el, 3);
}
function autoRegen() {
  if (typeof regenLaeuft === "undefined" || !regenLaeuft) return;
  for (const teil of document.querySelectorAll("#regenFeld .regenTeil:not(.gefangen)")) tippeAn(teil);
}

// ----- Kleinkram: Sterne, Aufgaben, Tiere, Garten -----
function autoKleinkram() {
  if (adminAutoAn("sterne") && !ui.stern.hidden) ui.stern.click();
  if (adminAutoAn("aufgaben") && spiel.aufgaben) {
    for (const index of [0, 1, 2, "bonus"]) beimAufgabeAbholen(index);
  }
  if (adminAutoAn("fuettern")) {
    for (const t of alleHaustiere()) {
      if (t.ausflug || t.sattheit >= 30) continue;
      const ergebnis = fuettere("leckerli", t);
      if (ergebnis.ok) meldeTierWachstum(ergebnis, t);
    }
  }
  if (adminAutoAn("garten") && typeof gartenStand === "function") {
    const gegossen = giesse();
    gartenStand().beete.forEach((beet, i) => { if (beetZustand(beet) === "reif") ernteHier(i); });
    if (gegossen) aktualisiereAnzeige();
  }
}

// ----- Takt -----
let adminAutoTakt = 0;
setInterval(() => {
  if (document.hidden || !spiel) return;
  adminAutoTakt++;
  try {
    if (adminAutoAn("klick")) { autoKlicks(ADMIN_AUTO.klicksProSekunde / 10); aktualisiereAnzeige(); }
    if (adminAutoAn("wolke")) autoWolke();
    if (adminAutoAn("regen")) autoRegen();
    if (adminAutoAn("kaufen") && adminAutoTakt % 5 === 0) autoKaufen();
    if (adminAutoTakt % 20 === 0) autoKleinkram();
  } catch (e) { /* ein Fehler hier darf das Spiel nie stören */ }
}, 100);

// ----- Reiter im Admin-Menü (el/knopf aus verwaltung-ui.js) -----
function adminAutomatikZeigen(inhalt) {
  inhalt.append(el("p", "seitenInfo", "Gilt nur auf diesem Gerät und bleibt an, bis du sie hier ausschaltest."));
  const liste = el("div", "autoListe");
  for (const s of ADMIN_AUTO.schalter) {
    const zeile = el("div", "autoZeile" + (adminAutoAn(s.id) ? " an" : ""));
    const text = el("div", "autoText");
    text.append(el("b", "", `${s.icon} ${s.name}`), el("div", "klein", s.text));
    const schalter = knopf(adminAutoAn(s.id) ? "AN" : "aus", () => {
      adminAuto[s.id] = !adminAutoAn(s.id);
      speichereAdminAuto();
      sound.klick();
      zeigeAdminReiter("automatik");
    }, "autoSchalter" + (adminAutoAn(s.id) ? " an" : ""));
    zeile.append(text, schalter);
    liste.append(zeile);
  }
  const reihe = el("div", "knopfReihe");
  reihe.append(
    knopf("✅ Alles an", () => { for (const s of ADMIN_AUTO.schalter) adminAuto[s.id] = true; speichereAdminAuto(); zeigeAdminReiter("automatik"); }),
    knopf("⏹️ Alles aus", () => { adminAuto = {}; speichereAdminAuto(); zeigeAdminReiter("automatik"); }),
  );
  inhalt.append(liste, reihe);
}
