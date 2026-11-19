"use strict";
// =====================================================
//  MARIE ERKLÄRT – beim ersten Mal ein kurzer Satz in der Sprechblase
//  Jede Erklärung kommt genau einmal (gemerkt in spiel.erklaert). Unter ⚙️ Optionen
//  kann man alle noch einmal hören. Höchstens eine Erklärung auf einmal, nie über Fenstern.
// =====================================================

const ERKLAERUNGEN = [
  { id: "buch", wann: () => true, hinweis: "buchBtn",
    text: () => "Psst! Links im 📖 Buch wartet eine Geschichte über Hannah und mich – mit einer kleinen Sternschnuppe!" },
  { id: "klickstufe", wann: () => klickStufe() >= 1, hinweis: "klickStufe",
    text: () => `Alle ${format(KLICKSTUFE.klicksProStufe)} Klicks steigt deine Klick-Stufe – dann gibt es alles doppelt! ✋` },
  { id: "neustart", wann: () => neustartMoeglich(),
    text: () => "Du kannst jetzt neu anfangen und bekommst Glitzersterne! Deine Klick-Stufe bleibt. 🌟 (Shop, ganz unten)" },
  { id: "sternenkarte", wann: () => glitzersterne() > 0, hinweis: "skillBtn",
    text: () => "Mit deinen Glitzersternen lernst du auf der Sternen-Karte 🗺️ tolle Sachen – tipp mal drauf!" },
];

const ERKLAERUNG_DAUER_MS = 7000;
let letzteErklaerung = 0;

// 1× pro Sekunde (aus main.js)
function pruefeErklaerungen() {
  const jetzt = Date.now();
  // nicht direkt nach dem Start (erst kommt die Begrüßung) und nicht mitten in einen anderen Spruch
  if (begruessungOffen || jetzt - letzteSprechblase < 4000) return;
  if (jetzt - letzteErklaerung < ERKLAERUNG_DAUER_MS + 3000 || !marieDarfSprechen()) return;
  const gesehen = spiel.erklaert || [];
  const e = ERKLAERUNGEN.find(x => !gesehen.includes(x.id) && x.wann());
  if (!e) return;
  spiel.erklaert = [...gesehen, e.id];
  letzteErklaerung = jetzt;
  letzteSprechblase = jetzt;   // andere Sprüche warten, bis Marie fertig ist
  marieSagt(e.text(), ERKLAERUNG_DAUER_MS);
  // Das, worum es geht, kurz aufleuchten lassen
  const ziel = e.hinweis && $(e.hinweis);
  if (ziel && !ziel.hidden) {
    ziel.classList.remove("feiern");
    void ziel.offsetWidth;
    ziel.classList.add("feiern");
  }
  speichern();
}

function erklaerungenZuruecksetzen() {
  spiel.erklaert = [];
  letzteErklaerung = 0;
  speichern();
}
