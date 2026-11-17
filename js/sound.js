"use strict";
// =====================================================
//  SOUNDS – mit der Web Audio API erzeugt, keine Dateien nötig
// =====================================================

let audioKontext = null;

// Spielt einen Ton: Frequenz (Hz), Dauer (s), Wellenform, Lautstärke, optional Endfrequenz
function spieleTon(freq, dauer, typ = "sine", lautstaerke = 0.15, freqEnde = null) {
  if (!spiel.tonAn) return;
  try {
    audioKontext = audioKontext || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioKontext.currentTime;
    const oszillator = audioKontext.createOscillator();
    const verstaerker = audioKontext.createGain();

    oszillator.type = typ;
    oszillator.frequency.setValueAtTime(freq, t);
    if (freqEnde) oszillator.frequency.exponentialRampToValueAtTime(freqEnde, t + dauer);

    verstaerker.gain.setValueAtTime(lautstaerke, t);
    verstaerker.gain.exponentialRampToValueAtTime(0.001, t + dauer);   // ausblenden

    oszillator.connect(verstaerker).connect(audioKontext.destination);
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
