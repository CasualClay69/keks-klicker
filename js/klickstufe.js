"use strict";
// =====================================================
//  KLICK-STUFE ✋ – der große Motor des Spiels
//  Alle KLICKSTUFE.klicksProStufe ECHTEN Klicks (jeder Finger zählt) steigt die Klick-Stufe,
//  und ALLES bringt doppelt so viel: Klicks und Helfer. Das bleibt für immer (auch beim Neustart).
//  Roboter-Klicks zählen nicht – so hängt das Tempo wirklich davon ab, wie viel man selbst klickt.
//
//  Balancing (siehe auch neustart.js und skills.js), geprüft mit einer Simulation:
//  Bei 3 Stunden am Tag erreicht man ∞ (10³⁰⁸) mit 6 Fingern nach etwa 3 Monaten,
//  mit 2 Fingern nach etwa 9 Monaten. Angenommen: 2 Tipps pro Finger und Sekunde,
//  zwei Drittel der Spielzeit wird getippt (der Rest: Shop, Album, Minispiele …).
//
//  Zählt spiel.klicks (steht schon im Spielstand). Diese Datei fasst das HTML nicht an.
// =====================================================

const KLICKSTUFE = {
  klicksProStufe: 8000,   // wird per Simulation eingestellt
};

function klickStufe() {
  return Math.floor((spiel.klicks || 0) / KLICKSTUFE.klicksProStufe);
}

// ×2 pro Stufe (gedeckelt, damit nie "Infinity" entsteht)
function klickStufeFaktor() {
  return Math.min(Number.MAX_VALUE, Math.pow(2, klickStufe()));
}

function klicksBisNaechsteStufe() {
  return KLICKSTUFE.klicksProStufe - ((spiel.klicks || 0) % KLICKSTUFE.klicksProStufe);
}

function klickStufeAnteil() {
  return ((spiel.klicks || 0) % KLICKSTUFE.klicksProStufe) / KLICKSTUFE.klicksProStufe;
}
