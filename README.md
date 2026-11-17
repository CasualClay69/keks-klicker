# 💖 Marie Clicker

Ein Klickspiel im Browser: Klick auf Marie und sammle Herzen! Reines HTML, CSS und JavaScript, ohne Frameworks.

## Funktionen

- Marie anklicken, Herzen sammeln (sie blinzelt und freut sich über jeden Klick)
- Multitouch: auf dem Handy zählt jeder Finger einzeln
- 7 Herzschenker – von der besten Freundin bis zum Regenbogen – mit je 4 Upgrade-Stufen
- Kaufmodi x1 / x10 / x100 / bis zum nächsten Upgrade
- Sternschnuppen mit zufälligen Boni
- 22 Erfolge (je +1 % Herzen)
- Tagesaufgaben 📋: jeden Tag 3 neue Aufgaben mit Herzen und Season-Pass-Fortschritt als Belohnung
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

## Spielstand sichern

Unter **📊 Statistik → 💾 Spielstand sichern**:

- **📋 Code kopieren** bzw. **💾 Als Datei speichern** – erzeugt einen Code `MARIE1:<Inhalt>:<Prüfsumme>`
- **📥 Code laden** bzw. **📂 Datei auswählen** – stellt den Spielstand wieder her (mit Sicherheitsfrage)
- Die Prüfsumme erkennt abgeschnittene oder falsch kopierte Codes
- Skins und Season-Fortschritt werden beim Wiederherstellen zusammengeführt – es geht nichts verloren
- Nach 7 Tagen ohne Sicherung erscheint ein orangefarbener Hinweis

## Online-Bestenliste 🏅

- Eine gemeinsame Liste für alle Spieler: Spitzname eingeben, „Mitmachen“ – fertig
  (intern immer die Gruppe `BESTENLISTE.gruppe` = `marie-clicker`)
- Gespeichert werden nur Spitzname, Herzen insgesamt, Herzen/Sek., Season-Stufe und Anzahl Erfolge
- Server: [Supabase](https://supabase.com) – Datenbank-Regeln in `supabase/bestenliste.sql`
- Einrichtung: SQL im Supabase-„SQL Editor“ ausführen, dann Projekt-URL und öffentlichen Schlüssel
  in `js/bestenliste.js` (`BESTENLISTE.url` / `BESTENLISTE.schluessel`) eintragen.
  Solange beides leer ist, ist die Bestenliste unsichtbar.

## Skins & Season-Pässe

Am Anfang ist pro Kategorie nur der normale Skin freigeschaltet. Freigeschaltete Skins werden
getrennt vom Spielstand gespeichert (`marieClicker-skins`) und bleiben beim „Spielstand löschen“ erhalten.

Neuen Skin hinzufügen:

1. In `js/skins.js` einen Eintrag in `SKINS` anlegen, mit `season: "<Pass-ID>"`
   - **Hintergrund:** `wert` + CSS-Regeln für `body[data-hintergrund="<wert>"]` in `css/style.css`
   - **Hut:** SVG-Code in `svg`
   - **HUD:** CSS-Farbvariablen in `farben`, Symbole in `symbole`
   - **Logo:** `krone`, `deko`, `funkeln` und Farben (`--logo-skin-*`, `--logo-schild-*`, `--logo-funkeln`)
   - **Musik:** Noten in `musik` (Aufbau wie `SPIELUHR`)
2. Den Season-Pass in `SEASON_PAESSE` eintragen (bzw. die Skin-ID dort ergänzen)
3. In `js/version.js` die Versionsnummer erhöhen

Freischalten per Code: `schalteSeasonFrei("<Pass-ID>")`.

### Season 1: Thanksgiving 🦃 (1.–30. November 2026)

- Erreichbar über das 🦃-Symbol oben rechts (nur sichtbar, solange die Season läuft)
- 50 Stufen, aufsteigen durch Klicks auf Marie: Stufe n braucht `670 + 30·n` Klicks,
  zusammen ~71.750 Klicks ≈ 10 Stunden bei 2 Klicks/Sekunde
- Herz-Belohnungen wachsen mit dem Fortschritt: Produktion von (5,5 + 0,5·n) Minuten + Wert von (100 + 10·n) Klicks,
  mindestens 50·n² (gilt für alle Seasons, siehe `seasonHerzen` in `js/skins.js`)
- Belohnungen: Herzen auf jeder Stufe, dazu
  🎩 Pilgerhut (Stufe 10), 🎻 Erntedank-Walzer (20), 🍂 Herbstlaub-HUD (30), 🦃 Erntedank-Logo (40), 🍁 Blätterregen (50, animiert)
- Fortschritt und Skins bleiben auch nach dem Season-Ende und beim „Spielstand löschen“ erhalten

### Season 2: Weihnachten 🎅 (1.–31. Dezember 2026)

- Startet automatisch, wenn Season 1 endet; gleiche Regeln (50 Stufen, ~10 Stunden)
- Skins: 🎅 Weihnachtsmütze (Stufe 10), 🔔 Glöckchen-Melodie (20), 🎄 Winterzauber-HUD (30), 🎄 Weihnachts-Logo (40), ❄️ Schneefall (50, animiert)
- Jede Season hat eigene Farben für die Season-Seite (`design` in `SEASON_PAESSE`)

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenstruktur, Marie als SVG-Zeichnung |
| `js/daten.js` | Herzschenker, Upgrades, Erfolge und alle Balancing-Werte |
| `js/skins.js` | Skins, Season-Pässe und Musikstücke (Anleitung für neue Skins oben in der Datei) |
| `js/hilfen.js` | Zahlen formatieren, Zufall |
| `js/zustand.js` | Spielstand, Speichern und Laden |
| `js/logik.js` | Berechnungen und Käufe |
| `js/sicherung.js` | Spielstand als Code sichern und wiederherstellen |
| `js/aufgaben.js` | Tagesaufgaben: Vorrat (`AUFGABEN_VORLAGEN`), Fortschritt, Belohnungen |
| `js/bestenliste.js` | Online-Bestenliste (Supabase-Verbindung) |
| `supabase/bestenliste.sql` | Datenbank-Tabelle und -Funktionen für die Bestenliste |
| `js/sound.js` | Klänge und Musik-Abspieler (Web Audio API) |
| `js/anzeige.js` | HTML erzeugen und aktualisieren |
| `js/main.js` | Verbindet alles und startet das Spiel |
| `css/style.css` | Aussehen (Farben ganz oben als Variablen) |
| `manifest.webmanifest` | App-Name, Symbole, Farben (PWA) |
| `js/version.js` | Versionsnummer (wird unter dem Logo angezeigt) – bei jeder Änderung hochzählen |
| `sw.js` | Service Worker: Offline-Cache, liest die Version aus `js/version.js`. Bei neuen Dateien `DATEIEN` ergänzen |
| `icons/` | App-Symbole |
