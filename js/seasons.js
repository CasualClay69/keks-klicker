"use strict";
// =====================================================
//  JAHRES-KALENDER 2027: Seasons 3 bis 8
//
//  Jede Season ist hier EIN Datenblock. registriereSeason() erzeugt daraus:
//  • 5 Skins (Hut, Musik, HUD, Logo, animierter Hintergrund) – Stufe 10/20/30/40/50
//  • den Season-Pass mit Logo-Banner, Farben und Herzregen-Thema
//  • eine Season-Sticker-Seite
//
//  Neue Season = neuen Block unten anlegen (und Version in version.js erhöhen).
//  Muss nach skins.js und album.js geladen werden.
// =====================================================

// ----- Helfer: Logo-Banner im Stil der Season-Logos -----
const SCHNEEHAUBE = `<path d="M44 68 C42 56 52 50 62 51 H298 C308 50 318 56 316 68
  C308 62 300 72 290 66 C280 74 268 63 258 69 C248 75 236 63 226 69 C214 75 204 63 192 69
  C180 75 170 63 158 69 C146 75 136 63 124 69 C112 75 100 63 90 69 C80 75 70 63 60 69
  C54 73 47 72 44 68 Z" fill="#ffffff"/>`;

function seasonLogo(o) {
  const groesse = Math.min(35, Math.floor(262 / (0.6 * o.titel.length)));   // lange Titel etwas kleiner
  const titel = o.titel.replace(/&/g, "&amp;");
  const textY = o.schnee ? 110 : 105;
  const deko = o.deko.map(([emoji, x, y, g]) => `<text x="${x}" y="${y}" font-size="${g}">${emoji}</text>`).join("");
  return `
<svg viewBox="0 0 360 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Season ${o.nr}: ${titel}">
  <defs>
    <linearGradient id="${o.id}-band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${o.band[0]}"/><stop offset="1" stop-color="${o.band[1]}"/>
    </linearGradient>
    <linearGradient id="${o.id}-schrift" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${o.schrift[0]}"/><stop offset="1" stop-color="${o.schrift[1]}"/>
    </linearGradient>
  </defs>
  <path d="M12 66 H60 V116 H12 L27 91 Z" fill="${o.enden}"/>
  <path d="M348 66 H300 V116 H348 L333 91 Z" fill="${o.enden}"/>
  <path d="M60 116 L46 104 H60 Z" fill="${o.endenSchatten}"/>
  <path d="M300 116 L314 104 H300 Z" fill="${o.endenSchatten}"/>
  <rect x="42" y="52" width="276" height="70" rx="18" fill="url(#${o.id}-band)" stroke="${o.rand}" stroke-width="4"/>
  ${o.schnee ? SCHNEEHAUBE : `<path d="M62 62 H298" stroke="#fff" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>`}
  <text x="180" y="${textY}" text-anchor="middle" ${LOGO_SCHRIFT} font-size="${groesse}" font-weight="900"
        fill="url(#${o.id}-schrift)" stroke="${o.rand}" stroke-width="7" stroke-linejoin="round" paint-order="stroke">${titel}</text>
  <rect x="124" y="31" width="112" height="28" rx="14" fill="#ffffff" stroke="${o.rand}" stroke-width="3"/>
  <text x="180" y="50.5" text-anchor="middle" ${LOGO_SCHRIFT} font-size="14" font-weight="900" fill="${o.schildText}" letter-spacing="3">SEASON ${o.nr}</text>
  ${deko}
</svg>`;
}

// ----- Helfer: kleine Blüte für Hüte (5 Blätter + gelbe Mitte) -----
function blume(x, y, farbe, r = 4) {
  let s = "";
  for (let i = 0; i < 5; i++) {
    const w = (i * 72 - 90) * Math.PI / 180;
    s += `<circle cx="${(x + Math.cos(w) * r * 1.15).toFixed(1)}" cy="${(y + Math.sin(w) * r * 1.15).toFixed(1)}" r="${r}" fill="${farbe}"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="${(r * 0.75).toFixed(1)}" fill="#ffd23f"/>`;
}

const HERZ_PFAD = "M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z";

// ----- Hüte (Koordinaten wie Maries Zeichnung, Kopf-Oberkante bei y ≈ 34) -----
const HUT_DIADEM = `<g>
  <path d="M66 47 Q100 33 134 47 L132 53 Q100 41 68 53 Z" fill="#cfe9ff" stroke="#7fb8e8" stroke-width="1.5"/>
  <path d="M83 45 L89 25 L96 42 Z" fill="#e8f6ff" stroke="#7fb8e8" stroke-width="1.5"/>
  <path d="M93 41 L100 12 L107 41 Z" fill="#ffffff" stroke="#7fb8e8" stroke-width="1.5"/>
  <path d="M104 42 L111 25 L117 45 Z" fill="#e8f6ff" stroke="#7fb8e8" stroke-width="1.5"/>
  <circle cx="100" cy="35" r="4.5" fill="#5ac8fa"/><circle cx="99" cy="33.5" r="1.5" fill="#fff"/>
  <circle cx="89" cy="38" r="2.6" fill="#b8e4ff"/><circle cx="111" cy="38" r="2.6" fill="#b8e4ff"/>
  <path d="M124 20 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff" stroke="#9fd0f5" stroke-width=".8"/>
  <path d="M74 26 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" fill="#fff" stroke="#9fd0f5" stroke-width=".8"/>
</g>`;

const HUT_HERZREIF = `<g>
  <path d="M58 74 Q58 30 100 27 Q142 30 142 74" fill="none" stroke="#ff5fa2" stroke-width="6" stroke-linecap="round"/>
  <path d="M82 31 Q75 23 82 17 Q89 11 82 5" fill="none" stroke="#ff8fbd" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M118 31 Q125 23 118 17 Q111 11 118 5" fill="none" stroke="#ff8fbd" stroke-width="2.2" stroke-linecap="round"/>
  <path d="${HERZ_PFAD}" transform="translate(68 -8) scale(1.15)" fill="#e8345f" stroke="#fff" stroke-width="1.2"/>
  <path d="${HERZ_PFAD}" transform="translate(105 -8) scale(1.15)" fill="#ff7eb6" stroke="#fff" stroke-width="1.2"/>
</g>`;

const HUT_HASENOHREN = `<g>
  <ellipse cx="80" cy="16" rx="10" ry="21" transform="rotate(-14 80 36)" fill="#ffffff" stroke="#e6d6e6" stroke-width="1.5"/>
  <ellipse cx="80" cy="18" rx="5" ry="15" transform="rotate(-14 80 36)" fill="#ffc2d8"/>
  <ellipse cx="121" cy="18" rx="10" ry="21" transform="rotate(24 121 38)" fill="#ffffff" stroke="#e6d6e6" stroke-width="1.5"/>
  <ellipse cx="121" cy="20" rx="5" ry="15" transform="rotate(24 121 38)" fill="#ffc2d8"/>
  <path d="M60 72 Q60 32 100 30 Q140 32 140 72" fill="none" stroke="#b48be0" stroke-width="6" stroke-linecap="round"/>
  <path d="M100 30 L90 24 Q88 32 90 36 Z M100 30 L110 24 Q112 32 110 36 Z" fill="#9ad97a"/>
  <circle cx="100" cy="30" r="3.5" fill="#7cc36b"/>
</g>`;

const HUT_BLUMENKRANZ = `<g>
  <path d="M62 48 Q100 30 138 48" fill="none" stroke="#7cc36b" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="74" cy="42" rx="5" ry="2.5" transform="rotate(-30 74 42)" fill="#7cc36b"/>
  <ellipse cx="126" cy="42" rx="5" ry="2.5" transform="rotate(30 126 42)" fill="#7cc36b"/>
  <ellipse cx="100" cy="34" rx="5" ry="2.5" fill="#7cc36b"/>
  ${blume(66, 47, "#ff9fd0")}${blume(80, 39, "#b48be0")}${blume(93, 35, "#ffffff", 4.5)}
  ${blume(107, 35, "#ff7eb6", 4.5)}${blume(120, 39, "#8ec5ff")}${blume(134, 47, "#ffd6e8")}
</g>`;

const HUT_SONNENHUT = `<g transform="rotate(-6 100 44)">
  <ellipse cx="100" cy="45" rx="64" ry="12" fill="#f2d28b" stroke="#d6b062" stroke-width="2"/>
  <path d="M68 45 Q70 14 100 12 Q130 14 132 45 Z" fill="#f5dc9c" stroke="#d6b062" stroke-width="2"/>
  <path d="M78 22 Q100 16 122 22 M74 32 Q100 26 126 32" stroke="#e0c27a" stroke-width="1.5" fill="none"/>
  <path d="M69 36 Q100 30 131 36 L131 45 Q100 39 69 45 Z" fill="#ff7eb6"/>
  ${blume(121, 39, "#ffffff", 4)}
</g>`;

const HUT_HEXENHUT = `<g transform="rotate(-4 100 44)">
  <ellipse cx="100" cy="45" rx="58" ry="10" fill="#6b3fa0" stroke="#4e2a7d" stroke-width="2"/>
  <path d="M72 45 Q84 22 96 6 Q106 -4 122 4 Q112 8 108 16 Q118 30 128 45 Z" fill="#7d4fc0" stroke="#4e2a7d" stroke-width="2"/>
  <path d="M75 38 Q100 33 125 38 L127 45 Q100 40 73 45 Z" fill="#ff9a3c"/>
  <path d="M106 18 l2.2 4.6 5 .7 -3.6 3.5 .9 5 -4.5 -2.4 -4.5 2.4 .9 -5 -3.6 -3.5 5 -.7z" fill="#ffd23f"/>
  <rect x="94" y="36" width="12" height="9" rx="1.5" fill="none" stroke="#ffd23f" stroke-width="2.2"/>
</g>`;

// ----- Melodien (eigene Kompositionen). [Note, Länge in Achteln], null = Pause -----

const EISPRINZESSIN_WALZER = {   // ¾-Takt · Am – F – C – G | Am – F – G – C
  achtelSek: 0.25,
  melodie: [
    ["E5", 2], ["A5", 2], ["C6", 2],   ["C6", 3], ["B5", 1], ["A5", 2],
    ["G5", 2], ["E5", 2], ["G5", 2],   ["D6", 4], ["B5", 2],
    ["E6", 2], ["C6", 2], ["A5", 2],   ["F6", 3], ["E6", 1], ["C6", 2],
    ["D6", 2], ["B5", 2], ["G5", 2],   ["C6", 4], [null, 2],
  ],
  bass: [
    ["A2", 2], ["E3", 2], ["E3", 2],   ["F2", 2], ["C3", 2], ["C3", 2],
    ["C3", 2], ["G3", 2], ["G3", 2],   ["G2", 2], ["D3", 2], ["D3", 2],
    ["A2", 2], ["E3", 2], ["E3", 2],   ["F2", 2], ["C3", 2], ["C3", 2],
    ["G2", 2], ["D3", 2], ["D3", 2],   ["C3", 2], ["G3", 2], [null, 2],
  ],
};

const HERZKLOPFEN = {   // 4/4 · C – G – Am – F | C – G – F/G – C
  achtelSek: 0.24,
  melodie: [
    ["E5", 1], ["G5", 1], ["C6", 2], ["E6", 2], ["C6", 2],
    ["D6", 2], ["B5", 2], ["G5", 2], ["B5", 2],
    ["C6", 1], ["A5", 1], ["E5", 2], ["A5", 2], ["C6", 2],
    ["A5", 4], [null, 2], ["G5", 2],
    ["E6", 2], ["D6", 1], ["C6", 1], ["G5", 2], ["C6", 2],
    ["B5", 2], ["D6", 2], ["G6", 4],
    ["A6", 2], ["F6", 2], ["G6", 2], ["B5", 2],
    ["C6", 4], ["G5", 2], ["C6", 2],
  ],
  bass: [
    ["C3", 4], ["G2", 4],  ["G2", 4], ["D3", 4],  ["A2", 4], ["E3", 4],  ["F2", 4], ["C3", 4],
    ["C3", 4], ["G2", 4],  ["G2", 4], ["D3", 4],  ["F2", 4], ["G2", 4],  ["C3", 4], ["C3", 4],
  ],
};

const HUEPF_HAESCHEN = {   // 4/4, hüpfend · C – F – C – G | C – F – G – C
  achtelSek: 0.2,
  melodie: [
    ["C6", 1], [null, 1], ["G5", 1], [null, 1], ["E5", 1], ["G5", 1], ["C6", 2],
    ["A5", 1], [null, 1], ["C6", 1], [null, 1], ["F6", 2], ["C6", 2],
    ["G5", 1], ["A5", 1], ["G5", 1], ["E5", 1], ["C6", 2], ["G5", 2],
    ["D6", 2], ["B5", 1], [null, 1], ["G5", 4],
    ["C6", 1], [null, 1], ["G5", 1], [null, 1], ["E6", 1], ["D6", 1], ["C6", 2],
    ["A5", 1], ["C6", 1], ["F6", 2], ["E6", 2], ["C6", 2],
    ["D6", 1], ["E6", 1], ["D6", 1], ["B5", 1], ["G5", 2], ["B5", 2],
    ["C6", 2], ["G5", 2], ["C6", 4],
  ],
  bass: [
    ["C3", 2], [null, 2], ["G2", 2], [null, 2],   ["F2", 2], [null, 2], ["C3", 2], [null, 2],
    ["C3", 2], [null, 2], ["G2", 2], [null, 2],   ["G2", 2], [null, 2], ["D3", 2], [null, 2],
    ["C3", 2], [null, 2], ["G2", 2], [null, 2],   ["F2", 2], [null, 2], ["C3", 2], [null, 2],
    ["G2", 2], [null, 2], ["D3", 2], [null, 2],   ["C3", 2], [null, 2], ["C3", 4],
  ],
};

const EINHORNWIESE = {   // ¾-Takt, verträumt · G – Em – C – D | G – Em – C/D – G
  achtelSek: 0.27,
  melodie: [
    ["B5", 2], ["D6", 2], ["G6", 2],   ["E6", 3], ["D6", 1], ["B5", 2],
    ["C6", 2], ["E6", 2], ["G6", 2],   ["F#6", 4], ["D6", 2],
    ["G6", 2], ["F#6", 1], ["E6", 1], ["D6", 2],   ["B5", 2], ["E6", 2], ["G6", 2],
    ["A5", 2], ["C6", 2], ["F#6", 2],  ["G6", 4], [null, 2],
  ],
  bass: [
    ["G2", 2], ["D3", 2], ["D3", 2],   ["E2", 2], ["B2", 2], ["B2", 2],
    ["C3", 2], ["G3", 2], ["G3", 2],   ["D3", 2], ["A3", 2], ["A3", 2],
    ["G2", 2], ["D3", 2], ["D3", 2],   ["E2", 2], ["B2", 2], ["B2", 2],
    ["C3", 2], ["G3", 2], ["D3", 2],   ["G2", 2], ["D3", 2], [null, 2],
  ],
};

const SOMMERFERIEN = {   // 4/4, fröhlich · F – G – Em – Am | F – G – C – C
  achtelSek: 0.21,
  melodie: [
    ["A5", 1], ["C6", 1], ["F6", 2], ["E6", 1], ["F6", 1], ["C6", 2],
    ["B5", 1], ["D6", 1], ["G6", 2], ["F6", 1], ["G6", 1], ["D6", 2],
    ["E6", 2], ["G6", 2], ["B5", 2], ["E6", 2],
    ["C6", 2], ["E6", 1], ["D6", 1], ["C6", 2], ["A5", 2],
    ["F6", 1], ["F6", 1], ["A6", 2], ["G6", 1], ["F6", 1], ["E6", 2],
    ["D6", 1], ["D6", 1], ["G6", 2], ["F6", 1], ["E6", 1], ["D6", 2],
    ["E6", 2], ["G6", 2], ["C6", 2], ["E6", 2],
    ["C6", 4], ["G5", 2], ["C6", 2],
  ],
  bass: [
    ["F2", 2], ["C3", 2], ["F2", 2], ["C3", 2],   ["G2", 2], ["D3", 2], ["G2", 2], ["D3", 2],
    ["E2", 2], ["B2", 2], ["E2", 2], ["B2", 2],   ["A2", 2], ["E3", 2], ["A2", 2], ["E3", 2],
    ["F2", 2], ["C3", 2], ["F2", 2], ["C3", 2],   ["G2", 2], ["D3", 2], ["G2", 2], ["D3", 2],
    ["C3", 2], ["G3", 2], ["C3", 2], ["G3", 2],   ["C3", 4], ["C3", 4],
  ],
};

const GESPENSTERCHEN = {   // 4/4, lieb-gruselig in Moll · Am – Dm – E – Am
  achtelSek: 0.23,
  melodie: [
    ["A5", 1], [null, 1], ["C6", 1], [null, 1], ["E6", 2], ["C6", 2],
    ["D6", 1], [null, 1], ["F6", 1], [null, 1], ["A6", 2], ["F6", 2],
    ["E6", 1], ["G#6", 1], ["B6", 2], ["E6", 2], ["B5", 2],
    ["A5", 4], [null, 2], ["E5", 2],
    ["C6", 1], ["B5", 1], ["A5", 1], ["B5", 1], ["C6", 2], ["E6", 2],
    ["F6", 1], ["E6", 1], ["D6", 1], ["E6", 1], ["F6", 2], ["A6", 2],
    ["G#6", 2], ["E6", 2], ["B5", 2], ["G#5", 2],
    ["A5", 4], [null, 4],
  ],
  bass: [
    ["A2", 2], ["E3", 2], ["A2", 2], ["E3", 2],   ["D3", 2], ["A2", 2], ["D3", 2], ["A2", 2],
    ["E2", 2], ["B2", 2], ["E2", 2], ["B2", 2],   ["A2", 2], ["E3", 2], ["A2", 4],
    ["A2", 2], ["E3", 2], ["A2", 2], ["E3", 2],   ["D3", 2], ["A2", 2], ["D3", 2], ["A2", 2],
    ["E2", 2], ["B2", 2], ["E2", 2], ["B2", 2],   ["A2", 4], [null, 4],
  ],
};

// ----- Registrieren: aus einem Datenblock Skins, Season-Pass und Sticker-Seite machen -----
function registriereSeason(s) {
  const id = k => `${k}-${s.id}`;
  const d = s.skins;
  SKINS.push(
    { id: id("hut"),         kategorie: "hut",         season: s.id, ...d.hut },
    { id: id("musik"),       kategorie: "musik",       season: s.id, ...d.musik },
    { id: id("hud"),         kategorie: "hud",         season: s.id, ...d.hud },
    { id: id("logo"),        kategorie: "logo",        season: s.id, ...d.logo },
    { id: id("hintergrund"), kategorie: "hintergrund", season: s.id, ...d.hintergrund },
  );
  SEASON_PAESSE.push({
    id: s.id,
    name: `Season ${s.nr}: ${s.titel}`,
    icon: s.icon,
    logo: seasonLogo({ id: s.id, nr: s.nr, titel: s.titel, ...s.logo }),
    start: s.start,
    ende: s.ende,
    stufen: 50,
    klicksBasis: 670,       // wie Season 1 und 2: ~10 Stunden bis Stufe 50
    klicksProStufe: 30,
    skinBelohnungen: { 10: id("hut"), 20: id("musik"), 30: id("hud"), 40: id("logo"), 50: id("hintergrund") },
    design: {
      "--season-kopf-1": s.design[0], "--season-kopf-2": s.design[1], "--season-text": s.design[2],
      "--season-akzent": s.design[3], "--season-balken-1": s.design[4], "--season-balken-2": s.design[5],
    },
    regen: s.regen,
  });
  fuegeStickerSeiteHinzu({ id: `${s.id}-sticker`, season: s.id, name: s.titel, icon: s.icon, farbe: s.stickerFarbe, sticker: s.sticker });
}

// HUD-Farben kompakt: [hintergrund, hintergrund-2, panel, karte-hover, karte-upgrade, rand,
//                      akzent, akzent-dunkel, lila, text, text-sanft, gold, schattenFarbe,
//                      logo-1, logo-2, logo-3, medaillon-1, medaillon-2]
function hudFarben(f) {
  const namen = ["--hintergrund", "--hintergrund-2", "--panel", "--karte-hover", "--karte-upgrade", "--rand",
                 "--akzent", "--akzent-dunkel", "--lila", "--text", "--text-sanft", "--gold", "--schatten",
                 "--logo-1", "--logo-2", "--logo-3", "--medaillon-1", "--medaillon-2"];
  const farben = {};
  namen.forEach((n, i) => { farben[n] = n === "--schatten" ? `0 4px 14px ${f[i]}` : f[i]; });
  return farben;
}

// Logo-Skin-Farben kompakt: [skin-1, skin-2, skin-3, schild-hg, schild-text, schild-rand, funkeln]
function logoFarben(f) {
  return {
    "--logo-skin-1": f[0], "--logo-skin-2": f[1], "--logo-skin-3": f[2],
    "--logo-schild-hg": f[3], "--logo-schild-text": f[4], "--logo-schild-rand": f[5], "--logo-funkeln": f[6],
  };
}

// =====================================================
//  DIE SEASONS 2027
// =====================================================

registriereSeason({
  id: "s3", nr: 3, titel: "Winterwunderland", icon: "⛸️",
  start: "2027-01-01T00:00:00", ende: "2027-02-01T00:00:00",
  design: ["#eef7ff", "#d6ebff", "#1e3a56", "#2f78c4", "#9fd0f5", "#4aa3df"],
  logo: { band: ["#d6efff", "#5aa9e6"], rand: "#2c6ea8", enden: "#8ec5ff", endenSchatten: "#4f86bf",
          schrift: ["#ffffff", "#dff3ff"], schildText: "#2c6ea8", schnee: true,
          deko: [["⛸️", 10, 52, 34], ["👸", 292, 50, 38], ["❄️", 80, 30, 16], ["❄️", 250, 26, 14], ["⛄", 4, 138, 28], ["🏔️", 318, 138, 26]] },
  skins: {
    hut:   { name: "Eis-Diadem", icon: "💎", svg: HUT_DIADEM },
    musik: { name: "Eisprinzessin-Walzer", icon: "⛸️", musik: EISPRINZESSIN_WALZER },
    hud:   { name: "Eiskristall", icon: "❄️",
             farben: hudFarben(["#eef7ff", "#e6ecff", "#f6fbff", "#eaf5ff", "#f3f9ff", "#bcdcf5", "#4aa3df", "#1f6fae", "#7b8fe0",
                                "#1e3a56", "#5d7a96", "#9fc9ee", "rgba(31, 111, 174, 0.15)", "#ffffff", "#7cc4f2", "#2f78c4", "#e0f1ff", "#e9e3ff"]),
             symbole: { herz: "💙", marie: "⛸️", shop: "🛷", skins: "❄️" } },
    logo:  { name: "Eisprinzessin-Logo", icon: "👸", krone: "👑", deko: "❄️", funkeln: "✧",
             farben: logoFarben(["#ffffff", "#7cc4f2", "#2f78c4", "#ffffff", "#2f78c4", "#9fd0f5", "#7cc4f2"]) },
    hintergrund: { name: "Glitzerfrost", icon: "✨",
             bg: { farbe: "linear-gradient(180deg, #cfe7ff 0%, #e4f1ff 55%, #eee7ff 100%)", richtung: "fallen",
                   hinten: ["✨", "❄️"], vorne: ["❄️", "⭐"] } },
  },
  regen: { name: "Glitzerfrost", icon: "❄️", teile: ["❄️", "💎", "🧊", "✨"], gold: "👸" },
  stickerFarbe: "#e3f2ff",
  sticker: [["🧣", "Schal"], ["🛷", "Schlitten"], ["☃️", "Schneemann"], ["🧊", "Eiswürfel"], ["🏔️", "Berg"], ["🍵", "Warmer Tee"], ["🌨️", "Schneewolke"],
            ["🐧", "Pinguin"], ["🐻‍❄️", "Eisbär"], ["⛷️", "Skifahrer"],
            ["🌌", "Polarlicht"], ["💎", "Eisdiamant"]],
});

registriereSeason({
  id: "s4", nr: 4, titel: "Valentinstag", icon: "💝",
  start: "2027-02-01T00:00:00", ende: "2027-03-01T00:00:00",
  design: ["#fff0f4", "#ffd9e4", "#5a1a2c", "#b0173f", "#ff9db5", "#e8345f"],
  logo: { band: ["#ff9db5", "#e8345f"], rand: "#9b1b4a", enden: "#ffb6c8", endenSchatten: "#d97a93",
          schrift: ["#ffffff", "#ffe3ea"], schildText: "#b0173f",
          deko: [["💘", 12, 52, 34], ["💝", 294, 48, 36], ["💕", 82, 30, 16], ["💕", 252, 28, 14], ["💌", 6, 136, 26], ["🌹", 318, 138, 26]] },
  skins: {
    hut:   { name: "Herz-Haarreif", icon: "💞", svg: HUT_HERZREIF },
    musik: { name: "Herzklopfen", icon: "💓", musik: HERZKLOPFEN },
    hud:   { name: "Rosenrot", icon: "🌹",
             farben: hudFarben(["#fff0f3", "#ffe3ec", "#fff7f9", "#ffe9ef", "#fff4f6", "#f7b8c8", "#e8345f", "#b0173f", "#d55b9a",
                                "#5a1a2c", "#94576a", "#f5b942", "rgba(176, 23, 63, 0.15)", "#ff9db5", "#e8345f", "#9b1b4a", "#ffd6e0", "#ffe1ec"]),
             symbole: { herz: "💘", marie: "💝", shop: "🌹", skins: "💌" } },
    logo:  { name: "Liebes-Logo", icon: "💘", krone: "💘", deko: "💌", funkeln: "♥",
             farben: logoFarben(["#ffb6c8", "#e8345f", "#9b1b4a", "#ffffff", "#b0173f", "#f7a1b8", "#ff5f7e"]) },
    hintergrund: { name: "Herzballons", icon: "🎈",
             bg: { farbe: "linear-gradient(180deg, #fff0f5 0%, #ffe0ea 60%, #ffd3e2 100%)", richtung: "steigen",
                   hinten: ["💗", "💕"], vorne: ["🎈", "💝"] } },
  },
  regen: { name: "Herzchenregen", icon: "💘", teile: ["💘", "💝", "💌", "💗"], gold: "🧸" },
  stickerFarbe: "#ffe6ee",
  sticker: [["💌", "Liebesbrief"], ["💘", "Amors Pfeil"], ["💝", "Herzgeschenk"], ["💞", "Herzwirbel"], ["💟", "Herzschmuck"], ["🥰", "Verliebt"], ["😘", "Küsschen"],
            ["🧸", "Kuschelteddy"], ["💍", "Ring"], ["🦢", "Schwan"],
            ["💖", "Glitzerherz"], ["👼", "Engelchen"]],
});

registriereSeason({
  id: "s5", nr: 5, titel: "Ostern", icon: "🐰",
  start: "2027-03-01T00:00:00", ende: "2027-05-01T00:00:00",
  design: ["#f6fdea", "#fff6cf", "#2f4a28", "#3f8a33", "#c3eaa0", "#7cc36b"],
  logo: { band: ["#fff27a", "#9ad97a"], rand: "#3f8a33", enden: "#b48be0", endenSchatten: "#8a64b8",
          schrift: ["#ffffff", "#fff9d6"], schildText: "#3f8a33",
          deko: [["🐰", 10, 54, 36], ["🐣", 296, 48, 34], ["🌼", 80, 30, 16], ["🌼", 252, 28, 14], ["🥚", 6, 136, 26], ["🌷", 318, 138, 26]] },
  skins: {
    hut:   { name: "Hasenohren", icon: "🐰", svg: HUT_HASENOHREN },
    musik: { name: "Hüpf-Häschen", icon: "🐇", musik: HUEPF_HAESCHEN },
    hud:   { name: "Pastell-Ostern", icon: "🌷",
             farben: hudFarben(["#f3fbea", "#fff8dc", "#fbfff5", "#eef9e3", "#fffbe6", "#c9e6b0", "#7cc36b", "#3f8a33", "#b48be0",
                                "#2f4a28", "#6f8a62", "#f5c542", "rgba(63, 138, 51, 0.15)", "#fff27a", "#9ad97a", "#b48be0", "#f0ffe0", "#fff6c8"]),
             symbole: { herz: "💚", marie: "🐰", shop: "🧺", skins: "🌷" } },
    logo:  { name: "Osterei-Logo", icon: "🥚", krone: "🐣", deko: "🐰", funkeln: "✿",
             farben: logoFarben(["#fff27a", "#9ad97a", "#7aa8e6", "#fffbe6", "#3f8a33", "#c9e6b0", "#b48be0"]) },
    hintergrund: { name: "Osterwiese", icon: "🌼",
             bg: { farbe: "linear-gradient(180deg, #eaf8ff 0%, #f4fbe9 60%, #e3f5d2 100%)", richtung: "fallen",
                   hinten: ["🌼", "🥚"], vorne: ["🐣", "🌷"] } },
  },
  regen: { name: "Eiersuche", icon: "🥚", teile: ["🥚", "🐣", "🌷", "🍫"], gold: "🐰" },
  stickerFarbe: "#effbe2",
  sticker: [["🥚", "Osterei"], ["🐣", "Schlüpfküken"], ["🐇", "Hoppelhase"], ["🥕", "Karotte"], ["🌱", "Keimling"], ["🐑", "Lämmchen"], ["🐝", "Biene"],
            ["🐔", "Henne"], ["🎨", "Eier bemalen"], ["🦆", "Entchen"],
            ["🐰", "Osterhase"], ["🧺", "Osterkorb"]],
});

registriereSeason({
  id: "s6", nr: 6, titel: "Einhornwiese", icon: "🦄",
  start: "2027-05-01T00:00:00", ende: "2027-07-01T00:00:00",
  design: ["#fbf0ff", "#e5f2ff", "#3e2257", "#7a3bbd", "#ff9fd0", "#b06ef0"],
  logo: { band: ["#ffc4e4", "#b06ef0"], rand: "#6a2fa8", enden: "#8ec5ff", endenSchatten: "#5a8fc9",
          schrift: ["#ffffff", "#fff1fb"], schildText: "#7a3bbd",
          deko: [["🦄", 8, 54, 38], ["🌈", 294, 48, 36], ["✨", 82, 30, 16], ["✨", 250, 28, 14], ["🦋", 6, 136, 26], ["🌸", 318, 138, 26]] },
  skins: {
    hut:   { name: "Blumenkranz", icon: "🌸", svg: HUT_BLUMENKRANZ },
    musik: { name: "Einhornwiese", icon: "🦄", musik: EINHORNWIESE },
    hud:   { name: "Regenbogen", icon: "🌈",
             farben: hudFarben(["#fbf0ff", "#e9f6ff", "#fdf8ff", "#f5ebff", "#fff8ec", "#dcc6f5", "#b06ef0", "#7a3bbd", "#ff7eb6",
                                "#3e2257", "#7c6596", "#f5c542", "rgba(122, 59, 189, 0.15)", "#ff9fd0", "#b06ef0", "#5aa9e6", "#f3e3ff", "#dff1ff"]),
             symbole: { herz: "💜", marie: "🦄", shop: "🌈", skins: "🌸" } },
    logo:  { name: "Einhorn-Logo", icon: "🦄", krone: "🦄", deko: "🌈", funkeln: "✦",
             farben: logoFarben(["#ff9fd0", "#b06ef0", "#5aa9e6", "#ffffff", "#7a3bbd", "#dcc6f5", "#ff7eb6"]) },
    hintergrund: { name: "Schmetterlingswiese", icon: "🦋",
             bg: { farbe: "linear-gradient(180deg, #fbeaff 0%, #e9f6ff 55%, #eafbe9 100%)", richtung: "steigen",
                   hinten: ["🌸", "✨"], vorne: ["🦋", "🌼"] } },
  },
  regen: { name: "Blütenregen", icon: "🌸", teile: ["🌸", "🌼", "🌺", "🦋"], gold: "🦄" },
  stickerFarbe: "#f6ecff",
  sticker: [["☀️", "Sonne"], ["🐞", "Marienkäfer"], ["🐛", "Raupe"], ["🪁", "Drachen"], ["🌾", "Wiese"], ["🐌", "Schnecke"], ["🎶", "Vogelgesang"],
            ["🐦", "Vögelchen"], ["🦩", "Flamingo"], ["🦚", "Pfau"],
            ["🦄", "Wieseneinhorn"], ["🌈", "Doppelregenbogen"]],
});

registriereSeason({
  id: "s7", nr: 7, titel: "Sommer & Meer", icon: "🏖️",
  start: "2027-07-01T00:00:00", ende: "2027-09-01T00:00:00",
  design: ["#e9fbf9", "#fff4cc", "#234a47", "#d4572a", "#ffd166", "#ff8a5c"],
  logo: { band: ["#ffe066", "#ff8a5c"], rand: "#c4471c", enden: "#2bb3a8", endenSchatten: "#1f857c",
          schrift: ["#ffffff", "#fff4d6"], schildText: "#d4572a",
          deko: [["🏖️", 8, 52, 34], ["☀️", 296, 48, 36], ["🌴", 80, 32, 18], ["🌊", 250, 28, 16], ["🐚", 6, 136, 26], ["🍉", 318, 138, 26]] },
  skins: {
    hut:   { name: "Sonnenhut", icon: "👒", svg: HUT_SONNENHUT },
    musik: { name: "Sommerferien", icon: "🏖️", musik: SOMMERFERIEN },
    hud:   { name: "Sommersonne", icon: "☀️",
             farben: hudFarben(["#effcfb", "#fff7dc", "#f7fffe", "#e6f8f6", "#fffbe5", "#a9e3dd", "#ff8a5c", "#d4572a", "#2bb3a8",
                                "#234a47", "#5f8784", "#f5c542", "rgba(43, 179, 168, 0.18)", "#ffe066", "#ff8a5c", "#ff5f7e", "#dff8f5", "#fff3c4"]),
             symbole: { herz: "💛", marie: "🏖️", shop: "🍦", skins: "🐚" } },
    logo:  { name: "Sommer-Logo", icon: "🕶️", krone: "🕶️", deko: "🌴", funkeln: "☀",
             farben: logoFarben(["#ffe066", "#ff8a5c", "#ff5f7e", "#fffbe5", "#d4572a", "#ffc89a", "#2bb3a8"]) },
    hintergrund: { name: "Unterwasserwelt", icon: "🐠",
             bg: { farbe: "linear-gradient(180deg, #d6f6ff 0%, #bfeaf5 55%, #a9dfea 100%)", richtung: "steigen",
                   hinten: ["💧", "✨"], vorne: ["🐠", "🐚"] } },
  },
  regen: { name: "Sommerregen", icon: "🍉", teile: ["🍉", "🍦", "🐚", "⭐"], gold: "🐬" },
  stickerFarbe: "#e2f8f5",
  sticker: [["🍉", "Melone"], ["🏐", "Ball"], ["🌴", "Palme"], ["🕶️", "Sonnenbrille"], ["🏄", "Surfen"], ["⛱️", "Sonnenschirm"], ["🍋", "Zitrone"],
            ["⛵", "Segelboot"], ["🎡", "Riesenrad"], ["🌅", "Sonnenuntergang"],
            ["🎆", "Sommerfeuerwerk"], ["🌺", "Hawaiiblume"]],
});

registriereSeason({
  id: "s8", nr: 8, titel: "Halloween", icon: "🎃",
  start: "2027-10-01T00:00:00", ende: "2027-11-01T00:00:00",
  design: ["#f4ecff", "#ffe6cc", "#3a2456", "#7a3fb5", "#ffb86b", "#ff8a2a"],
  logo: { band: ["#ffb86b", "#7a3fb5"], rand: "#3f1d6b", enden: "#ff8a2a", endenSchatten: "#c25f12",
          schrift: ["#fff6d6", "#ffc56b"], schildText: "#7a3fb5",
          deko: [["🎃", 8, 54, 36], ["👻", 296, 48, 36], ["🦇", 80, 30, 18], ["🦇", 250, 28, 16], ["🍬", 6, 136, 26], ["🧙‍♀️", 318, 138, 26]] },
  skins: {
    hut:   { name: "Hexenhut", icon: "🧙‍♀️", svg: HUT_HEXENHUT },
    musik: { name: "Gespensterchen", icon: "👻", musik: GESPENSTERCHEN },
    hud:   { name: "Kürbisnacht", icon: "🎃",
             farben: hudFarben(["#f6f0ff", "#fff1e3", "#fbf8ff", "#f1e9ff", "#fff5ea", "#d6c3f0", "#ff8a2a", "#7a3fb5", "#8a5cd6",
                                "#3a2456", "#7a6894", "#f5b942", "rgba(122, 63, 181, 0.15)", "#ffc56b", "#ff8a2a", "#7a3fb5", "#efe4ff", "#ffe7cf"]),
             symbole: { herz: "🧡", marie: "🎃", shop: "🍬", skins: "👻" } },
    logo:  { name: "Gruselspaß-Logo", icon: "🦇", krone: "🎃", deko: "👻", funkeln: "★",
             farben: logoFarben(["#ffc56b", "#ff8a2a", "#7a3fb5", "#fff6e8", "#7a3fb5", "#d6c3f0", "#ff8a2a"]) },
    hintergrund: { name: "Gespensternacht", icon: "👻",
             bg: { farbe: "linear-gradient(180deg, #e3d6ff 0%, #efe6ff 55%, #ffe6d1 100%)", richtung: "steigen",
                   hinten: ["⭐", "🌙"], vorne: ["👻", "🦇"] } },
  },
  regen: { name: "Süßigkeitenregen", icon: "🍬", teile: ["🍬", "🍭", "🎃", "👻"], gold: "🧙‍♀️" },
  stickerFarbe: "#f3e9ff",
  sticker: [["👻", "Gespenst"], ["🦇", "Fledermaus"], ["🕸️", "Spinnennetz"], ["🧹", "Hexenbesen"], ["🦉", "Eule"], ["🌕", "Vollmond"], ["🐈‍⬛", "Schwarze Katze"],
            ["🧙‍♀️", "Hexe"], ["🏚️", "Spukhaus"], ["🎃", "Kürbislaterne"],
            ["🌌", "Zaubernacht"], ["🍫", "Schokoschatz"]],
});
