"use strict";
// =====================================================
//  SPIELHALLE – die Minispiele auf dem Bildschirm
//  (Regeln und Belohnungen: minispiele.js)
//
//  Alle drei Spiele laufen im selben Fenster (#spielOverlay):
//  Kopf mit Titel, Info-Zeile, Spielfläche und am Ende das Ergebnis.
// =====================================================

let laufendesSpiel = null;   // { id, stopp() } – damit "✕" alles sauber anhält
let spielEndeMelden = null;  // Rückruf aus main.js: (ergebnis) => Meldungen, Erfolge, Speichern

// ----- Übersicht auf der Seite "Minispiele" -----

function rekordText(id) {
  const best = minispielStand().best[id];
  if (best === undefined) return "Noch nicht gespielt";
  if (id === "memory") return `🏆 Rekord: ${best} Züge`;
  if (id === "finde") return `🏆 Rekord: ${best.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Sekunden`;
  return `🏆 Rekord: ${best} Punkte`;
}

function minispielName(spielDef) {
  return spielDef.id === "finde" ? `Finde ${figurName()}` : spielDef.name;
}

function zeigeSpieleListe(beimStart) {
  const liste = $("spieleListe");
  liste.textContent = "";
  for (const s of MINISPIEL_LISTE) {
    const karte = document.createElement("div");
    karte.className = "spielEintrag";
    const gesperrt = minispielGesperrt(s.id);
    const uebrig = volleBelohnungenUebrig(s.id);
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "knopf haupt";
    knopf.textContent = "▶ Spielen";
    knopf.disabled = Boolean(gesperrt);
    knopf.addEventListener("click", () => beimStart(s.id));
    karte.append(
      span("spielIcon", s.icon),
      span("spielName", minispielName(s)),
      span("spielBeschr", gesperrt ? `🔒 ${gesperrt}` : mitName(s.beschr)),
      span("spielRekord", `${rekordText(s.id)} · ${uebrig > 0 ? `heute noch ${uebrig}× volle Belohnung` : "heute nur noch kleine Belohnung"}`),
      knopf,
    );
    liste.append(karte);
  }
}

// ----- Das Spielfenster -----

function oeffneMinispiel(id, beimEnde) {
  spielEndeMelden = beimEnde;
  const spielDef = MINISPIEL_LISTE.find(s => s.id === id);
  setzeText($("spielTitel"), `${spielDef.icon} ${minispielName(spielDef)}`);
  $("spielErgebnis").hidden = true;
  $("spielFlaeche").hidden = false;
  $("spielFlaeche").textContent = "";
  $("spielFlaeche").className = `spielFlaeche spiel-${id}`;
  $("spielInfo").textContent = "";
  $("spielOverlay").hidden = false;
  $("spielOverlay").dataset.spiel = id;
  const starte = { memory: spieleMemory, finde: spieleFinde, fangen: spieleFangen }[id];
  laufendesSpiel = { id, stopp: starte(wert => beendeSpiel(id, wert)) || (() => {}) };
}

function stoppeSpiel() {
  if (laufendesSpiel) laufendesSpiel.stopp();
  laufendesSpiel = null;
}

function schliesseMinispiel() {
  stoppeSpiel();
  $("spielOverlay").hidden = true;
}

function beendeSpiel(id, wert) {
  stoppeSpiel();
  const ergebnis = beendeMinispiel(id, wert);
  if (spielEndeMelden) spielEndeMelden(ergebnis);

  let titel = "🎉 Geschafft!";
  let text;
  if (id === "memory") text = `Alle Paare gefunden – in ${wert} Zügen!`;
  else if (id === "finde") text = `Alle 5 Runden in ${wert.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Sekunden!`;
  else {
    const t = haustier();
    titel = wert >= 25 ? "🎉 Super gefangen!" : "😋 Lecker!";
    text = `${t ? t.name : "Dein Tier"} hat ${wert} Punkte gefangen und ist jetzt satter.`;
    if (ergebnis.tier && ergebnis.tier.aufgestiegen) text += ` Level ${t.level}!`;
  }
  if (ergebnis.rekord) titel = "🏆 Neuer Rekord!";

  const zeilen = [`+${format(ergebnis.herzen)} ${herz()}`];
  if (ergebnis.seasonPunkte) zeilen.push(`+${format(ergebnis.seasonPunkte)} ${aktiverSeasonPass().icon}`);
  setzeText($("spielErgebnisTitel"), titel);
  setzeText($("spielErgebnisText"), ergebnis.voll ? text : `${text} (Heute schon oft gespielt – darum gibt es jetzt weniger.)`);
  $("spielBelohnung").textContent = zeilen.join("\n");
  $("spielFlaeche").hidden = true;
  $("spielInfo").textContent = "";
  $("spielErgebnis").hidden = false;
  sound.erfolg();
  konfetti($("spielErgebnis"));
}

// =====================================================
//  1) STICKER-MEMORY
// =====================================================

function spieleMemory(fertig) {
  const flaeche = $("spielFlaeche");
  const raster = document.createElement("div");
  raster.className = "memoryRaster";
  flaeche.append(raster);

  const paare = MINISPIELE.memory.paare;
  let offen = [], gefunden = 0, zuege = 0, gesperrt = false;
  const timer = [];
  const zeigeInfo = () => setzeText($("spielInfo"), `Züge: ${zuege} · Paare: ${gefunden} / ${paare}`);
  zeigeInfo();

  for (const sticker of memoryKarten()) {
    const karte = document.createElement("button");
    karte.type = "button";
    karte.className = "memoryKarte";
    karte.setAttribute("aria-label", "Verdeckte Karte");
    karte.append(span("hinten", "💖"), span("vorne", sticker.emoji));
    karte.addEventListener("click", () => {
      if (gesperrt || karte.classList.contains("offen")) return;
      karte.classList.add("offen");
      karte.setAttribute("aria-label", sticker.name);
      spieleTon(700 + offen.length * 200, 0.06, "sine", 0.1);
      offen.push({ karte, sticker });
      if (offen.length < 2) return;

      zuege++;
      const [a, b] = offen;
      offen = [];
      if (a.sticker.id === b.sticker.id) {
        gefunden++;
        a.karte.classList.add("gefunden");
        b.karte.classList.add("gefunden");
        sound.kauf();
        zeigeInfo();
        if (gefunden === paare) timer.push(setTimeout(() => fertig(zuege), 700));
      } else {
        gesperrt = true;
        zeigeInfo();
        timer.push(setTimeout(() => {
          for (const { karte: k } of [a, b]) { k.classList.remove("offen"); k.setAttribute("aria-label", "Verdeckte Karte"); }
          gesperrt = false;
        }, 850));
      }
    });
    raster.append(karte);
  }
  return () => timer.forEach(clearTimeout);
}

// =====================================================
//  2) FINDE MARIE / HANNAH
// =====================================================

// Die Figur als kleiner Kopf – mit anderer Haarfarbe und anderem Hut (für die Doppelgängerinnen)
function figurKopfHtml(haar, hutSvg, nummer) {
  const svg = ui.marie.querySelector("svg").cloneNode(true);
  svg.querySelector("#haarHell").setAttribute("stop-color", haar[0]);
  svg.querySelector("#haarDunkel").setAttribute("stop-color", haar[1]);
  svg.querySelector("#hut").innerHTML = hutSvg;
  svg.setAttribute("viewBox", "12 -6 176 176");   // nur Kopf und Schultern
  return svg.outerHTML
    .replace(/id="([^"]+)"/g, `id="f${nummer}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#f${nummer}-$1)`);
}

function spieleFinde(fertig) {
  const flaeche = $("spielFlaeche");
  const figur = aktiverSkin("figur");
  const zielHaar = aktiverSkin("haarfarbe").haar || figur.aussehen.haar;
  const zielHut = aktuellerHut().svg;
  const huete = ["", ...SKINS.filter(s => s.kategorie === "hut").map(s => s.svg)];
  const andereHaare = FINDE_HAARFARBEN.filter(h => h[0] !== zielHaar[0]);
  const runden = MINISPIELE.finde.figuren;

  let runde = 0;
  let start = Date.now();
  let strafe = 0;
  const sekunden = () => (Date.now() - start) / 1000 + strafe;

  // Info: Vorschau, wen man suchen soll, plus Runde und Zeit
  const info = $("spielInfo");
  info.textContent = "";
  const vorschau = span("findeVorschau");
  vorschau.innerHTML = figurKopfHtml(zielHaar, zielHut, "v");
  const text = span("findeText");
  info.append(span("findeLabel", "Finde:"), vorschau, text);
  const zeigeInfo = () => setzeText(text, `Runde ${Math.min(runde + 1, runden.length)} / ${runden.length} · ⏱ ${sekunden().toFixed(1).replace(".", ",")} s`);
  const uhr = setInterval(zeigeInfo, 100);

  function baueRunde() {
    flaeche.textContent = "";
    const anzahl = runden[runde];
    const breite = flaeche.clientWidth, hoehe = flaeche.clientHeight;
    const spalten = Math.ceil(Math.sqrt(anzahl * breite / Math.max(1, hoehe)));
    const zeilen = Math.ceil(anzahl / spalten);
    const zelleB = breite / spalten, zelleH = hoehe / zeilen;
    const groesse = Math.min(zelleB, zelleH) * 0.92;
    const zellen = mische([...Array(spalten * zeilen).keys()]).slice(0, anzahl);
    const zielIndex = Math.floor(Math.random() * anzahl);

    zellen.forEach((zelle, i) => {
      const istZiel = i === zielIndex;
      let haar = zufallAus(andereHaare), hut = zufallAus(huete);
      // ab Runde 3: manche haben dieselben Haare, aber einen anderen Hut
      if (!istZiel && runde >= 2 && Math.random() < 0.3) {
        haar = zielHaar;
        const andereHuete = huete.filter(h => h !== zielHut);
        hut = zufallAus(andereHuete);
      }
      const knopf = document.createElement("button");
      knopf.type = "button";
      knopf.className = "findeFigur";
      knopf.style.width = knopf.style.height = `${groesse}px`;
      const x = (zelle % spalten) * zelleB + (zelleB - groesse) * Math.random();
      const y = Math.floor(zelle / spalten) * zelleH + (zelleH - groesse) * Math.random();
      knopf.style.transform = `translate(${x}px, ${y}px)`;
      knopf.innerHTML = istZiel ? figurKopfHtml(zielHaar, zielHut, `${runde}-${i}`) : figurKopfHtml(haar, hut, `${runde}-${i}`);
      knopf.setAttribute("aria-label", istZiel ? figurName() : "Jemand anderes");
      knopf.addEventListener("click", () => {
        if (istZiel) {
          sound.stern();
          runde++;
          if (runde >= runden.length) {
            clearInterval(uhr);
            fertig(Math.round(sekunden() * 10) / 10);
          } else {
            baueRunde();
          }
        } else {
          sound.fehler();
          strafe += MINISPIELE.finde.strafeSek;
          knopf.classList.remove("falsch");
          void knopf.offsetWidth;
          knopf.classList.add("falsch");
        }
      });
      flaeche.append(knopf);
    });
  }

  // Erst bauen, wenn die Fläche ihre Größe hat
  const startTimer = setTimeout(() => { start = Date.now(); baueRunde(); zeigeInfo(); }, 50);
  return () => { clearInterval(uhr); clearTimeout(startTimer); };
}

// =====================================================
//  3) LECKERLI-FANGEN MIT DEM HAUSTIER
// =====================================================

function spieleFangen(fertig) {
  const flaeche = $("spielFlaeche");
  const t = haustier();
  const art = tierArt(t);
  const cfg = MINISPIELE.fangen;

  const tierEl = document.createElement("div");
  tierEl.className = "fangTier";
  zeichneTier(tierEl, t);   // mit Zubehör
  flaeche.append(tierEl);

  let tierX = 0.5, zielX = 0.5;     // 0 = ganz links, 1 = ganz rechts
  let punkte = 0;
  const teile = [];                  // { el, x, y, tempo, wert }
  const ende = Date.now() + cfg.dauerSek * 1000;
  let naechstes = 0, letzteZeit = performance.now(), animation = 0, vorbei = false;

  const zeigeInfo = () => setzeText($("spielInfo"),
    `⏱ ${Math.max(0, Math.ceil((ende - Date.now()) / 1000))} s · ${art.leckerli.icon} ${punkte} Punkte · 🌶️ meiden!`);
  zeigeInfo();

  // Steuern: Finger/Maus über die Fläche ziehen, oder Pfeiltasten
  const zeige = e => {
    const r = flaeche.getBoundingClientRect();
    zielX = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };
  flaeche.addEventListener("pointermove", zeige);
  flaeche.addEventListener("pointerdown", zeige);
  const tasten = e => {
    if (e.key === "ArrowLeft") zielX = Math.max(0, tierX - 0.15);
    if (e.key === "ArrowRight") zielX = Math.min(1, tierX + 0.15);
  };
  document.addEventListener("keydown", tasten);

  function neuesTeil(fortschritt) {
    const z = Math.random();
    const typ = z < cfg.chiliChance ? "chili" : z < cfg.chiliChance + cfg.festmahlChance ? "festmahl" : "leckerli";
    const el = span(`fangTeil ${typ}`, typ === "chili" ? "🌶️" : typ === "festmahl" ? art.festmahl.icon : art.leckerli.icon);
    flaeche.append(el);
    teile.push({ el, typ, x: 0.06 + Math.random() * 0.88, y: -0.08,
                 tempo: 0.32 + fortschritt * 0.38 + Math.random() * 0.12,
                 wert: typ === "chili" ? -3 : typ === "festmahl" ? 3 : 1 });
  }

  function schritt() {
    if (vorbei) return;
    // Selbst messen (der Zeitstempel von requestAnimationFrame kann hinter performance.now() liegen)
    const jetzt = performance.now();
    const dt = Math.max(0, Math.min(0.1, (jetzt - letzteZeit) / 1000));
    letzteZeit = jetzt;
    const rest = ende - Date.now();
    const fortschritt = 1 - rest / (cfg.dauerSek * 1000);
    const b = flaeche.clientWidth, h = flaeche.clientHeight;

    // Tier gleitet zum Finger
    tierX += (zielX - tierX) * Math.min(1, dt * 12);
    tierEl.style.transform = `translate(${tierX * b}px, 0) translateX(-50%)`;

    // Neue Teile – mit der Zeit immer öfter
    naechstes -= dt;
    if (naechstes <= 0 && rest > 600) {
      neuesTeil(fortschritt);
      naechstes = 0.75 - fortschritt * 0.4;
    }

    // Teile fallen lassen und fangen
    for (let i = teile.length - 1; i >= 0; i--) {
      const teil = teile[i];
      teil.y += teil.tempo * dt;
      teil.el.style.transform = `translate(${teil.x * b}px, ${teil.y * h}px) translateX(-50%)`;
      const gefangen = teil.y > 0.78 && teil.y < 0.94 && Math.abs(teil.x - tierX) < 0.12;
      if (gefangen) {
        punkte = Math.max(0, punkte + teil.wert);
        if (teil.wert < 0) {
          sound.fehler();
          tierEl.classList.remove("autsch"); void tierEl.offsetWidth; tierEl.classList.add("autsch");
        } else {
          spieleTon(660 + Math.min(punkte, 40) * 18, 0.08, "sine", 0.12);
          tierEl.classList.remove("happs"); void tierEl.offsetWidth; tierEl.classList.add("happs");
        }
        const r = flaeche.getBoundingClientRect();
        zeigeSchwebeText({ x: r.left + teil.x * b - 10, y: r.top + teil.y * h - 20 }, teil.wert > 0 ? `+${teil.wert}` : `${teil.wert} 🔥`);
      }
      if (gefangen || teil.y > 1.05) {
        teil.el.remove();
        teile.splice(i, 1);
      }
    }
    zeigeInfo();

    if (rest <= 0) {
      vorbei = true;
      fertig(punkte);
      return;
    }
    animation = requestAnimationFrame(schritt);
  }
  animation = requestAnimationFrame(schritt);

  return () => {
    vorbei = true;
    cancelAnimationFrame(animation);
    document.removeEventListener("keydown", tasten);
  };
}
