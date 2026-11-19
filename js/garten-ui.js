"use strict";
// =====================================================
//  GARTEN – Bildschirm (Regeln: garten.js)
//  🌱-Knopf links (💧 = etwas hat Durst, 🧺 = etwas ist reif), Fenster mit 6 Beeten.
//  Tippen auf ein Beet: leer -> Samen wählen, durstig -> gießen, reif -> ernten.
// =====================================================

let gartenAuswahlBeet = null;   // für welches Beet gerade ein Samen gewählt wird

function beetBild(beet) {
  const p = pflanzeNachId(beet.pflanze);
  if (!p) return "";
  if (beet.gegossen >= p.tage) return p.icon;
  const anteil = beet.gegossen / p.tage;
  return anteil === 0 ? "🟤" : anteil < 0.5 ? "🌱" : "🌿";
}

function zeigeGarten() {
  const g = gartenStand();
  setzeText($("gartenTitel"), `🌱 ${figurName()}s Garten`);
  setzeText($("gartenSamen"), g.zaubersamen ? `✨ Zaubersamen: ${g.zaubersamen}` : "✨ Zaubersamen findest du manchmal beim Ernten");
  const aufgaben = gartenAufgaben();
  $("gartenGiessen").disabled = aufgaben.durstig === 0;
  setzeText($("gartenGiessen"), aufgaben.durstig ? `💧 Alles gießen (${aufgaben.durstig})` : "💧 Heute schon gegossen!");

  const beete = $("gartenBeete");
  beete.textContent = "";
  g.beete.forEach((beet, i) => {
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "beet";
    if (!beetFrei(i)) {
      const preis = i === g.frei ? naechstesBeetPreis() : null;
      knopf.classList.add("gesperrt");
      knopf.append(span("bild", "🔒"), span("info", preis !== null ? `${format(preis)} ${herz()}` : "später"));
      knopf.disabled = preis === null || spiel.herzen < preis;
      knopf.addEventListener("click", () => {
        if (!kaufeBeet()) { sound.fehler(); return; }
        sound.kauf();
        meldung("🌱 Neues Beet!", "Jetzt kannst du noch mehr pflanzen.");
        speichern();
        zeigeGarten();
        aktualisiereAnzeige();
      });
    } else {
      const zustand = beetZustand(beet);
      const p = pflanzeNachId(beet.pflanze);
      knopf.classList.add(zustand);
      if (i === gartenAuswahlBeet) knopf.classList.add("gewaehlt");
      const info = zustand === "leer" ? "Pflanzen 🌰"
        : zustand === "reif" ? "Ernten! 🧺"
        : zustand === "durstig" ? `💧 Durst! ${beet.gegossen}/${p.tage}`
        : `✓ ${beet.gegossen}/${p.tage}`;
      knopf.append(span("bild", beetBild(beet)), span("name", p ? p.name : ""), span("info", info));
      knopf.addEventListener("click", () => tippeBeet(i));
    }
    beete.append(knopf);
  });

  zeigeSamenAuswahl();
  zeigeGartenKnopf();
}

function zeigeSamenAuswahl() {
  const bereich = $("gartenSamenwahl");
  bereich.hidden = gartenAuswahlBeet === null;
  if (bereich.hidden) return;
  const liste = $("gartenSamenListe");
  liste.textContent = "";
  for (const p of PFLANZEN.filter(x => x.art !== "zauber")) {
    const k = document.createElement("button");
    k.type = "button";
    k.className = "samen";
    k.append(span("bild", p.icon), span("name", p.name), span("info", `${p.tage} Tage${p.art === "obst" ? " · 🍖" : ""}`));
    k.addEventListener("click", () => pflanzeHier(p.id));
    liste.append(k);
  }
  const zauber = document.createElement("button");
  zauber.type = "button";
  zauber.className = "samen zauber";
  zauber.disabled = gartenStand().zaubersamen <= 0;
  zauber.append(span("bild", "✨"), span("name", "Zaubersamen"), span("info", `${gartenStand().zaubersamen} übrig · Überraschung!`));
  zauber.addEventListener("click", () => pflanzeHier("zauber"));
  liste.append(zauber);
}

function pflanzeHier(id) {
  const i = gartenAuswahlBeet;
  const ok = id === "zauber" ? pflanzeZaubersamen(i) : pflanze(i, id);
  if (!ok) { sound.fehler(); return; }
  gartenAuswahlBeet = null;
  sound.kauf();
  // gleich zum ersten Mal gießen
  giesse(i);
  const p = pflanzeNachId(gartenStand().beete[i].pflanze);
  meldung(`🌰 ${p.art === "zauber" ? "Ein Zaubersamen!" : p.name + " gepflanzt!"}`,
    p.art === "zauber" ? "Was daraus wohl wächst? Gieß ihn jeden Tag!" : `Gieß jeden Tag – nach ${p.tage} Tagen kannst du ernten.`);
  speichern();
  zeigeGarten();
}

function tippeBeet(i) {
  const beet = gartenStand().beete[i];
  const zustand = beetZustand(beet);
  if (zustand === "leer") {
    gartenAuswahlBeet = gartenAuswahlBeet === i ? null : i;
    sound.klick();
    zeigeGarten();
    return;
  }
  if (zustand === "durstig") {
    giesse(i);
    sound.klick();
    spieleTon(1200, 0.12, "sine", 0.08, 1500);   // Plätschern
    speichern();
    zeigeGarten();
    return;
  }
  if (zustand === "reif") { ernteHier(i); return; }
  sound.klick();
  meldung("💧 Schon gegossen!", "Diese Pflanze hat heute genug getrunken. Morgen wieder!");
}

function ernteHier(i) {
  const e = ernte(i);
  if (!e) return;
  sound.erfolg();
  const karte = $("gartenOverlay").querySelector(".gartenKarte");
  konfetti(karte);
  const teile = [`+${format(e.herzen)} ${herz()}`];
  if (e.satt) teile.push("🍖 Deine Tiere sind satt");
  if (e.zaubersamen) teile.push("✨ +1 Zaubersamen!");
  if (e.sticker) teile.push(`📒 ${e.sticker.sticker.emoji} ${e.sticker.sticker.name}`);
  meldung(`🧺 ${e.pflanze.icon} ${e.pflanze.name} geerntet!`, teile.join(" · "));
  if (e.teil) setTimeout(() => meldung("🏠 Etwas Neues fürs Zimmer!", `${e.teil.icon} ${e.teil.name} – stell es in dein Zimmer!`), 600);
  if (e.sticker && (e.sticker.neu || e.sticker.seiteFertig)) albumSymbolFeiern();
  sag("ernte", { wichtig: true });
  zeigeGarten();
  zeigeHaustier();
  pruefeErfolgeUndStatistik();
  aktualisiereAnzeige();
}

// 💧 oder 🧺 am Knopf
function zeigeGartenKnopf() {
  const { reif, durstig } = gartenAufgaben();
  const badge = $("gartenBadge");
  badge.hidden = !reif && !durstig;
  setzeText(badge, reif ? "🧺" : "💧");
}

function richteGartenEin() {
  $("gartenBtn").addEventListener("click", () => {
    sound.klick();
    gartenAuswahlBeet = null;
    zeigeGarten();
    $("gartenOverlay").hidden = false;
  });
  $("gartenZu").addEventListener("click", () => { $("gartenOverlay").hidden = true; sound.klick(); });
  $("gartenGiessen").addEventListener("click", () => {
    const n = giesse();
    if (!n) return;
    sound.klick();
    spieleTon(1200, 0.15, "sine", 0.08, 1500);
    sag("giessen", { wichtig: true });
    speichern();
    zeigeGarten();
  });
  $("gartenAbbrechen").addEventListener("click", () => { gartenAuswahlBeet = null; sound.klick(); zeigeGarten(); });
  zeigeGartenKnopf();
}
