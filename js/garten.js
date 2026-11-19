"use strict";
// =====================================================
//  MARIES / HANNAHS GARTEN 🌱 – das tägliche Ritual
//  Samen pflanzen, jeden Tag gießen, nach ein paar Tagen ernten.
//  • Eine Pflanze wächst nur an Tagen, an denen sie gegossen wurde (1× pro Tag).
//    Vergisst man das Gießen, wartet sie einfach – verdorren kann nichts.
//  • Blumen und Obst kann man immer pflanzen. Zauberpflanzen wachsen nur aus Zaubersamen,
//    die man manchmal beim Ernten findet. Jede Zauberpflanze bringt beim ersten Mal ein Zimmer-Teil.
//  • Obst macht zusätzlich die Haustiere satt.
//
//  Gespeichert: spiel.garten = { beete: [{ pflanze, gegossen, letzterGuss }], frei, zaubersamen, ernte: { id: Anzahl } }
//  Diese Datei fasst das HTML nicht an (Bildschirm: garten-ui.js).
// =====================================================

const GARTEN = {
  beete: 6,
  startFrei: 3,
  beetPreise: [25e3, 2.5e6, 250e6],   // Beet 4, 5, 6 (wachsen mit, siehe mitwachsenderPreis)
  zaubersamenChance: { blume: 0.2, obst: 0.25, zauber: 0.1 },
  obstSatt: 25,                      // so viel Sattheit bekommen die Haustiere
};

// art: blume | obst | zauber · tage: so oft gießen (an verschiedenen Tagen) bis zur Ernte
const PFLANZEN = [
  { id: "tulpe",        art: "blume",  icon: "🌷", name: "Tulpe",           tage: 2 },
  { id: "sonnenblume",  art: "blume",  icon: "🌻", name: "Sonnenblume",     tage: 2 },
  { id: "rose",         art: "blume",  icon: "🌹", name: "Rose",            tage: 3 },
  { id: "erdbeere",     art: "obst",   icon: "🍓", name: "Erdbeere",        tage: 3 },
  { id: "apfel",        art: "obst",   icon: "🍎", name: "Apfelbäumchen",   tage: 4 },
  { id: "melone",       art: "obst",   icon: "🍉", name: "Melone",          tage: 4 },
  { id: "zauberglocke", art: "zauber", icon: "🪻", name: "Zauberglocke",    tage: 5, teil: "zimmer-zauberglocke" },
  { id: "sternenfrucht", art: "zauber", icon: "🌟", name: "Sternenfrucht",  tage: 5, teil: "zimmer-sternenfrucht" },
  { id: "glitzerpilz",  art: "zauber", icon: "🍄", name: "Glitzerpilz",     tage: 5, teil: "zimmer-glitzerpilz" },
  { id: "regenbogenrose", art: "zauber", icon: "🌈", name: "Regenbogenrose", tage: 6, teil: "zimmer-regenbogenrose" },
];

// Zimmer-Teile, die es nur aus dem Garten gibt
ZIMMER_TEILE.push(
  { id: "zimmer-zauberglocke",   platz: "pflanze",   name: "Zauberglocke im Topf", icon: "🪻", zusatz: "✨", preis: null, garten: true },
  { id: "zimmer-sternenfrucht",  platz: "regal",     name: "Sternenfrucht-Glas",   icon: "🫙", zusatz: "🌟", preis: null, garten: true },
  { id: "zimmer-glitzerpilz",    platz: "spielzeug", name: "Glitzerpilz",          icon: "🍄", zusatz: "✨", preis: null, garten: true },
  { id: "zimmer-regenbogenrose", platz: "pflanze",   name: "Regenbogenrose",       icon: "🌹", zusatz: "🌈", preis: null, garten: true },
);

function pflanzeNachId(id) {
  return PFLANZEN.find(p => p.id === id);
}

function gartenStand() {
  if (!spiel.garten) spiel.garten = { beete: [], frei: GARTEN.startFrei, zaubersamen: 0, ernte: {} };
  const g = spiel.garten;
  while (g.beete.length < GARTEN.beete) g.beete.push({ pflanze: null, gegossen: 0, letzterGuss: "" });
  return g;
}

function beetFrei(i) {
  return i < gartenStand().frei;
}

// Preis für das nächste Beet (oder null, wenn alle frei sind)
function naechstesBeetPreis() {
  const g = gartenStand();
  const n = g.frei - GARTEN.startFrei;
  return n < GARTEN.beetPreise.length ? mitwachsenderPreis(GARTEN.beetPreise[n]) : null;
}

function kaufeBeet() {
  const preis = naechstesBeetPreis();
  if (preis === null || spiel.herzen < preis) return false;
  spiel.herzen -= preis;
  gartenStand().frei++;
  return true;
}

// "leer" | "durstig" | "waechst" (heute schon gegossen) | "reif"
function beetZustand(beet) {
  const p = pflanzeNachId(beet.pflanze);
  if (!p) return "leer";
  if (beet.gegossen >= p.tage) return "reif";
  return beet.letzterGuss === datumText() ? "waechst" : "durstig";
}

function pflanze(i, pflanzenId) {
  const g = gartenStand();
  const beet = g.beete[i];
  const p = pflanzeNachId(pflanzenId);
  if (!beetFrei(i) || !p || beet.pflanze) return false;
  if (p.art === "zauber") {
    if (g.zaubersamen <= 0) return false;
    g.zaubersamen--;
  }
  Object.assign(beet, { pflanze: p.id, gegossen: 0, letzterGuss: "" });
  return true;
}

// Ein Zaubersamen wird zu einer zufälligen Zauberpflanze (noch nie geerntete zuerst)
function pflanzeZaubersamen(i) {
  const zauber = PFLANZEN.filter(p => p.art === "zauber");
  const neu = zauber.filter(p => !(gartenStand().ernte[p.id] > 0));
  return pflanze(i, zufallAus(neu.length ? neu : zauber).id);
}

// Gießen (1× pro Tag und Beet). Rückgabe: Anzahl gegossener Beete
function giesse(i = null) {
  const g = gartenStand();
  const heute = datumText();
  let n = 0;
  g.beete.forEach((beet, j) => {
    if ((i !== null && j !== i) || !beetFrei(j) || beetZustand(beet) !== "durstig") return;
    beet.gegossen++;
    beet.letzterGuss = heute;
    n++;
  });
  return n;
}

// Herzen für eine Ernte: ~10 Min. Produktion + 100 Klicks pro Wachstumstag, Obst ×1,5, Zauber ×3
function ernteHerzen(p) {
  const proKlick = herzenProKlick() / aktuellerBonus().klickFaktor;
  const faktor = p.art === "zauber" ? 3 : p.art === "obst" ? 1.5 : 1;
  return rundeHuebsch(Math.max(500, (basisHps() * 600 + proKlick * 100) * p.tage * faktor));
}

// Ernten. Rückgabe: { pflanze, herzen, zaubersamen, sticker, teil, satt } oder null
function ernte(i) {
  const g = gartenStand();
  const beet = g.beete[i];
  if (!beet || beetZustand(beet) !== "reif") return null;
  const p = pflanzeNachId(beet.pflanze);
  Object.assign(beet, { pflanze: null, gegossen: 0, letzterGuss: "" });
  g.ernte = { ...(g.ernte || {}), [p.id]: ((g.ernte || {})[p.id] || 0) + 1 };
  spiel.ernten = (spiel.ernten || 0) + 1;

  const herzen = ernteHerzen(p);
  herzenDazu(herzen);
  const zaubersamen = Math.random() < GARTEN.zaubersamenChance[p.art];
  if (zaubersamen) g.zaubersamen++;

  let satt = false;
  if (p.art === "obst") {
    aktualisiereHunger();
    for (const t of alleHaustiere()) {
      if (t.ausflug) continue;
      t.sattheit = Math.min(100, t.sattheit + GARTEN.obstSatt);
      satt = true;
    }
  }

  let sticker = null, teil = null;
  if (p.art === "zauber") {
    sticker = gibSticker("garten");
    if (p.teil && !skinStand.freigeschaltet.includes(p.teil)) {
      schalteSkinFrei(p.teil);
      speichereSkins();
      teil = ZIMMER_TEILE.find(t => t.id === p.teil);
    }
  }
  speichern();
  return { pflanze: p, herzen, zaubersamen, sticker, teil, satt };
}

// Für den Knopf: was gibt es zu tun?
function gartenAufgaben() {
  const g = gartenStand();
  let reif = 0, durstig = 0;
  g.beete.forEach((beet, i) => {
    if (!beetFrei(i)) return;
    const z = beetZustand(beet);
    if (z === "reif") reif++;
    if (z === "durstig") durstig++;
  });
  return { reif, durstig };
}
