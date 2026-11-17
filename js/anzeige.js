"use strict";
// =====================================================
//  ANZEIGE – erzeugt und aktualisiert das HTML.
//  Liest den Spielstand, verändert ihn aber nie.
// =====================================================

const $ = id => document.getElementById(id);

// Häufig benutzte Elemente einmal suchen statt bei jedem Update
const ui = {
  spielfeld:      $("spielfeld"),
  herzen:         $("herzen"),
  hps:            $("hps"),
  bonus:          $("bonus"),
  marie:          $("marie"),
  hut:            $("hut"),
  skinBereich:    $("skinBereich"),
  stern:          $("stern"),
  tonBtn:         $("tonBtn"),
  musikBtn:       $("musikBtn"),
  installBtn:     $("installBtn"),
  seasonBtn:      $("seasonBtn"),
  seasonBtnIcon:  $("seasonBtnIcon"),
  seasonBtnStufe: $("seasonBtnStufe"),
  upgradeBereich: $("upgradeBereich"),
  shopBadge:      $("shopBadge"),
  sheetTitel:     $("sheetTitel"),
  tabBtns:        document.querySelectorAll("#tabs button"),
  untenBtns:      document.querySelectorAll("#untenNav button"),
  erfolgInfo:     $("erfolgInfo"),
  meldungen:      $("meldungen"),
  kaufModusBtns:  document.querySelectorAll("#kaufModus button"),
};

// Währungssymbol – kann vom HUD-Skin geändert werden (z.B. 🧡 beim Herbstlaub)
function herz() {
  return aktiverSkin("hud").symbole.herz || "💖";
}

// Zu jedem Datenobjekt (Herzschenker, Upgrade, Erfolg …) merken wir uns seine HTML-Teile
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
  ["Herzen aktuell",          () => format(spiel.herzen)],
  ["Insgesamt gesammelt",     () => format(spiel.gesamt)],
  ["Durch Klicks gesammelt",  () => format(spiel.klickHerzen)],
  ["Klicks auf Marie",        () => spiel.klicks.toLocaleString("de-DE")],
  ["Meiste Finger gleichzeitig", () => String(spiel.maxFinger)],
  ["Herzen pro Klick",        () => format(herzenProKlick())],
  ["Herzen pro Sekunde",      () => formatKomma(herzenProSekunde())],
  ["Herzschenker",            () => String(anzahlGebaeude())],
  ["Upgrades",                () => `${spiel.upgrades.length} / ${UPGRADES.length}`],
  ["Sternschnuppen gefangen", () => String(spiel.sternKlicks)],
  ["Erfolge",                 () => `${spiel.erfolge.length} / ${ERFOLGE.length}`],
  ["Spielzeit",               () => formatZeit(spiel.spielzeit)],
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
    erstelleItem($("klickListe"), k, aktionen.kaufeItem);
  }
  for (const g of GEBAEUDE) {
    erstelleItem($("gebaeudeListe"), g, aktionen.kaufeItem);
  }
  for (const u of UPGRADES) {
    erstelleItem($("upgradeListe"), u, aktionen.kaufeUpgrade, { klasse: "upgrade", medaille: u.medaille });
    elemente.get(u).wurzel.hidden = true;
  }
  for (const e of ERFOLGE) {
    erstelleErfolg($("erfolgRaster"), e);
  }
  erstelleStatistik();
}

// ----- Aktualisieren -----

function zeigeKopf() {
  setzeText(ui.herzen, `${format(spiel.herzen)} ${herz()}`);
  setzeText(ui.hps, `${formatKomma(herzenProSekunde())} pro Sekunde · ${format(herzenProKlick())} pro Klick`);
  document.title = `${format(spiel.herzen)} Herzen – Marie Clicker`;

  const rest = bonusRestSekunden();
  const b = aktuellerBonus();
  setzeText(ui.bonus, rest > 0 ? `${b.name}: ${b.text} – noch ${rest}s` : "");
}

function zeigeKlickItems() {
  for (const k of KLICK_ITEMS) {
    const teile = elemente.get(k);
    const kosten = preis(k);
    setzeText(teile.betrag, `${herz()} ${format(kosten)}`);
    setzeText(teile.beschr, `+${format(k.proKlick)} ${herz()} pro Klick`);
    setzeText(teile.anzahl, String(anzahl(k) || ""));
    teile.wurzel.classList.toggle("zuteuer", spiel.herzen < kosten);
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

    // Herzen pro Stück und insgesamt
    let beschr = `+${formatKomma(hpsProStueck(g))} ${herz()}/Sek. je Stück`;
    if (n > 0) beschr += ` · gesamt ${formatKomma(n * hpsProStueck(g))}`;
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

    setzeText(teile.betrag, `${herz()} ${format(kosten)}`);
    setzeText(teile.menge, mengeText);
    teile.wurzel.classList.toggle("zuteuer", spiel.herzen < kosten);
  }
}

function zeigeUpgrades() {
  let sichtbar = 0;
  let leistbar = 0;
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
    el.classList.toggle("zuteuer", spiel.herzen < u.preis);
    if (zeigen) setzeText(elemente.get(u).betrag, `${herz()} ${format(u.preis)}`);
    if (zeigen) sichtbar++;
    if (zeigen && spiel.herzen >= u.preis) leistbar++;
  }
  ui.upgradeBereich.hidden = sichtbar === 0;

  // Handy: Zahl am Shop-Symbol
  ui.shopBadge.hidden = leistbar === 0;
  setzeText(ui.shopBadge, String(leistbar));
}

// Wird 10× pro Sekunde aufgerufen
function aktualisiereAnzeige() {
  zeigeKopf();
  zeigeKlickItems();
  zeigeKaufModus();
  zeigeGebaeude();
  zeigeUpgrades();
  zeigeSeason();
}

// Wird 1× pro Sekunde aufgerufen
function zeigeErfolge() {
  for (const e of ERFOLGE) {
    elemente.get(e).wurzel.classList.toggle("gesperrt", !spiel.erfolge.includes(e.id));
  }
  const n = spiel.erfolge.length;
  setzeText(ui.erfolgInfo,
    `${n} von ${ERFOLGE.length} freigeschaltet · Bonus: +${Math.round(n * KONFIG.erfolgBonus * 100)} % Herzen`);
}

function zeigeStatistik() {
  STATISTIK_ZEILEN.forEach(([, wert], i) => setzeText(statistikZellen[i], wert()));
}

function zeigeTonStatus() {
  ui.tonBtn.textContent = spiel.tonAn ? "🔊" : "🔇";
  ui.musikBtn.classList.toggle("aus", !spiel.musikAn);
}

function zeigeAlles() {
  zeigeTonStatus();
  aktualisiereAnzeige();
  zeigeErfolge();
  zeigeStatistik();
}

// ----- Skins -----

// Baut die Skin-Seite: pro Kategorie eine Überschrift und ein Raster mit Karten
function baueSkinSeite(beimWaehlen) {
  for (const kategorie of SKIN_KATEGORIEN) {
    const ueberschrift = document.createElement("h2");
    ueberschrift.textContent = `${kategorie.icon} ${kategorie.name}`;
    const raster = document.createElement("div");
    raster.className = "skinRaster";

    for (const skin of skinsDerKategorie(kategorie.id)) {
      const karte = document.createElement("button");
      karte.type = "button";
      karte.className = "skinKarte";
      const status = span("skinStatus");
      karte.append(span("skinIcon", skin.icon), span("skinName", skin.name), status);
      karte.addEventListener("click", () => beimWaehlen(skin));
      raster.append(karte);
      elemente.set(skin, { wurzel: karte, status });
    }

    // Solange es nur den normalen Skin gibt: Vorschau auf kommende Season-Pässe
    if (skinsDerKategorie(kategorie.id).every(s => s.standard)) {
      const teaser = document.createElement("div");
      teaser.className = "skinKarte teaser";
      teaser.append(span("skinIcon", "🔒"), span("skinName", "Bald mehr!"), span("skinStatus", "mit dem Season-Pass"));
      raster.append(teaser);
    }

    ui.skinBereich.append(ueberschrift, raster);
  }
}

// Markiert aktive und gesperrte Skins
function zeigeSkins() {
  for (const skin of SKINS) {
    const { wurzel, status } = elemente.get(skin);
    const aktiv = aktiverSkin(skin.kategorie) === skin;
    const frei = skinFreigeschaltet(skin);
    wurzel.classList.toggle("aktiv", aktiv);
    wurzel.classList.toggle("gesperrt", !frei);
    wurzel.setAttribute("aria-pressed", String(aktiv));
    const stufe = skinStufe(skin);
    const gesperrtText = stufe ? `🔒 Season-Stufe ${stufe}` : `🔒 ${seasonName(skin.season)}`;
    setzeText(status, aktiv ? "✓ Ausgewählt" : frei ? "Auswählen" : gesperrtText);
  }
}

// Setzt die gewählten Skins im Spiel um (Musik startet main.js neu)
let hudVariablen = [];    // welche Farben der aktuelle HUD-Skin gesetzt hat
let logoVariablen = [];   // … und welche der Logo-Skin

// Setzt CSS-Variablen eines Skins und entfernt vorher die des alten. Gibt die neuen Namen zurück.
function tauscheVariablen(alteNamen, farben) {
  const wurzel = document.documentElement.style;
  for (const name of alteNamen) wurzel.removeProperty(name);
  for (const [name, wert] of Object.entries(farben)) wurzel.setProperty(name, wert);
  return Object.keys(farben);
}

function wendeSkinsAn() {
  // Hintergrund: per Attribut, das Aussehen steht in style.css
  document.body.dataset.hintergrund = aktiverSkin("hintergrund").wert;

  // Hut: SVG-Code auf Maries Kopf
  ui.hut.innerHTML = aktiverSkin("hut").svg;

  // HUD: Farben als CSS-Variablen. Erst die alten entfernen, dann die neuen setzen.
  hudVariablen = tauscheVariablen(hudVariablen, aktiverSkin("hud").farben);

  // Logo: eigene Farben (--logo-skin-* haben Vorrang vor den HUD-Logofarben) und Zeichen
  const logo = aktiverSkin("logo");
  logoVariablen = tauscheVariablen(logoVariablen, logo.farben);
  setzeText(document.querySelector(".logo-krone"), logo.krone);
  setzeText(document.querySelector(".logo-deko"), logo.deko);
  for (const stern of document.querySelectorAll(".funkeln")) setzeText(stern, logo.funkeln);

  // HUD: Symbole (Elemente mit data-symbol). Das ursprüngliche Symbol merken wir uns beim ersten Mal.
  const symbole = aktiverSkin("hud").symbole;
  for (const el of document.querySelectorAll("[data-symbol]")) {
    if (el.dataset.standard === undefined) el.dataset.standard = el.textContent;
    setzeText(el, symbole[el.dataset.symbol] || el.dataset.standard);
  }
  zeigeSeite(aktuelleSeite);   // Menü-Titel mit neuem Symbol
}

// ----- Season-Pass -----

let seasonListe = { passId: null, stufe: -1, herz: "" };   // was die Stufen-Liste gerade zeigt
let seasonHerzZeilen = [];   // [{ n, text }] – Zeilen mit Herz-Belohnung, deren Wert sich ändert

// Stufen-Liste neu aufbauen (nur wenn sich Stufe oder Herz-Symbol geändert haben)
function baueSeasonListe(pass, stand) {
  const liste = $("seasonStufen");
  liste.textContent = "";
  seasonHerzZeilen = [];
  for (let n = 1; n <= pass.stufen; n++) {
    const skinId = pass.skinBelohnungen[n];
    const skin = skinId && SKINS.find(s => s.id === skinId);
    const li = document.createElement("li");
    li.className = "seasonZeile";
    if (skin) li.classList.add("skin");
    if (n <= stand.stufe) li.classList.add("erreicht");
    if (n === stand.stufe + 1) li.classList.add("aktuell");

    const text = span("text", skin ? `${SKIN_KATEGORIEN.find(k => k.id === skin.kategorie).name}: ${skin.name}` : "");
    li.append(
      span("nr", String(n)),
      span("icon", skin ? skin.icon : herz()),
      text,
      span("status", n <= stand.stufe ? "✓" : n === stand.stufe + 1 ? "▶" : "🔒"),
    );
    if (!skin) seasonHerzZeilen.push({ n, text });
    liste.append(li);
  }
  seasonListe = { passId: pass.id, stufe: stand.stufe, herz: herz() };
  zeigeSeasonHerzen(stand);
}

// Herz-Werte in der Liste: erreichte Stufen = was es gab, kommende = was es jetzt ungefähr gäbe
function zeigeSeasonHerzen(stand) {
  const hps = basisHps();
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  const erhalten = stand.herzen || {};
  for (const { n, text } of seasonHerzZeilen) {
    if (n <= stand.stufe) {
      setzeText(text, erhalten[n] ? `${format(erhalten[n])} ${herz()}` : `Herzen ${herz()}`);
    } else {
      setzeText(text, `≈ ${format(seasonHerzen(n, hps, proKlick))} ${herz()}`);
    }
  }
}

function formatRestzeit(ms) {
  const tage = Math.floor(ms / 86400000);
  if (tage >= 2) return `noch ${tage} Tage`;
  const std = Math.floor(ms / 3600000);
  const min = Math.floor((ms % 3600000) / 60000);
  return std > 0 ? `noch ${std} Std. ${min} Min.` : `noch ${min} Min.`;
}

// Wird 10× pro Sekunde aufgerufen: Symbol mit Ring + Season-Seite
function zeigeSeason() {
  const pass = aktiverSeasonPass();
  ui.seasonBtn.hidden = !pass;
  if (!pass) {
    setzeText($("seasonName"), "Gerade läuft keine Season.");
    return;
  }
  const stand = seasonStand(pass);
  const fertig = stand.stufe >= pass.stufen;
  const noetig = fertig ? 1 : klicksFuerStufe(pass, stand.stufe + 1);
  const anteil = fertig ? 1 : stand.xp / noetig;

  // Symbol im Spielfeld
  setzeText(ui.seasonBtnIcon, pass.icon);
  setzeText(ui.seasonBtnStufe, String(stand.stufe));
  ui.seasonBtn.style.setProperty("--fortschritt", anteil.toFixed(3));

  // Season-Seite
  setzeText($("seasonName"), `${pass.icon} ${pass.name}`);
  setzeText($("seasonZeit"), `⏳ ${formatRestzeit(seasonRestMs(pass))} · bis ${seasonLetzterTag(pass)}`);
  setzeText($("seasonStufe"), String(stand.stufe));
  setzeText($("seasonMax"), String(pass.stufen));
  $("seasonBalkenFuellung").style.width = (anteil * 100).toFixed(1) + "%";
  setzeText($("seasonHinweis"), fertig
    ? "🎉 Alle Stufen geschafft – du bist großartig!"
    : `Noch ${format(noetig - stand.xp)} Klicks bis Stufe ${stand.stufe + 1}`);

  if (seasonListe.passId !== pass.id) {
    // Neue Season: ihre Farben für die Season-Seite setzen
    for (const [name, wert] of Object.entries(pass.design || {})) $("seiteSeason").style.setProperty(name, wert);
  }
  if (seasonListe.passId !== pass.id || seasonListe.stufe !== stand.stufe || seasonListe.herz !== herz()) {
    baueSeasonListe(pass, stand);
  } else if (!$("seiteSeason").hidden) {
    zeigeSeasonHerzen(stand);   // Werte wachsen mit der Produktion mit
  }
}

// Kurzes Aufleuchten des Season-Symbols bei einer neuen Stufe
function seasonSymbolFeiern() {
  ui.seasonBtn.classList.remove("feiern");
  void ui.seasonBtn.offsetWidth;
  ui.seasonBtn.classList.add("feiern");
}

// Season-Seite: zur aktuellen Stufe scrollen
function scrolleZuAktuellerStufe() {
  const aktuell = document.querySelector(".seasonZeile.aktuell") || document.querySelector(".seasonZeile:last-child");
  if (!aktuell) return;
  const leiste = $("seitenleiste");
  const kopf = document.querySelector(".seasonKopf");

  // Wie hoch ist der oben klebende Bereich? Desktop: Tabs, Handy: Menü-Kopf
  const stickyOben = $("tabs").offsetHeight || $("sheetKopf").offsetHeight;
  leiste.style.setProperty("--sticky-oben", stickyOben + "px");

  // Nur die Seitenleiste scrollen (scrollIntoView würde evtl. die ganze Seite verschieben).
  // Ziel: aktuelle Stufe direkt unter dem (klebenden) Season-Kopf, eine erledigte Stufe davor sichtbar.
  const zeileOben = aktuell.getBoundingClientRect().top;
  const kopfUnten = leiste.getBoundingClientRect().top + stickyOben + kopf.offsetHeight;
  leiste.scrollTop += zeileOben - kopfUnten - aktuell.offsetHeight - 18;
}

// ----- Seiten (Shop / Erfolge / Statistik) und Handy-Menü -----

let aktuelleSeite = "seiteShop";
let menueOffen = false;

// Zeigt eine Seite an – am Desktop über die Tabs, am Handy im Menü von unten.
// Die Season-Seite hat keinen Tab, sondern das eigene Symbol im Spielfeld.
function zeigeSeite(seiteId) {
  aktuelleSeite = seiteId;
  for (const seite of document.querySelectorAll(".seite")) {
    seite.hidden = seite.id !== seiteId;
  }
  let titel = "";
  for (const btn of ui.tabBtns) {
    const aktiv = btn.dataset.seite === seiteId;
    btn.setAttribute("aria-selected", String(aktiv));
    if (aktiv) titel = btn.textContent;
  }
  if (seiteId === "seiteSeason") {
    const pass = aktiverSeasonPass();
    titel = `${pass ? pass.icon : "🎟️"} Season-Pass`;
  }
  setzeText(ui.sheetTitel, titel);
  zeigeUntenNav();
}

// Handy: Menü von unten öffnen oder schließen
function setzeMenue(offen) {
  menueOffen = offen;
  document.body.classList.toggle("menue-offen", offen);
  zeigeUntenNav();
}

// Welches Symbol unten ist aktiv? Menü zu = "Marie", sonst die offene Seite
function zeigeUntenNav() {
  const aktiveSeite = menueOffen ? aktuelleSeite : "";
  for (const btn of ui.untenBtns) {
    btn.classList.toggle("aktiv", btn.dataset.seite === aktiveSeite);
  }
}

// ----- Effekte -----

// Marie freut sich kurz (Augen ^^, Mund offen)
let freudeTimer = null;
function marieFreutSich() {
  // Kleiner Hüpfer – Animation bei jedem Tipp neu starten
  ui.marie.classList.remove("hopser");
  void ui.marie.offsetWidth;
  ui.marie.classList.add("hopser");

  ui.marie.classList.add("freut-sich");
  clearTimeout(freudeTimer);
  freudeTimer = setTimeout(() => ui.marie.classList.remove("freut-sich"), 350);
}

// Mausposition eines Klicks – bei Tastatur (Enter/Leertaste) die Mitte des Elements
function klickPosition(ereignis, element) {
  if (ereignis.detail > 0) return { x: ereignis.clientX, y: ereignis.clientY };
  const r = element.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Schwebender Text, z.B. "+1 💖" beim Klicken
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
  // Höchstens 3 gleichzeitig – sonst verdecken sie auf dem Handy den halben Bildschirm
  while (ui.meldungen.children.length > 3) ui.meldungen.firstElementChild.remove();
  setTimeout(() => el.remove(), 4000);
}

function zeigeStern() {
  const groesse = 70;
  const untenFrei = parseFloat(getComputedStyle(ui.spielfeld).paddingBottom) || 0;   // nicht unter dem Handy-Menü
  const maxX = ui.spielfeld.clientWidth - groesse - 10;
  const maxY = ui.spielfeld.clientHeight - untenFrei - groesse;
  ui.stern.style.left = zufallZwischen(10, maxX) + "px";
  ui.stern.style.top  = zufallZwischen(50, maxY) + "px";   // nicht in die obere Knopf-Zeile
  ui.stern.hidden = false;
}

function versteckeStern() {
  ui.stern.hidden = true;
}
