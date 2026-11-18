"use strict";
// =====================================================
//  SKINS & SEASON-PÄSSE
//
//  Kategorien: Figur (Marie oder Hannah), Kleiderschrank (Kleid, Frisur, Haarfarbe –
//  siehe kleiderschrank.js), Hintergrund, Hut, HUD, Logo, Musik.
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
//     • logo:        krone (Zeichen auf dem "M"), deko (Zeichen rechts, "" = keins),
//                    funkeln (Zeichen der Sternchen) und farben (--logo-skin-*, siehe style.css)
//     • musik:       Noten im Feld "musik" (wie SPIELUHR unten)
//  3. Die Skin-ID beim Season-Pass in SEASON_PAESSE eintragen.
//  4. In js/version.js die Versionsnummer erhöhen.
// =====================================================

const SKIN_KATEGORIEN = [
  { id: "figur",       name: "Wer wird geklickt?", icon: "👧", ohneTeaser: true },
  { id: "kleid",       name: "Kleider",       icon: "👗" },
  { id: "frisur",      name: "Frisuren",      icon: "💇‍♀️" },
  { id: "haarfarbe",   name: "Haarfarben",    icon: "🌈" },
  { id: "hut",         name: "Hut",           icon: "👒" },
  { id: "hintergrund", name: "Hintergrund",   icon: "🖼️" },
  { id: "hud",         name: "HUD-Farben",    icon: "🎨" },
  { id: "logo",        name: "Logo",          icon: "✨" },
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

// "Happy Birthday" (gemeinfrei) – ¾-Takt, beginnt mit Auftakt "Hap-py"
// Akkorde: C – G – G – C | C – F – C – C
const HAPPY_BIRTHDAY = {
  achtelSek: 0.22,
  melodie: [
    ["G5", 1], ["G5", 1],                          // Auftakt
    ["A5", 2], ["G5", 2], ["C6", 2],               // birth-day to
    ["B5", 4], ["G5", 1], ["G5", 1],               // you, hap-py
    ["A5", 2], ["G5", 2], ["D6", 2],               // birth-day to
    ["C6", 4], ["G5", 1], ["G5", 1],               // you, hap-py
    ["G6", 2], ["E6", 2], ["C6", 2],               // birth-day, lie-be
    ["B5", 2], ["A5", 2], ["F6", 1], ["F6", 1],    // Ma-rie, hap-py
    ["E6", 2], ["C6", 2], ["D6", 2],               // birth-day to
    ["C6", 4], [null, 2], [null, 4],               // you!
  ],
  bass: [
    [null, 2],
    ["C3", 2], ["G3", 2], ["G3", 2],
    ["G2", 2], ["D3", 2], ["D3", 2],
    ["G2", 2], ["D3", 2], ["D3", 2],
    ["C3", 2], ["G3", 2], ["G3", 2],
    ["C3", 2], ["G3", 2], ["G3", 2],
    ["F2", 2], ["C3", 2], ["C3", 2],
    ["G2", 2], ["D3", 2], ["G2", 2],
    ["C3", 2], ["G3", 2], [null, 2], [null, 4],
  ],
};

// Bunter Partyhut mit Punkten und Bommel (Geburtstag)
const PARTYHUT_SVG = `<g transform="rotate(-10 100 44)">
  <path d="M64 46 L100 10 L136 46 Z" fill="#ff7eb6" stroke="#e0458f" stroke-width="2" stroke-linejoin="round"/>
  <path d="M76 36 L100 10 L88 44 Z" fill="#8ec5ff"/>
  <path d="M112 44 L100 10 L124 36 Z" fill="#ffe066"/>
  <circle cx="89" cy="30" r="3" fill="#fff"/><circle cx="109" cy="24" r="2.6" fill="#fff"/>
  <circle cx="118" cy="38" r="2.8" fill="#fff"/><circle cx="78" cy="41" r="2.4" fill="#fff"/>
  <circle cx="100" cy="36" r="2.6" fill="#fff"/>
  <ellipse cx="100" cy="46" rx="39" ry="6" fill="#ffd23f" stroke="#f0a500" stroke-width="2"/>
  <circle cx="100" cy="10" r="9" fill="#b56bff"/><circle cx="97" cy="7" r="3" fill="#fff" opacity=".6"/>
</g>`;

// ----- Alle Skins -----

const SKINS = [
  // Figur – beide sind von Anfang an frei. rufname steht im Logo und in allen Texten,
  // aussehen färbt die Zeichnung (Haare hell/dunkel, Kleid, Augen)
  { id: "figur-marie", kategorie: "figur", standard: true,
    name: "Marie", icon: "👧", rufname: "Marie",
    aussehen: { haar: ["#d4a373", "#b07d4f"], kleid: "#ff7eb6", augen: "#3b2240" } },
  { id: "figur-hannah", kategorie: "figur", standard: true,
    name: "Hannah", icon: "👱‍♀️", rufname: "Hannah",
    aussehen: { haar: ["#fbe39a", "#e3b14f"], kleid: "#b48cff", augen: "#2f4f8f" } },

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

  // Logo – leere Farben = die Logo-Farben des HUD-Skins
  { id: "logo-normal", kategorie: "logo", standard: true,
    name: "Prinzessin", icon: "👑", krone: "👑", deko: "", funkeln: "✦", farben: {} },

  // Musik
  { id: "musik-normal", kategorie: "musik", standard: true,
    name: "Spieluhr", icon: "🎶", musik: SPIELUHR },

  // ───────── Geburtstagsgeschenk (Marie 3. Februar, Hannah 8. Februar – siehe geburtstag.js) ─────────
  { id: "hut-partyhut", kategorie: "hut", geschenk: "geburtstag",
    name: "Partyhut", icon: "🥳", svg: PARTYHUT_SVG },
  { id: "musik-geburtstag", kategorie: "musik", geschenk: "geburtstag",
    name: "Happy Birthday", icon: "🎂", musik: HAPPY_BIRTHDAY },

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

  { id: "logo-erntedank", kategorie: "logo", season: "s1",
    name: "Erntedank-Logo", icon: "🦃", krone: "🍁", deko: "🦃", funkeln: "✦",
    farben: {
      "--logo-skin-1": "#ffd56b", "--logo-skin-2": "#e8772e", "--logo-skin-3": "#8f3d14",
      "--logo-schild-hg": "#fff3dc", "--logo-schild-text": "#a0461c", "--logo-schild-rand": "#f0b770",
      "--logo-funkeln": "#e0a526",
    } },

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

  { id: "logo-weihnachten", kategorie: "logo", season: "s2",
    name: "Weihnachts-Logo", icon: "🎄", krone: "⭐", deko: "🎄", funkeln: "❅",
    farben: {
      "--logo-skin-1": "#ff7b7b", "--logo-skin-2": "#d42a3c", "--logo-skin-3": "#1f7a45",
      "--logo-schild-hg": "#ffffff", "--logo-schild-text": "#1f7a45", "--logo-schild-rand": "#e05a66",
      "--logo-funkeln": "#7fb2ea",
    } },
];

// ----- Season-Logos (Banner oben im Season-Pass-Fenster) -----
const LOGO_SCHRIFT = `font-family="ui-rounded, 'Arial Rounded MT Bold', Nunito, 'Segoe UI', sans-serif"`;

const LOGO_THANKSGIVING = `
<svg viewBox="0 0 360 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Season 1: Thanksgiving">
  <defs>
    <linearGradient id="s1-band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffc56b"/><stop offset="1" stop-color="#e06a22"/>
    </linearGradient>
    <linearGradient id="s1-schrift" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffbe9"/><stop offset="1" stop-color="#ffd27a"/>
    </linearGradient>
  </defs>
  <!-- gefaltete Band-Enden -->
  <path d="M12 66 H60 V116 H12 L27 91 Z" fill="#a0461c"/>
  <path d="M348 66 H300 V116 H348 L333 91 Z" fill="#a0461c"/>
  <path d="M60 116 L46 104 H60 Z" fill="#6e2b0c"/>
  <path d="M300 116 L314 104 H300 Z" fill="#6e2b0c"/>
  <!-- Hauptband -->
  <rect x="42" y="52" width="276" height="70" rx="18" fill="url(#s1-band)" stroke="#8f3d14" stroke-width="4"/>
  <path d="M62 62 H298" stroke="#fff" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>
  <text x="180" y="105" text-anchor="middle" ${LOGO_SCHRIFT} font-size="35" font-weight="900"
        fill="url(#s1-schrift)" stroke="#8f3d14" stroke-width="7" stroke-linejoin="round" paint-order="stroke">Thanksgiving</text>
  <!-- Schild "SEASON 1" -->
  <rect x="124" y="33" width="112" height="28" rx="14" fill="#fff8ef" stroke="#8f3d14" stroke-width="3"/>
  <text x="180" y="52.5" text-anchor="middle" ${LOGO_SCHRIFT} font-size="14" font-weight="900" fill="#b4521b" letter-spacing="3">SEASON 1</text>
  <!-- Deko -->
  <text x="14" y="50" font-size="34">🍁</text>
  <text x="66" y="34" font-size="22">🍂</text>
  <text x="252" y="32" font-size="20">🍂</text>
  <text x="292" y="48" font-size="44">🦃</text>
  <text x="4" y="136" font-size="28">🌽</text>
  <text x="318" y="138" font-size="28">🥧</text>
</svg>`;

const LOGO_WEIHNACHTEN = `
<svg viewBox="0 0 360 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Season 2: Weihnachten">
  <defs>
    <linearGradient id="s2-band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#c0182b"/>
    </linearGradient>
    <linearGradient id="s2-schrift" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffbd6"/><stop offset="1" stop-color="#f5c542"/>
    </linearGradient>
  </defs>
  <!-- tannengrüne Band-Enden -->
  <path d="M12 66 H60 V116 H12 L27 91 Z" fill="#1f7a45"/>
  <path d="M348 66 H300 V116 H348 L333 91 Z" fill="#1f7a45"/>
  <path d="M60 116 L46 104 H60 Z" fill="#11512c"/>
  <path d="M300 116 L314 104 H300 Z" fill="#11512c"/>
  <!-- Hauptband -->
  <rect x="42" y="52" width="276" height="70" rx="18" fill="url(#s2-band)" stroke="#7d1220" stroke-width="4"/>
  <!-- Schneehaube -->
  <path d="M44 68 C42 56 52 50 62 51 H298 C308 50 318 56 316 68
           C308 62 300 72 290 66 C280 74 268 63 258 69 C248 75 236 63 226 69
           C214 75 204 63 192 69 C180 75 170 63 158 69 C146 75 136 63 124 69
           C112 75 100 63 90 69 C80 75 70 63 60 69 C54 73 47 72 44 68 Z" fill="#ffffff"/>
  <text x="180" y="110" text-anchor="middle" ${LOGO_SCHRIFT} font-size="35" font-weight="900"
        fill="url(#s2-schrift)" stroke="#7d1220" stroke-width="7" stroke-linejoin="round" paint-order="stroke">Weihnachten</text>
  <!-- Schild "SEASON 2" -->
  <rect x="124" y="31" width="112" height="28" rx="14" fill="#ffffff" stroke="#1f7a45" stroke-width="3"/>
  <text x="180" y="50.5" text-anchor="middle" ${LOGO_SCHRIFT} font-size="14" font-weight="900" fill="#1f7a45" letter-spacing="3">SEASON 2</text>
  <!-- Deko -->
  <text x="8" y="54" font-size="42">🎄</text>
  <text x="294" y="48" font-size="40">🎅</text>
  <text x="80" y="30" font-size="16">❄️</text>
  <text x="250" y="26" font-size="14">❄️</text>
  <text x="104" y="16" font-size="11">❄️</text>
  <text x="4" y="138" font-size="28">⛄</text>
  <text x="318" y="138" font-size="28">🎁</text>
</svg>`;

// ----- Season-Pässe -----
// start/ende in Ortszeit des Geräts. "ende" ist der erste Moment, an dem der Pass NICHT mehr läuft.
const SEASON_PAESSE = [
  {
    id: "s1",
    name: "Season 1: Thanksgiving",
    icon: "🦃",
    logo: LOGO_THANKSGIVING,
    start: "2026-11-01T00:00:00",
    ende:  "2026-12-01T00:00:00",   // = bis einschließlich 30. November
    stufen: 50,
    // Klicks für Stufe n: klicksBasis + klicksProStufe · n
    // -> Stufe 1: 700 Klicks … Stufe 50: 2.170 Klicks, zusammen ~71.750 Klicks
    // -> bei durchschnittlich 2 Klicks pro Sekunde etwa 10 Stunden
    klicksBasis: 670,
    klicksProStufe: 30,
    // Auf diesen Stufen gibt es Skins, auf allen anderen Herzen
    skinBelohnungen: { 10: "hut-pilgerhut", 20: "musik-erntedank", 30: "hud-herbstlaub", 40: "logo-erntedank", 50: "hintergrund-herbst" },
    // Herzregen-Minispiel während dieser Season (siehe herzregen.js)
    regen: { name: "Blätterregen", icon: "🍂", teile: ["🍂", "🍁", "🌰", "🎃"], gold: "🦃" },
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
    logo: LOGO_WEIHNACHTEN,
    start: "2026-12-01T00:00:00",
    ende:  "2027-01-01T00:00:00",   // = bis einschließlich 31. Dezember
    stufen: 50,
    // Wie Season 1: ~71.750 Klicks ≈ 10 Stunden bei 2 Klicks pro Sekunde
    klicksBasis: 670,
    klicksProStufe: 30,
    skinBelohnungen: { 10: "hut-weihnachtsmuetze", 20: "musik-gloeckchen", 30: "hud-winterzauber", 40: "logo-weihnachten", 50: "hintergrund-schnee" },
    regen: { name: "Schneegestöber", icon: "❄️", teile: ["❄️", "🎁", "⭐", "🔔"], gold: "🎅" },
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

// Name der gewählten Figur ("Marie" oder "Hannah")
function figurName() {
  return aktiverSkin("figur").rufname;
}

// ----- Was man sammelt: Herzen – oder in einer Season etwas Passendes -----
const SEASON_WAEHRUNG = {
  s1: { name: "Blätter",       icon: "🍂" },   // Thanksgiving
  s2: { name: "Plätzchen",     icon: "🍪" },   // Weihnachten
  s3: { name: "Schneeflocken", icon: "❄️" },   // Winterwunderland
  s4: { name: "Liebesbriefe",  icon: "💌" },   // Valentinstag
  s5: { name: "Ostereier",     icon: "🥚" },   // Ostern
  s6: { name: "Blüten",        icon: "🌸" },   // Einhornwiese
  s7: { name: "Muscheln",      icon: "🐚" },   // Sommer & Meer
  s8: { name: "Bonbons",       icon: "🍬" },   // Halloween
};

// { name, icon } – icon null = Herz-Symbol des HUD-Skins
function waehrung() {
  const pass = aktiverSeasonPass();
  return (pass && SEASON_WAEHRUNG[pass.id]) || { name: "Herzen", icon: null };
}

// "Herzen" im Text durch das ersetzen, was man gerade sammelt ("Herzensbrecher" bleibt)
function inWaehrung(text) {
  const name = waehrung().name;
  if (name === "Herzen") return String(text);
  return String(text).replace(/\bHerzen\b/g, name).replace(/\bHerz-/g, name + "-");
}

// Passt einen Text an: "Marie" -> Name der gewählten Figur ("Marienkäfer" bleibt),
// "Herzen" -> was man in der laufenden Season sammelt
function mitName(text) {
  return inWaehrung(String(text).replace(/\bMarie(s?)\b/g, (_, s) => figurName() + s));
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

// Eine Season-Belohnung nach ID: ein Skin, ein Zimmer-Teil (zimmer.js) oder Tier/Tier-Zubehör (haustier.js)
function belohnungNachId(id) {
  return SKINS.find(s => s.id === id) || ZIMMER_TEILE.find(t => t.id === id) || tierBelohnung(id);
}

// Wie heißt die Art der Belohnung? z.B. "Kleider", "Fürs Zimmer" oder "Neues Haustier"
function belohnungsArt(teil) {
  if (teil.platz) return "Fürs Zimmer";
  if (teil.tierTyp === "art") return "Neues Haustier";
  if (teil.tierTyp) return "Tier-Zubehör";
  return SKIN_KATEGORIEN.find(k => k.id === teil.kategorie).name;
}

// Was gibt es auf Stufe n?  { typ: "skin", skin } | { typ: "zimmer", teil } | { typ: "herzen", menge }
function seasonBelohnung(pass, n) {
  const id = pass.skinBelohnungen[n];
  const teil = id && belohnungNachId(id);
  if (teil) return teil.platz ? { typ: "zimmer", teil } : { typ: "skin", skin: teil };
  return { typ: "herzen", menge: seasonHerzen(n) };
}

// Auf welcher Stufe gibt es diesen Skin? (für "🔒 Stufe 10")
function skinStufe(skin) {
  const pass = SEASON_PAESSE.find(p => p.id === skin.season);
  if (!pass) return null;
  const eintrag = Object.entries(pass.skinBelohnungen).find(([, id]) => id === skin.id);
  return eintrag ? Number(eintrag[0]) : null;
}

// Skins für schon erreichte Stufen nachliefern – z.B. wenn eine Belohnung nachträglich
// zu einer Stufe hinzugefügt wurde, die man schon geschafft hatte. Gibt die neuen Skins zurück.
function seasonSkinsNachliefern() {
  const neu = [];
  for (const pass of SEASON_PAESSE) {
    const stand = skinStand.seasons[pass.id];
    if (!stand) continue;
    for (const [stufe, skinId] of Object.entries(pass.skinBelohnungen)) {
      if (Number(stufe) <= stand.stufe && !skinStand.freigeschaltet.includes(skinId)) {
        schalteSkinFrei(skinId);
        neu.push(belohnungNachId(skinId));
      }
    }
  }
  if (neu.length) speichereSkins();
  return neu;
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
      schalteSkinFrei((belohnung.skin || belohnung.teil).id);   // Zimmer-Teile werden wie Skins gemerkt
    }
    neu.push({ pass, stufe: stand.stufe, belohnung });
  }
  if (stand.stufe >= pass.stufen) stand.xp = 0;
  if (neu.length) speichereSkins();
  return neu;
}
