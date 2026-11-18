# 💖 Marie Clicker

Ein Klickspiel im Browser: Klick auf Marie und sammle Herzen! Reines HTML, CSS und JavaScript, ohne Frameworks.

## Funktionen

- Marie anklicken, Herzen sammeln (sie blinzelt und freut sich über jeden Klick)
- Multitouch: auf dem Handy zählt jeder Finger einzeln
- 12 Herzschenker – von der besten Freundin bis zum 👑 Herzkönigreich – mit je 4 Upgrade-Stufen
  (im Shop sieht man immer nur die eigenen plus die nächsten zwei)
- Neustart mit Bonus 🌟: Wer alle Herzschenker hat, kann neu anfangen und bekommt Glitzersterne
  (je +10 % Herzen für immer). Erfolge, Skins, Sticker, Haustier und Season-Pass bleiben (`js/neustart.js`)
- Kaufmodi x1 / x10 / x100 / bis zum nächsten Upgrade
- Sternschnuppen mit zufälligen Boni
- Season-Währung 🍂: Während einer Season sammelt man statt Herzen etwas Passendes (Blätter, Plätzchen,
  Schneeflocken, Liebesbriefe, Ostereier, Blüten, Muscheln, Bonbons – `SEASON_WAEHRUNG` in `js/skins.js`).
  Es bleibt derselbe Zähler, nur Symbol und Wort wechseln. Idee: Selina
- Zwei Figuren 👧: unter Skins → „Wer wird geklickt?“ zwischen Marie (7, hellbraune Haare) und
  Hannah (5, blonde Haare) wechseln. Logo und Texte passen sich an (`figur` in `js/skins.js`)
- Zimmer 🏠: Maries bzw. Hannahs Zimmer mit 11 Plätzen (Wand, Boden, Fenster, Bett, Lampe …) und 67 Teilen
  zum Kaufen mit Herzen. Jedes Teil bringt +1 % Herzen. Jeder Season-Pass bringt auf Stufe 15 und 45 ein
  Zimmer-Teil zum Thema (`js/zimmer.js`)
- Kleiderschrank 👗: Kleider, Frisuren und Haarfarben als Skins (`js/kleiderschrank.js`). Jeder Season-Pass
  bringt auf Stufe 25 ein Kleid und auf Stufe 35 eine Frisur oder Haarfarbe (z. B. Weihnachtskleid, Zwei Zöpfe)
- Minispiele 🎮 (`js/minispiele.js` Regeln, `js/spielhalle.js` Spiele): Sticker-Memory mit den eigenen Stickern,
  „Finde Marie/Hannah“ zwischen Doppelgängerinnen (5 Runden auf Zeit) und Leckerli-Fangen mit dem Haustier
  (macht es satt). Belohnung wie beim Herzregen, pro Spiel 5-mal am Tag voll, danach 20 %
- 45 Erfolge (je +1 % Herzen)
- Offline-Fortschritt 🌙: Die Herzschenker sammeln weiter, während die App zu ist (bis zu 8 Stunden,
  einstellbar in `KONFIG.offline`). Beim Zurückkommen zeigt ein Willkommen-Fenster die Ausbeute
- Herzregen 💖: alle 6–12 Minuten fallen 20 Sekunden lang Herzen – antippen und Bonus kassieren;
  in den Seasons passend zum Thema (🍂 Blätterregen, ❄️ Schneegestöber – siehe `regen` in `SEASON_PAESSE`)
- Geburtstag 🎂 (Marie am 3. Februar, Hannah am 8. Februar – gefeiert wird die gewählte Figur): Konfetti-Regen, Partyhut, „Happy Birthday“ als Musik und ein großes
  Geschenk mit Partyhut und Melodie als dauerhaften Skins (Daten in `GEBURTSTAG.termine` in `js/geburtstag.js`)
- Marie spricht 💬: Sprechblasen beim Klicken, bei Sternschnuppen, Erfolgen, Begrüßung nach Tageszeit
  und „Mir ist langweilig…“, wenn 45 Sekunden niemand klickt (Sprüche in `js/sprechen.js`)
- Haustiere 🐾: Kätzchen (grau-weiß, selbst gezeichnet), Häschen, Hündchen oder Einhorn-Baby – füttern, streicheln,
  wächst von Baby über Kind und Groß bis Prächtig (Level 50); satt gibt es +1 % Herzen pro Level, hungrig schläft es nur.
  Ab Level 50 darf ein zweites Tier einziehen (links neben der Figur).
  Zubehör: Halsbänder, Schleifen, Körbchen (mit Herzen kaufen). Unter Skins → Reiter „🐾 Tiere“ Tierart und Zubehör wählen.
  Season-Pass: Stufe 5 = Zubehör zum Thema, Stufe 33 = neue Tierart (Truthahn, Rentier, Pinguin, Kuschelbär, Küken,
  Igel, Schildkröte, Fledermaus)
- Sticker-Album 📒: 60 Sticker auf 5 Seiten (Tiere, Blumen, Süßes, Meer, Fantasie), normal/selten/super-selten,
  dazu pro Season eine eigene Sticker-Seite, die nur während der Season sammelbar ist (🦃 Thanksgiving, 🎅 Weihnachten)
- Glücksrad 🎡: einmal am Tag drehen – Herzen, Boni, Sternschnuppe, Season-Punkte oder Jackpot
- Tägliches Geschenk 🎁: wächst mit jedem Tag hintereinander (Tag 1–7, ab Tag 7 jeden Tag das große Geschenk)
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
- Admin-Menü 🛠️ (versteckt: Logo 10 Sekunden gedrückt halten, dann PIN): Ereignisse auslösen, Belohnungs-Codes
  erstellen (Kinder lösen sie unter Statistik ein), Nachricht an alle, Umfragen, Bestenliste moderieren.
  Datenbank: `supabase/verwaltung.sql` einmal ausführen, danach die PIN separat setzen:
  `select public.admin_pin_setzen('…');` – die PIN gehört NIE in eine Datei im Repository
- Wochen-Wettbewerb 📅: In der Bestenliste umschalten zwischen „Gesamt“ und „Diese Woche“. Wer von Montag 0 Uhr
  bis Sonntag 24 Uhr (deutsche Zeit) die meisten Herzen sammelt, bekommt eine Woche lang einen goldenen 👑-Rahmen.
  Die Wochenwerte rechnet die Datenbank aus – nach einem Update von `supabase/bestenliste.sql` diese Datei
  einmal neu im Supabase-Dashboard (SQL Editor → Run) ausführen
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
3. Optional: eine Season-Sticker-Seite in `STICKER_SEITEN` (`js/album.js`) mit `season: "<Pass-ID>"` anlegen
4. In `js/version.js` die Versionsnummer erhöhen

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

### Jahres-Kalender 2027 (Seasons 3–8, in `js/seasons.js`)

| Zeitraum | Season | Hut | Melodie | Hintergrund | Regen |
|---|---|---|---|---|---|
| Januar | ⛸️ Winterwunderland | Eis-Diadem | Eisprinzessin-Walzer | Glitzerfrost | Glitzerfrost |
| Februar | 💝 Valentinstag | Herz-Haarreif | Herzklopfen | Herzballons | Herzchenregen |
| März–April | 🐰 Ostern | Hasenohren | Hüpf-Häschen | Osterwiese | Eiersuche |
| Mai–Juni | 🦄 Einhornwiese | Blumenkranz | Einhornwiese | Schmetterlingswiese | Blütenregen |
| Juli–August | 🏖️ Sommer & Meer | Sonnenhut | Sommerferien | Unterwasserwelt | Sommerregen |
| Oktober | 🎃 Halloween | Hexenhut | Gespensterchen | Gespensternacht | Süßigkeitenregen |

Jede Season ist ein Datenblock (`registriereSeason({...})`), daraus entstehen automatisch 5 Skins, Season-Pass,
Logo-Banner und Sticker-Seite. Noch offen: September, November und Dezember 2027.

### Season 2: Weihnachten 🎅 (1.–31. Dezember 2026)

- Startet automatisch, wenn Season 1 endet; gleiche Regeln (50 Stufen, ~10 Stunden)
- Skins: 🎅 Weihnachtsmütze (Stufe 10), 🔔 Glöckchen-Melodie (20), 🎄 Winterzauber-HUD (30), 🎄 Weihnachts-Logo (40), ❄️ Schneefall (50, animiert)
- Jede Season hat eigene Farben für die Season-Seite (`design` in `SEASON_PAESSE`)

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenstruktur, Marie als SVG-Zeichnung |
| `js/daten.js` | Herzschenker, Upgrades, Erfolge und alle Balancing-Werte |
| `js/skins.js` | Skins, Season-Pässe 1–2 und Musikstücke (Anleitung für neue Skins oben in der Datei) |
| `js/seasons.js` | Jahres-Kalender 2027: Seasons 3–8 als Datenblöcke (Hüte, Melodien, Farben, Sticker, Logos) |
| `js/hilfen.js` | Zahlen formatieren, Zufall |
| `js/zustand.js` | Spielstand, Speichern und Laden |
| `js/logik.js` | Berechnungen und Käufe |
| `js/sicherung.js` | Spielstand als Code sichern und wiederherstellen |
| `js/aufgaben.js` | Tagesaufgaben: Vorrat (`AUFGABEN_VORLAGEN`), Fortschritt, Belohnungen |
| `js/geschenk.js` | Tägliches Geschenk mit Serie (`GESCHENK_FAKTOREN`, `GESCHENK_SEASON_PUNKTE`) |
| `js/gluecksrad.js` | Glücksrad: Felder, Gewinnchancen (`GLUECKSRAD_FELDER`) |
| `js/album.js` | Sticker-Album: Seiten und Sticker (`STICKER_SEITEN`), Seltenheiten, Chancen (`STICKER_CHANCE`) |
| `js/haustier.js` | Haustiere: Arten (`HAUSTIER_ARTEN`, inkl. Katzen-SVG und Season-Tiere), Zubehör (`TIER_ZUBEHOER`), Stufen, Hunger, Futter, Erfahrung, zweites Tier |
| `js/bestenliste.js` | Online-Bestenliste (Supabase-Verbindung) |
| `supabase/bestenliste.sql` | Datenbank-Tabelle und -Funktionen für die Bestenliste |
| `js/sound.js` | Klänge und Musik-Abspieler (Web Audio API) |
| `js/anzeige.js` | HTML erzeugen und aktualisieren |
| `js/main.js` | Verbindet alles und startet das Spiel |
| `css/style.css` | Aussehen (Farben ganz oben als Variablen) |
| `manifest.webmanifest` | App-Name, Symbole, Farben (PWA) |
| `js/version.js` | Versionsnummer (`APP_VERSION`) und Kurzbeschreibung (`APP_NEU`) – bei jeder Änderung hochzählen. Spieler mit älterer Version sehen dann ein „Neue Version verfügbar“-Fenster |
| `sw.js` | Service Worker: Offline-Cache, liest die Version aus `js/version.js`. Bei neuen Dateien `DATEIEN` ergänzen |
| `icons/` | App-Symbole |
