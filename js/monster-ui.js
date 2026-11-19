"use strict";
// =====================================================
//  WOLKEN-MONSTER – Bildschirm (Regeln: monster.js)
// =====================================================

let monsterAktiv = null;          // { art, getippt, start, timer }
let naechstesMonster = 0;         // Zeitpunkt (ms), ab dem das nächste kommen darf

function planeMonster(minuten = MONSTER.wartenMin) {
  naechstesMonster = Date.now() + zufallZwischen(minuten[0], minuten[1]) * 60000;
}

// 1× pro Sekunde (aus main.js): Zeit für ein Monster?
function pruefeMonster() {
  if (monsterAktiv || Date.now() < naechstesMonster) return;
  if (document.hidden || regenLaeuft || !marieDarfSprechen()) return;   // nicht über Fenstern/Herzregen
  starteMonster();
}

function starteMonster(art = zufallsMonster()) {
  if (monsterAktiv) return;
  monsterAktiv = { art, getippt: 0, start: Date.now(), timer: null };
  const el = $("monster");
  el.className = `monster ${art.id}`;
  $("monsterWolke").textContent = art.icon;
  el.hidden = false;
  zeigeMonster();
  sound.stern();
  marieSagt(`Oh, ein ${art.name}! Schnell, kitzel es weg! ☁️`, 3500);
  letzteSprechblase = Date.now();
  monsterAktiv.timer = setInterval(() => {
    if (!monsterAktiv) return;
    if ((Date.now() - monsterAktiv.start) / 1000 >= MONSTER.sekunden) monsterEntkommt();
    else zeigeMonster();
  }, 200);
}

function zeigeMonster() {
  const m = monsterAktiv;
  if (!m) return;
  const anteil = Math.min(1, m.getippt / m.art.tipps);
  const rest = Math.max(0, Math.ceil(MONSTER.sekunden - (Date.now() - m.start) / 1000));
  $("monsterGesicht").textContent = monsterGesicht(anteil);
  $("monsterBalken").style.width = (anteil * 100).toFixed(1) + "%";
  setzeText($("monsterInfo"), `⏱️ ${rest} s · noch ${Math.max(0, m.art.tipps - m.getippt)}× kitzeln!`);
  $("monster").classList.toggle("eilig", rest <= 8);
}

function kitzle(ereignis) {
  const m = monsterAktiv;
  if (!m || m.fertig) return;
  if (ereignis.pointerType === "mouse" && ereignis.button !== 0) return;
  ereignis.preventDefault();
  m.getippt++;

  // Jeder Tipp ist ein echter Klick (zählt für die Klick-Stufe)
  const stufeVorher = klickStufe();
  spiel.klicks++;
  if (klickStufe() > stufeVorher) feiereKlickStufe();

  spieleTon(500 + m.getippt * 3 + Math.random() * 120, 0.06, "triangle", 0.05, 900);
  if (m.getippt % 4 === 0) zeigeSchwebeText({ x: ereignis.clientX, y: ereignis.clientY }, zufallAus(["hihi", "haha", "🤭", "kicher"]));
  const wolke = $("monsterWolke");
  wolke.classList.remove("zuckt");
  void wolke.offsetWidth;
  wolke.classList.add("zuckt");

  if (m.getippt >= m.art.tipps) monsterBesiegt();
  else zeigeMonster();
}

function beendeMonster() {
  if (!monsterAktiv) return;
  clearInterval(monsterAktiv.timer);
  monsterAktiv = null;
  planeMonster();
}

function monsterBesiegt() {
  const m = monsterAktiv;
  m.fertig = true;
  const sekunden = (Date.now() - m.start) / 1000;
  const blitz = sekunden <= MONSTER.sekunden * MONSTER.blitzAnteil;
  merkeMonsterSieg(sekunden);
  const b = monsterBelohnung(m.art, blitz);

  $("monsterGesicht").textContent = "😂";
  $("monsterBalken").style.width = "100%";
  setzeText($("monsterInfo"), blitz ? `⚡ Blitz-Bonus! In ${sekunden.toFixed(1)} s geschafft!` : `Geschafft in ${sekunden.toFixed(1)} s!`);
  const el = $("monster");
  el.classList.add("weg");
  konfetti(ui.spielfeld);
  sound.erfolg();
  setTimeout(() => sound.stern(), 300);

  const teile = [`+${format(b.herzen)} ${herz()}${blitz ? " (⚡ doppelt)" : ""}`];
  if (b.sticker) teile.push(`📒 ${b.sticker.sticker.emoji} ${b.sticker.sticker.name}`);
  if (b.zaubersamen) teile.push("✨ +1 Zaubersamen");
  meldung(`☁️ ${m.art.name} weggekitzelt!`, teile.join(" · "));
  for (const stufe of b.stufen) meldeSeasonStufe(stufe);
  if (b.sticker && (b.sticker.neu || b.sticker.seiteFertig)) albumSymbolFeiern();
  if (b.sticker && b.sticker.seiteFertig) meldung(`🎉 Seite „${b.sticker.seiteFertig.name}“ voll! ${b.sticker.seiteFertig.icon}`, `Belohnung: +${format(b.sticker.seitenHerzen)} ${herz()}`);

  clearInterval(m.timer);
  setTimeout(() => {
    el.hidden = true;
    el.classList.remove("weg");
    beendeMonster();
    sag("monsterWeg", { wichtig: true });
  }, 1400);
  speichern();
  pruefeErfolgeUndStatistik();
  aktualisiereAnzeige();
}

function monsterEntkommt() {
  const m = monsterAktiv;
  if (!m || m.fertig) return;
  m.fertig = true;
  merkeMonsterEntkommen();
  clearInterval(m.timer);
  $("monsterGesicht").textContent = "😜";
  setzeText($("monsterInfo"), "💨 Weggeflogen – beim nächsten Mal!");
  const el = $("monster");
  el.classList.add("fliegtWeg");
  setTimeout(() => {
    el.hidden = true;
    el.classList.remove("fliegtWeg");
    beendeMonster();
  }, 1400);
  speichern();
}

function richteMonsterEin() {
  const el = $("monster");
  el.addEventListener("pointerdown", kitzle);
  el.addEventListener("contextmenu", e => e.preventDefault());
  planeMonster(MONSTER.ersteNachMin);
}
