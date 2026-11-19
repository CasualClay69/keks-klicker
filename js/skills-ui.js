"use strict";
// =====================================================
//  STERNEN-KARTE – Bildschirm
//  Eine Karte (9 × 9 Felder) mit dem Start in der Mitte. Man kann sie mit dem Finger
//  verschieben; Tippen auf eine Fähigkeit zeigt unten, was sie kann.
//  Außerdem: Automatik (Roboter, Einkauf, Futter) 1× pro Sekunde.
//  Regeln: skills.js
// =====================================================

const KARTE_FELD = 66;      // Pixel pro Feld
const KARTE_RADIUS = 4;     // Felder von der Mitte bis zum Rand
let skillGewaehlt = "start";

const kartePos = n => (n + KARTE_RADIUS) * KARTE_FELD + KARTE_FELD / 2;

function baueSternenKarte() {
  const flaeche = $("karteFlaeche");
  const groesse = (KARTE_RADIUS * 2 + 1) * KARTE_FELD;
  flaeche.style.width = flaeche.style.height = groesse + "px";
  flaeche.textContent = "";

  // Wege (Linien) hinter den Knöpfen
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "karteWege");
  svg.setAttribute("width", groesse);
  svg.setAttribute("height", groesse);
  for (const s of SKILLS) {
    if (!s.nach) continue;
    const vor = skillNachId(s.nach);
    const linie = document.createElementNS(ns, "line");
    linie.setAttribute("x1", kartePos(vor.x)); linie.setAttribute("y1", kartePos(vor.y));
    linie.setAttribute("x2", kartePos(s.x));   linie.setAttribute("y2", kartePos(s.y));
    linie.dataset.skill = s.id;
    linie.style.setProperty("--farbe", SKILL_AESTE[s.ast].farbe);
    svg.append(linie);
  }
  flaeche.append(svg);

  // Namen der vier Wege am Rand
  for (const [ast, x, y] of [["klick", 0, -4], ["helfer", 4, 0], ["auto", 0, 4], ["glueck", -4, 0]]) {
    const schild = span("karteSchild", `${SKILL_AESTE[ast].icon} ${SKILL_AESTE[ast].name}`);
    schild.style.left = kartePos(x) + "px";
    schild.style.top = kartePos(y) + "px";
    schild.style.setProperty("--farbe", SKILL_AESTE[ast].farbe);
    flaeche.append(schild);
  }

  for (const s of SKILLS) {
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "skillKnoten";
    knopf.dataset.skill = s.id;
    knopf.style.left = kartePos(s.x) + "px";
    knopf.style.top = kartePos(s.y) + "px";
    if (s.ast) knopf.style.setProperty("--farbe", SKILL_AESTE[s.ast].farbe);
    knopf.append(span("icon", s.icon), span("kosten", s.kosten ? `${s.kosten}⭐` : ""));
    knopf.setAttribute("aria-label", s.name);
    knopf.addEventListener("click", () => { skillGewaehlt = s.id; sound.klick(); zeigeSternenKarte(); });
    flaeche.append(knopf);
  }
}

function zeigeSternenKarte() {
  setzeText($("skillPunkte"), `⭐ ${sternePunkteFrei()} frei · ${glitzersterne()} insgesamt`);
  $("skillZurueck").disabled = !(spiel.skills || []).length;

  for (const knopf of $("karteFlaeche").querySelectorAll(".skillKnoten")) {
    const s = skillNachId(knopf.dataset.skill);
    const status = skillStatus(s);
    knopf.className = `skillKnoten ${status}${s.id === skillGewaehlt ? " gewaehlt" : ""}${s.id === "start" ? " start" : ""}`;
  }
  for (const linie of $("karteFlaeche").querySelectorAll("line")) {
    linie.classList.toggle("gelernt", hatSkill(linie.dataset.skill));
  }

  // Unten: die gewählte Fähigkeit
  const s = skillNachId(skillGewaehlt);
  const status = skillStatus(s);
  const ast = s.ast ? SKILL_AESTE[s.ast] : null;
  setzeText($("skillName"), `${s.icon} ${s.name}`);
  setzeText($("skillWeg"), ast ? `${ast.icon} ${ast.name}` : "");
  setzeText($("skillText"), s.text);
  const lernen = $("skillLernen");
  lernen.hidden = s.id === "start" || status === "gelernt";
  lernen.disabled = status !== "lernbar";
  setzeText(lernen, status === "gesperrt" ? `🔒 Erst „${skillNachId(s.nach).name}“ lernen`
    : status === "zuTeuer" ? `⭐ ${s.kosten} nötig – du hast ${sternePunkteFrei()}`
    : `✨ Lernen für ${s.kosten} ⭐`);
  const fertig = $("skillGelernt");
  fertig.hidden = s.id === "start" || status !== "gelernt";
  setzeText(fertig, "✓ Gelernt!");

  const schalter = $("skillSchalter");
  const auto = s.auto && status === "gelernt";
  schalter.hidden = !auto;
  if (auto) {
    const an = automatikAn(s.auto);
    schalter.classList.toggle("aus", !an);
    schalter.setAttribute("aria-checked", String(an));
    setzeText(schalter, an ? "🟢 Automatik ist AN – tippen zum Ausschalten" : "⚪ Automatik ist AUS – tippen zum Einschalten");
  }
}

function oeffneSternenKarte() {
  zeigeSternenKarte();
  $("skillOverlay").hidden = false;
  // Die Mitte zeigen
  const rahmen = $("karteRahmen");
  requestAnimationFrame(() => {
    rahmen.scrollLeft = (rahmen.scrollWidth - rahmen.clientWidth) / 2;
    rahmen.scrollTop = (rahmen.scrollHeight - rahmen.clientHeight) / 2;
  });
}

// Knopf rechts: erst sichtbar, wenn man Glitzersterne hat. Zahl = freie Sterne
function zeigeSkillKnopf() {
  const knopf = $("skillBtn");
  knopf.hidden = glitzersterne() <= 0;
  const frei = sternePunkteFrei();
  $("skillBadge").hidden = frei <= 0;
  setzeText($("skillBadge"), String(frei));
}

// ----- Automatik: 1× pro Sekunde -----

function automatikTakt() {
  if (document.hidden) return;
  const klicks = roboterKlicksProSekunde();
  if (klicks) {
    const plus = herzenProKlick() * klicks;
    herzenDazu(plus);
    spiel.klickHerzen = deckel((spiel.klickHerzen || 0) + plus);
    const r = ui.marie.getBoundingClientRect();
    if (r.width) zeigeSchwebeText({ x: r.right - r.width * 0.15, y: r.top + r.height * 0.2 }, `🤖 +${format(plus)}`);
  }
  if (automatikEinkauf()) zeigeAlles();
  for (const { t, ergebnis } of automatikFuettern()) meldeTierWachstum(ergebnis, t);
  zeigeSkillKnopf();
}

function richteSkillsEin() {
  baueSternenKarte();
  $("skillBtn").addEventListener("click", () => { sound.klick(); oeffneSternenKarte(); });
  $("neustartKarteBtn").addEventListener("click", () => { sound.klick(); oeffneSternenKarte(); });
  $("skillZu").addEventListener("click", () => { $("skillOverlay").hidden = true; sound.klick(); });

  $("skillLernen").addEventListener("click", () => {
    const s = skillNachId(skillGewaehlt);
    if (!lerneSkill(s.id)) { sound.fehler(); return; }
    sound.erfolg();
    setTimeout(() => sound.stern(), 250);
    const knoten = $("karteFlaeche").querySelector(`.skillKnoten[data-skill="${s.id}"]`);
    if (knoten) konfetti(knoten);
    meldung(`✨ ${s.name} gelernt!`, s.text);
    speichern();
    zeigeSternenKarte();
    zeigeSkillKnopf();
    zeigeAlles();
  });

  $("skillSchalter").addEventListener("click", () => {
    const s = skillNachId(skillGewaehlt);
    if (!s.auto) return;
    schalteAutomatik(s.auto);
    sound.klick();
    speichern();
    zeigeSternenKarte();
  });

  $("skillZurueck").addEventListener("click", () => {
    if (!confirm("Alle Fähigkeiten vergessen? Du bekommst alle Glitzersterne zurück und kannst sie neu verteilen.")) return;
    vergissAlleSkills();
    skillGewaehlt = "start";
    sound.klick();
    speichern();
    zeigeSternenKarte();
    zeigeSkillKnopf();
    zeigeAlles();
  });

  zeigeSkillKnopf();
  setInterval(automatikTakt, 1000);
}
