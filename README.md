# 💖 Marie Clicker

Ein Klickspiel im Browser: Klick auf Marie und sammle Herzen! Reines HTML, CSS und JavaScript, ohne Frameworks.

## Funktionen

- Marie anklicken, Herzen sammeln (sie blinzelt und freut sich über jeden Klick)
- Multitouch: auf dem Handy zählt jeder Finger einzeln
- 7 Herzschenker – von der besten Freundin bis zum Regenbogen – mit je 4 Upgrade-Stufen
- Kaufmodi x1 / x10 / x100 / bis zum nächsten Upgrade
- Sternschnuppen mit zufälligen Boni
- 20 Erfolge (je +1 % Herzen)
- Statistik, Soundeffekte, automatisches Speichern
- Süße Spieluhr-Hintergrundmelodie (im Browser erzeugt, ein-/ausschaltbar mit 🎵)
- Skins für Hintergrund, Maries Hut, HUD-Farben und Musik – neue Skins kommen mit Season-Pässen
- Responsive für Handy, Tablet und Desktop
- Als App installierbar (PWA) und offline spielbar

## Spielen

Online: **https://casualclay69.github.io/keks-klicker/**

Oder lokal `index.html` im Browser öffnen (dann ohne App-Installation/Offline-Modus).

### Als App installieren

- **Android / Chrome / Edge:** Knopf „📲 Installieren“ oben rechts, oder Browsermenü → „App installieren“
- **iPhone / iPad (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“

## Skins & Season-Pässe

Am Anfang ist pro Kategorie nur der normale Skin freigeschaltet. Freigeschaltete Skins werden
getrennt vom Spielstand gespeichert (`marieClicker-skins`) und bleiben beim „Spielstand löschen“ erhalten.

Neuen Skin hinzufügen:

1. In `js/skins.js` einen Eintrag in `SKINS` anlegen, mit `season: "<Pass-ID>"`
   - **Hintergrund:** `wert` + CSS-Regeln für `body[data-hintergrund="<wert>"]` in `css/style.css`
   - **Hut:** SVG-Code in `svg`
   - **HUD:** CSS-Farbvariablen in `farben`
   - **Musik:** Noten in `musik` (Aufbau wie `SPIELUHR`)
2. Den Season-Pass in `SEASON_PAESSE` eintragen (bzw. die Skin-ID dort ergänzen)
3. In `sw.js` die `VERSION` erhöhen

Freischalten per Code: `schalteSeasonFrei("<Pass-ID>")`.

### Season 1: Thanksgiving 🦃 (1.–30. November 2026)

- Erreichbar über das 🦃-Symbol oben rechts (nur sichtbar, solange die Season läuft)
- 50 Stufen, aufsteigen durch Klicks auf Marie: Stufe n braucht `2000 + 90·n` Klicks,
  zusammen ~215.000 Klicks ≈ 30 Stunden bei 2 Klicks/Sekunde
- Belohnungen: Herzen auf jeder Stufe, dazu
  🎩 Pilgerhut (Stufe 10), 🎻 Erntedank-Walzer (20), 🍂 Herbstlaub-HUD (30), 🍁 Blätterregen (50, animiert)
- Fortschritt und Skins bleiben auch nach dem Season-Ende und beim „Spielstand löschen“ erhalten

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenstruktur, Marie als SVG-Zeichnung |
| `js/daten.js` | Herzschenker, Upgrades, Erfolge und alle Balancing-Werte |
| `js/skins.js` | Skins, Season-Pässe und Musikstücke (Anleitung für neue Skins oben in der Datei) |
| `js/hilfen.js` | Zahlen formatieren, Zufall |
| `js/zustand.js` | Spielstand, Speichern und Laden |
| `js/logik.js` | Berechnungen und Käufe |
| `js/sound.js` | Klänge und Musik-Abspieler (Web Audio API) |
| `js/anzeige.js` | HTML erzeugen und aktualisieren |
| `js/main.js` | Verbindet alles und startet das Spiel |
| `css/style.css` | Aussehen (Farben ganz oben als Variablen) |
| `manifest.webmanifest` | App-Name, Symbole, Farben (PWA) |
| `sw.js` | Service Worker: Offline-Cache. Bei neuen Dateien `DATEIEN` und `VERSION` anpassen |
| `icons/` | App-Symbole |
