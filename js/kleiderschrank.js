"use strict";
// =====================================================
//  KLEIDERSCHRANK: Kleider, Frisuren und Haarfarben für Marie und Hannah
//
//  Drei Skin-Kategorien (siehe SKIN_KATEGORIEN in skins.js):
//  • kleid:     svg = SVG-Code für das Kleid. "{farbe}" wird durch die Kleidfarbe
//               der gewählten Figur ersetzt (nur beim Standardkleid nötig).
//  • frisur:    hinten = Haare hinter dem Kopf, vorne = Strähnen/Zöpfe vor den Schultern,
//               oben = Haargummis o.ä. über dem Pony. Haare immer mit fill="url(#haar)",
//               dann passt die Haarfarbe automatisch.
//  • haarfarbe: haar = [hell, dunkel]. Der Standard nimmt die Haarfarbe der Figur.
//
//  Koordinaten wie in der Zeichnung (viewBox -10 0 220 220):
//  Gesicht Mitte 100/106, Radius 54 · Hals bis y = 174 · Kleid von y = 168 bis 220.
//
//  Neue Teile für eine Season: registriereKleiderschrank("<season-id>", { kleid, frisur oder haarfarbe })
//  → das Kleid gibt es auf Stufe 25, Frisur bzw. Haarfarbe auf Stufe 35.
// =====================================================

const KLEID_FORM = "M40 220 Q44 174 100 168 Q156 174 160 220 Z";
const KLEID_KRAGEN = "M81 170 Q100 192 119 170 Q100 179 81 170 Z";
const KLEID_SAUM = "M41 207 Q100 197 159 207 L160 220 L40 220 Z";

// Grundgerüst: Kleid in einer Farbe + Kragen, danach die Verzierung
function kleidSvg(farbe, kragen, verzierung = "") {
  return `<path d="${KLEID_FORM}" fill="${farbe}"/><path d="${KLEID_KRAGEN}" fill="${kragen}"/>${verzierung}`;
}

// Kleines Zeichen (Emoji oder Symbol) auf dem Kleid
function aufdruck(zeichen, x, y, groesse = 13, farbe = "") {
  return `<text x="${x}" y="${y}" font-size="${groesse}" text-anchor="middle"${farbe ? ` fill="${farbe}"` : ""}>${zeichen}</text>`;
}

// Zickzack-Saum (für das Hexenkleid)
function zickzack(farbe) {
  let d = "M40 220";
  for (let x = 40; x < 160; x += 10) d += ` L${x + 5} 208 L${x + 10} 220`;
  return `<path d="${d} Z" fill="${farbe}"/>`;
}

// Ein geflochtener Zopf aus Gliedern: [[x, y], …], dazu Haargummi und Spitze
function zopf(glieder, r, gummi) {
  const teile = glieder.map(([x, y]) =>
    `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.95}" fill="url(#haar)" stroke="#000" stroke-opacity=".13" stroke-width="1.5"/>`);
  const [ex, ey] = glieder[glieder.length - 1];
  teile.push(`<path d="M${ex - 6} ${ey + r + 2} Q${ex} ${ey + r + 20} ${ex + 6} ${ey + r + 2} Z" fill="url(#haar)"/>`);
  teile.push(`<circle cx="${ex}" cy="${ey + r + 2}" r="5" fill="${gummi}"/>`);
  return teile.join("");
}

// Kurze Haare hinter dem Kopf (für Zöpfe, Dutts und Pferdeschwanz)
const HAAR_KURZ_HINTEN = `<path d="M100 26 C40 26 30 72 34 118 Q40 140 56 140 L144 140 Q160 140 166 118 C170 72 160 26 100 26 Z" fill="url(#haar)"/>`;

// ----- Standard-Teile (von Anfang an da) -----

SKINS.push(
  { id: "kleid-normal", kategorie: "kleid", standard: true, name: "Lieblingskleid", icon: "👗",
    svg: kleidSvg("{farbe}", "#fff",
      `<circle cx="76" cy="204" r="4" fill="#fff" opacity=".8"/><circle cx="124" cy="204" r="4" fill="#fff" opacity=".8"/><circle cx="100" cy="210" r="4" fill="#fff" opacity=".8"/>`) },

  { id: "frisur-normal", kategorie: "frisur", standard: true, name: "Lang & offen", icon: "💁‍♀️",
    hinten: `<path d="M100 26 C38 26 26 74 28 118 Q26 170 22 220 L178 220 Q174 170 172 118 C174 74 162 26 100 26 Z" fill="url(#haar)"/>`,
    vorne: `<path d="M48 104 Q34 160 42 220 L68 220 Q58 168 64 122 Z" fill="url(#haar)"/>
            <path d="M152 104 Q166 160 158 220 L132 220 Q142 168 136 122 Z" fill="url(#haar)"/>` },

  { id: "haarfarbe-normal", kategorie: "haarfarbe", standard: true, name: "Natur", icon: "🌰" },
);

// ----- Season-Teile -----

// Kleid auf Stufe 25, Frisur oder Haarfarbe auf Stufe 35
function registriereKleiderschrank(seasonId, teile) {
  const pass = SEASON_PAESSE.find(p => p.id === seasonId);
  const stufen = { kleid: 25, frisur: 35, haarfarbe: 35 };
  for (const [kategorie, daten] of Object.entries(teile)) {
    const id = `${kategorie}-${seasonId}`;
    SKINS.push({ id, kategorie, season: seasonId, ...daten });
    pass.skinBelohnungen[stufen[kategorie]] = id;
  }
}

// Die Teile der Seasons 3–8 stehen hier, damit alle Zeichnungen beisammen sind.
// seasons.js holt sie sich über KLEIDERSCHRANK[<season-id>].
const KLEIDERSCHRANK = {
  // Season 1: Thanksgiving
  s1: {
    kleid: { name: "Herbstkleid", icon: "🍁",
      svg: kleidSvg("#e8843f", "#fff3dc", `<path d="${KLEID_SAUM}" fill="#a9541f"/>${aufdruck("🍁", 68, 200)}${aufdruck("🍂", 132, 200)}`) },
    frisur: { name: "Zwei Zöpfe", icon: "👧",
      hinten: HAAR_KURZ_HINTEN,
      vorne: zopf([[44, 120], [42, 138], [41, 156], [41, 174], [42, 190]], 10, "#ff4f9a")
           + zopf([[156, 120], [158, 138], [159, 156], [159, 174], [158, 190]], 10, "#ff4f9a") },
  },
  // Season 2: Weihnachten
  s2: {
    kleid: { name: "Weihnachtskleid", icon: "🎄",
      svg: kleidSvg("#d62839", "#fff",
        `<path d="${KLEID_SAUM}" fill="#fff"/>`
        + [46, 58, 70, 82, 94, 106, 118, 130, 142, 154].map(x => `<circle cx="${x}" cy="${206 - Math.cos((x - 100) / 60) * 4 + 2}" r="5" fill="#fff"/>`).join("")
        + `<ellipse cx="93" cy="188" rx="7" ry="3.5" fill="#2e8b57" transform="rotate(-25 93 188)"/>
           <ellipse cx="107" cy="188" rx="7" ry="3.5" fill="#2e8b57" transform="rotate(25 107 188)"/>
           <circle cx="100" cy="189" r="3.5" fill="#ffd23f"/>`) },
    haarfarbe: { name: "Lebkuchen-Rot", icon: "🍪", haar: ["#e9764f", "#b8452c"] },
  },
  // Season 3: Winterwunderland
  s3: {
    kleid: { name: "Eisprinzessin-Kleid", icon: "❄️",
      svg: `<defs><linearGradient id="kleidEis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3f4ff"/><stop offset="1" stop-color="#7cbcf2"/></linearGradient></defs>`
        + kleidSvg("url(#kleidEis)", "#fff",
          `${aufdruck("❄", 66, 204, 13, "#fff")}${aufdruck("❄", 100, 214, 11, "#fff")}${aufdruck("❄", 134, 204, 13, "#fff")}
           <path d="M44 196 Q100 186 156 196" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>`) },
    frisur: { name: "Seitenzopf", icon: "👸",
      hinten: HAAR_KURZ_HINTEN,
      vorne: zopf([[156, 118], [154, 136], [150, 154], [145, 172], [139, 190]], 12, "#8ec5ff") },
  },
  // Season 4: Valentinstag
  s4: {
    kleid: { name: "Herzchenkleid", icon: "💗",
      svg: kleidSvg("#ff5c8a", "#fff",
        [[60, 206], [80, 196], [100, 212], [120, 196], [140, 206]].map(([x, y]) => aufdruck("♥", x, y, 14, "#fff")).join("")) },
    haarfarbe: { name: "Zuckerwatte-Rosa", icon: "🍭", haar: ["#ffbfd9", "#f27aa8"] },
  },
  // Season 5: Ostern
  s5: {
    kleid: { name: "Osterkleid", icon: "🥚",
      svg: kleidSvg("#fff07a", "#fff",
        [[68, 204, "#9fd8ff"], [100, 211, "#ffb3d1"], [132, 204, "#b8f0b0"]].map(([x, y, f]) =>
          `<ellipse cx="${x}" cy="${y}" rx="6" ry="8" fill="${f}"/><path d="M${x - 6} ${y} l3 -3 l3 3 l3 -3 l3 3" fill="none" stroke="#fff" stroke-width="1.5"/>`).join("")) },
    frisur: { name: "Zwei Dutts", icon: "🐰",
      hinten: HAAR_KURZ_HINTEN
        + `<circle cx="44" cy="40" r="24" fill="url(#haar)"/><circle cx="156" cy="40" r="24" fill="url(#haar)"/>
           <path d="M32 36 Q44 22 56 36 M144 36 Q156 22 168 36" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`,
      oben: `${aufdruck("🌼", 30, 30, 13)}${aufdruck("🌼", 170, 30, 13)}` },
  },
  // Season 6: Einhornwiese
  s6: {
    kleid: { name: "Einhornkleid", icon: "🦄",
      svg: `<defs><linearGradient id="kleidRegenbogen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#ffb3d9"/><stop offset=".25" stop-color="#ffd6a5"/><stop offset=".45" stop-color="#fdffb6"/>
              <stop offset=".65" stop-color="#caffbf"/><stop offset=".82" stop-color="#9bf6ff"/><stop offset="1" stop-color="#bdb2ff"/>
            </linearGradient></defs>`
        + kleidSvg("url(#kleidRegenbogen)", "#fff", `${aufdruck("✦", 70, 202, 12, "#fff")}${aufdruck("✦", 130, 202, 12, "#fff")}${aufdruck("🦄", 100, 212, 12)}`) },
    haarfarbe: { name: "Einhorn-Lila", icon: "💜", haar: ["#dcc0ff", "#9b6cf0"] },
  },
  // Season 7: Sommer & Meer
  s7: {
    kleid: { name: "Matrosenkleid", icon: "⚓",
      svg: kleidSvg("#2b5ea7", "#2b5ea7",
        `<path d="M70 171 L100 202 L130 171 L121 169 L100 190 L79 169 Z" fill="#fff"/>
         <path d="M41 209 Q100 200 159 209 L159.5 214 Q100 205 40.5 214 Z" fill="#fff"/>
         <path d="M100 198 L88 191 L88 205 Z M100 198 L112 191 L112 205 Z" fill="#e63946"/><circle cx="100" cy="198" r="3" fill="#c1121f"/>`) },
    frisur: { name: "Pferdeschwanz", icon: "🎀",
      hinten: HAAR_KURZ_HINTEN
        + `<path d="M150 40 Q198 50 192 112 Q188 150 174 180 Q168 150 171 120 Q170 82 144 62 Z" fill="url(#haar)"/>`,
      oben: `<circle cx="156" cy="50" r="6" fill="#3aa0ff"/>` },
  },
  // Season 8: Halloween
  s8: {
    kleid: { name: "Hexenkleid", icon: "🧙‍♀️",
      svg: kleidSvg("#4b2e83", "#ff9a3c", `${zickzack("#ff9a3c")}${aufdruck("🎃", 100, 204, 14)}${aufdruck("🦇", 66, 196, 11)}${aufdruck("🦇", 134, 196, 11)}`) },
    haarfarbe: { name: "Mitternachtsblau", icon: "🌙", haar: ["#56679f", "#262f63"] },
  },
};

// Season 1 und 2 stehen in skins.js – ihr Kleiderschrank kommt hier dazu
registriereKleiderschrank("s1", KLEIDERSCHRANK.s1);
registriereKleiderschrank("s2", KLEIDERSCHRANK.s2);
