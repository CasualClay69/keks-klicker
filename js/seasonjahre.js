"use strict";
// =====================================================
//  SEASON-JAHRE 2027–2029 – der Baukasten für alle weiteren Season-Pässe
//
//  Jedes Thema (Thanksgiving, Weihnachten, …, Wind & Drachen) gibt es einmal pro Jahr – jeden Monat eins.
//  Pro Jahr steht unten EIN kurzer Block (VARIANTEN) mit Farben, Motiven und Namen.
//  baueSeasonVariante() erzeugt daraus einen kompletten Pass mit 11 neuen Belohnungen:
//    Stufe 5 Tier-Zubehör · 10 Hut · 15 Zimmer · 20 Musik · 25 Kleid · 30 HUD · 33 Haustier
//    35 Haarfarbe · 40 Logo · 45 Zimmer · 50 Hintergrund   (alle anderen Stufen: Herzen)
//  Währung, Herzregen und Sticker-Seite gehören zum Thema (die Seite ist jedes Jahr wieder sammelbar).
//
//  Nach Season 36 (Halloween 2029) geht es wieder bei Season 1 los (siehe SEASON_KREIS in skins.js).
//  Muss nach skins.js, kleiderschrank.js, zimmer.js, album.js, seasons.js und haustier.js geladen werden.
// =====================================================

// ----- Farben mischen -----
function hexZuRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}
function mische(a, b, anteil) {   // anteil 0 = a, 1 = b
  const x = hexZuRgb(a), y = hexZuRgb(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * anteil).toString(16).padStart(2, "0")).join("");
}
function rgba(hex, alpha) {
  const [r, g, b] = hexZuRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ----- Hüte (Kopf-Oberkante bei y ≈ 34, Mitte x = 100) -----
const HUT_BAUER = {
  // Haarreif mit drei Emojis obendrauf
  haarreif: h => `<g>
    <path d="M60 72 Q60 30 100 27 Q140 30 140 72" fill="none" stroke="${h.farbe}" stroke-width="6" stroke-linecap="round"/>
    <text x="74" y="36" font-size="19" text-anchor="middle">${h.emoji[0]}</text>
    <text x="100" y="27" font-size="24" text-anchor="middle">${h.emoji[1]}</text>
    <text x="126" y="36" font-size="19" text-anchor="middle">${h.emoji[2]}</text></g>`,
  // Krönchen mit Steinen
  krone: h => `<g>
    <path d="M74 44 L70 18 L86 31 L100 12 L114 31 L130 18 L126 44 Z" fill="${h.farbe}" stroke="${h.rand}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="73" y="39" width="54" height="8" rx="3" fill="${h.rand}"/>
    <circle cx="100" cy="29" r="4.5" fill="${h.stein}"/><circle cx="85" cy="34" r="3" fill="${h.stein}"/><circle cx="115" cy="34" r="3" fill="${h.stein}"/>
    <circle cx="70" cy="17" r="2.8" fill="${h.rand}"/><circle cx="100" cy="11" r="2.8" fill="${h.rand}"/><circle cx="130" cy="17" r="2.8" fill="${h.rand}"/></g>`,
  // Strickmütze mit Bommel
  muetze: h => `<g>
    <path d="M62 58 Q60 18 100 15 Q140 18 138 58 Z" fill="${h.farbe}"/>
    <path d="M70 26 Q100 18 130 26" fill="none" stroke="${h.rand}" stroke-width="2" stroke-dasharray="3 4" opacity=".7"/>
    <rect x="58" y="50" width="84" height="13" rx="6.5" fill="${h.rand}"/>
    <circle cx="100" cy="13" r="8.5" fill="${h.bommel}"/>
    ${h.emoji ? `<text x="100" y="45" font-size="15" text-anchor="middle">${h.emoji}</text>` : ""}</g>`,
  // Große Schleife
  schleife: h => `<g transform="rotate(-10 100 32)">
    <path d="M100 32 L72 17 Q63 32 72 47 Z" fill="${h.farbe}" stroke="${h.rand}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M100 32 L128 17 Q137 32 128 47 Z" fill="${h.farbe}" stroke="${h.rand}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="100" cy="32" r="7" fill="${h.rand}"/>
    ${h.emoji ? `<text x="100" y="37" font-size="11" text-anchor="middle">${h.emoji}</text>` : ""}</g>`,
  // Blütenkranz
  kranz: h => `<g>${[[64, 54], [70, 40], [81, 30], [94, 25], [106, 25], [119, 30], [130, 40], [136, 54]]
    .map(([x, y], i) => blume(x, y, h.farben[i % h.farben.length], 4.2)).join("")}</g>`,
};

// ----- Musik: neue Fassung einer Themen-Melodie (andere Tonart, anderes Tempo, auf Wunsch verziert) -----
const NOTEN_NAMEN = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function transponiere(note, halbtoene) {
  if (!note) return note;
  const [, name, vz, okt] = note.match(/^([A-G])(#?)(\d)$/);
  const i = NOTEN_NAMEN.indexOf(name + vz) + halbtoene;
  return NOTEN_NAMEN[((i % 12) + 12) % 12] + (Number(okt) + Math.floor(i / 12));
}
function musikVariante(basis, { halbtoene = 0, tempo = 1, verziert = false }) {
  const melodie = basis.melodie.flatMap(([n, l]) => {
    const t = transponiere(n, halbtoene);
    if (verziert && t && l >= 2 && l % 2 === 0) return [[t, l / 2], [t, l / 2]];   // lange Töne doppelt anschlagen
    return [[t, l]];
  });
  return { achtelSek: basis.achtelSek / tempo, melodie, bass: (basis.bass || []).map(([n, l]) => [transponiere(n, halbtoene), l]) };
}

// "Drachenflug" (Wind & Drachen) – 4/4, G-Dur · G – Em – C – D | G – Em – C/D – G
const DRACHENFLUG = {
  achtelSek: 0.25,
  melodie: [
    ["G5", 2], ["B5", 1], ["D6", 1], ["B5", 2], ["G5", 2],
    ["E5", 1], ["G5", 1], ["B5", 2], ["G5", 2], ["E5", 2],
    ["C6", 2], ["E6", 1], ["C6", 1], ["G5", 2], ["E5", 2],
    ["D5", 1], ["F#5", 1], ["A5", 2], ["D6", 4],
    ["B5", 1], ["A5", 1], ["G5", 2], ["D6", 2], ["B5", 2],
    ["E6", 2], ["D6", 1], ["B5", 1], ["G5", 4],
    ["C6", 1], ["B5", 1], ["A5", 2], ["F#5", 2], ["A5", 2],
    ["G5", 4], ["D5", 2], [null, 2],
  ],
  bass: [
    ["G2", 4], ["D3", 4], ["E2", 4], ["B2", 4], ["C3", 4], ["G2", 4], ["D3", 4], ["A2", 4],
    ["G2", 4], ["D3", 4], ["E2", 4], ["B2", 4], ["C3", 4], ["D3", 4], ["G2", 4], ["G2", 4],
  ],
};

// ----- Neues Season-Tier: Drachenbaby (im Stil der anderen Tiere, Zubehör sitzt wie bei allen) -----
HAUSTIER_ARTEN.push({
  id: "drache", season: "drachen-2027", name: "Drachenbaby", emoji: "🐉",
  svg: tierSvg({
    fell: "#6cc56c", bauch: "#fff1a8", pfoten: "#58a858", schnauze: "#9fe39a",
    hinten: `<path d="M27 66 Q6 54 10 34 Q20 48 32 52 Z" fill="#a8eaa0" stroke="#4f9a4f" stroke-width="1.5"/>
             <path d="M73 66 Q94 54 90 34 Q80 48 68 52 Z" fill="#a8eaa0" stroke="#4f9a4f" stroke-width="1.5"/>
             <path d="M72 86 Q92 92 94 76 L88 80 Z" fill="#58a858"/>`,
    ohren: `<path d="M35 23 L29 6 L43 18 Z" fill="#ffd27a" stroke="#d9a440" stroke-width="1"/>
            <path d="M65 23 L71 6 L57 18 Z" fill="#ffd27a" stroke="#d9a440" stroke-width="1"/>`,
    kopfDeko: `<path d="M45 17 L50 9 L55 17 Z" fill="#4f9a4f"/>`,
    gesicht: `<circle cx="46" cy="46.5" r="1.4" fill="#3b2240"/><circle cx="54" cy="46.5" r="1.4" fill="#3b2240"/>${MUND(50.5)}`,
  }),
  anker: TIER_ANKER,
  leckerli: { icon: "🍎", name: "Herbstapfel" }, festmahl: { icon: "🌶️", name: "Feuerschote" },
  namen: ["Fauchi", "Flämmchen", "Puffi", "Windi"],
});

// "Schmetterlingstanz" (Schmetterlingsgarten) – 4/4, C-Dur · C – Am – F – G | C – Am – F/G – C
const SCHMETTERLINGSTANZ = {
  achtelSek: 0.2,
  melodie: [
    ["E6", 1], ["G6", 1], ["E6", 1], ["C6", 1], ["G6", 2], ["E6", 2],
    ["A5", 1], ["C6", 1], ["E6", 2], ["A6", 2], ["E6", 2],
    ["F6", 1], ["A6", 1], ["F6", 1], ["C6", 1], ["A5", 2], ["C6", 2],
    ["D6", 1], ["G6", 1], ["B5", 2], ["G5", 4],
    ["E6", 1], ["F6", 1], ["G6", 2], ["A6", 1], ["G6", 1], ["F6", 1], ["E6", 1],
    ["A5", 2], ["E6", 1], ["C6", 1], ["A5", 2], ["C6", 2],
    ["F6", 1], ["E6", 1], ["D6", 2], ["G6", 1], ["F6", 1], ["D6", 2],
    ["C6", 4], ["G5", 2], [null, 2],
  ],
  bass: [
    ["C3", 2], ["G3", 2], ["E3", 2], ["G3", 2],   ["A2", 2], ["E3", 2], ["C3", 2], ["E3", 2],
    ["F2", 2], ["C3", 2], ["A2", 2], ["C3", 2],   ["G2", 2], ["D3", 2], ["B2", 2], ["D3", 2],
    ["C3", 2], ["G3", 2], ["E3", 2], ["G3", 2],   ["A2", 2], ["E3", 2], ["C3", 2], ["E3", 2],
    ["F2", 2], ["C3", 2], ["G2", 2], ["D3", 2],   ["C3", 4], ["C3", 4],
  ],
};

// "Feenreigen" (Feenwald) – 4/4, geheimnisvoll in d-Moll · Dm – B – C – A | Dm – B – Gm/A – Dm
const FEENREIGEN = {
  achtelSek: 0.26,
  melodie: [
    ["D6", 2], ["F6", 1], ["A6", 1], ["F6", 2], ["D6", 2],
    ["D6", 1], ["F6", 1], ["A#6", 2], ["A6", 2], ["F6", 2],
    ["E6", 1], ["G6", 1], ["C6", 2], ["E6", 2], ["G6", 2],
    ["A5", 1], ["C#6", 1], ["E6", 2], ["A6", 4],
    ["A6", 1], ["G6", 1], ["F6", 2], ["E6", 1], ["F6", 1], ["D6", 2],
    ["F6", 1], ["E6", 1], ["D6", 2], ["A#5", 2], ["D6", 2],
    ["G6", 1], ["F6", 1], ["E6", 2], ["C#6", 2], ["E6", 2],
    ["D6", 4], ["A5", 2], [null, 2],
  ],
  bass: [
    ["D3", 2], ["A3", 2], ["F3", 2], ["A3", 2],   ["A#2", 2], ["F3", 2], ["D3", 2], ["F3", 2],
    ["C3", 2], ["G3", 2], ["E3", 2], ["G3", 2],   ["A2", 2], ["E3", 2], ["C#3", 2], ["E3", 2],
    ["D3", 2], ["A3", 2], ["F3", 2], ["A3", 2],   ["A#2", 2], ["F3", 2], ["D3", 2], ["F3", 2],
    ["G2", 2], ["D3", 2], ["A2", 2], ["E3", 2],   ["D3", 4], ["D3", 4],
  ],
};

// "Meereslied" (Meerjungfrauen) – 6/8, wiegend wie Wellen · F – Dm – B – C | F – Dm – Gm/C – F
const MEERESLIED = {
  achtelSek: 0.22,
  melodie: [
    ["C6", 2], ["F6", 1], ["A6", 2], ["F6", 1],
    ["D6", 2], ["F6", 1], ["A6", 3],
    ["A#5", 2], ["D6", 1], ["F6", 2], ["D6", 1],
    ["C6", 1], ["E6", 1], ["G6", 1], ["E6", 3],
    ["F6", 2], ["G6", 1], ["A6", 2], ["C6", 1],
    ["D6", 1], ["E6", 1], ["F6", 1], ["A6", 3],
    ["G6", 2], ["F6", 1], ["E6", 2], ["G5", 1],
    ["F6", 3], [null, 3],
  ],
  bass: [
    ["F2", 3], ["C3", 3],   ["D3", 3], ["A2", 3],   ["A#2", 3], ["F3", 3],   ["C3", 3], ["G2", 3],
    ["F2", 3], ["C3", 3],   ["D3", 3], ["A2", 3],   ["G2", 3], ["C3", 3],    ["F2", 3], [null, 3],
  ],
};

// ----- Neue Season-Tiere: Schmetterlingsbaby, Rehkitz, Robbenbaby -----
HAUSTIER_ARTEN.push({
  id: "schmetterling", season: "schmetterling-2027", name: "Schmetterlingsbaby", emoji: "🦋",
  svg: tierSvg({
    fell: "#c9a6f5", bauch: "#f6ecff", pfoten: "#b18be8", schnauze: "#f2e6ff", nase: "#ff7eb6",
    hinten: `<ellipse cx="22" cy="58" rx="20" ry="16" fill="#ff9fd0" stroke="#c45a9a" stroke-width="1.5" transform="rotate(-25 22 58)"/>
             <ellipse cx="78" cy="58" rx="20" ry="16" fill="#ff9fd0" stroke="#c45a9a" stroke-width="1.5" transform="rotate(25 78 58)"/>
             <ellipse cx="26" cy="84" rx="13" ry="10" fill="#ffd23f" stroke="#c49a1a" stroke-width="1.5" transform="rotate(20 26 84)"/>
             <ellipse cx="74" cy="84" rx="13" ry="10" fill="#ffd23f" stroke="#c49a1a" stroke-width="1.5" transform="rotate(-20 74 84)"/>
             <circle cx="15" cy="55" r="4.5" fill="#ffffff" opacity=".75"/><circle cx="85" cy="55" r="4.5" fill="#ffffff" opacity=".75"/>
             <circle cx="24" cy="64" r="2.6" fill="#ffffff" opacity=".75"/><circle cx="76" cy="64" r="2.6" fill="#ffffff" opacity=".75"/>`,
    ohren: `<path d="M42 20 Q38 6 31 4 M58 20 Q62 6 69 4" fill="none" stroke="#6b4a8a" stroke-width="2" stroke-linecap="round"/>
            <circle cx="31" cy="4.5" r="3.4" fill="#ff7eb6"/><circle cx="69" cy="4.5" r="3.4" fill="#ff7eb6"/>`,
  }),
  anker: TIER_ANKER,
  leckerli: { icon: "🌸", name: "Blütennektar" }, festmahl: { icon: "🍯", name: "Honigtopf" },
  namen: ["Flatti", "Lila", "Blümchen", "Sonni"],
});

HAUSTIER_ARTEN.push({
  id: "reh", season: "feenwald-2027", name: "Rehkitz", emoji: "🦌",
  svg: tierSvg({
    fell: "#c98b55", bauch: "#fbe6cc", pfoten: "#a86c3a", schnauze: "#f3dcc0",
    hinten: `<ellipse cx="76" cy="66" rx="5" ry="7.5" fill="#fff6e8" transform="rotate(30 76 66)"/>`,
    bauchDeko: `<g fill="#fff6e8"><circle cx="31" cy="65" r="2.6"/><circle cx="69" cy="65" r="2.6"/><circle cx="29" cy="76" r="2"/><circle cx="71" cy="76" r="2"/></g>`,
    ohren: `<ellipse cx="27" cy="26" rx="7" ry="13" fill="#c98b55" transform="rotate(-50 27 26)"/>
            <ellipse cx="27" cy="26" rx="3.5" ry="8" fill="#ffc8d6" transform="rotate(-50 27 26)"/>
            <ellipse cx="73" cy="26" rx="7" ry="13" fill="#c98b55" transform="rotate(50 73 26)"/>
            <ellipse cx="73" cy="26" rx="3.5" ry="8" fill="#ffc8d6" transform="rotate(50 73 26)"/>`,
    kopfDeko: `<circle cx="44" cy="23" r="2" fill="#fff6e8"/><circle cx="56" cy="23" r="2" fill="#fff6e8"/><circle cx="50" cy="19" r="1.6" fill="#fff6e8"/>`,
    gesicht: `<ellipse cx="50" cy="46.5" rx="3.4" ry="2.4" fill="#3b2240"/>${MUND(49.5)}`,
  }),
  anker: TIER_ANKER,
  leckerli: { icon: "☘️", name: "Glücksklee" }, festmahl: { icon: "🫐", name: "Waldbeeren-Korb" },
  namen: ["Tupfi", "Moosi", "Hasel", "Flöckchen"],
});

HAUSTIER_ARTEN.push({
  id: "robbe", season: "meerjungfrau-2027", name: "Robbenbaby", emoji: "🦭",
  svg: tierSvg({
    fell: "#a9bccf", bauch: "#eef4fa", pfoten: "#8ea4ba", schnauze: "#dfe9f2",
    hinten: `<ellipse cx="24" cy="78" rx="6" ry="12" fill="#8ea4ba" transform="rotate(40 24 78)"/>
             <ellipse cx="76" cy="78" rx="6" ry="12" fill="#8ea4ba" transform="rotate(-40 76 78)"/>
             <path d="M70 88 Q86 96 94 84 Q84 86 76 80 Z" fill="#8ea4ba"/>`,
    kopfDeko: `<circle cx="38" cy="25" r="2" fill="#8ea4ba"/><circle cx="62" cy="23" r="1.6" fill="#8ea4ba"/><circle cx="58" cy="28" r="1.2" fill="#8ea4ba"/>`,
    gesicht: `<ellipse cx="50" cy="46.5" rx="3.6" ry="2.6" fill="#3b2240"/>${MUND(49.5)}
              <path d="M39 49 L28 47 M39 52 L28 54 M61 49 L72 47 M61 52 L72 54" stroke="#6b7f93" stroke-width="1" stroke-linecap="round"/>`,
  }),
  anker: TIER_ANKER,
  leckerli: { icon: "🐟", name: "Fischchen" }, festmahl: { icon: "🦐", name: "Garnelen-Platte" },
  namen: ["Plitsch", "Kuller", "Perle", "Wellchen"],
});

// ----- Die Themen -----
// start/ende: [Monat, Tag] – ende im Folgejahr, wenn der Monat kleiner ist (Weihnachten)
const SEASON_THEMEN = {
  thanksgiving: { titel: "Thanksgiving",     icon: "🦃", start: [11, 1], ende: [12, 1], tier: "truthahn",     musik: () => ERNTEDANK_WALZER, vorbild: "s1" },
  weihnachten:  { titel: "Weihnachten",      icon: "🎅", start: [12, 1], ende: [1, 1],  tier: "rentier",      musik: () => GLOECKCHEN,       vorbild: "s2", schnee: true },
  winter:       { titel: "Winterwunderland", icon: "⛸️", start: [1, 1],  ende: [2, 1],  tier: "pinguin",      musik: () => EISPRINZESSIN_WALZER, vorbild: "s3", schnee: true },
  valentin:     { titel: "Valentinstag",     icon: "💝", start: [2, 1],  ende: [3, 1],  tier: "baer",         musik: () => HERZKLOPFEN,      vorbild: "s4" },
  ostern:       { titel: "Ostern",           icon: "🐰", start: [3, 1],  ende: [4, 1],  tier: "kueken",       musik: () => HUEPF_HAESCHEN,   vorbild: "s5" },
  schmetterling: { titel: "Schmetterlingsgarten", icon: "🦋", start: [4, 1], ende: [5, 1], tier: "schmetterling", musik: () => SCHMETTERLINGSTANZ,
                  waehrung: { name: "Nektartropfen", icon: "🍯" },
                  regen: { name: "Blütenwirbel", icon: "🦋", teile: ["🦋", "🌸", "🌷", "🐞"], gold: "🌈" },
                  stickerFarbe: "#fbefff",
                  sticker: [["🐛", "Raupe"], ["🐞", "Marienkäfer"], ["🌷", "Tulpe"], ["🌻", "Sonnenblume"], ["🐌", "Schnecke"], ["🌧️", "Aprilschauer"], ["🌼", "Gänseblümchen"],
                            ["🪺", "Vogelnest"], ["🌈", "Regenbogen"], ["🪴", "Blumentopf"],
                            ["🦋", "Zauberfalter"], ["🌺", "Wunderblüte"]] },
  einhorn:      { titel: "Einhornwiese",     icon: "🦄", start: [5, 1],  ende: [6, 1],  tier: "igel",         musik: () => EINHORNWIESE,     vorbild: "s6" },
  feenwald:     { titel: "Feenwald",         icon: "🧚", start: [6, 1],  ende: [7, 1],  tier: "reh",          musik: () => FEENREIGEN,
                  waehrung: { name: "Feenstaub", icon: "✨" },
                  regen: { name: "Feenstaub", icon: "✨", teile: ["✨", "🍄", "🍃", "🌟"], gold: "🧚" },
                  stickerFarbe: "#eaf7e6",
                  sticker: [["🍄", "Fliegenpilz"], ["🌿", "Farn"], ["🐿️", "Eichhörnchen"], ["🫐", "Waldbeeren"], ["🦉", "Waldeule"], ["🐸", "Frosch"], ["🌙", "Mondsichel"],
                            ["🦌", "Hirsch"], ["🛖", "Feenhütte"], ["🌟", "Wunschstern"],
                            ["🧚", "Waldfee"], ["🪄", "Zauberstab"]] },
  sommer:       { titel: "Sommer & Meer",    icon: "🏖️", start: [7, 1],  ende: [8, 1],  tier: "schildkroete", musik: () => SOMMERFERIEN,     vorbild: "s7" },
  meerjungfrau: { titel: "Meerjungfrauen",   icon: "🧜‍♀️", start: [8, 1], ende: [9, 1], tier: "robbe",        musik: () => MEERESLIED,
                  waehrung: { name: "Perlen", icon: "🦪" },
                  regen: { name: "Perlenregen", icon: "🫧", teile: ["🫧", "🐚", "🐠", "⭐"], gold: "🧜‍♀️" },
                  stickerFarbe: "#e3f8fb",
                  sticker: [["🐠", "Fischlein"], ["🦀", "Krebs"], ["🐙", "Krake"], ["🪸", "Koralle"], ["🐡", "Kugelfisch"], ["🌊", "Welle"], ["⭐", "Seestern"],
                            ["🦭", "Robbe"], ["🐬", "Delfin"], ["🔱", "Dreizack"],
                            ["🧜‍♀️", "Meerjungfrau"], ["🦪", "Zauberperle"]] },
  drachen:      { titel: "Wind & Drachen",   icon: "🪁", start: [9, 1],  ende: [10, 1], tier: "drache",       musik: () => DRACHENFLUG,
                  waehrung: { name: "Federn", icon: "🪶" },
                  regen: { name: "Herbstwind", icon: "🪁", teile: ["🪁", "🍂", "🪶", "🎈"], gold: "🐉" },
                  stickerFarbe: "#e6f4ff",
                  sticker: [["🪁", "Drachen"], ["🍃", "Blätterwirbel"], ["🌬️", "Windgesicht"], ["🎐", "Windspiel"], ["🎈", "Luftballon"], ["🌀", "Wirbelwind"], ["🪶", "Feder"],
                            ["🐦", "Zugvogel"], ["🌾", "Stoppelfeld"], ["🍎", "Herbstapfel"],
                            ["🐉", "Glücksdrache"], ["🎏", "Fischdrachen"]] },
  halloween:    { titel: "Halloween",        icon: "🎃", start: [10, 1], ende: [11, 1], tier: "fledermaus",   musik: () => GESPENSTERCHEN,   vorbild: "s8" },
};

// Datum als Text für Pass-Start/-Ende
function themenDatum([monat, tag], jahr) {
  return `${jahr}-${String(monat).padStart(2, "0")}-${String(tag).padStart(2, "0")}T00:00:00`;
}

// ----- Einen Pass aus einem Varianten-Block bauen -----
function baueSeasonVariante(v) {
  const thema = SEASON_THEMEN[v.thema];
  const id = `${v.thema}-${v.jahr}`;
  const [a, d, z, h1, h2, t] = v.f;   // Akzent, dunkel, Zweitfarbe, hell 1, hell 2, Text
  const vorbild = thema.vorbild && SEASON_PAESSE.find(p => p.id === thema.vorbild);
  const endeJahr = thema.ende[0] < thema.start[0] ? v.jahr + 1 : v.jahr;
  const deko = v.deko;

  registriereSeason({
    id, nr: v.nr, jahr: v.jahr, thema: v.thema, titel: thema.titel, icon: thema.icon,
    start: themenDatum(thema.start, v.jahr), ende: themenDatum(thema.ende, endeJahr),
    design: [h1, h2, t, d, mische(a, "#ffffff", 0.35), a],
    logo: { band: [mische(a, "#ffffff", 0.45), a], rand: d, enden: z, endenSchatten: mische(z, "#000000", 0.25),
            schrift: ["#ffffff", mische(h1, "#ffffff", 0.3)], schildText: d, schnee: thema.schnee,
            deko: [[deko[0], 10, 52, 34], [deko[1], 294, 48, 36], [deko[2], 80, 30, 16], [deko[3], 250, 28, 14], [deko[4], 6, 136, 26], [deko[5], 318, 138, 26]] },
    skins: {
      hut:   { name: v.hut.name, icon: v.hut.icon, svg: HUT_BAUER[v.hut.typ](v.hut) },
      musik: { name: v.musik.name, icon: v.musik.icon, musik: musikVariante(thema.musik(), v.musik) },
      hud:   { name: v.hud.name, icon: v.hud.icon,
               farben: hudFarben([h1, h2, mische(h1, "#ffffff", 0.5), mische(h1, a, 0.08), mische(h2, "#ffffff", 0.5),
                                  mische(a, "#ffffff", 0.62), a, d, z, t, mische(t, "#ffffff", 0.42), "#f5c242", rgba(d, 0.15),
                                  mische(a, "#ffffff", 0.45), a, d, mische(h1, a, 0.12), mische(h2, z, 0.14)]),
               symbole: { herz: v.hud.symbole[0], marie: v.hud.symbole[1], shop: v.hud.symbole[2], skins: v.hud.symbole[3] } },
      logo:  { name: v.logo.name, icon: v.logo.icon, krone: v.logo.krone, deko: v.logo.deko, funkeln: v.logo.funkeln,
               farben: logoFarben([mische(a, "#ffffff", 0.45), a, d, "#ffffff", d, mische(a, "#ffffff", 0.55), z]) },
      hintergrund: { name: v.bg.name, icon: v.bg.icon,
               bg: { farbe: `linear-gradient(180deg, ${v.bg.verlauf[0]} 0%, ${v.bg.verlauf[1]} 55%, ${v.bg.verlauf[2]} 100%)`,
                     richtung: v.bg.richtung, hinten: v.bg.hinten, vorne: v.bg.vorne } },
    },
    regen: thema.regen || (vorbild && vorbild.regen),
    stickerFarbe: thema.stickerFarbe,
    sticker: v.jahr === 2027 && thema.sticker ? thema.sticker : null,   // neue Themen: eigene Seite beim ersten Mal
  });
  SEASON_WAEHRUNG[id] = thema.waehrung || SEASON_WAEHRUNG[thema.vorbild];

  // Kleid (Stufe 25) und Haarfarbe (Stufe 35)
  const k = v.kleid;
  registriereKleiderschrank(id, {
    kleid: { name: k.name, icon: k.icon,
      svg: kleidSvg(k.farbe, k.kragen, `<path d="${KLEID_SAUM}" fill="${k.saum}"/>${aufdruck(k.muster[0], 68, 200)}${aufdruck(k.muster[1], 132, 200)}${aufdruck(k.muster[0], 100, 184, 11)}`) },
    haarfarbe: { name: v.haar.name, icon: v.haar.icon, haar: v.haar.farben },
  });

  // Zimmer (Stufe 15 und 45)
  ZIMMER_SEASON[id] = { 15: v.z15, 45: v.z45 };
  registriereZimmerSeason(id);

  // Haustier (Stufe 33): neues Tier oder eine neu gefärbte Variante des Themen-Tiers
  const pass = SEASON_PAESSE.find(p => p.id === id);
  const basisTier = HAUSTIER_ARTEN.find(x => x.id === thema.tier);
  let tierId = basisTier.id;
  if (basisTier.season !== id) {
    tierId = `${basisTier.id}-${v.jahr}`;
    HAUSTIER_ARTEN.push({ ...basisTier, id: tierId, season: id, name: v.tier.name,
      svg: basisTier.svg.replace("<svg ", `<svg style="filter:${v.tier.filter}" `) });
  }
  pass.skinBelohnungen[TIER.seasonStufeTier] = `tierart-${tierId}`;

  // Tier-Zubehör (Stufe 5)
  const zb = v.zubehoer;
  const zubehoerId = `zubehoer-${id}`;
  TIER_ZUBEHOER.push({ id: zubehoerId, season: id, typ: zb.typ, name: zb.name, icon: zb.icon,
    svg: zb.typ === "halsband" ? halsbandSvg(zb.farbe, zb.extra)
       : zb.typ === "schleife" ? schleifeSvg(zb.farbe, zb.extra)
       : koerbchenSvg(zb.farbe, zb.kissen, zb.extra) });
  pass.skinBelohnungen[TIER.seasonStufeZubehoer] = zubehoerId;
}

// =====================================================
//  DIE VARIANTEN – f: [Akzent, dunkel, Zweitfarbe, hell 1, hell 2, Text] · deko: 6 Emojis fürs Pass-Logo
// =====================================================

const SEASON_VARIANTEN = [
  // ───────── Season-Jahr 1 (Rest): April, Juni, August und September 2027 ─────────
  { nr: 6, thema: "schmetterling", jahr: 2027, f: ["#c86dd7", "#7a2c8a", "#7cc36b", "#fbf0ff", "#f0fbe8", "#3d1846"],
    deko: ["🦋", "🌷", "🐞", "🌸", "🐛", "🌻"],
    hut: { typ: "kranz", name: "Tulpenkranz", icon: "🌷", farben: ["#ff7eb6", "#ffd23f", "#c86dd7"] },
    musik: { name: "Schmetterlingstanz", icon: "🦋" },
    kleid: { name: "Schmetterlingskleid", icon: "🦋", farbe: "#dba6ef", kragen: "#ffffff", saum: "#7cc36b", muster: ["🦋", "🌷"] },
    haar: { name: "Fliederlila", icon: "💜", farben: ["#c9a0e6", "#8c5fb8"] },
    hud: { name: "Blumenbeet", icon: "🌷", symbole: ["💜", "🦋", "🌷", "🐞"] },
    logo: { name: "Falter-Logo", icon: "🦋", krone: "🦋", deko: "🌷", funkeln: "❀" },
    bg: { name: "Schmetterlingsgarten", icon: "🦋", verlauf: ["#f6eaff", "#fff4fb", "#e8f8dc"], richtung: "steigen", hinten: ["🌸", "✨"], vorne: ["🦋", "🌷"] },
    z15: { platz: "pflanze", name: "Tulpentopf", icon: "🌷", zusatz: "🦋" },
    z45: { platz: "fenster", name: "Schmetterlingswiese", icon: "🦋", himmel: "linear-gradient(#d9c2ff 0 55%, #a8e08f 56%)" },
    tier: { name: "Schmetterlingsbaby" },
    zubehoer: { typ: "schleife", name: "Falter-Spange", icon: "🦋", farbe: "", extra: "🦋" } },

  { nr: 8, thema: "feenwald", jahr: 2027, f: ["#3fae6a", "#1d5e38", "#f2b8e6", "#eefbf2", "#fbf0fa", "#173826"],
    deko: ["🍄", "🧚", "🌿", "✨", "🦉", "🌙"],
    hut: { typ: "krone", name: "Feenkrone", icon: "🧚", farbe: "#c8f2d4", rand: "#3fae6a", stein: "#f2b8e6" },
    musik: { name: "Feenreigen", icon: "🧚" },
    kleid: { name: "Feenkleid", icon: "🧚", farbe: "#9fdcb4", kragen: "#ffffff", saum: "#f2b8e6", muster: ["🍄", "✨"] },
    haar: { name: "Feen-Mint", icon: "🌿", farben: ["#a8e6c4", "#5fae86"] },
    hud: { name: "Feenwald", icon: "🌲", symbole: ["💚", "🧚", "🍄", "🌿"] },
    logo: { name: "Feen-Logo", icon: "🧚", krone: "🍄", deko: "✨", funkeln: "✧" },
    bg: { name: "Zauberwald", icon: "🌲", verlauf: ["#dff3e2", "#eef8ec", "#f8eefa"], richtung: "steigen", hinten: ["✨", "🌿"], vorne: ["🍄", "🧚"] },
    z15: { platz: "lampe", name: "Pilzlampe", icon: "🍄", zusatz: "✨" },
    z45: { platz: "wand", name: "Waldtapete", icon: "🌿", farbe: "#effaf0", muster: "🌿" },
    tier: { name: "Rehkitz" },
    zubehoer: { typ: "halsband", name: "Blätter-Halsband", icon: "🍃", farbe: "#3fae6a", extra: "🍄" } },

  { nr: 10, thema: "meerjungfrau", jahr: 2027, f: ["#3fb8c9", "#17606e", "#ff8fb8", "#ebfafc", "#fff0f6", "#123a42"],
    deko: ["🧜‍♀️", "🐚", "🫧", "🐠", "🌊", "⭐"],
    hut: { typ: "krone", name: "Muschelkrone", icon: "🐚", farbe: "#ffd6e8", rand: "#3fb8c9", stein: "#ffffff" },
    musik: { name: "Meereslied", icon: "🌊" },
    kleid: { name: "Schuppenkleid", icon: "🧜‍♀️", farbe: "#7fd9e0", kragen: "#ffffff", saum: "#ff8fb8", muster: ["🐚", "🫧"] },
    haar: { name: "Korallenrot", icon: "🪸", farben: ["#ff8a7a", "#c4473f"] },
    hud: { name: "Unterwasser", icon: "🫧", symbole: ["🩵", "🧜‍♀️", "🐚", "🫧"] },
    logo: { name: "Perlen-Logo", icon: "🦪", krone: "🧜‍♀️", deko: "🐚", funkeln: "≈" },
    bg: { name: "Meeresgrund", icon: "🌊", verlauf: ["#bfeef5", "#8fd5e3", "#5fb3cc"], richtung: "steigen", hinten: ["🫧", "✨"], vorne: ["🐚", "🐠"] },
    z15: { platz: "regal", name: "Muschelsammlung", icon: "🐚", zusatz: "🦪" },
    z45: { platz: "bett", name: "Muschelbett", icon: "🐚", zusatz: "🫧" },
    tier: { name: "Robbenbaby" },
    zubehoer: { typ: "koerbchen", name: "Muschelbettchen", icon: "🐚", farbe: "#ff8fb8", kissen: "#e6fbff", extra: "🫧🐚🫧" } },

  { nr: 11, thema: "drachen", jahr: 2027, f: ["#4fa8e8", "#1f5f96", "#ff9f43", "#eef7ff", "#fff1e0", "#1d3550"],
    deko: ["🪁", "🌬️", "🍃", "🍂", "🎈", "🐉"],
    hut: { typ: "haarreif", name: "Drachen-Haarreif", icon: "🪁", farbe: "#ff9f43", emoji: ["🍃", "🪁", "🍂"] },
    musik: { name: "Drachenflug", icon: "🪁" },
    kleid: { name: "Windkleid", icon: "🌬️", farbe: "#7cc4f2", kragen: "#ffffff", saum: "#ff9f43", muster: ["🪁", "🍃"] },
    haar: { name: "Herbstwind-Kupfer", icon: "🍂", farben: ["#d9844a", "#a0522d"] },
    hud: { name: "Himmelblau", icon: "🌬️", symbole: ["💙", "🪁", "🎈", "🍃"] },
    logo: { name: "Drachen-Logo", icon: "🐉", krone: "🪁", deko: "🍃", funkeln: "≋" },
    bg: { name: "Drachenhimmel", icon: "🪁", verlauf: ["#cfe9ff", "#e8f4ff", "#fff0dc"], richtung: "steigen", hinten: ["☁️", "🍃"], vorne: ["🪁", "🍂"] },
    z15: { platz: "spielzeug", name: "Bunter Drachen", icon: "🪁" },
    z45: { platz: "fenster", name: "Windiger Himmel", icon: "🎈", himmel: "linear-gradient(#9fd3ff, #e4f3ff)" },
    tier: { name: "Drachenbaby" },
    zubehoer: { typ: "schleife", name: "Drachen-Schleife", icon: "🪁", farbe: "#4fa8e8", extra: "#ff9f43" } },

  // ───────── Season-Jahr 2: November 2027 bis Oktober 2028 ─────────
  { nr: 13, thema: "thanksgiving", jahr: 2027, f: ["#d98a2b", "#7a4214", "#8a9a3a", "#fff6e6", "#fbefd9", "#4a2c12"],
    deko: ["🌽", "🥧", "🍁", "🌰", "🧺", "🦃"],
    hut: { typ: "kranz", name: "Erntekranz", icon: "🌾", farben: ["#f2a541", "#d9672b", "#f7d154"] },
    musik: { name: "Erntedank-Walzer (Glockenspiel)", icon: "🔔", halbtoene: 2, tempo: 1.08, verziert: true },
    kleid: { name: "Maisfeld-Kleid", icon: "🌽", farbe: "#f2c14e", kragen: "#fff6e0", saum: "#8a9a3a", muster: ["🌽", "🍁"] },
    haar: { name: "Kastanienbraun", icon: "🌰", farben: ["#9a5b34", "#5e341b"] },
    hud: { name: "Erntezeit", icon: "🌽", symbole: ["🧡", "🌽", "🧺", "🍁"] },
    logo: { name: "Erntefest-Logo", icon: "🥧", krone: "🌽", deko: "🍁", funkeln: "✿" },
    bg: { name: "Maisfeld", icon: "🌽", verlauf: ["#fff3d6", "#ffe8bf", "#f2dca0"], richtung: "fallen", hinten: ["🍂", "✨"], vorne: ["🌽", "🍁"] },
    z15: { platz: "regal", name: "Kürbis-Kuchen", icon: "🥧" },
    z45: { platz: "teppich", name: "Strohteppich", icon: "🌾", farbe: "radial-gradient(#f7e2a4 0 35%, #e9c56f 36% 65%, #d6a845 66%)" },
    tier: { name: "Goldenes Truthahn-Küken", filter: "hue-rotate(25deg) saturate(1.3) brightness(1.08)" },
    zubehoer: { typ: "koerbchen", name: "Erntekörbchen", icon: "🧺", farbe: "#c98b55", kissen: "#fff1c4", extra: "🌽🍎🌽" } },

  { nr: 14, thema: "weihnachten", jahr: 2027, f: ["#2e9e5b", "#145233", "#d62839", "#effaf3", "#fff0f0", "#163322"],
    deko: ["🎄", "⭐", "🎁", "❄️", "🍬", "🦌"],
    hut: { typ: "muetze", name: "Elfenmütze", icon: "🧝‍♀️", farbe: "#2e9e5b", rand: "#d62839", bommel: "#ffd23f", emoji: "⭐" },
    musik: { name: "Glöckchen (Schlittenfahrt)", icon: "🛷", halbtoene: -3, tempo: 1.15 },
    kleid: { name: "Tannenkleid", icon: "🎄", farbe: "#2e9e5b", kragen: "#ffffff", saum: "#d62839", muster: ["🎄", "⭐"] },
    haar: { name: "Zuckerstangen-Rot", icon: "🍬", farben: ["#e2474f", "#a51f2b"] },
    hud: { name: "Tannengrün", icon: "🌲", symbole: ["💚", "🎄", "🎁", "⭐"] },
    logo: { name: "Weihnachtsstern-Logo", icon: "⭐", krone: "⭐", deko: "🎄", funkeln: "✦" },
    bg: { name: "Winterwald", icon: "🌲", verlauf: ["#e6f4ec", "#f2f8ff", "#ffffff"], richtung: "fallen", hinten: ["❄️", "✨"], vorne: ["🌲", "⭐"] },
    z15: { platz: "spielzeug", name: "Holzschlitten", icon: "🛷", zusatz: "🎁" },
    z45: { platz: "wand", name: "Zuckerstangen-Tapete", icon: "🍬", farbe: "#fff4f4", muster: "🍬" },
    tier: { name: "Polarlicht-Rentier", filter: "hue-rotate(160deg) saturate(1.2)" },
    zubehoer: { typ: "halsband", name: "Zuckerstangen-Halsband", icon: "🍬", farbe: "#e2474f", extra: "⭐" } },

  { nr: 15, thema: "winter", jahr: 2028, f: ["#7b8fe0", "#3a4796", "#4fc3dc", "#f1f3ff", "#e9fbff", "#232a55"],
    deko: ["🐻‍❄️", "❄️", "🌨️", "✨", "🧣", "🏔️"],
    hut: { typ: "muetze", name: "Bommelmütze", icon: "🧶", farbe: "#7b8fe0", rand: "#ffffff", bommel: "#ffffff", emoji: "❄️" },
    musik: { name: "Eisprinzessin-Walzer (Spieldose)", icon: "🎶", halbtoene: 5, tempo: 0.92, verziert: true },
    kleid: { name: "Schneeflocken-Kleid", icon: "❄️", farbe: "#a9b8f2", kragen: "#ffffff", saum: "#3a4796", muster: ["❄️", "✨"] },
    haar: { name: "Eiskristall-Silber", icon: "💎", farben: ["#e8ecf5", "#aeb7cc"] },
    hud: { name: "Polarnacht", icon: "🌌", symbole: ["💜", "🐻‍❄️", "🧣", "❄️"] },
    logo: { name: "Polar-Logo", icon: "🐻‍❄️", krone: "🐻‍❄️", deko: "❄️", funkeln: "✧" },
    bg: { name: "Polarlicht", icon: "🌌", verlauf: ["#2b3a7a", "#5b6fc7", "#a7e6f2"], richtung: "fallen", hinten: ["✨", "⭐"], vorne: ["❄️", "🌨️"] },
    z15: { platz: "spielzeug", name: "Eisbär-Kuscheltier", icon: "🐻‍❄️" },
    z45: { platz: "lampe", name: "Polarlicht-Lampe", icon: "🌌" },
    tier: { name: "Kaiserpinguin", filter: "hue-rotate(200deg) saturate(0.8)" },
    zubehoer: { typ: "halsband", name: "Strickschal", icon: "🧣", farbe: "#7b8fe0", extra: "#ffffff" } },

  { nr: 16, thema: "valentin", jahr: 2028, f: ["#ff7aa8", "#a8235a", "#ffb347", "#fff2f7", "#fff4e6", "#4f1c33"],
    deko: ["💐", "🍫", "💗", "💕", "🧁", "💝"],
    hut: { typ: "schleife", name: "Herzschleife", icon: "🎀", farbe: "#ff7aa8", rand: "#a8235a", emoji: "💗" },
    musik: { name: "Herzklopfen (Zuckersüß)", icon: "🍬", halbtoene: 3, tempo: 1.05, verziert: true },
    kleid: { name: "Pralinen-Kleid", icon: "🍫", farbe: "#ff9ec2", kragen: "#fff0f6", saum: "#8a4b2f", muster: ["🍫", "💗"] },
    haar: { name: "Rosenholz", icon: "🌹", farben: ["#c97a7a", "#8e4a52"] },
    hud: { name: "Zuckerherz", icon: "🍭", symbole: ["💗", "🍫", "💐", "💕"] },
    logo: { name: "Pralinen-Logo", icon: "🍫", krone: "💐", deko: "🍫", funkeln: "♡" },
    bg: { name: "Pralinenregen", icon: "🍫", verlauf: ["#fff0f6", "#ffe4ee", "#ffe9d6"], richtung: "fallen", hinten: ["💕", "✨"], vorne: ["🍫", "💗"] },
    z15: { platz: "regal", name: "Pralinenschachtel", icon: "🍫", zusatz: "💝" },
    z45: { platz: "bett", name: "Herzchenbett", icon: "🛏️", zusatz: "💗" },
    tier: { name: "Zuckerwatte-Bär", filter: "hue-rotate(300deg) saturate(1.1) brightness(1.1)" },
    zubehoer: { typ: "schleife", name: "Pralinen-Schleife", icon: "🍫", farbe: "#8a4b2f", extra: "#ff9ec2" } },

  { nr: 17, thema: "ostern", jahr: 2028, f: ["#6ec6ff", "#2b6ea6", "#ffd23f", "#f0f9ff", "#fffbe6", "#1f3a52"],
    deko: ["🐇", "🥚", "🌷", "🐣", "🧺", "🌼"],
    hut: { typ: "haarreif", name: "Osterhasen-Haarreif", icon: "🐇", farbe: "#6ec6ff", emoji: ["🥚", "🐇", "🥚"] },
    musik: { name: "Hüpf-Häschen (Frühlingsfest)", icon: "🌷", halbtoene: -2, tempo: 1.1 },
    kleid: { name: "Ostereier-Kleid", icon: "🥚", farbe: "#bfe6ff", kragen: "#ffffff", saum: "#ffd23f", muster: ["🥚", "🌷"] },
    haar: { name: "Löwenzahn-Blond", icon: "🌼", farben: ["#ffe27a", "#e0b23f"] },
    hud: { name: "Frühlingshimmel", icon: "🌤️", symbole: ["💙", "🐇", "🧺", "🥚"] },
    logo: { name: "Frühlings-Logo", icon: "🐣", krone: "🐇", deko: "🌷", funkeln: "✾" },
    bg: { name: "Eierhügel", icon: "🥚", verlauf: ["#e3f4ff", "#f3fbe6", "#e6f6d2"], richtung: "steigen", hinten: ["🌼", "✨"], vorne: ["🥚", "🐣"] },
    z15: { platz: "spielzeug", name: "Schokohase", icon: "🐰", zusatz: "🍫" },
    z45: { platz: "boden", name: "Frühlingswiese", icon: "🌿", farbe: "#a9dd8f" },
    tier: { name: "Himmelblaues Küken", filter: "hue-rotate(170deg) saturate(0.9)" },
    zubehoer: { typ: "koerbchen", name: "Eierkorb", icon: "🥚", farbe: "#9fd3ff", kissen: "#fff8d6", extra: "🥚🌷🥚" } },

  { nr: 18, thema: "schmetterling", jahr: 2028, f: ["#f5b800", "#8a6200", "#6fbf73", "#fffbe6", "#f0fbe9", "#3b2e05"],
    deko: ["🐝", "🌻", "🦋", "🍯", "🌼", "☀️"],
    hut: { typ: "haarreif", name: "Bienchen-Haarreif", icon: "🐝", farbe: "#3b2e05", emoji: ["🌼", "🐝", "🌼"] },
    musik: { name: "Schmetterlingstanz (Summsumm)", icon: "🐝", halbtoene: -3, tempo: 1.1, verziert: true },
    kleid: { name: "Hummelkleid", icon: "🐝", farbe: "#ffd84d", kragen: "#ffffff", saum: "#3b2e05", muster: ["🐝", "🌻"] },
    haar: { name: "Honigblond", icon: "🍯", farben: ["#f2c46b", "#c48a2e"] },
    hud: { name: "Honigwabe", icon: "🍯", symbole: ["💛", "🐝", "🍯", "🌻"] },
    logo: { name: "Honig-Logo", icon: "🍯", krone: "🐝", deko: "🌻", funkeln: "✿" },
    bg: { name: "Sonnenblumenfeld", icon: "🌻", verlauf: ["#fff6cc", "#fffbe6", "#e6f6d0"], richtung: "fallen", hinten: ["✨", "🌼"], vorne: ["🌻", "🐝"] },
    z15: { platz: "regal", name: "Honigtopf", icon: "🍯", zusatz: "🐝" },
    z45: { platz: "teppich", name: "Wabenteppich", icon: "🍯", farbe: "radial-gradient(#fff3b0 0 35%, #ffd84d 36% 65%, #e0a800 66%)" },
    tier: { name: "Zitronenfalter", filter: "hue-rotate(140deg) saturate(1.3) brightness(1.1)" },
    zubehoer: { typ: "halsband", name: "Bienen-Halsband", icon: "🐝", farbe: "#f5b800", extra: "🐝" } },

  { nr: 19, thema: "einhorn", jahr: 2028, f: ["#4fd1c5", "#1f7a74", "#ff8fd1", "#ecfffb", "#fff0fa", "#173f3c"],
    deko: ["🦄", "🫧", "✨", "💎", "🌙", "🌸"],
    hut: { typ: "krone", name: "Seifenblasen-Krone", icon: "🫧", farbe: "#bdf4ee", rand: "#4fd1c5", stein: "#ff8fd1" },
    musik: { name: "Einhornwiese (Mondschein)", icon: "🌙", halbtoene: -5, tempo: 0.9 },
    kleid: { name: "Glitzer-Tutu", icon: "🩰", farbe: "#a6efe6", kragen: "#ffffff", saum: "#ff8fd1", muster: ["✨", "🌸"] },
    haar: { name: "Meerjungfrauen-Türkis", icon: "🧜‍♀️", farben: ["#7fe0d6", "#3aa79e"] },
    hud: { name: "Seifenblase", icon: "🫧", symbole: ["🩵", "🦄", "🫧", "✨"] },
    logo: { name: "Glitzerhorn-Logo", icon: "🦄", krone: "🦄", deko: "🫧", funkeln: "✧" },
    bg: { name: "Seifenblasenwiese", icon: "🫧", verlauf: ["#e6fffb", "#f3f0ff", "#fff0f8"], richtung: "steigen", hinten: ["✨", "🌸"], vorne: ["🫧", "🦋"] },
    z15: { platz: "lampe", name: "Einhorn-Nachtlicht", icon: "🦄", zusatz: "✨" },
    z45: { platz: "wand", name: "Glitzerhorn-Tapete", icon: "🦄", farbe: "#f0fffc", muster: "🦄" },
    tier: { name: "Glitzer-Igel", filter: "hue-rotate(140deg) saturate(1.4) brightness(1.1)" },
    zubehoer: { typ: "schleife", name: "Einhorn-Spange", icon: "🦄", farbe: "", extra: "🦄" } },

  { nr: 20, thema: "feenwald", jahr: 2028, f: ["#7a6ff0", "#3a2f99", "#d6f25a", "#f1f0ff", "#fbffe6", "#1f1a4a"],
    deko: ["✨", "🌙", "🍄", "🦉", "⭐", "🌲"],
    hut: { typ: "haarreif", name: "Glühwürmchen-Haarreif", icon: "✨", farbe: "#3a2f99", emoji: ["✨", "🌙", "✨"] },
    musik: { name: "Feenreigen (Glühwürmchen)", icon: "✨", halbtoene: 2, tempo: 0.9, verziert: true },
    kleid: { name: "Mondscheinkleid", icon: "🌙", farbe: "#a9a2f5", kragen: "#fbffe6", saum: "#d6f25a", muster: ["✨", "🌙"] },
    haar: { name: "Veilchenblau", icon: "🔮", farben: ["#9a8ce0", "#5a4ca8"] },
    hud: { name: "Glühwürmchen", icon: "✨", symbole: ["💜", "🌙", "🍄", "✨"] },
    logo: { name: "Glühwürmchen-Logo", icon: "✨", krone: "🌙", deko: "🍄", funkeln: "✦" },
    bg: { name: "Glühwürmchenwald", icon: "🌲", verlauf: ["#1f2a55", "#3d3f8f", "#6aa36f"], richtung: "steigen", hinten: ["✨", "⭐"], vorne: ["🌲", "🍄"] },
    z15: { platz: "lampe", name: "Glühwürmchenglas", icon: "🫙", zusatz: "✨" },
    z45: { platz: "fenster", name: "Mondwald", icon: "🌙", himmel: "linear-gradient(#1f2a55 0 60%, #2f5a3a 61%)" },
    tier: { name: "Mondschein-Kitz", filter: "hue-rotate(220deg) saturate(0.9) brightness(1.05)" },
    zubehoer: { typ: "schleife", name: "Sternen-Schleife", icon: "⭐", farbe: "#7a6ff0", extra: "#d6f25a" } },

  { nr: 21, thema: "sommer", jahr: 2028, f: ["#ff6f91", "#b0284f", "#ffc94d", "#fff3f6", "#fffbe0", "#4a1f2c"],
    deko: ["🍦", "🌴", "🍓", "☀️", "🍹", "🌺"],
    hut: { typ: "kranz", name: "Hawaii-Blumenkranz", icon: "🌺", farben: ["#ff6f91", "#ffc94d", "#ff9f43"] },
    musik: { name: "Sommerferien (Eisdiele)", icon: "🍦", halbtoene: 4, tempo: 1.1, verziert: true },
    kleid: { name: "Eiscreme-Kleid", icon: "🍦", farbe: "#ffb3c6", kragen: "#fffbe0", saum: "#ffc94d", muster: ["🍦", "🍓"] },
    haar: { name: "Sonnenblond", icon: "☀️", farben: ["#ffe08a", "#e0a93f"] },
    hud: { name: "Eisdiele", icon: "🍨", symbole: ["💗", "🍦", "🍹", "🌺"] },
    logo: { name: "Eiscreme-Logo", icon: "🍦", krone: "🍦", deko: "🍓", funkeln: "☼" },
    bg: { name: "Eiswaffel-Strand", icon: "🍦", verlauf: ["#ffe8ef", "#fff6d9", "#ffe9b8"], richtung: "fallen", hinten: ["✨", "☀️"], vorne: ["🍦", "🍓"] },
    z15: { platz: "moebel", name: "Eiswagen", icon: "🍨", zusatz: "☀️" },
    z45: { platz: "teppich", name: "Badetuch", icon: "🏖️", farbe: "repeating-linear-gradient(90deg, #ff6f91 0 14%, #fff 14% 28%, #ffc94d 28% 42%, #fff 42% 56%)" },
    tier: { name: "Korallen-Schildkröte", filter: "hue-rotate(250deg) saturate(1.3)" },
    zubehoer: { typ: "halsband", name: "Blumenkette", icon: "🌺", farbe: "#ff6f91", extra: "🌺" } },

  { nr: 22, thema: "meerjungfrau", jahr: 2028, f: ["#5b8def", "#203f96", "#ffd6a5", "#eef3ff", "#fff6ea", "#16244f"],
    deko: ["🐬", "🦪", "🌊", "🫧", "🧜‍♀️", "🐳"],
    hut: { typ: "schleife", name: "Perlenschleife", icon: "🦪", farbe: "#5b8def", rand: "#203f96", emoji: "🦪" },
    musik: { name: "Meereslied (Delfinsprung)", icon: "🐬", halbtoene: 3, tempo: 1.12 },
    kleid: { name: "Wellenkleid", icon: "🌊", farbe: "#8fb3f5", kragen: "#ffffff", saum: "#ffd6a5", muster: ["🐬", "🌊"] },
    haar: { name: "Perlweiß", icon: "🦪", farben: ["#f4f0ea", "#c9c0b4"] },
    hud: { name: "Delfinbucht", icon: "🐬", symbole: ["💙", "🐬", "🦪", "🌊"] },
    logo: { name: "Delfin-Logo", icon: "🐬", krone: "🐬", deko: "🫧", funkeln: "≈" },
    bg: { name: "Delfinbucht", icon: "🐬", verlauf: ["#dbe8ff", "#bcd6ff", "#ffe9cf"], richtung: "steigen", hinten: ["🫧", "✨"], vorne: ["🐬", "🌊"] },
    z15: { platz: "spielzeug", name: "Kuschel-Delfin", icon: "🐬" },
    z45: { platz: "boden", name: "Sandboden", icon: "🏝️", farbe: "#f3dcae" },
    tier: { name: "Perlen-Robbe", filter: "sepia(0.35) hue-rotate(170deg) saturate(1.8) brightness(1.08)" },
    zubehoer: { typ: "halsband", name: "Perlenkette", icon: "🦪", farbe: "#ffffff", extra: "#5b8def" } },

  { nr: 23, thema: "drachen", jahr: 2028, f: ["#8a63d2", "#4b2b8c", "#ffcf4d", "#f5f0ff", "#fff7dc", "#2a1a4a"],
    deko: ["🐉", "🌙", "🪁", "⭐", "🏮", "✨"],
    hut: { typ: "haarreif", name: "Laternen-Haarreif", icon: "🏮", farbe: "#8a63d2", emoji: ["⭐", "🏮", "⭐"] },
    musik: { name: "Drachenflug (Laternenfest)", icon: "🏮", halbtoene: -2, tempo: 0.95, verziert: true },
    kleid: { name: "Laternen-Kleid", icon: "🏮", farbe: "#b49bf0", kragen: "#fff7dc", saum: "#ffcf4d", muster: ["🏮", "⭐"] },
    haar: { name: "Abendrot", icon: "🌇", farben: ["#e87a5d", "#a8433a"] },
    hud: { name: "Laternenzauber", icon: "🏮", symbole: ["💜", "🐉", "🏮", "🌙"] },
    logo: { name: "Laternen-Logo", icon: "🏮", krone: "🏮", deko: "🌙", funkeln: "✦" },
    bg: { name: "Laternenhimmel", icon: "🏮", verlauf: ["#3a2a6e", "#7a5fc4", "#ffd9a8"], richtung: "steigen", hinten: ["⭐", "✨"], vorne: ["🏮", "🪁"] },
    z15: { platz: "lampe", name: "Papierlaterne", icon: "🏮" },
    z45: { platz: "fenster", name: "Sternendrachen", icon: "🐉", himmel: "linear-gradient(#2b2363, #6a54b8)" },
    tier: { name: "Sternen-Drache", filter: "hue-rotate(150deg) saturate(1.2)" },
    zubehoer: { typ: "halsband", name: "Laternen-Halsband", icon: "🏮", farbe: "#8a63d2", extra: "🏮" } },

  { nr: 24, thema: "halloween", jahr: 2028, f: ["#4caf50", "#1f5f23", "#ff8a2a", "#effbea", "#fff2e3", "#1c2e1d"],
    deko: ["🧟", "🕷️", "🍭", "🌕", "🍬", "🎃"],
    hut: { typ: "krone", name: "Kürbiskönigin-Krone", icon: "👑", farbe: "#ff8a2a", rand: "#1f5f23", stein: "#7a3fb5" },
    musik: { name: "Gespensterchen (Spukparty)", icon: "🕺", halbtoene: 2, tempo: 1.15 },
    kleid: { name: "Spinnennetz-Kleid", icon: "🕸️", farbe: "#6a4c93", kragen: "#ffffff", saum: "#ff8a2a", muster: ["🕷️", "🍬"] },
    haar: { name: "Hexengrün", icon: "🧪", farben: ["#7bd389", "#3f8f4c"] },
    hud: { name: "Zaubertrank", icon: "🧪", symbole: ["💚", "🧙‍♀️", "🍭", "🕸️"] },
    logo: { name: "Zaubertrank-Logo", icon: "🧪", krone: "🧪", deko: "🕷️", funkeln: "✶" },
    bg: { name: "Hexenküche", icon: "🧪", verlauf: ["#dff5dc", "#ece6ff", "#ffe9d1"], richtung: "steigen", hinten: ["✨", "⭐"], vorne: ["🧪", "🍬"] },
    z15: { platz: "regal", name: "Zaubertrank", icon: "🧪", zusatz: "✨" },
    z45: { platz: "wand", name: "Fledermaus-Tapete", icon: "🦇", farbe: "#f1ecfb", muster: "🦇" },
    tier: { name: "Mondschein-Fledermaus", filter: "hue-rotate(80deg) saturate(1.2)" },
    zubehoer: { typ: "koerbchen", name: "Kürbisbett", icon: "🎃", farbe: "#ff8a2a", kissen: "#6a4c93", extra: "🍬🎃🍬" } },

  { nr: 25, thema: "thanksgiving", jahr: 2028, f: ["#c0392b", "#6e1d15", "#e5a937", "#fff2ee", "#fff7e0", "#3d1a12"],
    deko: ["🍎", "🍐", "🍁", "🦔", "🍄", "🦃"],
    hut: { typ: "haarreif", name: "Apfel-Haarreif", icon: "🍎", farbe: "#6e1d15", emoji: ["🍁", "🍎", "🍁"] },
    musik: { name: "Erntedank-Walzer (Apfelfest)", icon: "🍎", halbtoene: -4, tempo: 0.95 },
    kleid: { name: "Apfelkleid", icon: "🍎", farbe: "#e05a4a", kragen: "#fff7e0", saum: "#6e1d15", muster: ["🍎", "🍁"] },
    haar: { name: "Herbstrot", icon: "🍁", farben: ["#c4533a", "#7d2a1c"] },
    hud: { name: "Apfelernte", icon: "🍎", symbole: ["❤️", "🍎", "🧺", "🍐"] },
    logo: { name: "Apfelfest-Logo", icon: "🍎", krone: "🍎", deko: "🍁", funkeln: "❀" },
    bg: { name: "Apfelgarten", icon: "🍏", verlauf: ["#fff0ea", "#ffeccc", "#f3e2b8"], richtung: "fallen", hinten: ["🍂", "✨"], vorne: ["🍎", "🍁"] },
    z15: { platz: "pflanze", name: "Apfelbäumchen", icon: "🌳", zusatz: "🍎" },
    z45: { platz: "boden", name: "Herbstlaub-Boden", icon: "🍂", farbe: "#d9a066" },
    tier: { name: "Apfelrotes Truthahn-Küken", filter: "hue-rotate(-20deg) saturate(1.4)" },
    zubehoer: { typ: "halsband", name: "Apfel-Halsband", icon: "🍎", farbe: "#c0392b", extra: "🍎" } },

  { nr: 26, thema: "weihnachten", jahr: 2028, f: ["#d4a017", "#7a5a00", "#c62f3e", "#fffaea", "#fff0f0", "#3a2c08"],
    deko: ["🌟", "👼", "🎁", "🕯️", "🔔", "🎅"],
    hut: { typ: "krone", name: "Goldsternen-Krone", icon: "🌟", farbe: "#ffe27a", rand: "#d4a017", stein: "#c62f3e" },
    musik: { name: "Glöckchen (Goldener Engel)", icon: "👼", halbtoene: 5, tempo: 0.9, verziert: true },
    kleid: { name: "Engelskleid", icon: "👼", farbe: "#fff3c4", kragen: "#ffffff", saum: "#d4a017", muster: ["🌟", "🔔"] },
    haar: { name: "Goldlocken", icon: "✨", farben: ["#ffd66b", "#d9a826"] },
    hud: { name: "Goldglanz", icon: "🌟", symbole: ["💛", "👼", "🎁", "🌟"] },
    logo: { name: "Goldstern-Logo", icon: "🌟", krone: "🌟", deko: "🔔", funkeln: "✸" },
    bg: { name: "Goldene Nacht", icon: "🌟", verlauf: ["#2c2a55", "#5a4a8a", "#e8c96a"], richtung: "fallen", hinten: ["✨", "⭐"], vorne: ["🌟", "❄️"] },
    z15: { platz: "regal", name: "Spieluhr", icon: "🎶", zusatz: "🌟" },
    z45: { platz: "lampe", name: "Goldstern-Lampe", icon: "🌟" },
    tier: { name: "Goldenes Rentier", filter: "hue-rotate(15deg) saturate(1.5) brightness(1.15)" },
    zubehoer: { typ: "schleife", name: "Goldglöckchen", icon: "🔔", farbe: "", extra: "🔔" } },

  // ───────── Season-Jahr 3: Januar bis Oktober 2029 ─────────
  { nr: 27, thema: "winter", jahr: 2029, f: ["#e66fa8", "#8f2a5f", "#7cc4f2", "#fff2f8", "#eef8ff", "#3f1630"],
    deko: ["⛸️", "❄️", "🎿", "✨", "☕", "🏔️"],
    hut: { typ: "muetze", name: "Ohrenwärmer-Mütze", icon: "🧢", farbe: "#e66fa8", rand: "#ffffff", bommel: "#7cc4f2", emoji: "⛸️" },
    musik: { name: "Eisprinzessin-Walzer (Schlittschuhlauf)", icon: "⛸️", halbtoene: -3, tempo: 1.12 },
    kleid: { name: "Eiskunstlauf-Kleid", icon: "⛸️", farbe: "#f7a8cf", kragen: "#ffffff", saum: "#7cc4f2", muster: ["⛸️", "❄️"] },
    haar: { name: "Frostrosa", icon: "🌸", farben: ["#f7b6d2", "#c97aa0"] },
    hud: { name: "Eiskunstlauf", icon: "⛸️", symbole: ["🩷", "⛸️", "☕", "❄️"] },
    logo: { name: "Eislauf-Logo", icon: "⛸️", krone: "⛸️", deko: "❄️", funkeln: "✧" },
    bg: { name: "Eislaufbahn", icon: "⛸️", verlauf: ["#ffe9f4", "#eaf4ff", "#ffffff"], richtung: "fallen", hinten: ["✨", "❄️"], vorne: ["❄️", "⛸️"] },
    z15: { platz: "regal", name: "Heiße Schokolade", icon: "☕", zusatz: "🍫" },
    z45: { platz: "teppich", name: "Eisfläche", icon: "🧊", farbe: "radial-gradient(#ffffff 0 30%, #dff1ff 31% 62%, #f7c6dd 63%)" },
    tier: { name: "Rosa Pinguin", filter: "hue-rotate(310deg) saturate(1.3) brightness(1.08)" },
    zubehoer: { typ: "koerbchen", name: "Kuschelschlitten", icon: "🛷", farbe: "#e66fa8", kissen: "#ffffff", extra: "❄️⭐❄️" } },

  { nr: 28, thema: "valentin", jahr: 2029, f: ["#b06ef0", "#5e2a9c", "#ff6f91", "#f7f0ff", "#fff0f4", "#2e1650"],
    deko: ["💜", "💌", "🦋", "💕", "🌷", "💞"],
    hut: { typ: "haarreif", name: "Schmetterlings-Haarreif", icon: "🦋", farbe: "#b06ef0", emoji: ["💕", "🦋", "💕"] },
    musik: { name: "Herzklopfen (Schmetterlinge)", icon: "🦋", halbtoene: -5, tempo: 0.95, verziert: true },
    kleid: { name: "Lavendel-Kleid", icon: "💜", farbe: "#c9a6f5", kragen: "#ffffff", saum: "#ff6f91", muster: ["🦋", "💜"] },
    haar: { name: "Lavendel", icon: "💜", farben: ["#c8a8ef", "#8e6bc4"] },
    hud: { name: "Lavendelherz", icon: "💜", symbole: ["💜", "💌", "🌷", "🦋"] },
    logo: { name: "Schmetterlings-Logo", icon: "🦋", krone: "🦋", deko: "💌", funkeln: "♡" },
    bg: { name: "Liebesbriefe", icon: "💌", verlauf: ["#f6efff", "#fff0f7", "#ffe6ee"], richtung: "steigen", hinten: ["💕", "✨"], vorne: ["💌", "🦋"] },
    z15: { platz: "wandbild", name: "Herz-Bild", icon: "💞" },
    z45: { platz: "moebel", name: "Schminktisch", icon: "🪞", zusatz: "💄" },
    tier: { name: "Lavendel-Bär", filter: "hue-rotate(240deg) saturate(0.9) brightness(1.1)" },
    zubehoer: { typ: "halsband", name: "Herzmedaillon", icon: "💌", farbe: "#b06ef0", extra: "💗" } },

  { nr: 29, thema: "ostern", jahr: 2029, f: ["#ff9f43", "#a8551a", "#7cc36b", "#fff6ea", "#f2fbe8", "#4a2a12"],
    deko: ["🥕", "🐰", "🌸", "🐣", "🦋", "🌻"],
    hut: { typ: "kranz", name: "Gänseblümchen-Kranz", icon: "🌼", farben: ["#ffffff", "#ffd1e6", "#ffe27a"] },
    musik: { name: "Hüpf-Häschen (Möhrenmarsch)", icon: "🥕", halbtoene: 3, tempo: 1.18, verziert: true },
    kleid: { name: "Möhrchen-Kleid", icon: "🥕", farbe: "#ffc285", kragen: "#ffffff", saum: "#7cc36b", muster: ["🥕", "🌸"] },
    haar: { name: "Karottenrot", icon: "🥕", farben: ["#f08a4b", "#b9572a"] },
    hud: { name: "Möhrenbeet", icon: "🥕", symbole: ["🧡", "🐰", "🥕", "🌸"] },
    logo: { name: "Möhren-Logo", icon: "🥕", krone: "🐰", deko: "🥕", funkeln: "✿" },
    bg: { name: "Möhrenbeet", icon: "🥕", verlauf: ["#eaf8ff", "#fff3e0", "#e8f6d8"], richtung: "fallen", hinten: ["🌸", "✨"], vorne: ["🥕", "🦋"] },
    z15: { platz: "spielzeug", name: "Hasenhäuschen", icon: "🏡", zusatz: "🐰" },
    z45: { platz: "fenster", name: "Blumenwiese", icon: "🌻", himmel: "linear-gradient(#bfe6ff 0 55%, #9ad97a 56%)" },
    tier: { name: "Möhrchen-Küken", filter: "hue-rotate(-25deg) saturate(1.5)" },
    zubehoer: { typ: "schleife", name: "Möhren-Spange", icon: "🥕", farbe: "", extra: "🥕" } },

  { nr: 30, thema: "schmetterling", jahr: 2029, f: ["#ff6f61", "#a82c22", "#4fc3dc", "#fff1ef", "#e9fbff", "#4a1612"],
    deko: ["🦋", "🌈", "🌺", "🐞", "🌧️", "🌷"],
    hut: { typ: "kranz", name: "Regenbogenkranz", icon: "🌈", farben: ["#ff6f61", "#ffd23f", "#4fc3dc", "#b06ef0"] },
    musik: { name: "Schmetterlingstanz (Regenbogen)", icon: "🌈", halbtoene: 4, tempo: 0.95 },
    kleid: { name: "Marienkäfer-Kleid", icon: "🐞", farbe: "#ff6f61", kragen: "#ffffff", saum: "#3a2a2a", muster: ["🐞", "🌺"] },
    haar: { name: "Kirschrot", icon: "🍒", farben: ["#d94a5a", "#9a2236"] },
    hud: { name: "Marienkäfer", icon: "🐞", symbole: ["❤️", "🐞", "🌺", "🦋"] },
    logo: { name: "Marienkäfer-Logo", icon: "🐞", krone: "🐞", deko: "🌺", funkeln: "❀" },
    bg: { name: "Aprilregen", icon: "🌧️", verlauf: ["#e2f4ff", "#fff0f0", "#e9f8de"], richtung: "fallen", hinten: ["💧", "✨"], vorne: ["🦋", "🐞"] },
    z15: { platz: "spielzeug", name: "Marienkäfer-Kissen", icon: "🐞" },
    z45: { platz: "wandbild", name: "Regenbogenbild", icon: "🌈" },
    tier: { name: "Regenbogenfalter", filter: "hue-rotate(80deg) saturate(1.5)" },
    zubehoer: { typ: "koerbchen", name: "Blütenkörbchen", icon: "🌺", farbe: "#ff6f61", kissen: "#fff1ef", extra: "🌺🐞🌺" } },

  { nr: 31, thema: "einhorn", jahr: 2029, f: ["#ffb347", "#a8641a", "#ff7eb6", "#fff8ec", "#fff0f7", "#4a2e12"],
    deko: ["🦄", "🌅", "🍑", "✨", "🌈", "🌻"],
    hut: { typ: "krone", name: "Sonnenaufgangs-Krone", icon: "🌅", farbe: "#ffd28a", rand: "#ff7eb6", stein: "#ffffff" },
    musik: { name: "Einhornwiese (Sonnenaufgang)", icon: "🌅", halbtoene: 2, tempo: 1.05, verziert: true },
    kleid: { name: "Pfirsich-Kleid", icon: "🍑", farbe: "#ffcfa3", kragen: "#ffffff", saum: "#ff7eb6", muster: ["🌈", "✨"] },
    haar: { name: "Pfirsichrosa", icon: "🍑", farben: ["#ffc2a8", "#e58a6f"] },
    hud: { name: "Sonnenaufgang", icon: "🌅", symbole: ["🧡", "🦄", "🌈", "🌻"] },
    logo: { name: "Morgenrot-Logo", icon: "🌅", krone: "🦄", deko: "🌅", funkeln: "✦" },
    bg: { name: "Morgenrot-Wiese", icon: "🌅", verlauf: ["#ffe2c4", "#ffe9f2", "#fff8dc"], richtung: "steigen", hinten: ["✨", "🌸"], vorne: ["🌈", "🦋"] },
    z15: { platz: "pflanze", name: "Regenbogen-Blume", icon: "🌷", zusatz: "🌈" },
    z45: { platz: "bett", name: "Wolkenbett", icon: "☁️", zusatz: "🦄" },
    tier: { name: "Pfirsich-Igel", filter: "hue-rotate(-30deg) saturate(1.3) brightness(1.12)" },
    zubehoer: { typ: "koerbchen", name: "Wolkenkissen", icon: "☁️", farbe: "#ffd28a", kissen: "#ffffff", extra: "🌈✨🌈" } },

  { nr: 32, thema: "feenwald", jahr: 2029, f: ["#e0533d", "#8a2a1c", "#7cbf6a", "#fff2ee", "#eef9e8", "#3e1710"],
    deko: ["🍄", "🏡", "🐿️", "🌰", "🍃", "🐌"],
    hut: { typ: "muetze", name: "Wichtelmütze", icon: "🍄", farbe: "#e0533d", rand: "#ffffff", bommel: "#ffffff", emoji: "🍄" },
    musik: { name: "Feenreigen (Pilzdorf)", icon: "🍄", halbtoene: -3, tempo: 1.15 },
    kleid: { name: "Fliegenpilz-Kleid", icon: "🍄", farbe: "#f07a66", kragen: "#ffffff", saum: "#7cbf6a", muster: ["🍄", "🍃"] },
    haar: { name: "Eichhörnchen-Rot", icon: "🐿️", farben: ["#d97a3f", "#9a4a1c"] },
    hud: { name: "Pilzdorf", icon: "🍄", symbole: ["❤️", "🍄", "🐿️", "🍃"] },
    logo: { name: "Fliegenpilz-Logo", icon: "🍄", krone: "🍄", deko: "🍃", funkeln: "✿" },
    bg: { name: "Pilzdorf", icon: "🏡", verlauf: ["#eaf7e3", "#fff3e8", "#f3e2cc"], richtung: "fallen", hinten: ["🍃", "✨"], vorne: ["🍄", "🌰"] },
    z15: { platz: "moebel", name: "Pilzhocker", icon: "🍄", zusatz: "🐌" },
    z45: { platz: "boden", name: "Moosboden", icon: "🌿", farbe: "#8fc77a" },
    tier: { name: "Haselnuss-Kitz", filter: "hue-rotate(-15deg) saturate(1.3) brightness(0.95)" },
    zubehoer: { typ: "schleife", name: "Pilz-Spange", icon: "🍄", farbe: "", extra: "🍄" } },

  { nr: 33, thema: "sommer", jahr: 2029, f: ["#2bb37a", "#14603f", "#ff6f91", "#ecfbf3", "#fff3f5", "#123d2a"],
    deko: ["🍉", "🏊‍♀️", "☀️", "🛟", "🍹", "🌴"],
    hut: { typ: "haarreif", name: "Melonen-Haarreif", icon: "🍉", farbe: "#2bb37a", emoji: ["🍉", "☀️", "🍉"] },
    musik: { name: "Sommerferien (Freibad)", icon: "🏊‍♀️", halbtoene: -4, tempo: 1.12 },
    kleid: { name: "Melonen-Kleid", icon: "🍉", farbe: "#ff8fa3", kragen: "#ffffff", saum: "#2bb37a", muster: ["🍉", "☀️"] },
    haar: { name: "Karamell", icon: "🍮", farben: ["#c98b55", "#8a5a2f"] },
    hud: { name: "Freibad", icon: "🏊‍♀️", symbole: ["💚", "🍉", "🛟", "☀️"] },
    logo: { name: "Melonen-Logo", icon: "🍉", krone: "🍉", deko: "☀️", funkeln: "☼" },
    bg: { name: "Freibad", icon: "🛟", verlauf: ["#d6f5ff", "#eafff4", "#fff6d6"], richtung: "fallen", hinten: ["☀️", "✨"], vorne: ["🍉", "🛟"] },
    z15: { platz: "spielzeug", name: "Schwimmring", icon: "🛟" },
    z45: { platz: "wand", name: "Melonen-Tapete", icon: "🍉", farbe: "#f2fff6", muster: "🍉" },
    tier: { name: "Melonen-Schildkröte", filter: "hue-rotate(320deg) saturate(1.4)" },
    zubehoer: { typ: "halsband", name: "Melonen-Halsband", icon: "🍉", farbe: "#ff6f91", extra: "🍉" } },

  { nr: 34, thema: "meerjungfrau", jahr: 2029, f: ["#9b5de5", "#4b1f8a", "#3fe0c5", "#f5efff", "#e8fffb", "#24104a"],
    deko: ["🐙", "🐡", "🫧", "✨", "🐚", "🧜‍♀️"],
    hut: { typ: "krone", name: "Tiefsee-Krone", icon: "💎", farbe: "#d9c2ff", rand: "#9b5de5", stein: "#3fe0c5" },
    musik: { name: "Meereslied (Tiefsee)", icon: "🐙", halbtoene: -5, tempo: 0.88, verziert: true },
    kleid: { name: "Tiefseekleid", icon: "🐙", farbe: "#c3a6f5", kragen: "#ffffff", saum: "#3fe0c5", muster: ["🐙", "✨"] },
    haar: { name: "Meerjungfrauen-Lila", icon: "🧜‍♀️", farben: ["#b48ef0", "#7a4fc4"] },
    hud: { name: "Tiefsee", icon: "🐙", symbole: ["💜", "🐙", "🐡", "🫧"] },
    logo: { name: "Tiefsee-Logo", icon: "🐙", krone: "🐙", deko: "🫧", funkeln: "✧" },
    bg: { name: "Leuchtende Tiefsee", icon: "🐡", verlauf: ["#2a1a5e", "#45308f", "#2fa8a0"], richtung: "steigen", hinten: ["🫧", "✨"], vorne: ["🐙", "🐠"] },
    z15: { platz: "lampe", name: "Leuchtfisch-Lampe", icon: "🐡", zusatz: "✨" },
    z45: { platz: "wand", name: "Blasen-Tapete", icon: "🫧", farbe: "#f3eeff", muster: "🫧" },
    tier: { name: "Glitzer-Robbe", filter: "sepia(0.5) hue-rotate(220deg) saturate(2)" },
    zubehoer: { typ: "schleife", name: "Kraken-Schleife", icon: "🐙", farbe: "#9b5de5", extra: "#3fe0c5" } },

  { nr: 35, thema: "drachen", jahr: 2029, f: ["#e8504a", "#8f211c", "#ffd23f", "#fff1f0", "#fff9dc", "#3f1210"],
    deko: ["🐲", "🔥", "🪁", "🍂", "🌋", "🎏"],
    hut: { typ: "haarreif", name: "Drachenhörner", icon: "🐲", farbe: "#8f211c", emoji: ["🔥", "🐲", "🔥"] },
    musik: { name: "Drachenflug (Feuerdrache)", icon: "🔥", halbtoene: 3, tempo: 1.15 },
    kleid: { name: "Feuerdrachen-Kleid", icon: "🔥", farbe: "#f07a6a", kragen: "#fff9dc", saum: "#ffd23f", muster: ["🐲", "🔥"] },
    haar: { name: "Feuerrot", icon: "🔥", farben: ["#e8604a", "#a52a1c"] },
    hud: { name: "Drachenfeuer", icon: "🔥", symbole: ["❤️‍🔥", "🐲", "🎏", "🔥"] },
    logo: { name: "Feuerdrachen-Logo", icon: "🐲", krone: "🐲", deko: "🔥", funkeln: "✹" },
    bg: { name: "Drachenberge", icon: "🌋", verlauf: ["#ffe2d6", "#ffd9b0", "#f7c7a0"], richtung: "steigen", hinten: ["✨", "🍂"], vorne: ["🪁", "🎏"] },
    z15: { platz: "regal", name: "Drachenei", icon: "🥚", zusatz: "🔥" },
    z45: { platz: "wandbild", name: "Drachenbild", icon: "🐲" },
    tier: { name: "Feuer-Drache", filter: "hue-rotate(-110deg) saturate(1.5)" },
    zubehoer: { typ: "koerbchen", name: "Drachennest", icon: "🪺", farbe: "#a8641a", kissen: "#ffd23f", extra: "🔥🥚🔥" } },

  { nr: 36, thema: "halloween", jahr: 2029, f: ["#5a6fd6", "#24307a", "#ffd23f", "#eff1ff", "#fff9e0", "#181f4a"],
    deko: ["👻", "🌙", "⭐", "🦉", "🍬", "🔮"],
    hut: { typ: "krone", name: "Sternenzauber-Krone", icon: "🔮", farbe: "#8fa0ef", rand: "#24307a", stein: "#ffd23f" },
    musik: { name: "Gespensterchen (Sternenzauber)", icon: "🔮", halbtoene: -2, tempo: 0.9, verziert: true },
    kleid: { name: "Zauberer-Kleid", icon: "🔮", farbe: "#5a6fd6", kragen: "#fff9e0", saum: "#ffd23f", muster: ["⭐", "🌙"] },
    haar: { name: "Mitternachtsblau", icon: "🌙", farben: ["#6a78c9", "#323b80"] },
    hud: { name: "Sternenzauber", icon: "🔮", symbole: ["💙", "🔮", "🍬", "👻"] },
    logo: { name: "Zauberkugel-Logo", icon: "🔮", krone: "🔮", deko: "🌙", funkeln: "✦" },
    bg: { name: "Sternenzauber", icon: "🌙", verlauf: ["#1f2860", "#43509e", "#a7b4f0"], richtung: "steigen", hinten: ["⭐", "✨"], vorne: ["👻", "🦉"] },
    z15: { platz: "regal", name: "Zauberkugel", icon: "🔮" },
    z45: { platz: "fenster", name: "Sternennacht", icon: "🌙", himmel: "linear-gradient(#141a4a, #3a4699)" },
    tier: { name: "Sternenstaub-Fledermaus", filter: "hue-rotate(180deg) saturate(1.2) brightness(1.1)" },
    zubehoer: { typ: "schleife", name: "Mond-Spange", icon: "🌙", farbe: "", extra: "🌙" } },
];

for (const v of SEASON_VARIANTEN) baueSeasonVariante(v);
