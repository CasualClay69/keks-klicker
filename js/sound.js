"use strict";
// =====================================================
//  SOUNDS & MUSIK – mit der Web Audio API erzeugt, keine Dateien nötig
// =====================================================

let audioKontext = null;

// Gemeinsamer Audio-Kontext für Klänge und Musik (wird beim ersten Ton erzeugt)
function audio() {
  audioKontext = audioKontext || new (window.AudioContext || window.webkitAudioContext)();
  if (audioKontext.state === "suspended") audioKontext.resume();
  return audioKontext;
}

// Notenname -> Frequenz in Hz, z.B. "A4" -> 440, "C6" -> 1046.5
function frequenz(note) {
  const halbtoene = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  const [, name, vorzeichen, oktave] = note.match(/^([A-G])(#?)(\d)$/);
  const abstand = halbtoene[name] + (vorzeichen ? 1 : 0) + (Number(oktave) - 4) * 12;
  return 440 * Math.pow(2, abstand / 12);
}

// =====================================================
//  KLANG-EFFEKTE
// =====================================================

// Spielt einen Ton: Frequenz (Hz), Dauer (s), Wellenform, Lautstärke, optional Endfrequenz
function spieleTon(freq, dauer, typ = "sine", lautstaerke = 0.15, freqEnde = null) {
  if (!spiel.tonAn) return;
  try {
    const ctx = audio();
    const t = ctx.currentTime;
    const oszillator = ctx.createOscillator();
    const verstaerker = ctx.createGain();

    oszillator.type = typ;
    oszillator.frequency.setValueAtTime(freq, t);
    if (freqEnde) oszillator.frequency.exponentialRampToValueAtTime(freqEnde, t + dauer);

    verstaerker.gain.setValueAtTime(lautstaerke, t);
    verstaerker.gain.exponentialRampToValueAtTime(0.001, t + dauer);   // ausblenden

    oszillator.connect(verstaerker).connect(ctx.destination);
    oszillator.start(t);
    oszillator.stop(t + dauer);
  } catch (e) { /* kein Audio verfügbar */ }
}

// Mehrere Töne nacheinander
function spieleMelodie(frequenzen, abstandMs, dauer, typ, lautstaerke) {
  frequenzen.forEach((f, i) =>
    setTimeout(() => spieleTon(f, dauer, typ, lautstaerke), i * abstandMs));
}

// Helle, verspielte Klänge: Sinus-Töne, die nach oben gleiten ("Plopp!")
const sound = {
  klick:  () => spieleTon(700 + Math.random() * 250, 0.12, "sine", 0.15, 1400),
  kauf:   () => spieleMelodie([1047, 1319, 1568], 60, 0.15, "sine", 0.1),
  fehler: () => spieleTon(330, 0.18, "triangle", 0.08, 220),
  stern:  () => spieleMelodie([1568, 1760, 2093, 2349, 2637, 3136], 55, 0.3, "sine", 0.08),
  erfolg: () => spieleMelodie([784, 988, 1175, 1568], 120, 0.35, "triangle", 0.12),
};

// =====================================================
//  HINTERGRUND-MUSIK
//  Welches Stück läuft, bestimmt der Musik-Skin (Noten stehen in skins.js).
// =====================================================

const MUSIK_LAUTSTAERKE = 0.07;

// Wandelt die Notenlisten eines Stücks in einen Fahrplan um: Achtel-Nummer -> zu spielende Noten
function baueFahrplan(stueck) {
  const fahrplan = [];
  function eintragen(liste, stimme) {
    let schritt = 0;
    for (const [note, laenge] of liste) {
      if (note) (fahrplan[schritt] = fahrplan[schritt] || []).push({ freq: frequenz(note), laenge, stimme });
      schritt += laenge;
    }
    return schritt;
  }
  const laenge = Math.max(eintragen(stueck.melodie, "spieluhr"), eintragen(stueck.bass || [], "bass"));
  return { fahrplan, laenge, achtelSek: stueck.achtelSek };
}

const musik = { laeuft: false, timer: null, bus: null, naechsteZeit: 0, schritt: 0, plan: null };

// Spieluhr-Glöckchen: Grundton + leiser, hoher Oberton, klingt lange aus
function spieluhrNote(ctx, ziel, freq, zeit) {
  for (const [faktor, lautstaerke, ausklingen] of [[1, 0.9, 1.4], [3, 0.12, 0.5], [4.2, 0.05, 0.25]]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * faktor;
    gain.gain.setValueAtTime(0.0001, zeit);
    gain.gain.exponentialRampToValueAtTime(lautstaerke, zeit + 0.005);   // schneller Anschlag
    gain.gain.exponentialRampToValueAtTime(0.0001, zeit + ausklingen);  // langes Ausklingen
    osc.connect(gain).connect(ziel);
    osc.start(zeit);
    osc.stop(zeit + ausklingen + 0.05);
  }
}

// Weicher Bass
function bassNote(ctx, ziel, freq, zeit, dauer) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, zeit);
  gain.gain.exponentialRampToValueAtTime(0.45, zeit + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, zeit + dauer);
  osc.connect(gain).connect(ziel);
  osc.start(zeit);
  osc.stop(zeit + dauer + 0.05);
}

// Plant immer die Noten der nächsten ~0,25 s im Voraus (nach der Audio-Uhr, nicht nach setTimeout –
// so bleibt der Takt exakt, auch wenn der Browser mal kurz hängt)
function planeMusikNoten() {
  const ctx = audio();
  const plan = musik.plan;
  while (musik.naechsteZeit < ctx.currentTime + 0.25) {
    for (const n of plan.fahrplan[musik.schritt] || []) {
      if (n.stimme === "spieluhr") spieluhrNote(ctx, musik.bus, n.freq, musik.naechsteZeit);
      else bassNote(ctx, musik.bus, n.freq, musik.naechsteZeit, n.laenge * plan.achtelSek * 0.9);
    }
    musik.schritt = (musik.schritt + 1) % plan.laenge;
    musik.naechsteZeit += plan.achtelSek;
  }
}

function starteMusik() {
  if (musik.laeuft) return;
  try {
    const ctx = audio();
    musik.plan = baueFahrplan(aktuellesMusikStueck());   // Musik-Skin – am Geburtstag "Happy Birthday"
    const ACHTEL_SEK = musik.plan.achtelSek;

    // "Bus" = gemeinsamer Lautstärkeregler für die Musik, mit leichtem Echo
    musik.bus = ctx.createGain();
    musik.bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    musik.bus.gain.exponentialRampToValueAtTime(MUSIK_LAUTSTAERKE, ctx.currentTime + 1.5);   // sanft einblenden

    const echo = ctx.createDelay();
    echo.delayTime.value = ACHTEL_SEK * 1.5;
    const echoLautstaerke = ctx.createGain();
    echoLautstaerke.gain.value = 0.25;
    musik.bus.connect(ctx.destination);
    musik.bus.connect(echo).connect(echoLautstaerke).connect(ctx.destination);
    echoLautstaerke.connect(echo);   // Rückkopplung: Echo vom Echo, immer leiser

    musik.schritt = 0;
    musik.naechsteZeit = ctx.currentTime + 0.1;
    musik.timer = setInterval(planeMusikNoten, 50);
    musik.laeuft = true;
  } catch (e) { /* kein Audio verfügbar */ }
}

function stoppeMusik() {
  if (!musik.laeuft) return;
  clearInterval(musik.timer);
  musik.laeuft = false;

  // Sanft ausblenden, dann vom Lautsprecher trennen (auch schon geplante Noten verstummen)
  const bus = musik.bus;
  const ctx = audio();
  bus.gain.cancelScheduledValues(ctx.currentTime);
  bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), ctx.currentTime);
  bus.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  setTimeout(() => bus.disconnect(), 500);
}
