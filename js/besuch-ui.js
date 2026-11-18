"use strict";
// =====================================================
//  ZU BESUCH – Bildschirm
//  Tippen auf einen Namen in der Bestenliste -> Fenster mit dem Zimmer dieses Spielers,
//  seiner Figur (Kleid, Frisur, Haarfarbe, Hut) und seinen Haustieren. Nur zum Ansehen.
//  Regeln: besuch.js
// =====================================================

let besuchNr = 0;   // gegen alte Antworten, wenn man schnell hintereinander tippt

// Die Figur mit fremden Kleidern: Kopie der eigenen Zeichnung, dann Haar, Kleid, Frisur, Hut tauschen.
// Alles kommt aus den eigenen Skin-Daten (nach ID gesucht), nichts direkt aus dem Profil.
function besuchFigurHtml(profil) {
  const box = document.createElement("div");
  box.innerHTML = ui.marie.querySelector("svg").outerHTML;
  const q = id => box.querySelector(`#${id}`);
  const figur = profilSkin("figur", profil.figur);
  const a = figur.aussehen;
  const haar = profilSkin("haarfarbe", profil.haarfarbe).haar || a.haar;
  q("haarHell").setAttribute("stop-color", haar[0]);
  q("haarDunkel").setAttribute("stop-color", haar[1]);
  q("kleid").innerHTML = profilSkin("kleid", profil.kleid).svg.replaceAll("{farbe}", a.kleid);
  const frisur = profilSkin("frisur", profil.frisur);
  q("haarHinten").innerHTML = frisur.hinten;
  q("haarVorne").innerHTML = frisur.vorne || "";
  q("haarOben").innerHTML = frisur.oben || "";
  q("hut").innerHTML = profilSkin("hut", profil.hut).svg || "";
  for (const pupille of box.querySelectorAll(".pupille")) pupille.setAttribute("fill", a.augen);
  // IDs umbenennen, sonst gibt es sie doppelt im Dokument
  return box.innerHTML
    .replace(/id="([^"]+)"/g, 'id="besuch-$1"')
    .replace(/url\(#([^)]+)\)/g, "url(#besuch-$1)");
}

function zeichneBesuchsZimmer(profil) {
  const zimmer = $("besuchZimmer");
  zimmer.textContent = "";
  zimmer.append(span("zimmerWand"), span("zimmerBoden"));

  const wand = profilZimmerTeil(profil, "wand");
  zimmer.style.setProperty("--wand", wand.muster ? `${emojiKachel([wand.muster, wand.muster], 70)} 0 0 / 22% auto, ${wand.farbe}` : wand.farbe);
  zimmer.style.setProperty("--boden", profilZimmerTeil(profil, "boden").farbe);

  for (const platz of ZIMMER_PLAETZE) {
    if (platz.id === "wand" || platz.id === "boden") continue;
    const teil = profilZimmerTeil(profil, platz.id);
    if (!teil) continue;
    const el = span("zimmerPlatz");
    el.dataset.platz = platz.id;
    zeichneZimmerTeil(el, teil);
    zimmer.append(el);
  }

  const figur = span("zimmerFigur");
  figur.innerHTML = besuchFigurHtml(profil);
  zimmer.append(figur);

  const tiere = (Array.isArray(profil.tiere) ? profil.tiere : []).slice(0, 2).map(profilTier).filter(Boolean);
  tiere.forEach((t, i) => {
    if (t.weg) return;   // gerade auf Ausflug
    const el = span(i === 0 ? "zimmerTier" : "zimmerTier zweites");
    zeichneTier(el, t);
    zimmer.append(el);
  });
  return tiere;
}

async function zeigeBesuch(spielerId, name) {
  const nr = ++besuchNr;
  const istDu = mitglied && spielerId === mitglied.spielerId;
  $("besuchTitel").textContent = istDu ? "🏠 Dein Zimmer" : `🏠 Bei ${name} zu Besuch`;
  $("besuchZimmer").hidden = true;
  $("besuchInfo").textContent = "⏳ Klopf, klopf …";
  $("besuchPost").hidden = true;
  $("besuchOverlay").hidden = false;

  try {
    if (istDu) await sendeProfil();
    const antwort = await holeProfil(spielerId);
    if (nr !== besuchNr) return;
    const profil = antwort && antwort.profil;
    if (!profil || typeof profil !== "object") {
      $("besuchInfo").textContent = `${name} hat noch nichts zum Ansehen. Vielleicht muss ${name} das Spiel erst aktualisieren. 🔄`;
      return;
    }
    const tiere = zeichneBesuchsZimmer(profil);
    $("besuchZimmer").hidden = false;

    const zeilen = [];
    for (const t of tiere) {
      const art = tierArt(t);
      zeilen.push(`${art.emoji} ${t.name} · ${art.name} · Level ${t.level}${t.weg ? " · gerade auf Ausflug 🗺️" : ""}`);
    }
    const sticker = Math.max(0, Math.floor(Number(profil.sticker) || 0));
    const teile = Math.max(0, Math.floor(Number(profil.zimmerTeile) || 0));
    zeilen.push(`📒 ${sticker} Sticker · 🏠 ${teile} Zimmer-Teile`);
    $("besuchInfo").textContent = zeilen.join("\n");

    const post = $("besuchPost");
    post.hidden = istDu;
    post.dataset.id = spielerId;
    post.dataset.name = name;
  } catch (fehler) {
    if (nr !== besuchNr) return;
    $("besuchInfo").textContent = "⚠️ " + fehler.message;
  }
}

function richteBesuchEin() {
  // Tippen auf eine Zeile der Bestenliste (der 🎁-Knopf hat seinen eigenen Empfänger)
  $("blListe").addEventListener("click", e => {
    if (e.target.closest(".blPost")) return;
    const zeile = e.target.closest(".blZeile");
    if (!zeile || !zeile.dataset.id) return;
    sound.klick();
    zeigeBesuch(zeile.dataset.id, zeile.dataset.name);
  });
  $("besuchZu").addEventListener("click", () => { $("besuchOverlay").hidden = true; besuchNr++; sound.klick(); });
  $("besuchOverlay").addEventListener("click", e => { if (e.target.id === "besuchOverlay") { $("besuchOverlay").hidden = true; besuchNr++; } });
  $("besuchPost").addEventListener("click", () => {
    $("besuchOverlay").hidden = true;
    sound.klick();
    zeigePostFenster($("besuchPost").dataset.id, $("besuchPost").dataset.name);
  });
  // Zimmer-Schriftgröße wächst mit der Breite (wie beim eigenen Zimmer)
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(([e]) => $("besuchZimmer").style.setProperty("--zb", e.contentRect.width + "px")).observe($("besuchZimmer"));
  }
}
