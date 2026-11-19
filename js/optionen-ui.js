"use strict";
// =====================================================
//  OPTIONEN ⚙️
//  Zurzeit: Wie sollen große Zahlen aussehen? (Regeln und Speicher: hilfen.js)
//  Weitere Einstellungen können hier später dazukommen.
// =====================================================

const ZAHLEN_WAHL = [
  { art: "worte", icon: "🔤", name: "Wörter" },
  { art: "kurz",  icon: "✂️", name: "Kurz" },
  { art: "wiss",  icon: "🔬", name: "Wissenschaftlich" },
];

// Beispiel mit dem eigenen Guthaben (mind. 1,5 Millionen, damit man den Unterschied sieht)
function zahlenBeispiel(art) {
  const vorher = zahlenArt;
  zahlenArt = art;   // nur kurz zum Ausprobieren
  const zahl = Math.max(1.5e6, spiel.herzen);
  const text = `${format(zahl)} · ${format(2.5e9)} · ${format(4e12)}`;
  zahlenArt = vorher;
  return text;
}

function zeigeOptionen() {
  const wahl = $("zahlenWahl");
  wahl.textContent = "";
  for (const z of ZAHLEN_WAHL) {
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.setAttribute("role", "radio");
    knopf.setAttribute("aria-checked", String(zahlenArt === z.art));
    knopf.classList.toggle("aktiv", zahlenArt === z.art);
    knopf.append(span("icon", z.icon), span("name", z.name), span("haken", zahlenArt === z.art ? "✓" : ""),
      span("beispiel", zahlenBeispiel(z.art)));
    knopf.addEventListener("click", () => {
      setzeZahlenArt(z.art);
      sound.klick();
      zeigeOptionen();
      aktualisiereAnzeige();
    });
    wahl.append(knopf);
  }
}

function richteOptionenEin() {
  $("optionenBtn").addEventListener("click", () => {
    sound.klick();
    zeigeOptionen();
    $("optionenOverlay").hidden = false;
  });
  const schliessen = () => { $("optionenOverlay").hidden = true; };
  $("erklaerungenNochmal").addEventListener("click", () => {
    erklaerungenZuruecksetzen();
    sound.klick();
    schliessen();
    meldung("💬 Gleich erklärt Marie alles nochmal", "Hör gut zu!");
  });
  $("optionenZu").addEventListener("click", () => { sound.klick(); schliessen(); });
  $("optionenOverlay").addEventListener("click", e => { if (e.target.id === "optionenOverlay") schliessen(); });
}
