"use strict";
// =====================================================
//  GESCHICHTENBUCH – Bildschirm (Regeln und Text: geschichte.js)
//  📖-Knopf links, Buch mit Blättern, Vorlesen (Sprachausgabe des Geräts).
// =====================================================

let buchSeite = 0;

function zeigeBuchSeite() {
  const frei = kapitelFrei();
  const seite = GESCHICHTE_SEITEN[buchSeite];
  stoppeVorlesen();
  setzeTextRoh($("buchKapitel"), buchSeite === 0 ? "Vorwort" : `Kapitel ${buchSeite} von ${GESCHICHTE.kapitelAnzahl}`);
  setzeTextRoh($("buchTitel"), seitenText(seite.titel));
  setzeTextRoh($("buchBild"), seite.bild);
  setzeTextRoh($("buchText"), seitenText(seite.text));
  merkeGelesen(buchSeite);

  $("buchZurueck").disabled = buchSeite <= 0;
  const naechsteFrei = buchSeite + 1 <= frei;
  const ende = buchSeite >= GESCHICHTE.kapitelAnzahl;
  $("buchWeiter").disabled = !naechsteFrei || ende;
  const hinweis = $("buchHinweis");
  hinweis.hidden = naechsteFrei || ende;
  setzeTextRoh(hinweis, "🔒 Das nächste Kapitel kommt, wenn am Ring um Marie ein neues Symbol erscheint. Sammle weiter!");
  zeigeBuchKnopf();
  speichern();
}

// Text ohne Ersetzungen (die Geschichte sagt "Herzen", auch wenn in der Season Blätter gesammelt werden)
function setzeTextRoh(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function oeffneBuch() {
  // dort aufschlagen, wo es Neues gibt – sonst beim zuletzt freien Kapitel
  const frei = kapitelFrei();
  buchSeite = Math.min(frei, Math.max(0, buchStand().gelesen + 1));
  zeigeBuchSeite();
  $("buchOverlay").hidden = false;
}

// ----- Vorlesen (Sprachausgabe des Geräts, wenn vorhanden) -----

function vorlesenMoeglich() {
  return typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance === "function";
}

function stoppeVorlesen() {
  if (vorlesenMoeglich()) speechSynthesis.cancel();
  setzeTextRoh($("buchVorlesen"), "🔊 Vorlesen");
}

function vorlesen() {
  if (!vorlesenMoeglich()) return;
  if (speechSynthesis.speaking) { stoppeVorlesen(); return; }
  const seite = GESCHICHTE_SEITEN[buchSeite];
  const satz = new SpeechSynthesisUtterance(`${seitenText(seite.titel)}. ${seitenText(seite.text)}`.replaceAll("∞", "unendlich"));
  satz.lang = "de-DE";
  satz.rate = 0.9;
  const stimme = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith("de"));
  if (stimme) satz.voice = stimme;
  satz.onend = () => setzeTextRoh($("buchVorlesen"), "🔊 Vorlesen");
  speechSynthesis.speak(satz);
  setzeTextRoh($("buchVorlesen"), "⏹️ Stopp");
}

// ----- Knopf und neue Kapitel -----

let buchBekanntGeprueft = false;

function zeigeBuchKnopf() {
  const neu = ungeleseneSeiten();
  $("buchBadge").hidden = neu <= 0;
  setzeTextRoh($("buchBadge"), neu > 9 ? "9+" : String(neu));
}

// 1× pro Sekunde (aus main.js): neues Kapitel frei?
function pruefeBuch() {
  const b = buchStand();
  const frei = kapitelFrei();
  if (frei > b.bekannt) {
    const neu = frei - b.bekannt;
    b.bekannt = frei;
    if (buchBekanntGeprueft) {   // nicht schon beim Start melden
      sound.stern();
      meldung(neu === 1 ? `📖 Neues Kapitel: ${seitenText(GESCHICHTE_SEITEN[frei].titel)}` : `📖 ${neu} neue Kapitel!`,
        "Tippe links auf 📖 und lies, wie die Reise weitergeht!", true);
      const knopf = $("buchBtn");
      knopf.classList.remove("feiern");
      void knopf.offsetWidth;
      knopf.classList.add("feiern");
    }
    speichern();
  }
  buchBekanntGeprueft = true;
  zeigeBuchKnopf();
}

function richteBuchEin() {
  $("buchBtn").addEventListener("click", () => { sound.klick(); oeffneBuch(); });
  $("buchZu").addEventListener("click", () => { stoppeVorlesen(); $("buchOverlay").hidden = true; sound.klick(); });
  $("buchZurueck").addEventListener("click", () => { if (buchSeite > 0) { buchSeite--; sound.klick(); zeigeBuchSeite(); } });
  $("buchWeiter").addEventListener("click", () => {
    if (buchSeite + 1 <= kapitelFrei() && buchSeite < GESCHICHTE.kapitelAnzahl) { buchSeite++; sound.klick(); zeigeBuchSeite(); }
  });
  $("buchVorlesen").hidden = !vorlesenMoeglich();
  $("buchVorlesen").addEventListener("click", vorlesen);
  // Manche Geräte laden die Stimmen erst später
  if (vorlesenMoeglich()) speechSynthesis.getVoices();
  zeigeBuchKnopf();
}
