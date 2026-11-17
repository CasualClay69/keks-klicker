# 💖 Marie Clicker

Ein Klickspiel im Browser: Klick auf Marie und sammle Herzen! Reines HTML, CSS und JavaScript, ohne Frameworks.

## Funktionen

- Marie anklicken, Herzen sammeln (sie blinzelt und freut sich über jeden Klick)
- 7 Herzschenker – von der besten Freundin bis zum Regenbogen – mit je 4 Upgrade-Stufen
- Kaufmodi x1 / x10 / x100 / bis zum nächsten Upgrade
- Sternschnuppen mit zufälligen Boni
- 19 Erfolge (je +1 % Herzen)
- Statistik, Soundeffekte, automatisches Speichern
- Responsive für Handy, Tablet und Desktop
- Als App installierbar (PWA) und offline spielbar

## Spielen

Online: **https://casualclay69.github.io/keks-klicker/**

Oder lokal `index.html` im Browser öffnen (dann ohne App-Installation/Offline-Modus).

### Als App installieren

- **Android / Chrome / Edge:** Knopf „📲 Installieren“ oben rechts, oder Browsermenü → „App installieren“
- **iPhone / iPad (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenstruktur, Marie als SVG-Zeichnung |
| `js/daten.js` | Herzschenker, Upgrades, Erfolge und alle Balancing-Werte |
| `js/hilfen.js` | Zahlen formatieren, Zufall |
| `js/zustand.js` | Spielstand, Speichern und Laden |
| `js/logik.js` | Berechnungen und Käufe |
| `js/sound.js` | Töne (Web Audio API) |
| `js/anzeige.js` | HTML erzeugen und aktualisieren |
| `js/main.js` | Verbindet alles und startet das Spiel |
| `css/style.css` | Aussehen (Farben ganz oben als Variablen) |
| `manifest.webmanifest` | App-Name, Symbole, Farben (PWA) |
| `sw.js` | Service Worker: Offline-Cache. Bei neuen Dateien `DATEIEN` und `VERSION` anpassen |
| `icons/` | App-Symbole |
