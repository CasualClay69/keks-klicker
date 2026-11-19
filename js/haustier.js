"use strict";
// =====================================================
//  HAUSTIERE FÜR MARIE
//  Ein kleines Tier sitzt neben Marie, reagiert auf Klicks,
//  will gefüttert werden und wächst mit (Baby -> Kind -> Groß -> Prächtig, bis Level 50).
//  Ab Level 50 darf ein zweites Tier einziehen. Jedes satte Tier gibt +1 % Herzen pro Level.
//  Zubehör (Halsband, Schleife, Körbchen) kauft man mit Herzen oder bekommt es im Season-Pass,
//  ebenso neue Tierarten. Kindgerecht: Ein hungriges Tier stirbt nie – es schläft nur.
//
//  Gespeichert: spiel.haustier / spiel.haustier2 = { art, name, level, xp, sattheit, letzteZeit,
//               streichelTag, streichelHeute, zubehoer: { halsband, schleife, koerbchen },
//               ausflug: { ziel, start, ende } (nur unterwegs, siehe ausfluege.js) }
//               spiel.tierZubehoer = [gekaufte Zubehör-IDs]
//  Season-Tiere und -Zubehör stehen wie Skins in skinStand.freigeschaltet.
//  Diese Datei fasst das HTML nicht an.
// =====================================================

// Selbst gezeichnete grau-weiße Katze (Emojis lassen sich nicht umfärben)
const KATZE_SVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Schwanz -->
  <path d="M72 84 Q96 82 92 62 Q89 52 81 57" fill="none" stroke="#9ea4ac" stroke-width="9" stroke-linecap="round"/>
  <path d="M84 56 Q88 54 90 58" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
  <!-- Körper: grau mit weißem Bauch -->
  <ellipse cx="50" cy="73" rx="26" ry="22" fill="#9ea4ac"/>
  <ellipse cx="50" cy="77" rx="15" ry="17" fill="#ffffff"/>
  <!-- Pfoten -->
  <ellipse cx="39" cy="93" rx="8" ry="5" fill="#ffffff" stroke="#d5d9df" stroke-width="1"/>
  <ellipse cx="61" cy="93" rx="8" ry="5" fill="#ffffff" stroke="#d5d9df" stroke-width="1"/>
  <!-- Ohren -->
  <path d="M28 30 L26 6 L46 20 Z" fill="#9ea4ac"/>
  <path d="M72 30 L74 6 L54 20 Z" fill="#9ea4ac"/>
  <path d="M31 26 L30 12 L41 21 Z" fill="#ffb6c8"/>
  <path d="M69 26 L70 12 L59 21 Z" fill="#ffb6c8"/>
  <!-- Kopf -->
  <circle cx="50" cy="40" r="25" fill="#9ea4ac"/>
  <!-- dunklere Streifen auf der Stirn -->
  <path d="M38 21 Q40 26 39 30 M62 21 Q60 26 61 30" fill="none" stroke="#7f858e" stroke-width="2.5" stroke-linecap="round"/>
  <!-- weißer Stirnstreifen und weiße Schnauze -->
  <path d="M50 17 Q45 30 42 40 L58 40 Q55 30 50 17 Z" fill="#ffffff"/>
  <ellipse cx="50" cy="50" rx="15" ry="11" fill="#ffffff"/>
  <!-- Augen -->
  <ellipse cx="40" cy="40" rx="4.6" ry="5.6" fill="#3b2240"/>
  <ellipse cx="60" cy="40" rx="4.6" ry="5.6" fill="#3b2240"/>
  <circle cx="41.6" cy="38" r="1.7" fill="#ffffff"/>
  <circle cx="61.6" cy="38" r="1.7" fill="#ffffff"/>
  <!-- Bäckchen, Näschen, Mund -->
  <ellipse cx="35" cy="50" rx="4.5" ry="2.8" fill="#ff9ec4" opacity=".55"/>
  <ellipse cx="65" cy="50" rx="4.5" ry="2.8" fill="#ff9ec4" opacity=".55"/>
  <path d="M47 46 H53 L50 49.5 Z" fill="#ff8fb0"/>
  <path d="M50 49.5 Q47.5 53.5 44.5 51.5 M50 49.5 Q52.5 53.5 55.5 51.5" fill="none" stroke="#6b5b66" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Schnurrhaare -->
  <path d="M38 49 L22 46 M38 52 L23 53 M62 49 L78 46 M62 52 L77 53" stroke="#c9ced6" stroke-width="1.3" stroke-linecap="round"/>
</svg>`;

// ----- Alle Tiere selbst gezeichnet – im Stil der Katze -----
// Gleicher Bauplan wie KATZE_SVG (viewBox 0–100): Körper unten (50/73), Kopf oben (50/40, Radius 25).
// Darum sitzen Halsband, Schleife und Körbchen bei allen Tieren an derselben, richtigen Stelle.
// o = { fell, bauch, pfoten, kopf, schnauze (false = keine), hinten, ohren, kopfDeko, bauchDeko, gesicht }
function tierSvg(o) {
  const fell = o.fell, bauch = o.bauch || "#ffffff", pfoten = o.pfoten || bauch;
  const gesicht = o.gesicht !== undefined ? o.gesicht
    : `<path d="M47 46 H53 L50 49.5 Z" fill="${o.nase || "#ff8fb0"}"/>
       <path d="M50 49.5 Q47.5 53.5 44.5 51.5 M50 49.5 Q52.5 53.5 55.5 51.5" fill="none" stroke="#6b5b66" stroke-width="1.5" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  ${o.hinten || ""}
  <ellipse cx="50" cy="73" rx="26" ry="22" fill="${fell}"/>
  <ellipse cx="50" cy="77" rx="15" ry="17" fill="${bauch}"/>
  ${o.bauchDeko || ""}
  <ellipse cx="39" cy="93" rx="8" ry="5" fill="${pfoten}" stroke="rgba(0,0,0,.12)" stroke-width="1"/>
  <ellipse cx="61" cy="93" rx="8" ry="5" fill="${pfoten}" stroke="rgba(0,0,0,.12)" stroke-width="1"/>
  ${o.ohren || ""}
  <circle cx="50" cy="40" r="25" fill="${o.kopf || fell}"/>
  ${o.kopfDeko || ""}
  ${o.schnauze === false ? "" : `<ellipse cx="50" cy="50" rx="15" ry="11" fill="${o.schnauze || bauch}"/>`}
  <ellipse cx="40" cy="40" rx="4.6" ry="5.6" fill="#3b2240"/>
  <ellipse cx="60" cy="40" rx="4.6" ry="5.6" fill="#3b2240"/>
  <circle cx="41.6" cy="38" r="1.7" fill="#ffffff"/>
  <circle cx="61.6" cy="38" r="1.7" fill="#ffffff"/>
  <ellipse cx="35" cy="50" rx="4.5" ry="2.8" fill="#ff9ec4" opacity=".55"/>
  <ellipse cx="65" cy="50" rx="4.5" ry="2.8" fill="#ff9ec4" opacity=".55"/>
  ${gesicht}
</svg>`;
}

const MUND = (y = 49.5) => `<path d="M50 ${y} Q47.5 ${y + 4} 44.5 ${y + 2} M50 ${y} Q52.5 ${y + 4} 55.5 ${y + 2}" fill="none" stroke="#6b5b66" stroke-width="1.5" stroke-linecap="round"/>`;

// Truthahn: Federfächer hinter dem Körper
const TRUTHAHN_FEDERN = [-72, -48, -24, 0, 24, 48, 72].map((winkel, i) => {
  const rad = winkel * Math.PI / 180;
  const x = 50 + 31 * Math.sin(rad), y = 64 - 31 * Math.cos(rad);
  const farbe = ["#e8843f", "#d62839", "#f2c14e", "#a8521f", "#f2c14e", "#d62839", "#e8843f"][i];
  return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="8" ry="17" fill="${farbe}" transform="rotate(${winkel} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
}).join("");

// Igel: Stacheln rund um Kopf und Rücken
const IGEL_STACHELN = [];
for (let winkel = 150; winkel <= 390; winkel += 15) {
  const p = (w, r) => {
    const rad = w * Math.PI / 180;
    return `${(50 + r * Math.cos(rad)).toFixed(1)} ${(52 + r * Math.sin(rad)).toFixed(1)}`;
  };
  IGEL_STACHELN.push(`<path d="M${p(winkel - 9, 26)} L${p(winkel, 42)} L${p(winkel + 9, 26)} Z" fill="${winkel % 30 ? "#6b4423" : "#7d532f"}"/>`);
}

const TIER_ZEICHNUNGEN = {
  hase: tierSvg({
    fell: "#ece6e0", bauch: "#ffffff",
    hinten: `<circle cx="77" cy="84" r="7" fill="#ffffff" stroke="#e2dad2"/>`,
    ohren: `<g transform="rotate(-10 40 30)"><ellipse cx="40" cy="17" rx="7.5" ry="16" fill="#ece6e0"/><ellipse cx="40" cy="18" rx="3.8" ry="11" fill="#ffb6c8"/></g>
            <g transform="rotate(10 60 30)"><ellipse cx="60" cy="17" rx="7.5" ry="16" fill="#ece6e0"/><ellipse cx="60" cy="18" rx="3.8" ry="11" fill="#ffb6c8"/></g>`,
    gesicht: `<ellipse cx="50" cy="47" rx="3" ry="2.2" fill="#ff8fb0"/>${MUND(49)}
              <rect x="48" y="52" width="4" height="4" rx="1" fill="#ffffff" stroke="#d9d0c8" stroke-width=".8"/>`,
  }),
  hund: tierSvg({
    fell: "#d9a066", bauch: "#f8e6cc",
    hinten: `<path d="M72 80 Q92 74 88 56" fill="none" stroke="#d9a066" stroke-width="8" stroke-linecap="round"/>`,
    kopfDeko: `<circle cx="61" cy="36" r="8" fill="#c0844f" opacity=".75"/>
               <ellipse cx="26" cy="40" rx="9" ry="17" fill="#9c6235" transform="rotate(18 26 40)"/>
               <ellipse cx="74" cy="40" rx="9" ry="17" fill="#9c6235" transform="rotate(-18 74 40)"/>`,
    gesicht: `<ellipse cx="50" cy="46.5" rx="4.5" ry="3.2" fill="#3b2240"/>${MUND(49.5)}
              <path d="M48 53 Q50 59 52 53 Z" fill="#ff7aa0"/>`,
  }),
  einhorn: tierSvg({
    fell: "#fffafe", bauch: "#fdeefc", schnauze: "#ffe1f0", pfoten: "#f4d9ff",
    hinten: `<path d="M72 84 Q96 84 92 62" fill="none" stroke="#ffb3d9" stroke-width="9" stroke-linecap="round"/>
             <path d="M74 80 Q92 78 90 64" fill="none" stroke="#bdb2ff" stroke-width="5" stroke-linecap="round"/>`,
    ohren: `<path d="M30 28 L30 10 L42 20 Z" fill="#fffafe" stroke="#eadff0"/><path d="M70 28 L70 10 L58 20 Z" fill="#fffafe" stroke="#eadff0"/>`,
    kopfDeko: `<path d="M27 36 Q25 17 44 15 Q40 23 46 27 Q34 25 27 36 Z" fill="#ffb3d9"/>
               <path d="M29 44 Q21 31 31 23 Q31 31 37 33 Q29 35 29 44 Z" fill="#bdb2ff"/>
               <path d="M44 15 Q56 11 64 19 Q54 19 50 25 Q48 19 44 15 Z" fill="#9bf6ff"/>
               <path d="M45 19 L50 1 L55 19 Z" fill="#ffd23f" stroke="#f0a500" stroke-width="1"/>
               <path d="M46.5 13 L53.5 11 M47.8 7 L52.2 6" stroke="#f0a500" stroke-width="1"/>`,
    gesicht: `<ellipse cx="45" cy="50" rx="1.6" ry="1.2" fill="#d98aa8"/><ellipse cx="55" cy="50" rx="1.6" ry="1.2" fill="#d98aa8"/>
              <path d="M45 55 Q50 58 55 55" fill="none" stroke="#6b5b66" stroke-width="1.5" stroke-linecap="round"/>`,
  }),
  truthahn: tierSvg({
    fell: "#9b6640", kopf: "#b07b52", bauch: "#d8b48c", pfoten: "#f2a33a", schnauze: false,
    hinten: TRUTHAHN_FEDERN,
    gesicht: `<path d="M45 46 L55 46 L50 54 Z" fill="#f2a33a"/><path d="M54 50 Q60 55 56 61 Q52 56 54 50 Z" fill="#e63946"/>`,
  }),
  rentier: tierSvg({
    fell: "#b07a4e", bauch: "#f1dcc4", schnauze: "#e9cfa8",
    hinten: `<ellipse cx="75" cy="78" rx="5" ry="7" fill="#f1dcc4"/>`,
    ohren: `<path d="M38 22 Q34 11 28 4 M33 12 Q26 13 21 8 M62 22 Q66 11 72 4 M67 12 Q74 13 79 8" fill="none" stroke="#7a4f2a" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="24" cy="32" rx="9" ry="5" fill="#b07a4e" transform="rotate(-25 24 32)"/>
            <ellipse cx="76" cy="32" rx="9" ry="5" fill="#b07a4e" transform="rotate(25 76 32)"/>`,
    gesicht: `<circle cx="50" cy="47" r="5" fill="#e63946"/><circle cx="48.4" cy="45.4" r="1.5" fill="#ffffff" opacity=".7"/>${MUND(52)}`,
  }),
  pinguin: tierSvg({
    fell: "#2f3a4f", bauch: "#ffffff", pfoten: "#f2a33a", schnauze: false,
    hinten: `<ellipse cx="25" cy="72" rx="7" ry="16" fill="#26303f" transform="rotate(20 25 72)"/>
             <ellipse cx="75" cy="72" rx="7" ry="16" fill="#26303f" transform="rotate(-20 75 72)"/>`,
    kopfDeko: `<path d="M50 30 Q38 22 32 34 Q28 50 50 60 Q72 50 68 34 Q62 22 50 30 Z" fill="#ffffff"/>`,
    gesicht: `<path d="M45 47 L55 47 L50 53 Z" fill="#f2a33a"/>`,
  }),
  baer: tierSvg({
    fell: "#c68b59", bauch: "#f1d3b0",
    ohren: `<circle cx="29" cy="21" r="9" fill="#c68b59"/><circle cx="29" cy="21" r="4.5" fill="#f1d3b0"/>
            <circle cx="71" cy="21" r="9" fill="#c68b59"/><circle cx="71" cy="21" r="4.5" fill="#f1d3b0"/>`,
    bauchDeko: `<path d="M50 84 C40 77 41 70 46 70 C48.5 70 50 72 50 73.5 C50 72 51.5 70 54 70 C59 70 60 77 50 84 Z" fill="#ff5c8a"/>`,
    gesicht: `<ellipse cx="50" cy="46.5" rx="4.5" ry="3.2" fill="#3b2240"/>${MUND(49.5)}`,
  }),
  kueken: tierSvg({
    fell: "#ffd84d", bauch: "#ffe98f", pfoten: "#f2a33a", schnauze: false,
    hinten: `<ellipse cx="26" cy="72" rx="7" ry="12" fill="#ffc31f" transform="rotate(25 26 72)"/>
             <ellipse cx="74" cy="72" rx="7" ry="12" fill="#ffc31f" transform="rotate(-25 74 72)"/>`,
    ohren: `<path d="M50 17 Q45 7 49 4 Q51 10 54 6 Q57 12 53 17 Z" fill="#ffc31f"/>`,
    gesicht: `<path d="M45 46 L55 46 L50 52 Z" fill="#f2a33a"/>`,
  }),
  igel: tierSvg({
    fell: "#8a5a34", kopf: "#e8c9a0", bauch: "#f3dfc2", schnauze: "#f6e6cf",
    hinten: IGEL_STACHELN.join(""),
    ohren: `<circle cx="31" cy="23" r="5" fill="#e8c9a0"/><circle cx="69" cy="23" r="5" fill="#e8c9a0"/>`,
    gesicht: `<circle cx="50" cy="46" r="3" fill="#3b2240"/>${MUND(49)}`,
  }),
  schildkroete: tierSvg({
    fell: "#8fd18a", bauch: "#f2e6a6", schnauze: "#b4e3a8",
    hinten: `<ellipse cx="50" cy="70" rx="35" ry="26" fill="#4f9d55" stroke="#3b7d41" stroke-width="2"/>
             <path d="M50 46 L50 94 M17 68 L83 68 M28 52 L40 68 L28 86 M72 52 L60 68 L72 86" stroke="#3b7d41" stroke-width="2" fill="none"/>`,
    bauchDeko: `<path d="M38 72 H62 M37 82 H63" stroke="#d8c87a" stroke-width="1.5"/>`,
  }),
  fledermaus: tierSvg({
    fell: "#6b5b95", bauch: "#a99bd0", schnauze: "#b9addd",
    hinten: `<path d="M30 60 Q8 48 2 64 Q10 64 10 72 Q16 68 20 76 Q24 70 30 78 Z" fill="#4b3f72"/>
             <path d="M70 60 Q92 48 98 64 Q90 64 90 72 Q84 68 80 76 Q76 70 70 78 Z" fill="#4b3f72"/>`,
    ohren: `<path d="M28 32 L22 4 L44 20 Z" fill="#6b5b95"/><path d="M30 28 L26 11 L40 21 Z" fill="#c9a8e8"/>
            <path d="M72 32 L78 4 L56 20 Z" fill="#6b5b95"/><path d="M70 28 L74 11 L60 21 Z" fill="#c9a8e8"/>`,
    gesicht: `<path d="M47 46 H53 L50 49.5 Z" fill="#ff8fb0"/>${MUND(49.5)}
              <path d="M46 52 L47.5 56 L49 52.5 Z M54 52 L52.5 56 L51 52.5 Z" fill="#ffffff"/>`,
  }),
};

// Alle Tiere haben denselben Bauplan -> Halsband und Schleife sitzen überall gleich
const TIER_ANKER = { halsY: 63, halsB: 46, kopfX: 72, kopfY: 6 };

// ----- Tierarten -----
// Bild: die Zeichnung aus TIER_ZEICHNUNGEN (bzw. KATZE_SVG); emoji nur als kleines Symbol (z.B. im Season-Pass).
// anker: wo Halsband und Schleife sitzen – für alle gleich (TIER_ANKER), weil alle denselben Bauplan haben.
// season: gibt es nur im Season-Pass (Stufe 33) – vorher gesperrt.
const HAUSTIER_ARTEN = [
  { id: "katze",   name: "Kätzchen",     svg: KATZE_SVG, emoji: "🐱",
    anker: { halsY: 62, halsB: 46, kopfX: 74, kopfY: 6 },
    leckerli: { icon: "🐟", name: "Fischli" },   festmahl: { icon: "🍣", name: "Sushi" },
    namen: ["Mimi", "Luna", "Minka", "Schnurri"] },
  { id: "hase",    name: "Häschen",      emoji: "🐰",
    anker: { halsY: 82, halsB: 50, kopfX: 70, kopfY: 4 },
    leckerli: { icon: "🥕", name: "Karotte" },   festmahl: { icon: "🥗", name: "Salat" },
    namen: ["Hoppel", "Flocke", "Stupsi", "Mümmel"] },
  { id: "hund",    name: "Hündchen",     emoji: "🐶",
    anker: { halsY: 82, halsB: 52, kopfX: 76, kopfY: 10 },
    leckerli: { icon: "🦴", name: "Knochen" },   festmahl: { icon: "🍖", name: "Festschmaus" },
    namen: ["Bello", "Keks", "Wuffi", "Struppi"] },
  { id: "einhorn", name: "Einhorn-Baby", emoji: "🦄",
    anker: { halsY: 80, halsB: 50, kopfX: 66, kopfY: 8 },
    leckerli: { icon: "🍓", name: "Erdbeere" },  festmahl: { icon: "🧁", name: "Regenbogen-Cupcake" },
    namen: ["Glitzer", "Sternchen", "Wolke", "Funkel"] },

  // ----- Season-Tiere (Stufe 33 im jeweiligen Season-Pass) -----
  { id: "truthahn", season: "s1", name: "Truthahn-Küken", emoji: "🦃",
    anker: { halsY: 48, halsB: 40, kopfX: 34, kopfY: 4 },
    leckerli: { icon: "🌽", name: "Maiskorn" },   festmahl: { icon: "🥧", name: "Kürbiskuchen" },
    namen: ["Kürbis", "Krümel", "Herbstli", "Gobbel"] },
  { id: "rentier", season: "s2", name: "Rentier",        emoji: "🦌",
    anker: { halsY: 46, halsB: 38, kopfX: 30, kopfY: 4 },
    leckerli: { icon: "🥕", name: "Möhre" },       festmahl: { icon: "🍪", name: "Weihnachtsplätzchen" },
    namen: ["Rudi", "Blitz", "Komet", "Tanne"] },
  { id: "pinguin", season: "s3", name: "Pinguin",         emoji: "🐧",
    anker: { halsY: 44, halsB: 44, kopfX: 66, kopfY: 2 },
    leckerli: { icon: "🐟", name: "Fischli" },     festmahl: { icon: "🍤", name: "Garnele" },
    namen: ["Pingu", "Frosti", "Flipper", "Eisi"] },
  { id: "baer",    season: "s4", name: "Kuschelbär",      emoji: "🐻",
    anker: { halsY: 84, halsB: 52, kopfX: 76, kopfY: 8 },
    leckerli: { icon: "🍯", name: "Honig" },       festmahl: { icon: "🍫", name: "Schokoherz" },
    namen: ["Brummi", "Herzi", "Knuddel", "Honey"] },
  { id: "kueken",  season: "s5", name: "Küken",           emoji: "🐥",
    anker: { halsY: 56, halsB: 44, kopfX: 62, kopfY: 4 },
    leckerli: { icon: "🌾", name: "Körnchen" },    festmahl: { icon: "🥚", name: "Schokoei" },
    namen: ["Piepsi", "Flauschi", "Sunny", "Tschiep"] },
  { id: "igel",    season: "s6", name: "Igel",            emoji: "🦔",
    anker: { halsY: 62, halsB: 40, kopfX: 26, kopfY: 22 },
    leckerli: { icon: "🍎", name: "Apfelstück" },  festmahl: { icon: "🍄", name: "Pilzpfanne" },
    namen: ["Stachel", "Pieks", "Blümchen", "Igor"] },
  { id: "schildkroete", season: "s7", name: "Schildkröte", emoji: "🐢",
    anker: { halsY: 50, halsB: 34, kopfX: 76, kopfY: 22 },
    leckerli: { icon: "🥬", name: "Salatblatt" },  festmahl: { icon: "🍉", name: "Melone" },
    namen: ["Shelly", "Tempo", "Welle", "Kuli"] },
  { id: "fledermaus", season: "s8", name: "Fledermaus",   emoji: "🦇",
    anker: { halsY: 56, halsB: 34, kopfX: 62, kopfY: 10 },
    leckerli: { icon: "🍒", name: "Kirsche" },     festmahl: { icon: "🍬", name: "Gruselbonbon" },
    namen: ["Flatter", "Luna", "Nachti", "Vampi"] },
];

// Zeichnungen und Zubehör-Positionen eintragen (die Katze hat ihre eigene Zeichnung schon)
for (const art of HAUSTIER_ARTEN) {
  if (TIER_ZEICHNUNGEN[art.id]) art.svg = TIER_ZEICHNUNGEN[art.id];
  art.anker = TIER_ANKER;
}

// Wachstumsstufen: ab welchem Level, und wie groß (relativ zu Marie)
const TIER_STUFEN = [
  { ab: 1,  name: "Baby", groesse: 1 },
  { ab: 5,  name: "Kind", groesse: 1.25 },
  { ab: 10, name: "Groß", groesse: 1.5 },
  { ab: 30, name: "Prächtig", groesse: 1.65 },
];

const TIER = {
  maxLevel: 50,
  zweitesTierAb: 50,       // ab diesem Level des ersten Tiers gibt es ein zweites
  hungerProStunde: 4,      // Sattheit (0–100) sinkt um 4 pro Stunde -> nach ~1 Tag leer
  bonusProLevel: 0.01,     // satt: +1 % Herzen pro Level
  streichelnProTag: 20,
  streichelnXp: 1,
  leckerli: { satt: 25, xp: 10, preisFaktor: 1 },
  festmahl: { satt: 70, xp: 35, preisFaktor: 3.5 },
  seasonStufeTier: 33,     // Season-Pass: neues Tier
  seasonStufeZubehoer: 5,  // Season-Pass: Zubehör
};

// Erfahrung, die man von Level n zu Level n+1 braucht: 33, 41, 49, … bis Level 20, danach immer 185
// Bei normaler Pflege -> Kind nach ~3 Tagen, Groß nach ~10 Tagen, Level 50 nach etwa 2 Monaten
function tierXpFuerLevel(n) {
  return 25 + 8 * Math.min(n, 20);
}

// ----- Zubehör: Halsbänder, Schleifen, Körbchen -----
// Selbst gezeichnet, damit die Farben auf jedem Gerät stimmen.

function halsbandSvg(farbe, anhaenger = "") {
  const mitte = anhaenger.startsWith("#")
    ? `<circle cx="50" cy="24" r="8" fill="${anhaenger}" stroke="#fff" stroke-width="2"/>`
    : anhaenger ? `<text x="50" y="31" font-size="17" text-anchor="middle">${anhaenger}</text>` : "";
  return `<svg viewBox="0 0 100 36" aria-hidden="true">
    <path d="M4 8 Q50 22 96 8 L96 16 Q50 30 4 16 Z" fill="${farbe}" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>
    <path d="M10 11 Q50 23 90 11" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-dasharray="3 5"/>
    ${mitte}</svg>`;
}

function schleifeSvg(farbe, mitte = "") {
  if (!farbe) return `<svg viewBox="0 0 40 40" aria-hidden="true"><text x="20" y="31" font-size="28" text-anchor="middle">${mitte}</text></svg>`;
  return `<svg viewBox="0 0 40 30" aria-hidden="true">
    <path d="M20 15 L4 5 Q0 15 4 25 Z" fill="${farbe}" stroke="rgba(0,0,0,.15)"/>
    <path d="M20 15 L36 5 Q40 15 36 25 Z" fill="${farbe}" stroke="rgba(0,0,0,.15)"/>
    <path d="M7 9 Q5 15 7 21 M33 9 Q35 15 33 21" stroke="#fff" stroke-opacity=".5" stroke-width="1.5" fill="none"/>
    <circle cx="20" cy="15" r="5" fill="${mitte || farbe}" stroke="rgba(0,0,0,.15)"/></svg>`;
}

function koerbchenSvg(farbe, kissen, deko = "") {
  return `<svg viewBox="0 0 120 50" aria-hidden="true">
    <ellipse cx="60" cy="18" rx="54" ry="12" fill="${kissen}"/>
    <path d="M4 18 Q8 46 60 46 Q112 46 116 18 Q112 30 60 30 Q8 30 4 18 Z" fill="${farbe}" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>
    <path d="M14 30 Q60 40 106 30" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-dasharray="4 4"/>
    ${deko ? `<text x="60" y="44" font-size="13" text-anchor="middle">${deko}</text>` : ""}</svg>`;
}

// typ: halsband | schleife | koerbchen · preis: mit Herzen kaufen · season: nur im Season-Pass (Stufe 5)
const TIER_ZUBEHOER = [
  { id: "halsband-rosa",    typ: "halsband", name: "Rosa Halsband",      icon: "🩷", preis: 500,  svg: halsbandSvg("#ff8fbf", "#ffd23f") },
  { id: "halsband-blau",    typ: "halsband", name: "Himmelblau",         icon: "🩵", preis: 5e3,  svg: halsbandSvg("#7cc4f2", "#ffffff") },
  { id: "halsband-herz",    typ: "halsband", name: "Lila mit Herz",      icon: "💜", preis: 50e3, svg: halsbandSvg("#b48cff", "💖") },
  { id: "halsband-stern",   typ: "halsband", name: "Goldstern",          icon: "⭐", preis: 5e6,  svg: halsbandSvg("#f2c14e", "⭐") },
  { id: "halsband-diamant", typ: "halsband", name: "Diamant-Halsband",   icon: "💎", preis: 5e9,  svg: halsbandSvg("#d9ecff", "💎") },

  { id: "schleife-rosa",    typ: "schleife", name: "Rosa Schleife",      icon: "🎀", preis: 300,  svg: schleifeSvg("#ff6fa8") },
  { id: "schleife-rot",     typ: "schleife", name: "Rote Schleife",      icon: "❤️", preis: 3e3,  svg: schleifeSvg("#e63946") },
  { id: "schleife-gelb",    typ: "schleife", name: "Sonnenschleife",     icon: "💛", preis: 30e3, svg: schleifeSvg("#ffd23f", "#ff9a3c") },
  { id: "schleife-lila",    typ: "schleife", name: "Glitzerschleife",    icon: "✨", preis: 3e6,  svg: schleifeSvg("#9b6cf0", "#fff3a8") },
  { id: "schleife-krone",   typ: "schleife", name: "Kleine Krone",       icon: "👑", preis: 3e9,  svg: schleifeSvg("", "👑") },

  { id: "koerbchen-weide",  typ: "koerbchen", name: "Weidenkörbchen",    icon: "🧺", preis: 1e3,  svg: koerbchenSvg("#c98b55", "#f4e6c8") },
  { id: "koerbchen-rosa",   typ: "koerbchen", name: "Kuschelkissen",     icon: "🩷", preis: 100e3, svg: koerbchenSvg("#ff8fbf", "#ffe1ee") },
  { id: "koerbchen-wolke",  typ: "koerbchen", name: "Wolkenbett",        icon: "☁️", preis: 10e6, svg: koerbchenSvg("#cfe7ff", "#ffffff") },
  { id: "koerbchen-thron",  typ: "koerbchen", name: "Prinzessinnenbett", icon: "👑", preis: 10e9, svg: koerbchenSvg("#f2c14e", "#ff8fbf", "💎") },

  // ----- Season-Zubehör (Stufe 5) -----
  { id: "zubehoer-s1", season: "s1", typ: "halsband",  name: "Herbstlaub-Halsband", icon: "🍁", svg: halsbandSvg("#e8843f", "🍁") },
  { id: "zubehoer-s2", season: "s2", typ: "halsband",  name: "Glöckchen-Halsband",  icon: "🔔", svg: halsbandSvg("#d62839", "🔔") },
  { id: "zubehoer-s3", season: "s3", typ: "schleife",  name: "Schneeflocken-Spange", icon: "❄️", svg: schleifeSvg("", "❄️") },
  { id: "zubehoer-s4", season: "s4", typ: "schleife",  name: "Herzschleife",        icon: "💝", svg: schleifeSvg("#ff3d7f", "#ffd1e6") },
  { id: "zubehoer-s5", season: "s5", typ: "koerbchen", name: "Osterkörbchen",       icon: "🧺", svg: koerbchenSvg("#e9c08f", "#b8f0b0", "🥚🐣🥚") },
  { id: "zubehoer-s6", season: "s6", typ: "schleife",  name: "Blüten-Spange",       icon: "🌸", svg: schleifeSvg("", "🌸") },
  { id: "zubehoer-s7", season: "s7", typ: "koerbchen", name: "Muschelbett",         icon: "🐚", svg: koerbchenSvg("#7cc4f2", "#fff6e0", "🐚⭐🐚") },
  { id: "zubehoer-s8", season: "s8", typ: "halsband",  name: "Kürbis-Halsband",     icon: "🎃", svg: halsbandSvg("#4b2e83", "🎃") },
];

const ZUBEHOER_TYPEN = [
  { id: "halsband",  name: "Halsband",  icon: "📿" },
  { id: "schleife",  name: "Schleife",  icon: "🎀" },
  { id: "koerbchen", name: "Körbchen",  icon: "🧺" },
];

// Season-Tiere und -Zubehör als Belohnung in die Pässe eintragen.
// IDs der Tiere: "tierart-<id>" (stehen wie Skins in skinStand.freigeschaltet)
for (const art of HAUSTIER_ARTEN.filter(a => a.season)) {
  const pass = SEASON_PAESSE.find(p => p.id === art.season);
  if (pass) pass.skinBelohnungen[TIER.seasonStufeTier] = `tierart-${art.id}`;
}
for (const z of TIER_ZUBEHOER.filter(z => z.season)) {
  const pass = SEASON_PAESSE.find(p => p.id === z.season);
  if (pass) pass.skinBelohnungen[TIER.seasonStufeZubehoer] = z.id;
}

// Für Season-Pass-Liste und Meldungen: Tiere und Zubehör nach ID finden
// (Rückgabe wie bei Skins: { id, name, icon, season, tierTyp })
function tierBelohnung(id) {
  if (id.startsWith("tierart-")) {
    const art = HAUSTIER_ARTEN.find(a => `tierart-${a.id}` === id);
    return art && { id, name: art.name, icon: art.emoji, season: art.season, tierTyp: "art" };
  }
  const z = TIER_ZUBEHOER.find(x => x.id === id);
  return z && { id, name: z.name, icon: z.icon, season: z.season, tierTyp: "zubehoer" };
}

// =====================================================
//  ABFRAGEN
// =====================================================

// nr 1 = erstes Tier (spiel.haustier), nr 2 = zweites Tier (spiel.haustier2)
function haustier(nr = 1) {
  return (nr === 2 ? spiel.haustier2 : spiel.haustier) || null;
}

function alleHaustiere() {
  return [spiel.haustier, spiel.haustier2].filter(Boolean);
}

function tierArt(t = haustier()) {
  return t && (HAUSTIER_ARTEN.find(a => a.id === t.art) || HAUSTIER_ARTEN[0]);
}

function tierArtFrei(art) {
  return !art.season || skinStand.freigeschaltet.includes(`tierart-${art.id}`);
}

function tierStufe(t = haustier()) {
  const level = t ? t.level : 1;
  return TIER_STUFEN.filter(s => level >= s.ab).pop();
}

function tierEmoji(t = haustier()) {
  return t ? tierArt(t).emoji : "🥚";
}

// "gluecklich" | "hungrig" | "schlaeft"
function tierLaune(t = haustier()) {
  if (!t) return null;
  if (t.sattheit <= 0) return "schlaeft";
  if (t.sattheit < 30) return "hungrig";
  return "gluecklich";
}

// Darf man ein zweites Tier adoptieren?
function zweitesTierFrei() {
  const t = haustier(1);
  return Boolean(t) && t.level >= TIER.zweitesTierAb;
}

// ----- Zubehör -----

function zubehoerBesitzt(z) {
  return (spiel.tierZubehoer || []).includes(z.id) || skinStand.freigeschaltet.includes(z.id);
}

// Was kostet das Zubehör gerade? (wächst mit, siehe mitwachsenderPreis in logik.js)
function zubehoerPreis(z) {
  return mitwachsenderPreis(z.preis);
}

// Was trägt das Tier gerade? typ -> Zubehör oder undefined
function tierTraegt(t, typ) {
  const id = t && t.zubehoer && t.zubehoer[typ];
  const z = id && TIER_ZUBEHOER.find(x => x.id === id && x.typ === typ);
  if (z && t.fremd) return z;   // Tier eines anderen Spielers (besuch.js): nicht mit dem eigenen Besitz abgleichen
  return z && zubehoerBesitzt(z) ? z : undefined;
}

// Zubehör antippen. Rückgabe: "gekauft" | "angelegt" | "abgelegt" | "zuTeuer" | "gesperrt"
function waehleZubehoer(t, z) {
  if (!t) return "gesperrt";
  t.zubehoer = t.zubehoer || {};
  if (zubehoerBesitzt(z)) {
    if (t.zubehoer[z.typ] === z.id) { delete t.zubehoer[z.typ]; return "abgelegt"; }
    t.zubehoer[z.typ] = z.id;
    return "angelegt";
  }
  if (z.season) return "gesperrt";
  const kosten = zubehoerPreis(z);
  if (spiel.herzen < kosten) return "zuTeuer";
  spiel.herzen -= kosten;
  spiel.tierZubehoer = [...(spiel.tierZubehoer || []), z.id];
  t.zubehoer[z.typ] = z.id;
  return "gekauft";
}

// Tierart wechseln (Name, Level und Zubehör bleiben)
function waehleTierArt(t, art) {
  if (!t || !tierArtFrei(art)) return false;
  t.art = art.id;
  return true;
}

// =====================================================
//  AKTIONEN
// =====================================================

function adoptiere(artId, name, nr = 1) {
  const art = HAUSTIER_ARTEN.find(a => a.id === artId);
  if (!art || !tierArtFrei(art) || haustier(nr)) return false;
  if (nr === 2 && !zweitesTierFrei()) return false;
  name = String(name || "").trim().slice(0, 12) || art.namen[0];
  const tier = {
    art: art.id, name, level: 1, xp: 0, sattheit: 80,
    letzteZeit: Date.now(), streichelTag: "", streichelHeute: 0, zubehoer: {},
  };
  if (nr === 2) spiel.haustier2 = tier;
  else spiel.haustier = tier;
  return true;
}

// Sattheit nach der echten vergangenen Zeit verringern (auch während das Spiel zu war)
function aktualisiereHunger() {
  const jetzt = Date.now();
  for (const t of alleHaustiere()) {
    const stunden = (jetzt - (t.letzteZeit || jetzt)) / 3600000;
    if (stunden > 0) t.sattheit = Math.max(0, t.sattheit - stunden * TIER.hungerProStunde);
    t.letzteZeit = jetzt;
  }
}

// Bonus auf alle Herzen pro Sekunde – jedes Tier, das nicht hungrig schläft, gibt +1 % pro Level
function haustierFaktor() {
  let bonus = 0;
  for (const t of alleHaustiere()) if (t.sattheit > 0) bonus += t.level * TIER.bonusProLevel;
  return 1 + bonus;
}

// Futterpreis: ~2 Min. Produktion + 20 Klicks (mind. 50), Festmahl 3,5×
function futterPreis(sorte) {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  return rundeHuebsch(Math.max(50, basisHps() * 120 + proKlick * 20) * TIER[sorte].preisFaktor);
}

// Erfahrung dazu. Rückgabe: { aufgestiegen: Anzahl Level, gewachsen: neue Stufe oder null }
function gibTierXp(menge, t = haustier()) {
  const stufeVorher = tierStufe(t);
  let aufgestiegen = 0;
  t.xp += menge;
  while (t.level < TIER.maxLevel && t.xp >= tierXpFuerLevel(t.level)) {
    t.xp -= tierXpFuerLevel(t.level);
    t.level++;
    aufgestiegen++;
  }
  if (t.level >= TIER.maxLevel) t.xp = 0;
  const stufeNachher = tierStufe(t);
  return { aufgestiegen, gewachsen: stufeNachher !== stufeVorher ? stufeNachher : null };
}

// Füttern. Rückgabe: { ok: false, grund: "satt" | "herzen" } oder { ok: true, preis, aufgestiegen, gewachsen }
function fuettere(sorte, t = haustier()) {
  if (!t) return { ok: false, grund: "keins" };
  if (t.ausflug) return { ok: false, grund: "unterwegs" };   // auf Ausflug (ausfluege.js)
  aktualisiereHunger();
  if (t.sattheit >= 100) return { ok: false, grund: "satt" };
  const preis = futterPreis(sorte);
  if (spiel.herzen < preis) return { ok: false, grund: "herzen" };
  spiel.herzen -= preis;
  t.sattheit = Math.min(100, t.sattheit + TIER[sorte].satt);
  return { ok: true, preis, ...gibTierXp(TIER[sorte].xp, t) };
}

function streichelnUebrig(t = haustier()) {
  if (!t) return 0;
  return t.streichelTag === datumText() ? Math.max(0, TIER.streichelnProTag - t.streichelHeute) : TIER.streichelnProTag;
}

// Streicheln (begrenzt pro Tag und Tier). Rückgabe: { ok, aufgestiegen, gewachsen }
function streichle(t = haustier()) {
  if (!t || t.ausflug || streichelnUebrig(t) <= 0) return { ok: false };
  if (t.streichelTag !== datumText()) { t.streichelTag = datumText(); t.streichelHeute = 0; }
  t.streichelHeute++;
  return { ok: true, ...gibTierXp(TIER.streichelnXp, t) };
}
