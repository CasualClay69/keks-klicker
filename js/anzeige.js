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
  aufgabenBtn:    $("aufgabenBtn"),
  aufgabenBadge:  $("aufgabenBadge"),
  radBtn:         $("radBtn"),
  radBadge:       $("radBadge"),
  haustier:       $("haustier"),
  marieBereich:   $("marieBereich"),
  albumBtn:       $("albumBtn"),
  albumBadge:     $("albumBadge"),
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
  // Texte mit "Marie" passt zeigeFigur() an die gewählte Figur an (data-vorlage)
  el.dataset.titelVorlage = `${erfolg.name} – ${erfolg.beschr}`;
  el.title = mitName(el.dataset.titelVorlage);
  const name = Object.assign(document.createElement("small"), { textContent: mitName(erfolg.name) });
  name.dataset.vorlage = erfolg.name;
  el.append(erfolg.icon, name);
  container.append(el);
  elemente.set(erfolg, { wurzel: el });
}

// Statistik-Tabelle: Zeilen einmal anlegen, später nur Werte aktualisieren
const STATISTIK_ZEILEN = [
  ["Herzen aktuell",          () => format(spiel.herzen)],
  ["Insgesamt gesammelt",     () => format(spiel.gesamt)],
  ["Herzen aller Zeiten",     () => format(herzenAllerZeiten())],
  ["Glitzersterne",           () => `${glitzersterne()} (+${Math.round(glitzersterne() * NEUSTART.sternBonus * 100)} %)`],
  ["Neustarts",               () => String(spiel.neustarts || 0)],
  ["Durch Klicks gesammelt",  () => format(spiel.klickHerzen)],
  ["Klicks auf Marie",        () => spiel.klicks.toLocaleString("de-DE")],
  ["Meiste Finger gleichzeitig", () => String(spiel.maxFinger)],
  ["Herzen pro Klick",        () => format(herzenProKlick())],
  ["Herzen pro Sekunde",      () => formatKomma(herzenProSekunde())],
  ["Herzschenker",            () => String(anzahlGebaeude())],
  ["Upgrades",                () => `${spiel.upgrades.length} / ${UPGRADES.length}`],
  ["Sternschnuppen gefangen", () => String(spiel.sternKlicks)],
  ["Tagesaufgaben erledigt",  () => String(spiel.aufgabenGesamt || 0)],
  ["Längste Geschenk-Serie",  () => `${(spiel.geschenk && spiel.geschenk.beste) || 0} Tage`],
  ["Glücksrad gedreht",       () => `${(spiel.gluecksrad && spiel.gluecksrad.gesamt) || 0}-mal`],
  ["Sticker gesammelt",       () => `${anzahlVerschiedeneSticker(sichtbareSticker())} / ${sichtbareSticker().length}`],
  ["Zimmer-Teile",            () => `${anzahlZimmerTeile()} / ${anzahlZimmerTeileGesamt()} (+${Math.round((zimmerFaktor() - 1) * 100)} %)`],
  ["Haustier",                () => haustier() ? `${haustier().name} (Level ${haustier().level})` : "noch keins"],
  ["Bester Herzregen",        () => `${spiel.regenBest || 0} Punkte`],
  ["Erfolge",                 () => `${spiel.erfolge.length} / ${ERFOLGE.length}`],
  ["Spielzeit",               () => formatZeit(spiel.spielzeit)],
];
const statistikZellen = [];

function erstelleStatistik() {
  const tabelle = $("statistik");
  for (const [beschriftung] of STATISTIK_ZEILEN) {
    const zeile = tabelle.insertRow();
    const zelle = zeile.insertCell();
    zelle.textContent = mitName(beschriftung);
    zelle.dataset.vorlage = beschriftung;
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
  document.title = `${format(spiel.herzen)} Herzen – ${figurName()} Clicker`;

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
  // Nur die Herzschenker zeigen, die man hat, plus die nächsten zwei – der Rest kommt nach und nach
  const sichtbarBis = hoechstesGebaeude() + 2;
  let versteckt = 0;
  GEBAEUDE.forEach((g, i) => {
    elemente.get(g).wurzel.hidden = i > sichtbarBis;
    if (i > sichtbarBis) versteckt++;
  });
  $("gebaeudeHinweis").hidden = versteckt === 0;

  for (const g of GEBAEUDE) {
    const teile = elemente.get(g);
    if (teile.wurzel.hidden) continue;
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
  zeigeAufgaben();
  ui.radBadge.hidden = !gluecksradBereit();   // "!" am Glücksrad, solange heute noch gedreht werden kann

  zeigeHaustier();
  if (!$("tierOverlay").hidden) zeigeTierPflege();
  zeigeNeustart();

  const neueSticker = (spiel.stickerNeu || []).length;   // Zahl am Album: neue, ungesehene Sticker
  ui.albumBadge.hidden = neueSticker === 0;
  setzeText(ui.albumBadge, String(neueSticker));
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
  zeigeSicherungInfo();
}

// "Zuletzt gesichert: …" – nach 7 Tagen ohne Sicherung orange als Erinnerung
function zeigeSicherungInfo() {
  const info = $("sicherungInfo");
  const zeit = letzteSicherung();
  const tage = Math.floor((Date.now() - zeit) / 86400000);
  let text;
  if (!zeit) text = "⚠️ Noch nie gesichert";
  else if (tage === 0) text = "✅ Zuletzt gesichert: heute";
  else if (tage === 1) text = "✅ Zuletzt gesichert: gestern";
  else text = `${tage >= 7 ? "⚠️" : "✅"} Zuletzt gesichert: vor ${tage} Tagen`;
  setzeText(info, text);
  info.classList.toggle("alt", !zeit || tage >= 7);
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
    if (!kategorie.ohneTeaser && skinsDerKategorie(kategorie.id).every(s => s.standard)) {
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
    const gesperrtText = skin.geschenk === "geburtstag" ? "🔒 Geburtstagsgeschenk 🎂"
      : stufe ? `🔒 Season-Stufe ${stufe}` : `🔒 ${seasonName(skin.season)}`;
    setzeText(status, aktiv ? "✓ Ausgewählt" : frei ? "Auswählen" : gesperrtText);
  }
}

// Emoji-Muster als Bild-Kachel (SVG) – hinten 70px mit kleinen, vorne 140px mit großen Emojis
function emojiKachel(emojis, kachel) {
  const [a, b] = emojis;
  const inhalt = kachel === 70
    ? `<text x="6" y="28" font-size="20">${a}</text><text x="40" y="62" font-size="15">${b}</text>`
    : `<text x="12" y="44" font-size="34">${a}</text><text x="80" y="112" font-size="28">${b}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${kachel}" height="${kachel}" viewBox="0 0 ${kachel} ${kachel}">${inhalt}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function setzeHintergrund(skin) {
  const body = document.body;
  if (!skin.bg) {
    body.dataset.hintergrund = skin.wert;
    delete body.dataset.bgRichtung;
    return;
  }
  // Kacheln nur einmal pro Skin bauen
  if (!skin.bg.bilder) skin.bg.bilder = { hinten: emojiKachel(skin.bg.hinten, 70), vorne: emojiKachel(skin.bg.vorne, 140) };
  body.dataset.hintergrund = "emoji";
  body.dataset.bgRichtung = skin.bg.richtung || "fallen";
  body.style.setProperty("--bg-farbe", skin.bg.farbe);
  body.style.setProperty("--bg-hinten", skin.bg.bilder.hinten);
  body.style.setProperty("--bg-vorne", skin.bg.bilder.vorne);
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

// Figur: Name überall einsetzen und die Zeichnung einfärben (Haare, Kleid, Augen)
function zeigeFigur() {
  const figur = aktiverSkin("figur");
  const name = figur.rufname;
  for (const el of document.querySelectorAll(".figurName")) setzeText(el, name);
  for (const el of document.querySelectorAll("[data-vorlage]")) setzeText(el, mitName(el.dataset.vorlage));
  for (const el of document.querySelectorAll("[data-titel-vorlage]")) el.title = mitName(el.dataset.titelVorlage);
  $("titel").setAttribute("aria-label", `${name} Clicker`);
  ui.marie.setAttribute("aria-label", `${name} anklicken`);
  document.body.dataset.figur = figur.id;

  // Kleiderschrank: Kleid, Frisur und Haarfarbe (Standard = so, wie die Figur gezeichnet ist)
  const a = figur.aussehen;
  const haar = aktiverSkin("haarfarbe").haar || a.haar;
  $("haarHell").setAttribute("stop-color", haar[0]);
  $("haarDunkel").setAttribute("stop-color", haar[1]);
  $("kleid").innerHTML = aktiverSkin("kleid").svg.replaceAll("{farbe}", a.kleid);
  const frisur = aktiverSkin("frisur");
  $("haarHinten").innerHTML = frisur.hinten;
  $("haarVorne").innerHTML = frisur.vorne || "";
  $("haarOben").innerHTML = frisur.oben || "";
  for (const pupille of document.querySelectorAll("#marie .pupille")) pupille.setAttribute("fill", a.augen);
}

function wendeSkinsAn() {
  zeigeFigur();

  // Hintergrund: per Attribut (Aussehen in style.css) oder als Emoji-Muster (Seasons ab 2027)
  setzeHintergrund(aktiverSkin("hintergrund"));

  // Hut: SVG-Code auf Maries Kopf (am Geburtstag der Partyhut)
  ui.hut.innerHTML = aktuellerHut().svg;

  // Geburtstag: Konfetti-Regen über dem Spielfeld
  zeigeKonfettiRegen(istGeburtstag());

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
    const skin = skinId && belohnungNachId(skinId);   // Skin oder Zimmer-Teil
    const li = document.createElement("li");
    li.className = "seasonZeile";
    if (skin) li.classList.add("skin");
    if (n <= stand.stufe) li.classList.add("erreicht");
    if (n === stand.stufe + 1) li.classList.add("aktuell");

    const text = span("text", skin ? `${belohnungsArt(skin)}: ${skin.name}` : "");
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

  // Season-Seite (das Logo wird unten nur beim Wechsel der Season gesetzt)
  setzeText($("seasonZeit"), `⏳ ${formatRestzeit(seasonRestMs(pass))} · bis ${seasonLetzterTag(pass)}`);
  setzeText($("seasonStufe"), String(stand.stufe));
  setzeText($("seasonMax"), String(pass.stufen));
  $("seasonBalkenFuellung").style.width = (anteil * 100).toFixed(1) + "%";
  setzeText($("seasonHinweis"), fertig
    ? "🎉 Alle Stufen geschafft – du bist großartig!"
    : `Noch ${format(noetig - stand.xp)} Klicks bis Stufe ${stand.stufe + 1}`);

  if (seasonListe.passId !== pass.id) {
    // Neue Season: ihre Farben und ihr Logo für die Season-Seite setzen
    for (const [name, wert] of Object.entries(pass.design || {})) $("seiteSeason").style.setProperty(name, wert);
    const titel = $("seasonName");
    titel.classList.toggle("seasonLogo", Boolean(pass.logo));
    if (pass.logo) titel.innerHTML = pass.logo;   // eigenes SVG aus skins.js – kein fremder Inhalt
    else titel.textContent = `${pass.icon} ${pass.name}`;
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

// Season-Seite öffnen: immer ganz oben, damit man zuerst das Logo sieht
function zeigeSeasonVonOben() {
  const leiste = $("seitenleiste");
  const kopf = document.querySelector(".seasonKopf");

  // Wie hoch ist der oben klebende Bereich? Desktop: Tabs, Handy: Menü-Kopf
  const stickyOben = $("tabs").offsetHeight || $("sheetKopf").offsetHeight;
  leiste.style.setProperty("--sticky-oben", stickyOben + "px");

  // Logo und Zeit scrollen mit weg – nur "Stufe x / 50" und der Balken bleiben oben kleben.
  // Dafür klebt der Kopf so weit oberhalb, wie Logo und Zeit hoch sind.
  const weg = Math.max(0, kopf.querySelector(".seasonStufeAnzeige").offsetTop - 5);
  kopf.style.setProperty("--kopf-weg", weg + "px");

  leiste.scrollTop = 0;
}

// ----- Tagesaufgaben -----

let aufgabenKarten = { tag: null, karten: [] };   // die gebauten Karten des aktuellen Tages
let aufgabenAbholAktion = () => {};                // setzt main.js: was "Abholen" tut

function setzeAufgabenAbholAktion(aktion) {
  aufgabenAbholAktion = aktion;
}

function belohnungText(istBonus) {
  const b = aufgabenBelohnung(istBonus);
  const pass = aktiverSeasonPass();
  let text = `🎁 +${format(b.herzen)} ${herz()}`;
  if (b.seasonPunkte) text += ` · +${b.seasonPunkte} ${pass.icon}`;
  return text;
}

// Karten für den Tag einmal bauen
function baueAufgabenKarten() {
  const liste = $("aufgabenListe");
  liste.textContent = "";
  const karten = [];

  const eintraege = spiel.aufgaben.liste.map((a, i) => ({ index: i, aufgabe: a }));
  eintraege.push({ index: "bonus", aufgabe: null });

  for (const { index, aufgabe } of eintraege) {
    const karte = document.createElement("div");
    karte.className = "aufgabe" + (aufgabe ? "" : " bonus");
    const fuellung = document.createElement("div");
    fuellung.className = "aufgabeFuellung";
    const balken = document.createElement("div");
    balken.className = "aufgabeBalken";
    balken.append(fuellung);

    const zahl = span("aufgabeZahl");
    const belohnung = span("aufgabeBelohnung");
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "abholen";
    knopf.addEventListener("click", () => aufgabenAbholAktion(index));
    const zeile = document.createElement("div");
    zeile.className = "aufgabeZeile";
    zeile.append(zahl, belohnung, knopf);

    karte.append(
      span("aufgabeIcon", aufgabe ? aufgabeIcon(aufgabe) : "🎁"),
      span("aufgabeText", aufgabe ? aufgabeText(aufgabe) : "Bonus: Schaffe alle 3 Aufgaben!"),
      balken,
      zeile,
    );
    liste.append(karte);
    karten.push({ index, aufgabe, karte, fuellung, zahl, belohnung, knopf });
  }
  aufgabenKarten = { tag: spiel.aufgaben.tag, karten };
}

// 10× pro Sekunde: Zahl am Symbol, und – wenn die Seite offen ist – Fortschritt der Karten
function zeigeAufgaben() {
  if (!spiel.aufgaben) return;
  const abholbar = anzahlAbholbar();
  ui.aufgabenBadge.hidden = abholbar === 0;
  setzeText(ui.aufgabenBadge, String(abholbar));

  // Neuer Tag oder Spielstand gelöscht/geladen -> Karten neu bauen
  if (aufgabenKarten.tag !== spiel.aufgaben.tag || aufgabenKarten.karten[0]?.aufgabe !== spiel.aufgaben.liste[0]) {
    baueAufgabenKarten();
  }
  if ($("seiteAufgaben").hidden) return;

  const ms = msBisMitternacht();
  setzeText($("aufgabenZeit"),
    `⏳ Neue Aufgaben in ${Math.floor(ms / 3600000)} Std. ${Math.floor((ms % 3600000) / 60000)} Min.`);

  const alleAbgeholt = spiel.aufgaben.liste.every(a => a.abgeholt);
  for (const k of aufgabenKarten.karten) {
    let anteil, zahl, fertig, abgeholt;
    if (k.aufgabe) {
      const a = k.aufgabe;
      anteil = a.fortschritt / a.ziel;
      zahl = aufgabeFortschrittText(a);
      fertig = a.erledigt;
      abgeholt = a.abgeholt;
    } else {
      const geschafft = spiel.aufgaben.liste.filter(a => a.abgeholt).length;
      anteil = geschafft / spiel.aufgaben.liste.length;
      zahl = `${geschafft} / ${spiel.aufgaben.liste.length}`;
      fertig = alleAbgeholt;
      abgeholt = spiel.aufgaben.bonusAbgeholt;
    }
    k.fuellung.style.width = (Math.min(1, anteil) * 100).toFixed(1) + "%";
    setzeText(k.zahl, zahl);
    setzeText(k.belohnung, abgeholt ? "" : belohnungText(!k.aufgabe));
    setzeText(k.knopf, abgeholt ? "✓ Abgeholt" : fertig ? "🎁 Abholen" : "Noch nicht");
    k.knopf.disabled = !fertig || abgeholt;
    k.karte.classList.toggle("fertig", fertig && !abgeholt);
    k.karte.classList.toggle("abgeholt", abgeholt);
  }
}

function aufgabenSymbolFeiern() {
  ui.aufgabenBtn.classList.remove("feiern");
  void ui.aufgabenBtn.offsetWidth;
  ui.aufgabenBtn.classList.add("feiern");
}

// ----- Tägliches Geschenk -----

// Fenster vorbereiten und zeigen (noch verpackt)
function zeigeGeschenkFenster() {
  const serie = geschenkSerieHeute();
  const tag = geschenkTag(serie);

  let serienText = "Komm jeden Tag – dann wird dein Geschenk immer größer!";
  if (serie > 1) serienText = `🔥 ${serie} Tage hintereinander!`;
  else if (geschenkSerieUnterbrochen()) serienText = "Willkommen zurück! Deine Serie startet neu.";
  setzeText($("geschenkSerie"), serienText);

  // 7 Tage: erledigte ✓, heute hervorgehoben, Tag 7 = großes Geschenk
  const tage = $("geschenkTage");
  tage.textContent = "";
  for (let t = 1; t <= GESCHENK_TAGE; t++) {
    const li = document.createElement("li");
    if (t < tag) li.classList.add("erledigt");
    if (t === tag) li.classList.add("heute");
    if (t === GESCHENK_TAGE) li.classList.add("gross");
    li.append(t < tag ? "✅" : t === GESCHENK_TAGE ? "💝" : "🎁",
      Object.assign(document.createElement("small"), { textContent: `Tag ${t}` }));
    tage.append(li);
  }

  const box = $("geschenkBox");
  box.textContent = tag === GESCHENK_TAGE ? "💝" : "🎁";
  box.classList.remove("offen");
  box.disabled = false;
  $("geschenkHinweis").hidden = false;
  $("geschenkInhalt").hidden = true;
  $("geschenkOverlay").hidden = false;
}

// Nach dem Öffnen: Belohnung zeigen + Konfetti
function zeigeGeschenkInhalt(ergebnis) {
  const box = $("geschenkBox");
  box.textContent = "🎉";
  box.classList.add("offen");
  box.disabled = true;
  $("geschenkHinweis").hidden = true;

  const pass = aktiverSeasonPass();
  let betrag = `+${format(ergebnis.herzen)} ${herz()}`;
  if (ergebnis.seasonPunkte) betrag += `\n+${ergebnis.seasonPunkte} ${pass.icon}`;
  $("geschenkBetrag").textContent = betrag;
  $("geschenkBetrag").style.whiteSpace = "pre-line";

  setzeText($("geschenkMorgen"), ergebnis.tag < GESCHENK_TAGE
    ? `Komm morgen wieder – dann ist dein Geschenk noch größer! 🎁`
    : `Du bekommst jeden Tag das große Geschenk, solange du jeden Tag kommst! 💝`);
  $("geschenkInhalt").hidden = false;
  konfetti($("geschenkOverlay").querySelector(".geschenkKarte"));
}

// Konfetti fliegt aus der Mitte in alle Richtungen
function konfetti(behaelter) {
  const teile = ["💖", "✨", "⭐", "🎀", "💗", "🌟"];
  for (let i = 0; i < 18; i++) {
    const el = span("konfetti", teile[i % teile.length]);
    behaelter.append(el);
    const winkel = Math.random() * Math.PI * 2;
    const weite = 90 + Math.random() * 110;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transform = `translate(${Math.cos(winkel) * weite}px, ${Math.sin(winkel) * weite - 40}px) rotate(${Math.random() * 360}deg)`;
      el.style.opacity = "0";
    }));
    setTimeout(() => el.remove(), 1300);
  }
}

function versteckeGeschenkFenster() {
  $("geschenkOverlay").hidden = true;
}

// ----- Glücksrad -----

// Das Rad als SVG zeichnen: 8 Tortenstücke mit Symbol und Beschriftung
function baueGluecksrad() {
  const n = GLUECKSRAD_FELDER.length;
  const mitte = 150, radius = 146;
  const punkt = winkel => {   // Winkel in Grad, 0 = oben, im Uhrzeigersinn
    const rad = (winkel - 90) * Math.PI / 180;
    return `${(mitte + radius * Math.cos(rad)).toFixed(2)} ${(mitte + radius * Math.sin(rad)).toFixed(2)}`;
  };
  const pass = aktiverSeasonPass();
  let svg = "";
  GLUECKSRAD_FELDER.forEach((feld, i) => {
    const von = (i / n) * 360, bis = ((i + 1) / n) * 360, mittelWinkel = (i + 0.5) / n * 360;
    const icon = feld.typ === "season" && pass ? pass.icon : feld.icon;
    svg += `<path d="M${mitte} ${mitte} L${punkt(von)} A${radius} ${radius} 0 0 1 ${punkt(bis)} Z"
                  fill="${feld.farbe}" stroke="#fff" stroke-width="3"/>
            <g transform="rotate(${mittelWinkel} ${mitte} ${mitte})">
              <text x="${mitte}" y="58" text-anchor="middle" font-size="30">${icon}</text>
              <text x="${mitte}" y="80" text-anchor="middle" font-size="12" font-weight="bold" fill="#5b2a4f">${feld.kurz}</text>
            </g>`;
  });
  svg += `<circle cx="${mitte}" cy="${mitte}" r="${radius}" fill="none" stroke="#ff5fa2" stroke-width="6"/>`;
  $("radScheibe").innerHTML = svg;
}

// Fenster öffnen: Rad auf Anfang, Knopf je nachdem, ob heute schon gedreht wurde
function zeigeRadFenster() {
  baueGluecksrad();
  const scheibe = $("radScheibe");
  scheibe.style.transition = "none";
  scheibe.style.transform = "rotate(0deg)";
  void scheibe.offsetWidth;          // ohne Animation zurückdrehen
  scheibe.style.transition = "";

  const bereit = gluecksradBereit();
  const knopf = $("radDrehen");
  knopf.disabled = !bereit;
  setzeText(knopf, bereit ? "Drehen!" : "⏳");
  const ms = msBisMitternacht();
  setzeText($("radInfo"), bereit
    ? "Einmal am Tag drehen und gewinnen!"
    : `Du hast heute schon gedreht! Nächster Versuch in ${Math.floor(ms / 3600000)} Std. ${Math.floor((ms % 3600000) / 60000)} Min.`);
  $("radErgebnis").hidden = true;
  $("radZu").disabled = false;
  $("radOverlay").hidden = false;
}

// Rad so drehen, dass Feld "index" oben unter dem Zeiger landet. Gibt die Dauer in ms zurück.
function dreheRadScheibe(index) {
  const feldWinkel = 360 / GLUECKSRAD_FELDER.length;
  const mitteDesFelds = (index + 0.5) * feldWinkel;
  const wackeln = (Math.random() - 0.5) * (feldWinkel - 14);   // nicht immer genau in der Mitte
  const drehung = 360 * 6 - mitteDesFelds + wackeln;           // 6 volle Runden + Ziel
  $("radScheibe").style.transform = `rotate(${drehung}deg)`;
  $("radDrehen").disabled = true;
  $("radZu").disabled = true;
  return 4200;
}

function gewinnText(ergebnis) {
  const pass = aktiverSeasonPass();
  const teile = [];
  if (ergebnis.feld.typ === "jackpot") teile.push("💎 JACKPOT! 💎");
  if (ergebnis.herzen) teile.push(`+${format(ergebnis.herzen)} ${herz()}`);
  if (ergebnis.seasonPunkte) teile.push(`+${ergebnis.seasonPunkte} ${pass.icon}`);
  if (ergebnis.feld.effekt) teile.push(`${ergebnis.feld.effekt.name}!\n${ergebnis.feld.effekt.text} für ${ergebnis.feld.effekt.dauerSek} Sekunden`);
  if (ergebnis.feld.typ === "stern") teile.push("🌟 Eine Sternschnuppe!\nSchnell fangen!");
  return teile.join("\n");
}

function zeigeRadErgebnis(ergebnis) {
  setzeText($("radGewinn"), gewinnText(ergebnis));
  $("radErgebnis").hidden = false;
  setzeText($("radDrehen"), ergebnis.feld.icon);
  setzeText($("radInfo"), "Glückwunsch! Morgen kannst du wieder drehen.");
  $("radZu").disabled = false;
  konfetti($("radOverlay").querySelector(".geschenkKarte"));
}

// ----- Offline-Fortschritt -----

// "3 Std. 12 Min." – ohne Sekunden, ab 1 Stunde
function formatDauer(sekunden) {
  const h = Math.floor(sekunden / 3600), m = Math.floor((sekunden % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)} Tage und ${h % 24} Std.`;
  if (h > 0) return `${h} Std. ${m} Min.`;
  return `${Math.max(1, m)} Min.`;
}

function zeigeOfflineFenster(ergebnis) {
  setzeText($("offlineZeit"), `Du warst ${formatDauer(ergebnis.sekunden)} weg. In der Zeit haben deine Herzschenker fleißig gesammelt:`);
  setzeText($("offlineBetrag"), `+${format(ergebnis.herzen)} ${herz()}`);
  setzeText($("offlineHinweis"), ergebnis.gekappt
    ? `💡 Dein Herzkorb fasst höchstens ${KONFIG.offline.maxStunden} Stunden – komm öfter vorbei, dann geht nichts verloren!`
    : "Schön, dass du wieder da bist! 💕");
  $("offlineOverlay").hidden = false;
}

// ----- Neustart mit Bonus -----

function zeigeNeustart() {
  const sterne = glitzersterne();
  const prozent = Math.round(sterne * NEUSTART.sternBonus * 100);
  setzeText($("neustartSterne"), sterne
    ? `⭐ ${sterne} Glitzersterne · +${prozent} % Herzen für immer`
    : "⭐ Noch keine Glitzersterne");

  const fehlend = GEBAEUDE.filter(g => anzahl(g) < 1).length;
  const neu = neueSterne();
  const knopf = $("neustartBtn");
  let info;
  if (fehlend > 0) {
    info = `Wenn du jeden Herzschenker mindestens einmal hast (bis zum 👑 Herzkönigreich), kannst du neu anfangen `
         + `und bekommst Glitzersterne. Jeder ⭐ gibt für immer +${NEUSTART.sternBonus * 100} % Herzen. Noch ${fehlend} Herzschenker fehlen.`;
    setzeText(knopf, "🔒 Noch nicht möglich");
  } else if (neu === 0) {
    info = "Sammle noch mehr Herzen – dann gibt es beim Neustart neue Glitzersterne!";
    setzeText(knopf, "🔒 Noch keine neuen Sterne");
  } else {
    info = `Neustart jetzt: +${neu} Glitzersterne ⭐ (dann ${sterne + neu} = +${Math.round((sterne + neu) * NEUSTART.sternBonus * 100)} % Herzen für immer). `
         + "Herzen, Herzschenker, Verbesserungen und Upgrades fangen wieder bei 0 an. "
         + "Erfolge, Skins, Sticker, Haustier und Season-Pass bleiben!";
    setzeText(knopf, `🌟 Neustart: +${neu} ⭐`);
  }
  setzeText($("neustartInfo"), info);
  knopf.disabled = !neustartMoeglich();
}

// ----- Herzregen-Minispiel -----

function starteRegenAnzeige() {
  $("regenFeld").textContent = "";
  $("regenFeld").hidden = false;
  $("regenAnzeige").hidden = false;
}

function aktualisiereRegenAnzeige(thema, punkte, restSek) {
  setzeText($("regenAnzeige"), `${thema.icon} ${punkte} Punkte · ⏳ ${restSek} s`);
}

// Ein Teil fallen lassen. beimFangen(wert, position) wird beim Antippen aufgerufen.
function lasseRegenTeilFallen(thema, beimFangen) {
  const istGold = Math.random() < REGEN.goldChance;
  const teil = document.createElement("span");
  teil.className = "regenTeil" + (istGold ? " gold" : "");
  teil.textContent = istGold ? thema.gold : zufallAus(thema.teile);
  teil.style.left = `${zufallZwischen(2, 86)}%`;
  teil.style.setProperty("--dauer", `${zufallZwischen(REGEN.fallSekMin, REGEN.fallSekMax).toFixed(2)}s`);

  teil.addEventListener("pointerdown", ereignis => {
    ereignis.preventDefault();
    ereignis.stopPropagation();
    if (teil.classList.contains("gefangen")) return;
    // Aktuelle Höhe festhalten, sonst springt das Teil beim Wechsel der Animation nach oben
    teil.style.top = getComputedStyle(teil).top;
    teil.classList.add("gefangen");
    beimFangen(istGold ? REGEN.goldPunkte : 1, { x: ereignis.clientX, y: ereignis.clientY });
    setTimeout(() => teil.remove(), 320);
  });
  // Unten rausgefallen -> wegräumen
  teil.addEventListener("animationend", e => { if (e.animationName === "regenFallen") teil.remove(); });
  $("regenFeld").append(teil);
}

function beendeRegenAnzeige() {
  $("regenAnzeige").hidden = true;
  const feld = $("regenFeld");
  for (const teil of feld.children) teil.style.opacity = "0";
  setTimeout(() => { feld.textContent = ""; feld.hidden = true; }, 400);
}

// ----- Geburtstag -----

// Konfetti-Regen: bunte Schnipsel fallen den ganzen Tag über das Spielfeld
function zeigeKonfettiRegen(an) {
  const regen = $("konfettiRegen");
  regen.hidden = !an;
  if (!an || regen.childElementCount) return;
  const farben = ["#ff5fa2", "#ffd23f", "#8ec5ff", "#7ee0a1", "#b56bff", "#ff9a5a"];
  for (let i = 0; i < 28; i++) {
    const stueck = document.createElement("i");
    stueck.style.left = `${Math.random() * 100}%`;
    stueck.style.background = farben[i % farben.length];
    stueck.style.animationDuration = `${5 + Math.random() * 5}s, ${1 + Math.random()}s`;
    stueck.style.animationDelay = `${-Math.random() * 10}s, 0s`;
    if (i % 3 === 0) stueck.style.borderRadius = "50%";   // ein paar runde Punkte
    regen.append(stueck);
  }
}

function zeigeGeburtstagFenster() {
  const box = $("gbBox");
  box.textContent = "🎁";
  box.classList.remove("offen");
  box.disabled = false;
  $("gbHinweis").hidden = false;
  $("gbInhalt").hidden = true;
  $("geburtstagOverlay").hidden = false;
}

function zeigeGeburtstagInhalt(ergebnis) {
  const box = $("gbBox");
  box.textContent = "🎂";
  box.classList.add("offen");
  box.disabled = true;
  $("gbHinweis").hidden = true;
  const pass = aktiverSeasonPass();
  const zeilen = [`+${format(ergebnis.herzen)} ${herz()}`];
  if (ergebnis.seasonPunkte) zeilen.push(`+${format(ergebnis.seasonPunkte)} ${pass.icon}`);
  $("gbBetrag").textContent = zeilen.join("\n");
  $("gbSkins").textContent = ergebnis.neueSkins.length
    ? `Und für immer: ${ergebnis.neueSkins.map(s => `${s.icon} ${s.name}`).join(" und ")} – unter Skins auswählbar!`
    : "";
  $("gbInhalt").hidden = false;
  const karte = $("geburtstagOverlay").querySelector(".geschenkKarte");
  konfetti(karte);
  setTimeout(() => konfetti(karte), 500);
}

// ----- Marie spricht -----

let sprechTimer = null, mundTimer = null;

// Sprechblase zeigen, Mund bewegen, leise "plappern"
function marieSagt(text, dauerMs = 2800) {
  if (!text) return;
  const blase = $("sprechblase");
  clearTimeout(sprechTimer);
  blase.classList.remove("weg");
  blase.hidden = true;
  void blase.offsetWidth;          // Aufplopp-Animation neu starten
  blase.textContent = text;
  blase.hidden = false;

  ui.marie.classList.add("spricht");
  clearTimeout(mundTimer);
  mundTimer = setTimeout(() => ui.marie.classList.remove("spricht"), 1100);

  // 3–4 kurze, hohe Töne wie Plappern
  const silben = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < silben; i++) {
    setTimeout(() => spieleTon(950 + Math.random() * 450, 0.06, "sine", 0.05), i * 95);
  }

  sprechTimer = setTimeout(() => {
    blase.classList.add("weg");
    sprechTimer = setTimeout(() => { blase.hidden = true; blase.classList.remove("weg"); }, 260);
  }, dauerMs);
}

// ----- Zimmer -----

let zimmerPlatz = "bett";   // welcher Platz unten zur Auswahl steht

// Ein Teil im Zimmer zeichnen (Inhalt des Platz-Elements)
function zeichneZimmerTeil(el, teil) {
  el.textContent = "";
  el.style.removeProperty("--teil-filter");
  if (!teil) return;
  if (teil.platz === "fenster") {
    el.style.setProperty("--himmel", teil.himmel);
    el.append(span("draussen", teil.icon));
    return;
  }
  if (teil.platz === "teppich") {
    el.style.setProperty("--teppich", teil.farbe);
    return;
  }
  const bild = span("bild", teil.svg ? "" : teil.icon);
  if (teil.svg) bild.innerHTML = teil.svg;
  el.append(bild);
  if (teil.zusatz) el.append(span("zusatz", teil.zusatz));
}

// Figur (mit Kleid, Frisur, Hut) und Haustier als Kopie ins Zimmer stellen
function zimmerFigurHtml() {
  // IDs umbenennen, sonst gibt es sie doppelt im Dokument
  return ui.marie.querySelector("svg").outerHTML
    .replace(/id="([^"]+)"/g, 'id="zimmer-$1"')
    .replace(/url\(#([^)]+)\)/g, "url(#zimmer-$1)");
}

// Das Zimmer selbst (oben auf der Seite)
function baueZimmer(beimTippen) {
  const zimmer = $("zimmer");
  zimmer.append(span("zimmerWand"), span("zimmerBoden"));
  for (const platz of ZIMMER_PLAETZE) {
    if (platz.id === "wand" || platz.id === "boden") continue;
    const el = document.createElement("button");
    el.type = "button";
    el.className = "zimmerPlatz";
    el.dataset.platz = platz.id;
    el.setAttribute("aria-label", platz.name);
    el.addEventListener("click", () => beimTippen(platz.id));
    zimmer.append(el);
  }
  const figur = span("zimmerFigur");
  figur.id = "zimmerFigur";
  const tier = span("zimmerTier");
  tier.id = "zimmerTier";
  zimmer.append(figur, tier);

  // Schriftgröße der Teile wächst mit der Zimmerbreite
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(([e]) => zimmer.style.setProperty("--zb", e.contentRect.width + "px")).observe(zimmer);
  }

  // Auswahl der Plätze unter dem Zimmer
  for (const platz of ZIMMER_PLAETZE) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "albumSeitenBtn";
    btn.dataset.platz = platz.id;
    btn.append(platz.icon, Object.assign(document.createElement("small"), { textContent: platz.name }));
    btn.addEventListener("click", () => beimTippen(platz.id));
    $("zimmerPlatzwahl").append(btn);
  }
}

function zeigeZimmer(beimTeilWaehlen) {
  const zimmer = $("zimmer");

  // Wand und Boden
  const wand = teilAufPlatz("wand");
  zimmer.style.setProperty("--wand", wand.muster ? `${emojiKachel([wand.muster, wand.muster], 70)} 0 0 / 22% auto, ${wand.farbe}` : wand.farbe);
  zimmer.style.setProperty("--boden", teilAufPlatz("boden").farbe);

  // Plätze
  for (const el of zimmer.querySelectorAll(".zimmerPlatz")) {
    const teil = teilAufPlatz(el.dataset.platz);
    el.classList.toggle("leer", !teil);
    el.classList.toggle("gewaehlt", el.dataset.platz === zimmerPlatz);
    zeichneZimmerTeil(el, teil);
  }

  // Figur und Haustier
  $("zimmerFigur").innerHTML = zimmerFigurHtml();
  const t = haustier();
  const tierEl = $("zimmerTier");
  tierEl.hidden = !t;
  if (t) setzeTierBild(tierEl, tierArt(t), TIER_STUFEN.indexOf(tierStufe(t)));

  setzeText($("zimmerInfo"),
    `🏠 ${anzahlZimmerTeile()} von ${anzahlZimmerTeileGesamt()} Teilen · Gemütlichkeit: +${Math.round((zimmerFaktor() - 1) * 100)} % Herzen`);

  // Platz-Auswahl und Teile des gewählten Platzes
  for (const btn of $("zimmerPlatzwahl").children) btn.classList.toggle("aktiv", btn.dataset.platz === zimmerPlatz);
  const platz = ZIMMER_PLAETZE.find(p => p.id === zimmerPlatz);
  setzeText($("zimmerPlatzTitel"), `${platz.icon} ${platz.name}`);

  const raster = $("zimmerRaster");
  raster.textContent = "";
  const steht = teilAufPlatz(zimmerPlatz);
  for (const teil of teileFuerPlatz(zimmerPlatz)) {
    const karte = document.createElement("button");
    karte.type = "button";
    karte.className = "skinKarte zimmerKarte";
    const besitzt = zimmerTeilBesitzt(teil);
    let status;
    if (steht === teil) status = "✓ Im Zimmer";
    else if (besitzt) status = "Hinstellen";
    else if (teil.preis === null) status = `🔒 Season-Stufe ${Object.entries(SEASON_PAESSE.find(p => p.id === teil.season).skinBelohnungen).find(([, id]) => id === teil.id)[0]}`;
    else status = `${herz()} ${format(teil.preis)}`;
    karte.classList.toggle("aktiv", steht === teil);
    karte.classList.toggle("gesperrt", !besitzt && teil.preis === null);
    karte.classList.toggle("zuTeuer", !besitzt && teil.preis !== null && spiel.herzen < teil.preis);
    const icon = span("skinIcon", teil.svg ? "" : teil.icon);
    if (teil.svg) icon.innerHTML = teil.svg;
    karte.append(icon, span("skinName", teil.name), span("skinStatus", status));
    if (teil.season && !besitzt) karte.title = seasonName(teil.season);
    karte.addEventListener("click", () => beimTeilWaehlen(teil));
    raster.append(karte);
  }
}

// ----- Haustier -----

// Das Tier wächst und schrumpft mit Marie: ihre Breite als CSS-Variable bereitstellen
if (typeof ResizeObserver === "function") {
  new ResizeObserver(([eintrag]) => {
    ui.marieBereich.style.setProperty("--marie-breite", eintrag.contentRect.width + "px");
  }).observe(ui.marie);
}

// Bild eines Tiers in ein Element setzen: eigenes SVG (z.B. die grau-weiße Katze) oder Emoji
function setzeTierBild(el, art, stufenIndex = 0) {
  const schluessel = art ? `${art.id}-${stufenIndex}` : "ei";
  if (el.dataset.bild === schluessel) return;   // nur bei Änderung neu zeichnen
  el.dataset.bild = schluessel;
  if (!art) el.textContent = "🥚";
  else if (art.svg) el.innerHTML = art.svg;     // eigenes SVG aus haustier.js
  else el.textContent = art.stufen[stufenIndex];
}

// Das Tier neben Marie: Bild, Größe, Gedankenblase
function zeigeHaustier() {
  const t = haustier();
  const el = ui.haustier;
  el.classList.toggle("ei", !t);
  const stufe = tierStufe(t);
  setzeTierBild($("haustierEmoji"), tierArt(t), TIER_STUFEN.indexOf(stufe));
  el.style.setProperty("--tier-groesse", t ? stufe.groesse : 1);
  el.setAttribute("aria-label", t ? `${t.name} – Haustier pflegen` : "Ei – Haustier adoptieren");

  const laune = tierLaune(t);
  const blase = $("haustierBlase");
  const zeichen = !t ? "❓" : laune === "schlaeft" ? "💤" : laune === "hungrig" ? tierArt(t).leckerli.icon : "";
  blase.hidden = !zeichen;
  setzeText(blase, zeichen);
  el.classList.toggle("schlaeft", laune === "schlaeft");
}

// Klick auf Marie: das Tier hüpft mit
function haustierHopst() {
  if (!haustier()) return;
  ui.haustier.classList.remove("hopst");
  void ui.haustier.offsetWidth;
  ui.haustier.classList.add("hopst");
}

let tierAuswahl = HAUSTIER_ARTEN[0];

// Fenster: Adoption (noch kein Tier) oder Pflege
function zeigeTierFenster() {
  const t = haustier();
  $("tierAdoption").hidden = Boolean(t);
  $("tierPflege").hidden = !t;
  if (!t) baueTierAuswahl();
  else zeigeTierPflege();
  $("tierOverlay").hidden = false;
}

function baueTierAuswahl() {
  const auswahl = $("tierAuswahl");
  auswahl.textContent = "";
  for (const art of HAUSTIER_ARTEN) {
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.classList.toggle("aktiv", art === tierAuswahl);
    const bild = span("tierBild");
    setzeTierBild(bild, art, 0);
    knopf.append(bild, Object.assign(document.createElement("small"), { textContent: art.name }));
    knopf.addEventListener("click", () => {
      tierAuswahl = art;
      $("tierName").value = zufallAus(art.namen);
      sound.klick();
      baueTierAuswahl();
    });
    auswahl.append(knopf);
  }
  if (!$("tierName").value) $("tierName").value = tierAuswahl.namen[0];
}

function zeigeTierPflege() {
  const t = haustier();
  if (!t) return;
  const art = tierArt(t);
  const stufe = tierStufe(t);
  const gross = $("tierGross");
  setzeTierBild(gross, art, TIER_STUFEN.indexOf(stufe));
  gross.style.setProperty("--tier-groesse", stufe.groesse);

  setzeText($("tierNameTitel"), `${t.name} · ${art.name}`);
  const laune = tierLaune(t);
  setzeText($("tierLaune"), laune === "schlaeft"
    ? `${t.name} hat großen Hunger und ist eingeschlafen 💤 – füttere es, dann wacht es auf!`
    : laune === "hungrig" ? `${t.name} hat Hunger 🥺` : `${t.name} ist glücklich! 💕`);

  setzeText($("tierLevel"), String(t.level));
  setzeText($("tierStufe"), stufe.name);
  const maxLevel = t.level >= TIER.maxLevel;
  setzeText($("tierXpText"), maxLevel ? "Höchstes Level! 👑" : `${t.xp} / ${tierXpFuerLevel(t.level)} ⭐`);
  $("tierXpBalken").style.width = (maxLevel ? 100 : t.xp / tierXpFuerLevel(t.level) * 100).toFixed(1) + "%";
  setzeText($("tierSattText"), `${Math.round(t.sattheit)} %`);
  $("tierSattBalken").style.width = t.sattheit.toFixed(1) + "%";
  $("tierSattBalken").parentElement.classList.toggle("leer", t.sattheit < 30);

  const prozent = Math.round(t.level * TIER.bonusProLevel * 100);
  setzeText($("tierBonus"), t.sattheit > 0
    ? `✨ ${t.name} gibt dir +${prozent} % Herzen`
    : `💤 Schlafend kein Bonus (sonst +${prozent} % Herzen)`);

  const satt = t.sattheit >= 100;
  for (const sorte of ["leckerli", "festmahl"]) {
    const knopf = $(sorte === "leckerli" ? "tierLeckerli" : "tierFestmahl");
    const preis = futterPreis(sorte);
    setzeText(knopf, satt ? `${art[sorte].icon} Satt!` : `${art[sorte].icon} ${art[sorte].name} · ${herz()} ${format(preis)}`);
    knopf.disabled = satt || spiel.herzen < preis;
  }
  const uebrig = streichelnUebrig();
  setzeText($("tierStreicheln"), uebrig > 0 ? `🤗 Streicheln (noch ${uebrig}× heute)` : "🤗 Genug gestreichelt für heute – morgen wieder!");
  $("tierStreicheln").disabled = uebrig <= 0;
}

function tierFreutSich() {
  const gross = $("tierGross");
  gross.classList.remove("freut");
  void gross.offsetWidth;
  gross.classList.add("freut");
}

// ----- Sticker-Album -----

let albumSeite = STICKER_SEITEN[0];   // gerade aufgeschlagene Seite

// Album zeichnen: Seitenwahl oben, 12 Sticker-Felder der aktuellen Seite
function zeigeAlbum() {
  const sichtbar = sichtbareSticker();
  setzeText($("albumGesamt"), `${anzahlVerschiedeneSticker(sichtbar)} von ${sichtbar.length} Stickern gesammelt`);
  if (!seiteSichtbar(albumSeite)) albumSeite = STICKER_SEITEN[0];

  // Seitenwahl: Symbol, Fortschritt, Punkt bei neuen Stickern
  const wahl = $("albumSeitenwahl");
  wahl.textContent = "";
  for (const seite of sichtbareSeiten()) {
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.classList.toggle("aktiv", seite === albumSeite);
    knopf.classList.toggle("voll", seiteVoll(seite));
    knopf.classList.toggle("season", Boolean(seite.season));
    knopf.append(seite.icon, Object.assign(document.createElement("small"), {
      textContent: seiteVoll(seite) ? "✓ voll" : `${seiteFortschritt(seite)}/${seite.sticker.length}`,
    }));
    if ((spiel.stickerNeu || []).some(id => id.startsWith(seite.id + "-")) && seite !== albumSeite) {
      knopf.append(span("punkt"));
    }
    knopf.addEventListener("click", () => {
      albumSeite = seite;
      sound.klick();
      zeigeAlbum();
    });
    wahl.append(knopf);
  }

  // Die aufgeschlagene Seite
  const seite = albumSeite;
  let titel = `${seite.icon} ${seite.name}  ·  ${seiteFortschritt(seite)}/${seite.sticker.length}`;
  if (seite.season) {
    const pass = SEASON_PAESSE.find(p => p.id === seite.season);
    if (seiteVoll(seite)) titel += "  ·  ✓";
    else if (aktiverSeasonPass() === pass) titel += `  ·  ⏳ nur bis ${seasonLetzterTag(pass)}`;
    else titel += "  ·  Season vorbei";
  }
  setzeText($("albumSeitenTitel"), titel);
  const neuGesehen = markiereStickerGesehen(seite);   // ab jetzt nicht mehr "neu" – aber diesmal noch markieren
  const raster = $("albumRaster");
  raster.style.setProperty("--seiten-farbe", seite.farbe);
  raster.textContent = "";
  for (const sticker of ALLE_STICKER.filter(s => s.seite === seite)) {
    const anzahl = stickerAnzahl(sticker);
    const feld = document.createElement("div");
    feld.className = `stickerFeld ${sticker.seltenheit}`;
    feld.style.setProperty("--seiten-farbe", seite.farbe);
    if (!anzahl) feld.classList.add("fehlt");
    if (neuGesehen.includes(sticker.id)) feld.classList.add("neu");
    feld.title = anzahl ? `${sticker.name}${seltenheit(sticker).name ? " – " + seltenheit(sticker).name : ""}` : "Noch nicht gefunden";
    feld.append(
      span("emoji", sticker.emoji),
      span("name", anzahl ? sticker.name : "?"),
    );
    if (anzahl && sticker.seltenheit !== "normal") feld.append(span("seltenheit", sticker.seltenheit === "super" ? "🌟" : "✨"));
    if (anzahl > 1) feld.append(span("anzahl", `×${anzahl}`));
    raster.append(feld);
  }
}

function albumSymbolFeiern() {
  ui.albumBtn.classList.remove("feiern");
  void ui.albumBtn.offsetWidth;
  ui.albumBtn.classList.add("feiern");
}

// ----- Bestenliste -----

// Welcher Teil der Seite ist sichtbar: Mitmachen-Formular oder die Liste
function zeigeBestenlisteBereich() {
  $("blBeitreten").hidden = Boolean(mitglied);
  $("blListeBereich").hidden = !mitglied;
}

function setzeBestenlisteStatus(text) {
  setzeText($("blStatus"), text);
}

function vorWieLangeText(zeitpunkt) {
  const minuten = Math.floor((Date.now() - Date.parse(zeitpunkt)) / 60000);
  if (minuten < 2) return "gerade eben";
  if (minuten < 60) return `vor ${minuten} Min.`;
  const stunden = Math.floor(minuten / 60);
  if (stunden < 24) return `vor ${stunden} Std.`;
  return `vor ${Math.floor(stunden / 24)} Tagen`;
}

// Liste zeichnen. Die Namen kommen von anderen Spielern -> nur als Text einsetzen (textContent)
function zeigeBestenlisteEintraege(eintraege) {
  const liste = $("blListe");
  liste.textContent = "";
  if (!eintraege.length) {
    const leer = document.createElement("li");
    leer.className = "blLeer";
    leer.textContent = "Noch niemand hier – mach den Anfang!";
    liste.append(leer);
    return;
  }
  const medaillen = ["🥇", "🥈", "🥉"];
  eintraege.forEach((e, i) => {
    const zeile = document.createElement("li");
    zeile.className = "blZeile";
    const istDu = mitglied && e.spieler_id === mitglied.spielerId;
    if (istDu) zeile.classList.add("du");

    const details = [`${formatKomma(e.hps)} ${herz()}/Sek.`];
    if (e.season_stufe > 0) details.push(`Season-Stufe ${e.season_stufe}`);
    details.push(`🏆 ${e.erfolge}`, vorWieLangeText(e.aktualisiert));

    zeile.append(
      span("platz", medaillen[i] || String(i + 1)),
      span("name", istDu ? `${e.name} (du)` : e.name),
      span("punkte", `${format(e.herzen_gesamt)} ${herz()}`),
      span("details", details.join(" · ")),
    );
    liste.append(zeile);
  });
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
  if (seiteId === "seiteAufgaben") titel = "📋 Tagesaufgaben";
  if (seiteId === "seiteBestenliste") titel = "🏅 Bestenliste";
  if (seiteId === "seiteAlbum") titel = "📒 Sticker-Album";
  if (seiteId === "seiteZimmer") titel = `🏠 ${figurName()}s Zimmer`;
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
