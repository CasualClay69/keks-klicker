"use strict";
// =====================================================
//  SEASON-JAHRE 2027–2029 – der Baukasten für alle weiteren Season-Pässe
//
//  Jedes Thema (Thanksgiving, Weihnachten, …, Wind & Drachen) gibt es einmal pro Jahr.
//  Pro Jahr steht unten EIN kurzer Block (VARIANTEN) mit Farben, Motiven und Namen.
//  baueSeasonVariante() erzeugt daraus einen kompletten Pass mit 11 neuen Belohnungen:
//    Stufe 5 Tier-Zubehör · 10 Hut · 15 Zimmer · 20 Musik · 25 Kleid · 30 HUD · 33 Haustier
//    35 Haarfarbe · 40 Logo · 45 Zimmer · 50 Hintergrund   (alle anderen Stufen: Herzen)
//  Währung, Herzregen und Sticker-Seite gehören zum Thema (die Seite ist jedes Jahr wieder sammelbar).
//
//  Nach Season 27 (Halloween 2029) geht es wieder bei Season 1 los (siehe SEASON_KREIS in skins.js).
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

// ----- Die Themen -----
// start/ende: [Monat, Tag] – ende im Folgejahr, wenn der Monat kleiner ist (Weihnachten)
const SEASON_THEMEN = {
  thanksgiving: { titel: "Thanksgiving",     icon: "🦃", start: [11, 1], ende: [12, 1], tier: "truthahn",     musik: () => ERNTEDANK_WALZER, vorbild: "s1" },
  weihnachten:  { titel: "Weihnachten",      icon: "🎅", start: [12, 1], ende: [1, 1],  tier: "rentier",      musik: () => GLOECKCHEN,       vorbild: "s2", schnee: true },
  winter:       { titel: "Winterwunderland", icon: "⛸️", start: [1, 1],  ende: [2, 1],  tier: "pinguin",      musik: () => EISPRINZESSIN_WALZER, vorbild: "s3", schnee: true },
  valentin:     { titel: "Valentinstag",     icon: "💝", start: [2, 1],  ende: [3, 1],  tier: "baer",         musik: () => HERZKLOPFEN,      vorbild: "s4" },
  ostern:       { titel: "Ostern",           icon: "🐰", start: [3, 1],  ende: [5, 1],  tier: "kueken",       musik: () => HUEPF_HAESCHEN,   vorbild: "s5" },
  einhorn:      { titel: "Einhornwiese",     icon: "🦄", start: [5, 1],  ende: [7, 1],  tier: "igel",         musik: () => EINHORNWIESE,     vorbild: "s6" },
  sommer:       { titel: "Sommer & Meer",    icon: "🏖️", start: [7, 1],  ende: [9, 1],  tier: "schildkroete", musik: () => SOMMERFERIEN,     vorbild: "s7" },
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
  // ───────── Season-Jahr 1 (Rest): Wind & Drachen 2027 ─────────
  { nr: 8, thema: "drachen", jahr: 2027, f: ["#4fa8e8", "#1f5f96", "#ff9f43", "#eef7ff", "#fff1e0", "#1d3550"],
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
  { nr: 10, thema: "thanksgiving", jahr: 2027, f: ["#d98a2b", "#7a4214", "#8a9a3a", "#fff6e6", "#fbefd9", "#4a2c12"],
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

  { nr: 11, thema: "weihnachten", jahr: 2027, f: ["#2e9e5b", "#145233", "#d62839", "#effaf3", "#fff0f0", "#163322"],
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

  { nr: 12, thema: "winter", jahr: 2028, f: ["#7b8fe0", "#3a4796", "#4fc3dc", "#f1f3ff", "#e9fbff", "#232a55"],
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

  { nr: 13, thema: "valentin", jahr: 2028, f: ["#ff7aa8", "#a8235a", "#ffb347", "#fff2f7", "#fff4e6", "#4f1c33"],
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

  { nr: 14, thema: "ostern", jahr: 2028, f: ["#6ec6ff", "#2b6ea6", "#ffd23f", "#f0f9ff", "#fffbe6", "#1f3a52"],
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

  { nr: 15, thema: "einhorn", jahr: 2028, f: ["#4fd1c5", "#1f7a74", "#ff8fd1", "#ecfffb", "#fff0fa", "#173f3c"],
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

  { nr: 16, thema: "sommer", jahr: 2028, f: ["#ff6f91", "#b0284f", "#ffc94d", "#fff3f6", "#fffbe0", "#4a1f2c"],
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

  { nr: 17, thema: "drachen", jahr: 2028, f: ["#8a63d2", "#4b2b8c", "#ffcf4d", "#f5f0ff", "#fff7dc", "#2a1a4a"],
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

  { nr: 18, thema: "halloween", jahr: 2028, f: ["#4caf50", "#1f5f23", "#ff8a2a", "#effbea", "#fff2e3", "#1c2e1d"],
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

  { nr: 19, thema: "thanksgiving", jahr: 2028, f: ["#c0392b", "#6e1d15", "#e5a937", "#fff2ee", "#fff7e0", "#3d1a12"],
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

  { nr: 20, thema: "weihnachten", jahr: 2028, f: ["#d4a017", "#7a5a00", "#c62f3e", "#fffaea", "#fff0f0", "#3a2c08"],
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
  { nr: 21, thema: "winter", jahr: 2029, f: ["#e66fa8", "#8f2a5f", "#7cc4f2", "#fff2f8", "#eef8ff", "#3f1630"],
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

  { nr: 22, thema: "valentin", jahr: 2029, f: ["#b06ef0", "#5e2a9c", "#ff6f91", "#f7f0ff", "#fff0f4", "#2e1650"],
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

  { nr: 23, thema: "ostern", jahr: 2029, f: ["#ff9f43", "#a8551a", "#7cc36b", "#fff6ea", "#f2fbe8", "#4a2a12"],
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

  { nr: 24, thema: "einhorn", jahr: 2029, f: ["#ffb347", "#a8641a", "#ff7eb6", "#fff8ec", "#fff0f7", "#4a2e12"],
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

  { nr: 25, thema: "sommer", jahr: 2029, f: ["#2bb3a8", "#14605a", "#ffd166", "#ebfbf9", "#fff7dd", "#123d3a"],
    deko: ["🐠", "🐙", "🌊", "🫧", "⚓", "🐬"],
    hut: { typ: "haarreif", name: "Muschel-Diadem", icon: "🐚", farbe: "#2bb3a8", emoji: ["🐚", "⭐", "🐚"] },
    musik: { name: "Sommerferien (Unterwasser)", icon: "🫧", halbtoene: -4, tempo: 0.92 },
    kleid: { name: "Meerjungfrauen-Kleid", icon: "🧜‍♀️", farbe: "#6fd6cc", kragen: "#fff7dd", saum: "#14605a", muster: ["🐚", "🫧"] },
    haar: { name: "Meeresblau", icon: "🌊", farben: ["#6ec6e8", "#2f7fb0"] },
    hud: { name: "Lagune", icon: "🌊", symbole: ["🩵", "🧜‍♀️", "🐚", "🐠"] },
    logo: { name: "Lagunen-Logo", icon: "🐬", krone: "🐚", deko: "🌊", funkeln: "≈" },
    bg: { name: "Korallenriff", icon: "🐠", verlauf: ["#c9f2ff", "#9fe0ea", "#7ccbd6"], richtung: "steigen", hinten: ["🫧", "✨"], vorne: ["🐠", "🐙"] },
    z15: { platz: "spielzeug", name: "Kuschel-Krake", icon: "🐙" },
    z45: { platz: "wand", name: "Wellen-Tapete", icon: "🌊", farbe: "#e6fbfa", muster: "🌊" },
    tier: { name: "Lagunen-Schildkröte", filter: "hue-rotate(60deg) saturate(1.2)" },
    zubehoer: { typ: "halsband", name: "Perlenkette", icon: "🦪", farbe: "#ffffff", extra: "#2bb3a8" } },

  { nr: 26, thema: "drachen", jahr: 2029, f: ["#e8504a", "#8f211c", "#ffd23f", "#fff1f0", "#fff9dc", "#3f1210"],
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

  { nr: 27, thema: "halloween", jahr: 2029, f: ["#5a6fd6", "#24307a", "#ffd23f", "#eff1ff", "#fff9e0", "#181f4a"],
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
