"use strict";
// =====================================================
//  VERWALTUNG – Bildschirm
//  • Admin-Menü: versteckt – nur über das Logo, 10 Sekunden gedrückt halten,
//    dann PIN eingeben (die prüft die Datenbank, siehe supabase/verwaltung.sql)
//  • Für alle: Nachricht an alle, Umfrage, Code einlösen (Statistik-Seite)
//  Daten und Datenbank-Aufrufe: verwaltung.js
// =====================================================

// Kleiner Helfer: Element mit Klasse und Text bauen
function el(tag, klasse = "", text = "") {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text) e.textContent = text;
  return e;
}

function knopf(text, beimKlick, klasse = "knopf") {
  const k = el("button", klasse, text);
  k.type = "button";
  k.addEventListener("click", beimKlick);
  return k;
}

// =====================================================
//  ADMIN-MENÜ
// =====================================================

let adminReiter = "ereignisse";
const ADMIN_DRUECKEN_MS = 10000;   // so lange muss man das Logo gedrückt halten

function oeffneAdmin() {
  $("adminOverlay").hidden = false;
  $("adminAnmeldung").hidden = Boolean(adminPin);
  $("adminMenue").hidden = !adminPin;
  setzeText($("adminAnmeldeFehler"), "");
  if (adminPin) zeigeAdminReiter(adminReiter);
  else setTimeout(() => $("adminPinEingabe").focus(), 50);
}

function schliesseAdmin() {
  $("adminOverlay").hidden = true;
  $("adminPinEingabe").value = "";
}

async function beimAdminAnmelden() {
  const pin = $("adminPinEingabe").value.trim();
  if (!pin) return;
  $("adminAnmelden").disabled = true;
  setzeText($("adminAnmeldeFehler"), "⏳ Prüfe …");
  try {
    await adminAnmelden(pin);
    sound.erfolg();
    $("adminPinEingabe").value = "";
    oeffneAdmin();
  } catch (fehler) {
    sound.fehler();
    setzeText($("adminAnmeldeFehler"), "⚠️ " + fehler.message);
  } finally {
    $("adminAnmelden").disabled = false;
  }
}

function zeigeAdminReiter(reiter) {
  adminReiter = reiter;
  for (const b of $("adminReiter").children) b.classList.toggle("aktiv", b.dataset.reiter === reiter);
  const inhalt = $("adminInhalt");
  inhalt.textContent = "";
  ({ ereignisse: adminEreignisse, codes: adminCodesZeigen, nachricht: adminNachrichtZeigen, lauftext: adminLauftextZeigen,
     umfrage: adminUmfrageZeigen, ziel: adminZielZeigen, liste: adminListeZeigen })[reiter](inhalt);
}

// Statuszeile unten im Admin-Bereich
function adminStatus(inhalt, text) {
  let zeile = inhalt.querySelector(".adminStatus");
  if (!zeile) { zeile = el("p", "adminStatus"); inhalt.append(zeile); }
  setzeText(zeile, text);
}

// Admin-Aufruf mit Fehleranzeige
async function adminVersuche(inhalt, aktion) {
  try {
    adminStatus(inhalt, "⏳ …");
    await aktion();
  } catch (fehler) {
    sound.fehler();
    adminStatus(inhalt, "⚠️ " + fehler.message);
    if (/PIN|Versuche/.test(fehler.message)) { adminAbmelden(); oeffneAdmin(); }
  }
}

// ----- ⚡ Ereignisse auslösen (nur auf diesem Gerät) -----

function adminEreignisse(inhalt) {
  inhalt.append(el("p", "seitenInfo", "Löst sofort etwas auf DIESEM Gerät aus – zum Testen oder als kleine Überraschung."));
  const liste = el("div", "adminKnoepfe");
  const ereignis = (text, aktion) => liste.append(knopf(text, () => {
    schliesseAdmin();
    aktion();
    speichern();
    aktualisiereAnzeige();
  }));
  ereignis("💖 Herzregen jetzt", () => { if (!regenLaeuft) { clearTimeout(regenTimer); starteRegen(); } });
  ereignis("🌟 Sternschnuppe jetzt", () => { clearTimeout(sternTimer); sternErscheint(); });
  ereignis("🎁 Tagesgeschenk nochmal", () => {
    const g = geschenkStand();
    if (g.letzterTag === datumText()) { g.letzterTag = gesternText(); g.serie = Math.max(0, g.serie - 1); }
    pruefeGeschenk();
  });
  ereignis("🎡 Glücksrad nochmal drehen", () => { gluecksradStand().letzterTag = null; zeigeRadFenster(); });
  ereignis("🎮 Minispiele: volle Belohnung zurück", () => { minispielStand().gespielt = {}; meldung("🎮 Minispiele", "Heute gibt es wieder 5× volle Belohnung pro Spiel."); });
  ereignis("📋 Neue Tagesaufgaben", () => { spiel.aufgaben = null; pruefeTageswechsel(); zeigeAufgaben(); });
  ereignis("🍖 Haustiere satt machen", () => {
    aktualisiereHunger();
    for (const t of alleHaustiere()) t.sattheit = 100;
    zeigeHaustier();
    meldung("🍖 Alle satt!", "Die Haustiere sind glücklich.");
  });
  // Feiertage vorab ansehen – nur Hut und Effekt, ohne Geschenk, bis die Seite neu geladen wird
  for (const f of FEIERTAGE) {
    ereignis(`${f.icon} ${f.name} ansehen (Test)`, () => { feiertagTest = f.id; pruefeFeiertag(); sag(f.id, { wichtig: true }); });
  }
  ereignis("🚫 Feiertags-Test beenden", () => { feiertagTest = null; pruefeFeiertag(); });
  // Geheime Ereignisse vorab ansehen (wirken echt, bis die Seite neu geladen wird)
  for (const w of WUNDER) {
    ereignis(`${w.icon} ${w.name} (Test)`, () => { wunderTest = w.id; pruefeWunder(); sag(w.id, { wichtig: true }); });
  }
  ereignis("☁️ Wolken-Monster jetzt", () => { schliesseAdmin(); setTimeout(() => starteMonster(), 300); });
  ereignis("♾️ Unendlich-Feier ansehen (Test)", () => zeigeUnendlichFeier());
  ereignis("🎄 Adventskalender ansehen (Test)", () => {
    const tag = Number(prompt("So tun, als wäre heute der … Dezember (1–24)? Es wird nichts gutgeschrieben.", "6"));
    if (!(tag >= 1 && tag <= 31)) return;
    adventTestTag = Math.floor(tag);
    adventTestOffen = [];
    pruefeAdvent();
    meldung("🎄 Test-Kalender", `Tippe links auf 🎄 – heute ist der ${adventTestTag}. Dezember. Neu laden beendet den Test.`);
  });
  ereignis("🎒 Ausflüge sofort beenden (Test)", () => {
    for (const t of alleHaustiere()) if (t.ausflug) t.ausflug.ende = Date.now();
    meldung("🎒 Gleich zurück!", "Alle Haustiere kommen jetzt vom Ausflug heim.");
  });
  ereignis("🚫 Wunder-Test beenden", () => { wunderTest = null; pruefeWunder(); });
  inhalt.append(liste);

  // Für ALLE Geräte: Erster Schnee
  inhalt.append(el("h3", "", "Für alle Geräte"),
    el("p", "seitenInfo", "Schneit es draußen zum ersten Mal? Dann tippe hier – heute schneit es auf allen Tablets, und alle bekommen das Schnee-Geschenk (einmal pro Winter)."));
  const schnee = el("div", "adminKnoepfe");
  schnee.append(knopf("❄️ Erster Schnee – für alle!", () => adminVersuche(inhalt, async () => {
    if (!confirm("Heute ist der erste Schnee? Dann schneit es heute auf allen Geräten.")) { adminStatus(inhalt, ""); return; }
    await adminEreignis("schnee");
    await pruefeSchneeEreignis();
    sound.erfolg();
    adminStatus(inhalt, "✓ Es schneit! Die anderen Geräte merken es beim nächsten Öffnen.");
    pruefeFeiertag();
  }), "knopf haupt"));
  inhalt.append(schnee);
}

// ----- 🎁 Belohnungs-Codes -----

function adminCodesZeigen(inhalt) {
  inhalt.append(el("p", "seitenInfo",
    "Erstelle einen Code, z.B. für ein gutes Zeugnis. Das Kind tippt ihn unter Statistik → „Code einlösen“ ein. Jeder Code geht nur einmal. Herzen passen sich an den Spielstand an."));
  let gewaehlt = VERWALTUNG.codeBelohnungen[0];
  const auswahl = el("div", "adminAuswahl");
  for (const b of VERWALTUNG.codeBelohnungen) {
    const k = knopf(b.text, () => {
      gewaehlt = b;
      for (const x of auswahl.children) x.classList.toggle("aktiv", x === k);
    }, "adminChip");
    k.classList.toggle("aktiv", b === gewaehlt);
    auswahl.append(k);
  }
  const grund = el("input");
  grund.type = "text"; grund.maxLength = 80; grund.placeholder = "z.B. Für dein tolles Zeugnis! (optional)";
  const feld = el("label", "feld", "Nachricht zum Code");
  feld.append(grund);
  const ergebnis = el("div", "adminCodeErgebnis");
  ergebnis.hidden = true;
  const liste = el("div", "adminListe");

  const ladeListe = () => adminVersuche(inhalt, async () => {
    const { codes } = await adminCodes();
    liste.textContent = "";
    liste.append(el("h3", "", "Letzte Codes"));
    if (!codes.length) liste.append(el("p", "seitenInfo", "Noch keine Codes."));
    for (const c of codes) {
      const zeile = el("div", "adminZeile");
      zeile.append(el("b", "", codeAnzeige(c.code)), el("span", "", codeBelohnungText(c.art, c.menge)),
        el("small", "", c.eingeloest_am
          ? `✓ eingelöst${c.eingeloest_von ? " von " + c.eingeloest_von : ""} am ${new Date(c.eingeloest_am).toLocaleDateString("de-DE")}`
          : "noch offen"));
      liste.append(zeile);
    }
    adminStatus(inhalt, "");
  });

  const erstellen = knopf("✨ Code erstellen", () => adminVersuche(inhalt, async () => {
    const { code } = await adminCodeErstellen(gewaehlt.art, gewaehlt.menge, grund.value);
    sound.erfolg();
    ergebnis.hidden = false;
    ergebnis.textContent = "";
    const gross = el("div", "adminCodeGross", codeAnzeige(code));
    ergebnis.append(gross, el("small", "", gewaehlt.text),
      knopf("📋 Kopieren", () => { navigator.clipboard?.writeText(codeAnzeige(code)); sound.klick(); }));
    grund.value = "";
    await ladeListe();
  }), "knopf haupt");

  inhalt.append(auswahl, feld, el("div", "knopfReihe"), ergebnis, liste);
  inhalt.querySelector(".knopfReihe").append(erstellen);
  ladeListe();
}

// ----- 📢 Nachricht an alle -----

function adminNachrichtZeigen(inhalt) {
  inhalt.append(el("p", "seitenInfo", "Erscheint auf allen Geräten einmal beim nächsten Öffnen (mit Internet)."));
  const aktuell = el("div", "adminAktuell", "⏳ …");
  const text = el("textarea");
  text.rows = 3; text.maxLength = 300; text.placeholder = "z.B. Am Wochenende gibt es eine Überraschung! 🎉";
  const feld = el("label", "feld", "Nachricht");
  feld.append(text);
  let tage = 3;
  const dauer = el("div", "adminAuswahl");
  for (const t of [1, 3, 7]) {
    const k = knopf(`${t} ${t === 1 ? "Tag" : "Tage"}`, () => { tage = t; for (const x of dauer.children) x.classList.toggle("aktiv", x === k); }, "adminChip");
    k.classList.toggle("aktiv", t === tage);
    dauer.append(k);
  }
  const ladeAktuell = async () => {
    try {
      const n = await holeNachricht();
      aktuell.textContent = n ? `Aktuell (bis ${new Date(n.bis).toLocaleDateString("de-DE")}): „${n.text}“` : "Gerade keine Nachricht.";
    } catch (e) { aktuell.textContent = "⚠️ " + e.message; }
  };
  const reihe = el("div", "knopfReihe");
  reihe.append(
    knopf("📢 An alle senden", () => adminVersuche(inhalt, async () => {
      if (!text.value.trim()) throw new Error("Bitte erst eine Nachricht eintippen.");
      await adminNachricht(text.value, tage);
      sound.erfolg();
      text.value = "";
      adminStatus(inhalt, "✓ Gesendet!");
      await ladeAktuell();
    }), "knopf haupt"),
    knopf("🗑️ Nachricht beenden", () => adminVersuche(inhalt, async () => {
      await adminNachricht("", 1);
      adminStatus(inhalt, "✓ Beendet.");
      await ladeAktuell();
    })),
  );
  inhalt.append(aktuell, feld, el("div", "feld", "Wie lange?"), dauer, reihe);
  ladeAktuell();
}

// ----- 📊 Umfrage -----

function umfrageBalken(u, eigene = null) {
  const box = el("div", "umfrageErgebnis");
  const summe = u.stimmen.reduce((a, b) => a + b, 0);
  u.antworten.forEach((antwort, i) => {
    const anteil = summe ? Math.round(u.stimmen[i] / summe * 100) : 0;
    const zeile = el("div", "umfrageZeile" + (i === eigene ? " meine" : ""));
    const balken = el("span", "umfrageBalken");
    balken.style.width = anteil + "%";
    zeile.append(balken, el("span", "umfrageText", `${i === eigene ? "✓ " : ""}${antwort}`), el("b", "", `${u.stimmen[i]} (${anteil} %)`));
    box.append(zeile);
  });
  box.append(el("small", "", `${summe} ${summe === 1 ? "Stimme" : "Stimmen"}${u.offen ? "" : " · beendet"}`));
  return box;
}

function adminUmfrageZeigen(inhalt) {
  const aktuell = el("div", "adminAktuell", "⏳ …");
  const ladeAktuell = async () => {
    try {
      const u = await holeUmfrage();
      aktuell.textContent = "";
      if (!u) { aktuell.textContent = "Gerade keine Umfrage."; return; }
      aktuell.append(el("b", "", `${u.offen ? "Läuft" : "Beendet"}: ${u.frage}`), umfrageBalken(u));
      if (u.offen) aktuell.append(knopf("⏹️ Umfrage beenden", () => adminVersuche(inhalt, async () => {
        await adminUmfrageBeenden();
        adminStatus(inhalt, "✓ Beendet.");
        await ladeAktuell();
      })));
    } catch (e) { aktuell.textContent = "⚠️ " + e.message; }
  };

  const frage = el("input");
  frage.type = "text"; frage.maxLength = 120; frage.placeholder = "z.B. Welches Tier soll als Nächstes kommen?";
  const frageFeld = el("label", "feld", "Neue Frage");
  frageFeld.append(frage);
  const antworten = [];
  const antwortBox = el("div", "adminAntworten");
  for (let i = 0; i < 4; i++) {
    const a = el("input");
    a.type = "text"; a.maxLength = 40; a.placeholder = `Antwort ${i + 1}${i < 2 ? "" : " (optional)"}`;
    antworten.push(a);
    antwortBox.append(a);
  }
  const reihe = el("div", "knopfReihe");
  reihe.append(knopf("📊 Umfrage starten", () => adminVersuche(inhalt, async () => {
    await adminUmfrageStarten(frage.value, antworten.map(a => a.value).filter(v => v.trim()));
    sound.erfolg();
    frage.value = "";
    antworten.forEach(a => (a.value = ""));
    adminStatus(inhalt, "✓ Gestartet! Eine laufende Umfrage wird dabei beendet.");
    await ladeAktuell();
  }), "knopf haupt"));
  inhalt.append(aktuell, frageFeld, antwortBox, reihe);
  ladeAktuell();
}

// ----- 🎯 Gemeinschaftsziel -----

function adminZielZeigen(inhalt) {
  inhalt.append(el("p", "seitenInfo",
    "Alle in der Bestenliste sammeln zusammen. Gezählt wird ab jetzt. Ist das Ziel erreicht, holt sich jedes Gerät die Belohnung einmal ab (in der Bestenliste). Ein neues Ziel ersetzt das alte."));
  const aktuell = el("div", "adminAktuell", "⏳ …");
  const ladeAktuell = async () => {
    try {
      const z = await holeGemeinschaftsziel();
      aktuell.textContent = "";
      if (!z) { aktuell.textContent = "Gerade kein Gemeinschaftsziel."; return; }
      const prozent = Math.min(100, Math.floor(z.summe / z.ziel * 100));
      aktuell.append(el("b", "", `🎯 ${z.titel}`),
        el("div", "", `${format(z.summe)} / ${format(z.ziel)} (${prozent} %)${z.erreicht_am ? " · ✓ erreicht" : ""}`),
        el("small", "", `Belohnung: ${codeBelohnungText(z.art, z.menge)}`),
        knopf("⏹️ Gemeinschaftsziel beenden", () => adminVersuche(inhalt, async () => {
          await adminGemeinschaftszielBeenden();
          adminStatus(inhalt, "✓ Beendet.");
          await ladeAktuell();
        })));
    } catch (e) { aktuell.textContent = "⚠️ " + e.message; }
  };

  // Größe und Belohnung richten sich nach dem Durchschnitt der Bestenliste
  let durchschnitt = 0;
  let stufe = GEMEINSCHAFTSZIEL_STUFEN[1];
  let art = GEMEINSCHAFTSZIEL_ARTEN[0];
  const schnittInfo = el("p", "seitenInfo", "⏳ Durchschnitt wird geladen …");
  const groessen = el("div", "adminAuswahl");
  const belohnungen = el("div", "adminAuswahl");
  const vorschau = el("div", "adminAktuell", "");
  const ziel = () => gemeinschaftszielFuer(durchschnitt, stufe);
  const menge = () => stufe.belohnung[art.art];
  const zeichneAuswahl = () => {
    groessen.textContent = "";
    for (const s of GEMEINSCHAFTSZIEL_STUFEN) {
      const k = knopf(`${s.icon} ${s.name} · ${format(gemeinschaftszielFuer(durchschnitt, s))}`, () => { stufe = s; zeichneAuswahl(); }, "adminChip");
      k.title = `${s.faktor}× der Durchschnitt`;
      k.classList.toggle("aktiv", s === stufe);
      groessen.append(k);
    }
    belohnungen.textContent = "";
    for (const a of GEMEINSCHAFTSZIEL_ARTEN) {
      const k = knopf(codeBelohnungText(a.art, stufe.belohnung[a.art]), () => { art = a; zeichneAuswahl(); }, "adminChip");
      k.classList.toggle("aktiv", a === art);
      belohnungen.append(k);
    }
    vorschau.textContent = `🎯 Ziel: ${format(ziel())} Herzen (${stufe.faktor}× Ø) · Belohnung: ${codeBelohnungText(art.art, menge())}`;
  };
  const ladeDurchschnitt = async () => {
    try {
      const eintraege = (await rufeBestenlisteAuf("hole_bestenliste", { p_gruppe: BESTENLISTE.gruppe })) || [];
      durchschnitt = durchschnittHerzen(eintraege);
      schnittInfo.textContent = `Ø ${format(durchschnitt)} Herzen aller Zeiten pro Spieler (${eintraege.length} in der Bestenliste). `
        + "Je größer das Ziel, desto besser die Belohnung.";
    } catch (e) {
      schnittInfo.textContent = "⚠️ Durchschnitt nicht ladbar: " + e.message;
    }
    zeichneAuswahl();
  };
  zeichneAuswahl();
  const titel = el("input");
  titel.type = "text"; titel.maxLength = 60; titel.placeholder = "z.B. Zusammen zur Billion! (optional)";
  const titelFeld = el("label", "feld", "Titel");
  titelFeld.append(titel);
  const reihe = el("div", "knopfReihe");
  reihe.append(knopf("🎯 Gemeinschaftsziel starten", () => adminVersuche(inhalt, async () => {
    if (!durchschnitt) { adminStatus(inhalt, "⚠️ Der Durchschnitt ist noch nicht geladen."); return; }
    if (!confirm(`Neues Gemeinschaftsziel: ${format(ziel())} Herzen (${stufe.name})?
Belohnung: ${codeBelohnungText(art.art, menge())}
Ein laufendes Ziel wird dabei beendet.`)) { adminStatus(inhalt, ""); return; }
    await adminGemeinschaftsziel(titel.value.trim() || `Zusammen ${format(ziel())} Herzen!`, ziel(), art.art, menge());
    sound.erfolg();
    titel.value = "";
    adminStatus(inhalt, "✓ Gestartet!");
    await ladeAktuell();
  }), "knopf haupt"));

  inhalt.append(aktuell, schnittInfo, el("div", "feld", "Wie groß soll das Ziel sein?"), groessen,
                el("div", "feld", "Belohnung für alle"), belohnungen, vorschau, titelFeld, reihe);
  ladeAktuell();
  ladeDurchschnitt();
}

// ----- 🏅 Bestenliste moderieren -----

function adminListeZeigen(inhalt) {
  inhalt.append(el("p", "seitenInfo", "Doppelte oder unpassende Einträge umbenennen oder löschen."));
  const liste = el("div", "adminListe");
  inhalt.append(liste);
  const lade = () => adminVersuche(inhalt, async () => {
    const eintraege = (await rufeBestenlisteAuf("hole_bestenliste", { p_gruppe: BESTENLISTE.gruppe })) || [];
    liste.textContent = "";
    if (!eintraege.length) liste.append(el("p", "seitenInfo", "Die Liste ist leer."));
    for (const e of eintraege) {
      const zeile = el("div", "adminZeile");
      const knoepfe = el("span", "adminZeileKnoepfe");
      knoepfe.append(
        knopf("✏️", () => {
          const neu = prompt(`Neuer Spitzname für „${e.name}“:`, e.name);
          if (neu === null || neu.trim() === e.name) return;
          adminVersuche(inhalt, async () => { await adminEintragUmbenennen(e.spieler_id, neu); await lade(); adminStatus(inhalt, "✓ Umbenannt."); });
        }, "adminMini"),
        knopf("🗑️", () => {
          if (!confirm(`„${e.name}“ wirklich aus der Bestenliste löschen?\n(Meldet sich das Gerät wieder, erscheint der Eintrag neu.)`)) return;
          adminVersuche(inhalt, async () => { await adminEintragLoeschen(e.spieler_id); await lade(); adminStatus(inhalt, "✓ Gelöscht."); });
        }, "adminMini"),
      );
      zeile.append(el("b", "", e.name), el("span", "", `${format(e.herzen_gesamt)} 💖 · ${vorWieLangeText(e.aktualisiert)}`), knoepfe);
      liste.append(zeile);
    }
    adminStatus(inhalt, "");
  });
  lade();
}

// =====================================================
//  FÜR ALLE: Nachricht, Umfrage, Code einlösen
// =====================================================

let umfrageSpaeter = false;   // "Später" gedrückt -> bis zum nächsten Start nicht mehr zeigen
let aktuelleUmfrage = null;

function irgendeinFensterOffen() {
  return [...document.querySelectorAll(".overlay")].some(o => !o.hidden);
}

// Neue Nachricht oder offene Umfrage? Dann (wenn gerade nichts anderes offen ist) zeigen.
let neuigkeitenTimer = null;
async function pruefeNeuigkeiten() {
  clearTimeout(neuigkeitenTimer);
  if (!verwaltungMoeglich() || document.hidden) return;
  // Gerade ein anderes Fenster offen (z.B. Tagesgeschenk)? Dann gleich nochmal versuchen.
  if (irgendeinFensterOffen()) { neuigkeitenTimer = setTimeout(pruefeNeuigkeiten, 15000); return; }
  try { await pruefeSchneeEreignis(); } catch (e) { /* ohne Ereignis-Tabelle: kein Schnee */ }
  try {
    const n = await holeNachricht();
    if (n && !nachrichtGesehen(n.id) && !irgendeinFensterOffen()) {
      setzeText($("nachrichtText"), n.text);
      $("nachrichtOverlay").dataset.id = n.id;
      $("nachrichtOverlay").hidden = false;
      sound.stern();
      return;   // Umfrage danach
    }
    if (umfrageSpaeter) return;
    const u = await holeUmfrage();
    if (u && u.offen && u.meine === null && !irgendeinFensterOffen()) zeigeUmfrage(u);
  } catch (e) { /* offline – dann später */ }
}

function zeigeUmfrage(u) {
  aktuelleUmfrage = u;
  setzeText($("umfrageFrage"), u.frage);
  const box = $("umfrageAntworten");
  box.textContent = "";
  const abgestimmt = u.meine !== null && u.meine !== undefined;
  setzeText($("umfrageHinweis"), abgestimmt ? "Danke fürs Mitmachen! So haben alle abgestimmt:" : "Tippe auf deine Antwort:");
  setzeText($("umfrageZu"), abgestimmt ? "Fertig" : "Später");
  if (abgestimmt || !u.offen) {
    box.append(umfrageBalken(u, u.meine));
  } else {
    u.antworten.forEach((antwort, i) => box.append(knopf(antwort, async () => {
      try {
        await stimmeAb(u.id, i);
        sound.erfolg();
        zeigeUmfrage(await holeUmfrage());
      } catch (e) {
        sound.fehler();
        meldung("⚠️ Abstimmen nicht möglich", e.message);
      }
    }, "knopf haupt umfrageKnopf")));
  }
  $("umfrageOverlay").hidden = false;
}

async function beimCodeEinloesen() {
  const eingabe = $("codeEingabe");
  const code = eingabe.value.trim();
  if (!code) return;
  $("codeEinloesen").disabled = true;
  try {
    const e = await loeseCodeEin(code);
    eingabe.value = "";
    sound.stern();
    setTimeout(() => sound.erfolg(), 350);
    konfetti($("spielfeld"));
    const teile = [];
    if (e.herzen) teile.push(`+${format(e.herzen)} ${herz()}`);
    if (e.seasonPunkte) teile.push(`+${format(e.seasonPunkte)} Season-Punkte`);
    if (e.sticker.length) teile.push(`${e.sticker.length} Sticker: ${e.sticker.map(s => s.sticker.emoji).join(" ")}`);
    meldung(`🎁 ${e.text || "Code eingelöst!"}`, teile.join(" · "));
    for (const s of e.sticker) if (s.neu || s.seiteFertig) meldeSticker(s);
    for (const stufe of e.stufen) meldeSeasonStufe(stufe);
    pruefeErfolgeUndStatistik();
    aktualisiereAnzeige();
  } catch (fehler) {
    sound.fehler();
    meldung("⚠️ Code nicht einlösbar", fehler.message);
  } finally {
    $("codeEinloesen").disabled = false;
  }
}

// =====================================================
//  GEMEINSCHAFTSZIEL (Karte oben in der Bestenliste)
// =====================================================

function zeigeGemeinschaftsziel(z) {
  const box = $("gemeinschaftsziel");
  box.hidden = !z;
  if (!z) return;
  box.textContent = "";
  const erreicht = Boolean(z.erreicht_am);
  box.classList.toggle("erreicht", erreicht);
  const prozent = Math.min(100, z.summe / z.ziel * 100);
  const balken = el("div", "fzBalken");
  const fuellung = el("div");
  fuellung.style.width = prozent.toFixed(1) + "%";
  balken.append(fuellung);

  box.append(
    el("div", "fzTitel", `${erreicht ? "🎉" : "🎯"} ${inWaehrung(z.titel)}`),
    balken,
    el("div", "fzZahl", inWaehrung(`Gemeinsam: ${format(z.summe)} von ${format(z.ziel)} ${herz()} (${Math.floor(prozent)} %)`)),
    el("span", "fzKlein", erreicht ? "Geschafft! Alle bekommen eine Belohnung." : `Belohnung für alle: ${codeBelohnungText(z.art, z.menge)}`),
  );
  const beitraege = el("div", "fzBeitraege");
  for (const b of z.beitraege) {
    if (b.beitrag <= 0) continue;
    const istDu = mitglied && b.spieler_id === mitglied.spielerId;
    beitraege.append(el("span", istDu ? "du" : "", `${b.name}${istDu ? " (du)" : ""}: ${format(b.beitrag)}`));
  }
  if (beitraege.children.length) box.append(beitraege);

  if (erreicht && mitglied) {
    const abgeholt = gemeinschaftszielAbgeholt(z);
    const k = knopf(abgeholt ? "✓ Belohnung abgeholt" : "🎁 Belohnung abholen", () => beimGemeinschaftsBelohnung(z), "knopf haupt");
    k.disabled = abgeholt;
    box.append(k);
  }
}

function beimGemeinschaftsBelohnung(z) {
  const e = holeGemeinschaftsBelohnung(z);
  if (!e) return;
  sound.stern();
  setTimeout(() => sound.erfolg(), 350);
  konfetti($("spielfeld"));
  const teile = [];
  if (e.herzen) teile.push(`+${format(e.herzen)} ${herz()}`);
  if (e.seasonPunkte) teile.push(`+${format(e.seasonPunkte)} Season-Punkte`);
  if (e.sticker.length) teile.push(`${e.sticker.length} Sticker: ${e.sticker.map(s => s.sticker.emoji).join(" ")}`);
  meldung("🎉 Gemeinschaftsziel geschafft!", teile.join(" · "));
  for (const s of e.sticker) if (s.seiteFertig) meldeSticker(s);
  for (const stufe of e.stufen) meldeSeasonStufe(stufe);
  pruefeErfolgeUndStatistik();
  speichern();
  aktualisiereAnzeige();
  zeigeGemeinschaftsziel(z);
}

// Wird mit der Bestenliste aufgerufen (main.js)
async function ladeGemeinschaftsziel() {
  if (!verwaltungMoeglich()) return;
  try { zeigeGemeinschaftsziel(await holeGemeinschaftsziel()); } catch (e) { /* ohne Gemeinschaftsziel-Tabellen: Karte bleibt weg */ }
}

// Kurz nach dem Start: Ziel erreicht und Belohnung noch nicht abgeholt? Dann Bescheid sagen.
async function pruefeGemeinschaftsziel() {
  if (!verwaltungMoeglich() || !mitglied) return;
  try {
    const z = await holeGemeinschaftsziel();
    if (gemeinschaftszielAbholbar(z)) {
      sound.erfolg();
      meldung(`🎉 Gemeinschaftsziel geschafft: ${z.titel}`, "Alle zusammen haben es geschafft! Hol dir deine Belohnung in der Bestenliste 🏅");
    }
  } catch (e) { /* offline */ }
}

// =====================================================
//  EINRICHTEN (aus main.js)
// =====================================================

function richteVerwaltungEin() {
  if (!verwaltungMoeglich()) return;   // ohne Internet-Adresse (z.B. file://) keine Datenbank
  $("codeBereich").hidden = false;

  // Versteckter Zugang: NUR das Logo 10 Sekunden gedrückt halten (das Logo wird dabei langsam kleiner)
  const titel = $("titel");
  let druckTimer = null;
  const loslassen = () => { clearTimeout(druckTimer); titel.classList.remove("gedrueckt"); };
  for (const teil of titel.querySelectorAll(".logo-marie, .logo-clicker")) {
    teil.addEventListener("pointerdown", () => {
      loslassen();
      titel.classList.add("gedrueckt");
      druckTimer = setTimeout(() => {
        loslassen();
        if (navigator.vibrate) navigator.vibrate(60);
        oeffneAdmin();
      }, ADMIN_DRUECKEN_MS);
    });
    for (const ende of ["pointerup", "pointerleave", "pointercancel"]) teil.addEventListener(ende, loslassen);
    teil.addEventListener("contextmenu", e => e.preventDefault());   // kein Menü bei langem Drücken
  }

  $("adminZu").addEventListener("click", schliesseAdmin);
  $("adminAnmelden").addEventListener("click", beimAdminAnmelden);
  $("adminPinEingabe").addEventListener("keydown", e => { if (e.key === "Enter") beimAdminAnmelden(); });
  for (const b of $("adminReiter").children) {
    b.addEventListener("click", () => { sound.klick(); zeigeAdminReiter(b.dataset.reiter); });
  }

  $("nachrichtOk").addEventListener("click", () => {
    merkeNachrichtGesehen($("nachrichtOverlay").dataset.id);
    $("nachrichtOverlay").hidden = true;
    sound.klick();
    setTimeout(pruefeNeuigkeiten, 600);   // vielleicht wartet noch eine Umfrage
  });
  $("umfrageZu").addEventListener("click", () => {
    if (aktuelleUmfrage && (aktuelleUmfrage.meine === null || aktuelleUmfrage.meine === undefined)) umfrageSpaeter = true;
    $("umfrageOverlay").hidden = true;
    sound.klick();
  });

  $("codeEinloesen").addEventListener("click", beimCodeEinloesen);
  $("codeEingabe").addEventListener("keydown", e => { if (e.key === "Enter") beimCodeEinloesen(); });

  setTimeout(pruefeGemeinschaftsziel, 12000);

  // Neuigkeiten: kurz nach dem Start, beim Zurückkommen und alle 30 Minuten
  setTimeout(pruefeNeuigkeiten, 6000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(pruefeNeuigkeiten, 2000); });
  setInterval(pruefeNeuigkeiten, VERWALTUNG.wieOftPruefenMin * 60 * 1000);
}
