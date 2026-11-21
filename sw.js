"use strict";
// =====================================================
//  SERVICE WORKER – macht das Spiel offline spielbar
//
//  Strategie "stale-while-revalidate":
//  1. Datei sofort aus dem Speicher (Cache) liefern → startet blitzschnell, auch offline
//  2. Gleichzeitig im Hintergrund die neueste Version laden und den Cache aktualisieren
//  → Änderungen, die du hochlädst, sind beim ÜBERNÄCHSTEN Öffnen da.
//  Im Hintergrund wird immer beim Server nachgefragt (cache: "no-cache"), nie aus dem
//  Browser-Zwischenspeicher genommen – sonst könnten alte und neue Dateien gemischt werden.
//
//  Wenn du Dateien hinzufügst oder umbenennst: in DATEIEN eintragen.
//  Die Versionsnummer steht in js/version.js – dort hochzählen,
//  damit der alte Cache gelöscht wird.
// =====================================================

importScripts("js/version.js");   // liefert APP_VERSION
const CACHE = "marie-clicker-v" + APP_VERSION;

const DATEIEN = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/version.js",
  "js/splash.js",
  "js/versionen.js",
  "js/daten.js",
  "js/skins.js",
  "js/kleiderschrank.js",
  "js/zimmer.js",
  "js/hilfen.js",
  "js/zustand.js",
  "js/logik.js",
  "js/neustart.js",
  "js/klickstufe.js",
  "js/skills.js",
  "js/sicherung.js",
  "js/aufgaben.js",
  "js/wochenmissionen.js",
  "js/geschenk.js",
  "js/gluecksrad.js",
  "js/album.js",
  "js/seasons.js",
  "js/haustier.js",
  "js/seasonjahre.js",
  "js/ausfluege.js",
  "js/garten.js",
  "js/backstube.js",
  "js/monster.js",
  "js/sprechen.js",
  "js/geburtstag.js",
  "js/feiertage.js",
  "js/advent.js",
  "js/unendlich.js",
  "js/geschichte.js",
  "js/wunder.js",
  "js/herzregen.js",
  "js/minispiele.js",
  "js/bestenliste.js",
  "js/stickerpost.js",
  "js/besuch.js",
  "js/verwaltung.js",
  "js/sound.js",
  "js/anzeige.js",
  "js/spielhalle.js",
  "js/verwaltung-ui.js",
  "js/lauftext.js",
  "js/feiertage-ui.js",
  "js/erklaerungen.js",
  "js/optionen-ui.js",
  "js/advent-ui.js",
  "js/unendlich-ui.js",
  "js/geschichte-ui.js",
  "js/garten-ui.js",
  "js/monster-ui.js",
  "js/skills-ui.js",
  "js/ausfluege-ui.js",
  "js/wunder-ui.js",
  "js/stickerpost-ui.js",
  "js/besuch-ui.js",
  "js/admin-automatik.js",
  "js/main.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];

// Installation: alle Dateien vorab in den Cache laden
self.addEventListener("install", ereignis => {
  ereignis.waitUntil(
    caches.open(CACHE)
      // cache: "reload" = am Browser-Zwischenspeicher vorbei direkt vom Server holen,
      // sonst landet evtl. eine alte Datei im neuen Cache
      .then(cache => cache.addAll(DATEIEN.map(datei => new Request(datei, { cache: "reload" }))))
      .then(() => self.skipWaiting())       // neue Version sofort aktiv werden lassen
  );
});

// Aktivierung: Caches älterer Versionen löschen
self.addEventListener("activate", ereignis => {
  ereignis.waitUntil(
    caches.keys()
      .then(namen => Promise.all(
        // nur eigene alte Caches löschen – andere Spiele auf derselben Adresse nicht anfassen
        namen.filter(name => name.startsWith("marie-clicker") && name !== CACHE).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Jede Anfrage: erst Cache, im Hintergrund aktualisieren
self.addEventListener("fetch", ereignis => {
  const anfrage = ereignis.request;
  const adresse = new URL(anfrage.url);
  if (anfrage.method !== "GET" || adresse.origin !== self.location.origin) return;

  // Versions-Check des Spiels (…?frisch=…): immer direkt vom Server, nie aus dem Speicher
  if (adresse.searchParams.has("frisch")) return;

  const ausDemNetz = fetch(anfrage.url, { cache: "no-cache", credentials: "same-origin" }).then(antwort => {
    if (antwort.ok && antwort.type === "basic") {
      const kopie = antwort.clone();
      caches.open(CACHE).then(cache => cache.put(anfrage, kopie));
    }
    return antwort;
  });
  ereignis.waitUntil(ausDemNetz.catch(() => {}));   // Fehler offline ignorieren

  ereignis.respondWith(
    caches.match(anfrage, { ignoreSearch: true })
      .then(ausDemCache => ausDemCache || ausDemNetz)
  );
});
