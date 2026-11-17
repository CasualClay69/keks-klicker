"use strict";
// =====================================================
//  ANZEIGE – erzeugt und aktualisiert das HTML.
//  Liest den Spielstand, verändert ihn aber nie.
// =====================================================

const $ = id => document.getElementById(id);

// Häufig benutzte Elemente einmal suchen statt bei jedem Update
const ui = {
  spielfeld:      $("spielfeld"),
  kekse:          $("kekse"),
  kps:            $("kps"),
  bonus:          $("bonus"),
  keks:           $("keks"),
  goldKeks:       $("goldKeks"),
  tonBtn:         $("tonBtn"),
  upgradeBereich: $("upgradeBereich"),
  erfolgInfo:     $("erfolgInfo"),
  meldungen:      $("meldungen"),
  kaufModusBtns:  document.querySelectorAll("#kaufModus button"),
};

// Zu jedem Datenobjekt (Gebäude, Upgrade, Erfolg …) merken wir uns seine HTML-Teile
const elemente = new Map();

// Text nur ändern, wenn er anders ist (spart dem Browser Arbeit)
function setzeText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function span(klasse, text = "") {
  const el = document.createElement("span");
  el.className = klasse;
  el.textContent = text;
  return el;
}

// ----- Aufbau (einmal beim Start) -----

// Erzeugt einen Shop-Eintrag als <button> – so ist er auch per Tastatur bedienbar
function erstelleItem(container, item, beimKlick, { klasse = "", medaille = "", beschr = item.beschr || "" } = {}) {
  const teile = {
    wurzel: document.createElement("button"),
    icon:   span("icon", item.icon),
    name:   span("name", item.name),
    betrag: span("betrag"),
    menge:  span("menge"),
    beschr: span("beschr", beschr),
    anzahl: span("anzahl"),
  };
  if (medaille) teile.icon.append(span("medaille", medaille));

  const preis = span("preis");
  preis.append(teile.betrag, teile.menge);
  const info = span("info");
  info.append(teile.name, preis, teile.beschr);

  teile.wurzel.type = "button";
  teile.wurzel.className = ("item " + klasse).trim();
  teile.wurzel.append(teile.icon, info, teile.anzahl);
  teile.wurzel.addEventListener("click", () => beimKlick(item));

  container.append(teile.wurzel);
  elemente.set(item, teile);
}

function erstelleErfolg(container, erfolg) {
  const el = document.createElement("div");
  el.className = "erfolg gesperrt";
  el.title = `${erfolg.name} – ${erfolg.beschr}`;
  el.append(erfolg.icon, Object.assign(document.createElement("small"), { textContent: erfolg.name }));
  container.append(el);
  elemente.set(erfolg, { wurzel: el });
}

// Statistik-Tabelle: Zeilen einmal anlegen, später nur Werte aktualisieren
const STATISTIK_ZEILEN = [
  ["Kekse aktuell",          () => format(spiel.kekse)],
  ["Insgesamt gebacken",     () => format(spiel.gesamt)],
  ["Durch Klicks gebacken",  () => format(spiel.klickKekse)],
  ["Klicks",                 () => spiel.klicks.toLocaleString("de-DE")],
  ["Kekse pro Klick",        () => format(keksProKlick())],
  ["Kekse pro Sekunde",      () => formatKomma(keksProSekunde())],
  ["Gebäude",                () => String(anzahlGebaeude())],
  ["Gebäude-Upgrades",       () => `${spiel.upgrades.length} / ${UPGRADES.length}`],
  ["Goldene Kekse gefangen", () => String(spiel.goldKlicks)],
  ["Erfolge",                () => `${spiel.erfolge.length} / ${ERFOLGE.length}`],
  ["Spielzeit",              () => formatZeit(spiel.spielzeit)],
];
const statistikZellen = [];

function erstelleStatistik() {
  const tabelle = $("statistik");
  for (const [beschriftung] of STATISTIK_ZEILEN) {
    const zeile = tabelle.insertRow();
    zeile.insertCell().textContent = beschriftung;
    statistikZellen.push(zeile.insertCell());
  }
}

// aktionen = { kaufeItem, kaufeUpgrade } – was beim Klick passieren soll
function baueOberflaeche(aktionen) {
  for (const k of KLICK_ITEMS) {
    erstelleItem($("klickListe"), k, aktionen.kaufeItem, { beschr: `+${format(k.proKlick)} pro Klick` });
  }
  for (const g of GEBAEUDE) {
    erstelleItem($("gebaeudeListe"), g, aktionen.kaufeItem);
  }
  for (const u of UPGRADES) {
    erstelleItem($("upgradeListe"), u, aktionen.kaufeUpgrade, { klasse: "upgrade", medaille: u.medaille });
    elemente.get(u).betrag.textContent = "🍪 " + format(u.preis);
    elemente.get(u).wurzel.hidden = true;
  }
  for (const e of ERFOLGE) {
    erstelleErfolg($("erfolgRaster"), e);
  }
  erstelleStatistik();
}

// ----- Aktualisieren -----

function zeigeKopf() {
  setzeText(ui.kekse, format(spiel.kekse) + " Kekse");
  setzeText(ui.kps, `${formatKomma(keksProSekunde())} pro Sekunde · ${format(keksProKlick())} pro Klick`);
  document.title = format(spiel.kekse) + " Kekse – Keks-Klicker";

  const rest = bonusRestSekunden();
  const b = aktuellerBonus();
  setzeText(ui.bonus, rest > 0 ? `${b.name}: ${b.text} – noch ${rest}s` : "");
}

function zeigeKlickItems() {
  for (const k of KLICK_ITEMS) {
    const teile = elemente.get(k);
    const kosten = preis(k);
    setzeText(teile.betrag, "🍪 " + format(kosten));
    setzeText(teile.anzahl, String(anzahl(k) || ""));
    teile.wurzel.classList.toggle("zuteuer", spiel.kekse < kosten);
  }
}

function zeigeKaufModus() {
  for (const btn of ui.kaufModusBtns) {
    btn.classList.toggle("aktiv", btn.dataset.modus === spiel.kaufModus);
  }
}

function zeigeGebaeude() {
  for (const g of GEBAEUDE) {
    const teile = elemente.get(g);
    const n = anzahl(g);
    const menge = kaufMenge(g);

    setzeText(teile.anzahl, String(n || ""));

    // Produktion pro Stück und insgesamt
    let beschr = `+${formatKomma(kpsProStueck(g))} Kekse/Sek. je Stück`;
    if (n > 0) beschr += ` · gesamt ${formatKomma(n * kpsProStueck(g))}`;
    setzeText(teile.beschr, beschr);

    // Preis für die gewählte Menge
    if (menge === 0) {
      setzeText(teile.betrag, "💎 Alle Upgrade-Stufen erreicht");
      setzeText(teile.menge, "");
      teile.wurzel.classList.add("zuteuer");
      continue;
    }
    const kosten = preis(g, menge);
    let mengeText = menge > 1 ? `für ${menge} Stück` : "";
    if (spiel.kaufModus === "next") mengeText = `${menge}× bis ${naechsteStufe(g).medaille}`;

    setzeText(teile.betrag, "🍪 " + format(kosten));
    setzeText(teile.menge, mengeText);
    teile.wurzel.classList.toggle("zuteuer", spiel.kekse < kosten);
  }
}

function zeigeUpgrades() {
  let sichtbar = 0;
  for (const u of UPGRADES) {
    const el = elemente.get(u).wurzel;
    const zeigen = upgradeVerfuegbar(u);

    // Neu aufgetauchte Upgrades kurz aufleuchten lassen
    if (zeigen && el.hidden) {
      el.classList.remove("neu");
      void el.offsetWidth;   // Trick: zwingt den Browser, die Animation neu zu starten
      el.classList.add("neu");
    }
    el.hidden = !zeigen;
    el.classList.toggle("zuteuer", spiel.kekse < u.preis);
    if (zeigen) sichtbar++;
  }
  ui.upgradeBereich.hidden = sichtbar === 0;
}

// Wird 10× pro Sekunde aufgerufen
function aktualisiereAnzeige() {
  zeigeKopf();
  zeigeKlickItems();
  zeigeKaufModus();
  zeigeGebaeude();
  zeigeUpgrades();
}

// Wird 1× pro Sekunde aufgerufen
function zeigeErfolge() {
  for (const e of ERFOLGE) {
    elemente.get(e).wurzel.classList.toggle("gesperrt", !spiel.erfolge.includes(e.id));
  }
  const n = spiel.erfolge.length;
  setzeText(ui.erfolgInfo,
    `${n} von ${ERFOLGE.length} freigeschaltet · Bonus: +${Math.round(n * KONFIG.erfolgBonus * 100)} % Produktion`);
}

function zeigeStatistik() {
  STATISTIK_ZEILEN.forEach(([, wert], i) => setzeText(statistikZellen[i], wert()));
}

function zeigeTonStatus() {
  ui.tonBtn.textContent = spiel.tonAn ? "🔊" : "🔇";
}

function zeigeAlles() {
  zeigeTonStatus();
  aktualisiereAnzeige();
  zeigeErfolge();
  zeigeStatistik();
}

// ----- Tabs -----

function wechsleTab(aktiverBtn) {
  for (const btn of document.querySelectorAll("#tabs button")) {
    const aktiv = btn === aktiverBtn;
    btn.setAttribute("aria-selected", String(aktiv));
    $(btn.dataset.seite).hidden = !aktiv;
  }
}

// ----- Effekte -----

// Mausposition eines Klicks – bei Tastatur (Enter/Leertaste) die Mitte des Elements
function klickPosition(ereignis, element) {
  if (ereignis.detail > 0) return { x: ereignis.clientX, y: ereignis.clientY };
  const r = element.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Schwebender Text, z.B. "+5" beim Klicken
function zeigeSchwebeText({ x, y }, text, gross = false) {
  const el = document.createElement("div");
  el.className = "schwebeText" + (gross ? " gross" : "");
  el.textContent = text;
  const feld = ui.spielfeld.getBoundingClientRect();
  el.style.left = (x - feld.left - 15) + "px";
  el.style.top  = (y - feld.top - 20) + "px";
  ui.spielfeld.append(el);
  el.addEventListener("animationend", () => el.remove());
}

// Benachrichtigung, die nach 4 Sekunden verschwindet
function meldung(titel, text) {
  const el = document.createElement("div");
  el.className = "meldung";
  el.append(Object.assign(document.createElement("b"), { textContent: titel }), text);
  ui.meldungen.append(el);
  setTimeout(() => el.remove(), 4000);
}

function zeigeGoldKeks() {
  const groesse = ui.goldKeks.offsetWidth || 75;
  const maxX = ui.spielfeld.clientWidth - groesse - 10;
  const maxY = ui.spielfeld.clientHeight - groesse - 10;
  ui.goldKeks.style.left = zufallZwischen(10, maxX) + "px";
  ui.goldKeks.style.top  = zufallZwischen(10, maxY) + "px";
  ui.goldKeks.hidden = false;
}

function versteckeGoldKeks() {
  ui.goldKeks.hidden = true;
}
