"use strict";
// =====================================================
//  HAUSTIER FÜR MARIE
//  Ein kleines Tier sitzt neben Marie, reagiert auf Klicks,
//  will gefüttert werden und wächst mit (Baby -> Kind -> Groß).
//  Ein sattes Tier gibt +1 % Herzen pro Level.
//  Kindgerecht: Ein hungriges Tier stirbt nie – es schläft nur, bis es wieder Futter bekommt.
//
//  Gespeichert in spiel.haustier = { art, name, level, xp, sattheit, letzteZeit, streichelTag, streichelHeute }
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

// "svg": eigenes Bild statt Emoji (gleiches Bild in allen Stufen, es wird nur größer)
const HAUSTIER_ARTEN = [
  { id: "katze",   name: "Kätzchen",     stufen: ["🐱", "🐈", "🐈"], svg: KATZE_SVG,
    leckerli: { icon: "🐟", name: "Fischli" },   festmahl: { icon: "🍣", name: "Sushi" },
    namen: ["Mimi", "Luna", "Minka", "Schnurri"] },
  { id: "hase",    name: "Häschen",      stufen: ["🐰", "🐇", "🐇"],
    leckerli: { icon: "🥕", name: "Karotte" },   festmahl: { icon: "🥗", name: "Salat" },
    namen: ["Hoppel", "Flocke", "Stupsi", "Mümmel"] },
  { id: "hund",    name: "Hündchen",     stufen: ["🐶", "🐕", "🐕"],
    leckerli: { icon: "🦴", name: "Knochen" },   festmahl: { icon: "🍖", name: "Festschmaus" },
    namen: ["Bello", "Keks", "Wuffi", "Struppi"] },
  { id: "einhorn", name: "Einhorn-Baby", stufen: ["🦄", "🦄", "🦄"],
    leckerli: { icon: "🍓", name: "Erdbeere" },  festmahl: { icon: "🧁", name: "Regenbogen-Cupcake" },
    namen: ["Glitzer", "Sternchen", "Wolke", "Funkel"] },
];

// Wachstumsstufen: ab welchem Level, und wie groß (relativ zu Marie)
const TIER_STUFEN = [
  { ab: 1,  name: "Baby", groesse: 1 },
  { ab: 5,  name: "Kind", groesse: 1.25 },
  { ab: 10, name: "Groß", groesse: 1.5 },
];

const TIER = {
  maxLevel: 20,
  hungerProStunde: 4,      // Sattheit (0–100) sinkt um 4 pro Stunde -> nach ~1 Tag leer
  bonusProLevel: 0.01,     // satt: +1 % Herzen pro Level
  streichelnProTag: 20,
  streichelnXp: 1,
  leckerli: { satt: 25, xp: 10, preisFaktor: 1 },
  festmahl: { satt: 70, xp: 35, preisFaktor: 3.5 },
};

// Erfahrung, die man von Level n zu Level n+1 braucht: 33, 41, 49, …
// Bei normaler Pflege (satt füttern + streicheln) -> Kind nach ~3 Tagen, Groß nach ~10 Tagen
function tierXpFuerLevel(n) {
  return 25 + 8 * n;
}

function haustier() {
  return spiel.haustier || null;
}

function tierArt(t = haustier()) {
  return t && HAUSTIER_ARTEN.find(a => a.id === t.art);
}

function tierStufe(t = haustier()) {
  const level = t ? t.level : 1;
  return TIER_STUFEN.filter(s => level >= s.ab).pop();
}

function tierEmoji(t = haustier()) {
  if (!t) return "🥚";
  return tierArt(t).stufen[TIER_STUFEN.indexOf(tierStufe(t))];
}

// "gluecklich" | "hungrig" | "schlaeft"
function tierLaune(t = haustier()) {
  if (!t) return null;
  if (t.sattheit <= 0) return "schlaeft";
  if (t.sattheit < 30) return "hungrig";
  return "gluecklich";
}

function adoptiere(artId, name) {
  const art = HAUSTIER_ARTEN.find(a => a.id === artId);
  if (!art || haustier()) return false;
  name = String(name || "").trim().slice(0, 12) || art.namen[0];
  spiel.haustier = {
    art: art.id, name, level: 1, xp: 0, sattheit: 80,
    letzteZeit: Date.now(), streichelTag: "", streichelHeute: 0,
  };
  return true;
}

// Sattheit nach der echten vergangenen Zeit verringern (auch während das Spiel zu war)
function aktualisiereHunger() {
  const t = haustier();
  if (!t) return;
  const jetzt = Date.now();
  const stunden = (jetzt - (t.letzteZeit || jetzt)) / 3600000;
  if (stunden > 0) t.sattheit = Math.max(0, t.sattheit - stunden * TIER.hungerProStunde);
  t.letzteZeit = jetzt;
}

// Bonus auf alle Herzen pro Sekunde – nur, wenn das Tier nicht hungrig schläft
function haustierFaktor() {
  const t = spiel.haustier;
  if (!t || t.sattheit <= 0) return 1;
  return 1 + t.level * TIER.bonusProLevel;
}

// Futterpreis: ~2 Min. Produktion + 20 Klicks (mind. 50), Festmahl 3,5×
function futterPreis(sorte) {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  return rundeHuebsch(Math.max(50, basisHps() * 120 + proKlick * 20) * TIER[sorte].preisFaktor);
}

// Erfahrung dazu. Rückgabe: { aufgestiegen: Anzahl Level, gewachsen: neue Stufe oder null }
function gibTierXp(menge) {
  const t = haustier();
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
function fuettere(sorte) {
  const t = haustier();
  if (!t) return { ok: false, grund: "keins" };
  aktualisiereHunger();
  if (t.sattheit >= 100) return { ok: false, grund: "satt" };
  const preis = futterPreis(sorte);
  if (spiel.herzen < preis) return { ok: false, grund: "herzen" };
  spiel.herzen -= preis;
  t.sattheit = Math.min(100, t.sattheit + TIER[sorte].satt);
  return { ok: true, preis, ...gibTierXp(TIER[sorte].xp) };
}

function streichelnUebrig() {
  const t = haustier();
  if (!t) return 0;
  return t.streichelTag === datumText() ? Math.max(0, TIER.streichelnProTag - t.streichelHeute) : TIER.streichelnProTag;
}

// Streicheln (begrenzt pro Tag). Rückgabe: { ok, aufgestiegen, gewachsen }
function streichle() {
  const t = haustier();
  if (!t || streichelnUebrig() <= 0) return { ok: false };
  if (t.streichelTag !== datumText()) { t.streichelTag = datumText(); t.streichelHeute = 0; }
  t.streichelHeute++;
  return { ok: true, ...gibTierXp(TIER.streichelnXp) };
}
