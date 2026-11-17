"use strict";
// =====================================================
//  SKINS & SEASON-PÄSSE
//
//  Vier Kategorien: Hintergrund, Hut, HUD, Musik.
//  Am Anfang ist nur der "normale" Skin jeder Kategorie freigeschaltet
//  (standard: true). Weitere Skins kommen später über Season-Pässe.
//
//  ── So fügst du einen neuen Skin hinzu ──────────────
//  1. Eintrag in SKINS anlegen, mit season: "<id des Season-Passes>"
//  2. Je nach Kategorie:
//     • hintergrund: CSS-Regeln für body[data-hintergrund="<wert>"] in style.css
//     • hut:         SVG-Code im Feld "svg" (Koordinaten wie in Maries Zeichnung,
//                    viewBox -10 0 220 220, Kopf-Oberkante bei etwa y = 34)
//     • hud:         Farben im Feld "farben" (CSS-Variablen aus style.css :root)
//     • musik:       Noten im Feld "musik" (wie SPIELUHR unten)
//  3. Die Skin-ID beim Season-Pass in SEASON_PAESSE eintragen.
//  4. In js/version.js die Versionsnummer erhöhen.
// =====================================================

const SKIN_KATEGORIEN = [
  { id: "hintergrund", name: "Hintergrund",   icon: "🖼️" },
  { id: "hut",         name: "Hut für Marie", icon: "👒" },
  { id: "hud",         name: "HUD-Farben",    icon: "🎨" },
  { id: "musik",       name: "Musik",         icon: "🎵" },
];

// ----- Musikstücke -----
// Noten als [Name, Länge in Achteln]. null = Pause. Jeder Takt = 8 Achtel.

// "Spieluhr" – Akkorde: C – Am – F – G | C – Am – F/G – C
const SPIELUHR = {
  achtelSek: 0.27,
  melodie: [
    ["E5", 1], ["G5", 1], ["C6", 2], ["G5", 1], ["E5", 1], ["G5", 2],   // C
    ["A5", 1], ["C6", 1], ["E5", 2], ["A5", 2], ["G5", 2],              // Am
    ["F5", 1], ["A5", 1], ["C6", 2], ["A5", 1], ["F5", 1], ["A5", 2],   // F
    ["G5", 2], ["B5", 1], ["D6", 1], ["B5", 2], ["G5", 2],              // G
    ["E5", 1], ["G5", 1], ["C6", 2], ["D6", 1], ["C6", 1], ["B5", 1], ["A5", 1],   // C
    ["A5", 2], ["E5", 2], ["C6", 2], ["A5", 2],                         // Am
    ["F5", 1], ["A5", 1], ["C6", 1], ["A5", 1], ["G5", 1], ["B5", 1], ["D6", 1], ["B5", 1],   // F – G
    ["C6", 4], ["G5", 2], [null, 2],                                    // C
  ],
  // Bass: Grundton und Quinte
  bass: [
    ["C3", 4], ["G3", 4],  ["A2", 4], ["E3", 4],
    ["F2", 4], ["C3", 4],  ["G2", 4], ["D3", 4],
    ["C3", 4], ["G3", 4],  ["A2", 4], ["E3", 4],
    ["F2", 4], ["G2", 4],  ["C3", 4], ["C3", 4],
  ],
};

// "Erntedank-Walzer" (Season 1) – ¾-Takt: 6 Achtel pro Takt
// Akkorde: G – C – D – G | Em – C – D – G
const ERNTEDANK_WALZER = {
  achtelSek: 0.24,
  melodie: [
    ["D5", 2], ["G5", 2], ["B5", 2],      // G
    ["C6", 3], ["B5", 1], ["A5", 2],      // C
    ["A5", 2], ["F#5", 2], ["D5", 2],     // D
    ["G5", 4], [null, 2],                 // G
    ["E5", 2], ["G5", 2], ["B5", 2],      // Em
    ["E6", 3], ["D6", 1], ["C6", 2],      // C
    ["B5", 2], ["A5", 2], ["F#5", 2],     // D
    ["G5", 4], ["D5", 2],                 // G
  ],
  // Walzer-Bass "Umm – pa – pa"
  bass: [
    ["G2", 2], ["D3", 2], ["D3", 2],
    ["C3", 2], ["G3", 2], ["G3", 2],
    ["D3", 2], ["A3", 2], ["A3", 2],
    ["G2", 2], ["D3", 2], ["D3", 2],
    ["E2", 2], ["B2", 2], ["B2", 2],
    ["C3", 2], ["G3", 2], ["G3", 2],
    ["D3", 2], ["A3", 2], ["A3", 2],
    ["G2", 2], ["D3", 2], ["B2", 2],
  ],
};

// "Glöckchen-Melodie" (Season 2) – helle, hüpfende Glöckchen
// Akkorde: C – F – G – C | Am – F – G – C
const GLOECKCHEN = {
  achtelSek: 0.25,
  melodie: [
    ["G5", 1], ["G5", 1], ["E6", 2], ["D6", 1], ["C6", 1], ["G5", 2],   // C
    ["A5", 1], ["A5", 1], ["F6", 2], ["E6", 1], ["D6", 1], ["A5", 2],   // F
    ["B5", 1], ["D6", 1], ["G6", 2], ["F6", 1], ["E6", 1], ["D6", 2],   // G
    ["E6", 2], ["C6", 2], ["G5", 2], [null, 2],                         // C
    ["A5", 1], ["C6", 1], ["E6", 2], ["D6", 1], ["C6", 1], ["A5", 2],   // Am
    ["F5", 1], ["A5", 1], ["C6", 2], ["D6", 1], ["C6", 1], ["A5", 2],   // F
    ["G5", 1], ["B5", 1], ["D6", 1], ["F6", 1], ["E6", 1], ["D6", 1], ["B5", 2],   // G
    ["C6", 4], ["G5", 2], ["C6", 2],                                    // C
  ],
  bass: [
    ["C3", 4], ["G2", 4],  ["F2", 4], ["C3", 4],
    ["G2", 4], ["D3", 4],  ["C3", 4], ["G2", 4],
    ["A2", 4], ["E3", 4],  ["F2", 4], ["C3", 4],
    ["G2", 4], ["B2", 4],  ["C3", 4], ["C3", 4],
  ],
};

// ----- Alle Skins -----

const SKINS = [
  // Hintergrund – das Aussehen steht in style.css (body[data-hintergrund="..."])
  { id: "hintergrund-normal", kategorie: "hintergrund", standard: true,
    name: "Herzchen-Wolke", icon: "💗", wert: "normal" },

  // Hut – SVG-Code, der auf Maries Kopf gezeichnet wird
  { id: "hut-normal", kategorie: "hut", standard: true,
    name: "Rosa Schleife", icon: "🎀",
    svg: `<g transform="translate(140 46) rotate(20)">
            <path d="M0 0 L-24 -14 Q-29 0 -24 14 Z" fill="#ff4f9a"/>
            <path d="M0 0 L24 -14 Q29 0 24 14 Z" fill="#ff4f9a"/>
            <path d="M-20 -8 Q-23 0 -20 8 M20 -8 Q23 0 20 8" stroke="#ff9cc9" stroke-width="2" fill="none"/>
            <circle r="7" fill="#ff7eb6"/>
          </g>` },

  // HUD – Farben (CSS-Variablen) und Symbole der Oberfläche. Leer = Standard aus style.css/index.html
  { id: "hud-normal", kategorie: "hud", standard: true,
    name: "Zuckerwatte", icon: "🍬", farben: {}, symbole: {} },

  // Musik
  { id: "musik-normal", kategorie: "musik", standard: true,
    name: "Spieluhr", icon: "🎶", musik: SPIELUHR },

  // ───────── Season 1: Thanksgiving ─────────

  // Pilgerhut: schwarzer Hut mit braunem Band, goldener Schnalle und Herbstblatt
  { id: "hut-pilgerhut", kategorie: "hut", season: "s1",
    name: "Pilgerhut", icon: "🎩",
    svg: `<g transform="rotate(-6 100 40)">
            <ellipse cx="100" cy="41" rx="54" ry="10" fill="#2f2622"/>
            <path d="M71 41 L77 4 Q100 0 123 4 L129 41 Z" fill="#3a2f2a"/>
            <path d="M74 31 L126 31 L127.5 39 L72.5 39 Z" fill="#8b5a2b"/>
            <rect x="91" y="28" width="18" height="14" rx="2" fill="none" stroke="#f5c542" stroke-width="3.5"/>
            <path d="M80 10 Q86 8 90 9" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none" stroke-linecap="round"/>
            <g transform="translate(116 22) rotate(30) scale(.75)">
              <path d="M0 -12 C7 -8 9 0 0 10 C-9 0 -7 -8 0 -12 Z" fill="#e8772e"/>
              <path d="M0 -10 V10" stroke="#a0461c" stroke-width="1.5"/>
            </g>
          </g>` },

  { id: "musik-erntedank", kategorie: "musik", season: "s1",
    name: "Erntedank-Walzer", icon: "🎻", musik: ERNTEDANK_WALZER },

  { id: "hud-herbstlaub", kategorie: "hud", season: "s1",
    name: "Herbstlaub", icon: "🍂",
    farben: {
      "--hintergrund": "#fff1e0", "--hintergrund-2": "#ffe2c2", "--panel": "#fff8ef",
      "--karte-hover": "#fff0dc", "--karte-upgrade": "#fff6dc", "--rand": "#f2c79a",
      "--akzent": "#e8772e", "--akzent-dunkel": "#b4521b", "--lila": "#c0843d",
      "--text": "#4a2c17", "--text-sanft": "#8a6446", "--gold": "#e0a526",
      "--schatten": "0 4px 14px rgba(180, 82, 27, 0.15)",
      "--logo-1": "#ffd27a", "--logo-2": "#e8772e", "--logo-3": "#a0461c",
      "--medaillon-1": "#ffdcb0", "--medaillon-2": "#f7c08f",
    },
    // Symbole: Schlüssel = data-symbol in index.html, "herz" = Währungssymbol
    symbole: { herz: "🧡", marie: "🦃", shop: "🧺", skins: "🍁", erfolge: "🏆", statistik: "📜" } },

  { id: "hintergrund-herbst", kategorie: "hintergrund", season: "s1",
    name: "Blätterregen", icon: "🍁", wert: "herbst" },

  // ───────── Season 2: Weihnachten ─────────

  // Weihnachtsmütze: rote Mütze, Spitze hängt nach rechts, weißer Pelzrand und Bommel
  { id: "hut-weihnachtsmuetze", kategorie: "hut", season: "s2",
    name: "Weihnachtsmütze", icon: "🎅",
    svg: `<g transform="rotate(-5 100 40)">
            <path d="M54 40 C56 8 92 -4 124 4 C150 11 168 32 172 58 L160 60 C154 42 146 36 146 40 Z" fill="#e53946"/>
            <path d="M120 6 C146 13 162 32 166 54 L160 56 C156 38 144 24 124 14 Z" fill="#c42a37"/>
            <path d="M70 18 Q86 6 104 6" stroke="#fff" stroke-opacity=".3" stroke-width="4" fill="none" stroke-linecap="round"/>
            <rect x="46" y="30" width="108" height="18" rx="9" fill="#ffffff"/>
            <circle cx="56" cy="34" r="4" fill="#eef1f6"/><circle cx="80" cy="44" r="4" fill="#eef1f6"/>
            <circle cx="108" cy="35" r="4" fill="#eef1f6"/><circle cx="138" cy="43" r="4" fill="#eef1f6"/>
            <circle cx="170" cy="62" r="11" fill="#ffffff"/>
            <circle cx="167" cy="59" r="4" fill="#eef1f6"/>
          </g>` },

  { id: "musik-gloeckchen", kategorie: "musik", season: "s2",
    name: "Glöckchen-Melodie", icon: "🔔", musik: GLOECKCHEN },

  { id: "hud-winterzauber", kategorie: "hud", season: "s2",
    name: "Winterzauber", icon: "🎄",
    farben: {
      "--hintergrund": "#eef6ff", "--hintergrund-2": "#ece6ff", "--panel": "#f7fbff",
      "--karte-hover": "#eef5ff", "--karte-upgrade": "#fff8e6", "--rand": "#c3d8f2",
      "--akzent": "#d63a4a", "--akzent-dunkel": "#a3202f", "--lila": "#2f8f5b",
      "--text": "#23324d", "--text-sanft": "#5f6f8c", "--gold": "#e5b53a",
      "--schatten": "0 4px 14px rgba(40, 70, 130, 0.15)",
      "--logo-1": "#ff9a9a", "--logo-2": "#d63a4a", "--logo-3": "#2f8f5b",
      "--medaillon-1": "#dbe9ff", "--medaillon-2": "#f1e1ff",
    },
    symbole: { herz: "❤️", marie: "⛄", shop: "🎁", skins: "🎄", erfolge: "⭐" } },

  { id: "hintergrund-schnee", kategorie: "hintergrund", season: "s2",
    name: "Schneefall", icon: "❄️", wert: "schnee" },
];

// ----- Season-Pässe -----
// start/ende in Ortszeit des Geräts. "ende" ist der erste Moment, an dem der Pass NICHT mehr läuft.
const SEASON_PAESSE = [
  {
    id: "s1",
    name: "Season 1: Thanksgiving",
    icon: "🦃",
    start: "2026-11-01T00:00:00",
    ende:  "2026-12-01T00:00:00",   // = bis einschließlich 30. November
    stufen: 50,
    // Klicks für Stufe n: klicksBasis + klicksProStufe · n
    // -> Stufe 1: 700 Klicks … Stufe 50: 2.170 Klicks, zusammen ~71.750 Klicks
    // -> bei durchschnittlich 2 Klicks pro Sekunde etwa 10 Stunden
    klicksBasis: 670,
    klicksProStufe: 30,
    // Auf diesen Stufen gibt es Skins, auf allen anderen Herzen
    skinBelohnungen: { 10: "hut-pilgerhut", 20: "musik-erntedank", 30: "hud-herbstlaub", 50: "hintergrund-herbst" },
    // Farben der Season-Seite (Kopf, Fortschrittsbalken)
    design: {
      "--season-kopf-1": "#fff3e0", "--season-kopf-2": "#ffe0c4", "--season-text": "#5a3317",
      "--season-akzent": "#c2581e", "--season-balken-1": "#ffb347", "--season-balken-2": "#e8772e",
    },
  },
  {
    id: "s2",
    name: "Season 2: Weihnachten",
    icon: "🎅",
    start: "2026-12-01T00:00:00",
    ende:  "2027-01-01T00:00:00",   // = bis einschließlich 31. Dezember
    stufen: 50,
    // Wie Season 1: ~71.750 Klicks ≈ 10 Stunden bei 2 Klicks pro Sekunde
    klicksBasis: 670,
    klicksProStufe: 30,
    skinBelohnungen: { 10: "hut-weihnachtsmuetze", 20: "musik-gloeckchen", 30: "hud-winterzauber", 50: "hintergrund-schnee" },
    design: {
      "--season-kopf-1": "#eef6ff", "--season-kopf-2": "#dbe9ff", "--season-text": "#23324d",
      "--season-akzent": "#c62f3e", "--season-balken-1": "#ff8a8a", "--season-balken-2": "#d63a4a",
    },
  },
];

// =====================================================
//  ABFRAGEN & AKTIONEN (Spielstand der Skins steht in zustand.js: skinStand)
// =====================================================

function skinsDerKategorie(kategorie) {
  return SKINS.filter(s => s.kategorie === kategorie);
}

function skinFreigeschaltet(skin) {
  return skin.standard || skinStand.freigeschaltet.includes(skin.id);
}

// Der gewählte Skin einer Kategorie – oder der normale, falls nichts (Gültiges) gewählt ist
function aktiverSkin(kategorie) {
  const gewaehlt = SKINS.find(s => s.id === skinStand.aktiv[kategorie] && s.kategorie === kategorie);
  if (gewaehlt && skinFreigeschaltet(gewaehlt)) return gewaehlt;
  return SKINS.find(s => s.kategorie === kategorie && s.standard);
}

// Gibt true zurück, wenn der Skin gewählt werden konnte
function waehleSkin(skin) {
  if (!skinFreigeschaltet(skin)) return false;
  skinStand.aktiv[skin.kategorie] = skin.id;
  return true;
}

function schalteSkinFrei(skinId) {
  if (!skinStand.freigeschaltet.includes(skinId)) skinStand.freigeschaltet.push(skinId);
}

// Schaltet alle Skins eines Season-Passes auf einmal frei (z.B. für Tests oder Geschenk-Codes)
function schalteSeasonFrei(seasonId) {
  const pass = SEASON_PAESSE.find(p => p.id === seasonId);
  if (!pass) return false;
  Object.values(pass.skinBelohnungen).forEach(schalteSkinFrei);
  speichereSkins();
  return true;
}

function seasonName(seasonId) {
  const pass = SEASON_PAESSE.find(p => p.id === seasonId);
  return pass ? pass.name : "Season-Pass";
}

// =====================================================
//  SEASON-PASS: Stufen und Belohnungen
// =====================================================

// Der Pass, der gerade (laut Uhr des Geräts) läuft – oder undefined
function aktiverSeasonPass(jetzt = Date.now()) {
  return SEASON_PAESSE.find(p => jetzt >= Date.parse(p.start) && jetzt < Date.parse(p.ende));
}

function seasonRestMs(pass) {
  return Math.max(0, Date.parse(pass.ende) - Date.now());
}

// Letzter Tag der Season als Text, z.B. "31. Dezember"
function seasonLetzterTag(pass) {
  return new Date(Date.parse(pass.ende) - 1).toLocaleDateString("de-DE", { day: "numeric", month: "long" });
}

// Fortschritt eines Passes: erreichte Stufe + Klicks in der aktuellen Stufe
function seasonStand(pass) {
  if (!skinStand.seasons[pass.id]) skinStand.seasons[pass.id] = { stufe: 0, xp: 0 };
  return skinStand.seasons[pass.id];
}

function klicksFuerStufe(pass, n) {
  return pass.klicksBasis + pass.klicksProStufe * n;
}

// Rundet auf 2 "schöne" Stellen: 1234 -> 1200, 56789 -> 57000
function rundeHuebsch(x) {
  const stufe = Math.pow(10, Math.max(0, Math.floor(Math.log10(x)) - 1));
  return Math.round(x / stufe) * stufe;
}

// Herz-Belohnung für Stufe n – wächst mit dem aktuellen Fortschritt:
//   Produktion von (5,5 + 0,5·n) Minuten  +  Wert von (100 + 10·n) Klicks
//   -> Stufe 1: 5,5 Min. + 110 Klicks … Stufe 50: 30 Min. + 600 Klicks
// Ohne Sternschnuppen-Bonus gerechnet (sonst wäre es Zufall, wie viel man bekommt).
// Mindestens 50·n² Herzen, damit es sich auch ganz am Anfang lohnt.
function seasonHerzen(n, hps = basisHps(), proKlick = herzenProKlick() / aktuellerBonus().klickFaktor) {
  const sekunden = 300 + 30 * n;
  const klicks = 100 + 10 * n;
  const wert = hps * sekunden + proKlick * klicks;
  return rundeHuebsch(Math.max(50 * n * n, wert));
}

// Was gibt es auf Stufe n?  { typ: "skin", skin }  oder  { typ: "herzen", menge }
function seasonBelohnung(pass, n) {
  const skinId = pass.skinBelohnungen[n];
  if (skinId) return { typ: "skin", skin: SKINS.find(s => s.id === skinId) };
  return { typ: "herzen", menge: seasonHerzen(n) };
}

// Auf welcher Stufe gibt es diesen Skin? (für "🔒 Stufe 10")
function skinStufe(skin) {
  const pass = SEASON_PAESSE.find(p => p.id === skin.season);
  if (!pass) return null;
  const eintrag = Object.entries(pass.skinBelohnungen).find(([, id]) => id === skin.id);
  return eintrag ? Number(eintrag[0]) : null;
}

// Wird bei jedem Klick auf Marie aufgerufen. Gibt die neu erreichten Stufen zurück
// (meist leer) – die Belohnungen sind dann schon gutgeschrieben.
function seasonKlick(anzahl = 1) {
  const pass = aktiverSeasonPass();
  if (!pass) return [];
  const stand = seasonStand(pass);
  if (stand.stufe >= pass.stufen) return [];

  stand.xp += anzahl;
  const neu = [];
  while (stand.stufe < pass.stufen && stand.xp >= klicksFuerStufe(pass, stand.stufe + 1)) {
    stand.xp -= klicksFuerStufe(pass, stand.stufe + 1);
    stand.stufe++;
    const belohnung = seasonBelohnung(pass, stand.stufe);
    if (belohnung.typ === "herzen") {
      herzenDazu(belohnung.menge);
      // Merken, wie viel es gab – die Liste zeigt das bei erreichten Stufen an
      stand.herzen = stand.herzen || {};
      stand.herzen[stand.stufe] = belohnung.menge;
    } else {
      schalteSkinFrei(belohnung.skin.id);
    }
    neu.push({ pass, stufe: stand.stufe, belohnung });
  }
  if (stand.stufe >= pass.stufen) stand.xp = 0;
  if (neu.length) speichereSkins();
  return neu;
}
