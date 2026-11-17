"use strict";
// =====================================================
//  SERVICE WORKER – macht das Spiel offline spielbar
//
//  Strategie "stale-while-revalidate":
//  1. Datei sofort aus dem Speicher (Cache) liefern → startet blitzschnell, auch offline
//  2. Gleichzeitig im Hintergrund die neueste Version laden und den Cache aktualisieren
//  → Änderungen, die du hochlädst, sind beim ÜBERNÄCHSTEN Öffnen da.
//
//  Wenn du Dateien hinzufügst oder umbenennst: in DATEIEN eintragen
//  und VERSION erhöhen, damit der alte Cache gelöscht wird.
// =====================================================

const VERSION = "v4";
const CACHE = "marie-clicker-" + VERSION;

const DATEIEN = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/daten.js",
  "js/hilfen.js",
  "js/zustand.js",
  "js/logik.js",
  "js/sound.js",
  "js/anzeige.js",
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
        namen.filter(name => name !== CACHE).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Jede Anfrage: erst Cache, im Hintergrund aktualisieren
self.addEventListener("fetch", ereignis => {
  const anfrage = ereignis.request;
  if (anfrage.method !== "GET" || new URL(anfrage.url).origin !== self.location.origin) return;

  const ausDemNetz = fetch(anfrage).then(antwort => {
    if (antwort.ok) {
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
