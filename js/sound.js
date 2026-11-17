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
//  HINTERGRUND-MUSIK: eine kleine Spieluhr-Melodie
//
//  Noten als [Name, Länge in Achteln]. null = Pause. Jeder Takt = 8 Achtel.
//  Akkorde: C – Am – F – G | C – Am – F/G – C
// =====================================================

const MELODIE = [
  ["E5", 1], ["G5", 1], ["C6", 2], ["G5", 1], ["E5", 1], ["G5", 2],   // C
  ["A5", 1], ["C6", 1], ["E5", 2], ["A5", 2], ["G5", 2],              // Am
  ["F5", 1], ["A5", 1], ["C6", 2], ["A5", 1], ["F5", 1], ["A5", 2],   // F
  ["G5", 2], ["B5", 1], ["D6", 1], ["B5", 2], ["G5", 2],              // G
  ["E5", 1], ["G5", 1], ["C6", 2], ["D6", 1], ["C6", 1], ["B5", 1], ["A5", 1],   // C
  ["A5", 2], ["E5", 2], ["C6", 2], ["A5", 2],                         // Am
  ["F5", 1], ["A5", 1], ["C6", 1], ["A5", 1], ["G5", 1], ["B5", 1], ["D6", 1], ["B5", 1],   // F – G
  ["C6", 4], ["G5", 2], [null, 2],                                    // C
];

// Bass: Grundton und Quinte, je eine Viertelnote (2 Achtel) mit Pause dazwischen
const BASS = [
  ["C3", 4], ["G3", 4],
  ["A2", 4], ["E3", 4],
  ["F2", 4], ["C3", 4],
  ["G2", 4], ["D3", 4],
  ["C3", 4], ["G3", 4],
  ["A2", 4], ["E3", 4],
  ["F2", 4], ["G2", 4],
  ["C3", 4], ["C3", 4],
];

const ACHTEL_SEK = 0.27;      // Tempo: Länge einer Achtelnote
const MUSIK_LAUTSTAERKE = 0.07;

// Wandelt die Notenlisten in einen Fahrplan um: Achtel-Nummer -> zu spielende Noten
function baueFahrplan() {
  const fahrplan = [];
  function eintragen(liste, stimme) {
    let schritt = 0;
    for (const [note, laenge] of liste) {
      if (note) (fahrplan[schritt] = fahrplan[schritt] || []).push({ freq: frequenz(note), laenge, stimme });
      schritt += laenge;
    }
    return schritt;
  }
  const laenge = eintragen(MELODIE, "spieluhr");
  eintragen(BASS, "bass");
  return { fahrplan, laenge };
}
const { fahrplan: MUSIK_FAHRPLAN, laenge: MUSIK_SCHRITTE } = baueFahrplan();

const musik = { laeuft: false, timer: null, bus: null, naechsteZeit: 0, schritt: 0 };

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
  while (musik.naechsteZeit < ctx.currentTime + 0.25) {
    for (const n of MUSIK_FAHRPLAN[musik.schritt] || []) {
      if (n.stimme === "spieluhr") spieluhrNote(ctx, musik.bus, n.freq, musik.naechsteZeit);
      else bassNote(ctx, musik.bus, n.freq, musik.naechsteZeit, n.laenge * ACHTEL_SEK * 0.9);
    }
    musik.schritt = (musik.schritt + 1) % MUSIK_SCHRITTE;
    musik.naechsteZeit += ACHTEL_SEK;
  }
}

function starteMusik() {
  if (musik.laeuft) return;
  try {
    const ctx = audio();

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
