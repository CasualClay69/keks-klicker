# 🍪 Keks-Klicker

Ein kleines Klickspiel im Browser – reines HTML, CSS und JavaScript, ohne Frameworks.

## Funktionen

- Keks anklicken, Kekse sammeln
- 7 Gebäude, die automatisch backen, mit je 4 Upgrade-Stufen
- Kaufmodi x1 / x10 / x100 / bis zum nächsten Upgrade
- Goldener Keks mit zufälligen Boni
- 19 Erfolge (je +1 % Produktion)
- Statistik, Soundeffekte, automatisches Speichern
- Responsive für Handy, Tablet und Desktop

## Spielen

`index.html` im Browser öffnen – fertig.

## Aufbau

| Datei | Inhalt |
|---|---|
| `js/daten.js` | Gebäude, Upgrades, Erfolge und alle Balancing-Werte |
| `js/hilfen.js` | Zahlen formatieren, Zufall |
| `js/zustand.js` | Spielstand, Speichern und Laden |
| `js/logik.js` | Berechnungen und Käufe |
| `js/sound.js` | Töne (Web Audio API) |
| `js/anzeige.js` | HTML erzeugen und aktualisieren |
| `js/main.js` | Verbindet alles und startet das Spiel |
| `css/style.css` | Aussehen |
