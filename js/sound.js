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

const sound = {
  klick:  () => spieleTon(500 + Math.random() * 200, 0.08, "triangle", 0.15, 250),
  kauf:   () => spieleMelodie([523, 784], 70, 0.12, "square", 0.05),
  fehler: () => spieleTon(140, 0.15, "sawtooth", 0.05),
  gold:   () => spieleMelodie([880, 1109, 1319, 1760], 70, 0.25, "sine", 0.12),
  erfolg: () => spieleMelodie([523, 659, 784, 1047], 110, 0.3, "triangle", 0.12),
};
