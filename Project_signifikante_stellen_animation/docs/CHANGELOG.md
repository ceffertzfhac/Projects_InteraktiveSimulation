# Changelog – Signifikante Stellen (Schritt-Animation)

## v0.2.0 — 2026-10-01

Didaktischer Umbau nach PO-Review (Drehbuch 31 → 20 Schritte, weniger Zoom-
und Animationsstufen, dafür schärfer):
- **Neuer Einstieg „Messen":** Metallstange auf einem Maßband mit 1-m-Teilung →
  „abgelesen: 3 m"; feineres Maßband (0,1 m) → „3,0 m"; zweite Stange — 2,97 m
  und 3,02 m ergeben beide 3,0 m. Erst danach die Zahlengerade, dann das Rechteck.
- **Teilung = Rundungsgenauigkeit:** bei „3" nur 0,5er-, bei „3,0" nur
  0,05er-Ticks (genau die Intervallgrenzen). Neue Teilungen **wachsen** nach dem
  Zoom gestaffelt vom Messwert nach außen aus der Achse (Überschwinger, Labels
  steigen nach); die alte zieht sich während des Zooms zurück.
- **Pfeil „wahre Länge"** steigt vom Stangenende zur Zahlengeraden, landet mit
  Impulsring und hinterläßt Treffer — mal auf der 3, mal links/rechts im Intervall.
  Das Maßband unter der Achse zeigt jeweils die zur Stufe passende Teilung.
- Je Genauigkeitsstufe **ein** Schritt (feineres Maßband → Ablesung → Intervall
  schrumpft im alten → Zoom ×10 → neue Teilung → Pfeile), statt drei.
- **Flächenvariationen animiert:** die Rechteckecke springt durch das
  Unsicherheitsfeld, ein Live-Wert rechnet *l* · *b* mit, Treffer bleiben stehen;
  danach der Bereich *A*_min … *A*_max.
- **Folien mit Intervallen:** *l* ∈ […), *b* ∈ […), *A* ∈ […) aus dem Modell.
- „Rechteck" wird erst benannt, wenn die zweite Achse steht.
- Rückweg verkürzt auf 3,000 · 2,00 → 3,000 · 2 → 3 · 2; Mischungen ohne Zoom.
- Shared: `createAxis` mit fester, überblendbarer Teilung (`fixed: [{ step, grow, center }]`);
  Tick-Labels mit Halo; keine Punkt-Kappe bei noch nicht gezeichneter Achse.

## v0.1.0 — 2026-10-01

Erste Fassung (→ BACKLOG N9), zugleich erster Vertreter des Projekttyps
**Schritt-Animation** (→ BACKLOG I19, Blueprint §10): eine Lehr-Animation für
Vorlesung und Lernvideo mit minimaler Bedienung statt einer interaktiven Sim.

**Kapitel 1 „Multiplikation" (31 Schritte):**
- **A · Eine Messgröße:** leere Zahlengerade → Messpunkt „3" → halboffenes
  Rundungsintervall 2,5 ≤ *l* < 3,5 (● eingeschlossen, ○ ausgeschlossen) →
  „Sonde" zeigt, daß der wahre Wert überall im Intervall liegen kann → je Stufe
  3,0 / 3,00 / 3,000: Label-Überblendung, neues Intervall schrumpft im alten
  (Geisterband), Kamerazoom ×10 mit weich überblendender Neu-Teilung, Sonde.
- **B · Fläche:** die Zahlengerade wird zur *l*-Achse, die *b*-Achse wächst ein,
  *b* = 2,000 direkt auf der Endstufe, Rechteck baut sich auf, Zoom (≈ ×1000) auf
  die Ecke, Flächenbereich *A*_min … *A*_max als L-förmiges Band.
- **C · Rückweg:** erst Breite, dann Länge — 3,000 · 2,00 → … → 3 · 2; Bänder
  wachsen, Kamera zoomt mit, Folie zeigt Bereich und gesicherten Wert.
- **D · Mischungen:** 3 · 2,00, 3,00 · 2,9, 3,0 · 2,00 — je „Aufbau" und
  „Bereich und Rundung".
- **E · Merksatz:** Ergebnis hat so viele signifikante Stellen wie der
  ungenaueste Faktor.

**Technik:**
- Bedienung: ⏮ Reset · ◀ Zurück · Weiter ▶ · Auto-Play mit Tempo 0,5×/1×/2×,
  klickbare Fortschrittsleiste, Kapitel-Tabs (Addition angelegt, deaktiviert).
  Tastatur/Presenter-Clicker: → / Bild↓ / Leertaste, ← / Bild↑, Pos1, Ende,
  `P` Auto-Play, `F` Vollbild, `H` Bedienung ausblenden (Aufnahme-Modus).
- GSAP 3.13 (CDN) als Timeline-Engine; Szene = Zahlenobjekt, exakt reversibel.
- Alle Zahlen aus `js/model.js` (Intervalle, Produktbereich, exakte Darstellung,
  Rundung auf signifikante Stellen); Vitest `test/signifikante_stellen.model.test.js`.
- Folienkarten statisch in `index.html` (MathJax einmal beim Laden), wechselnde
  Zahlen als `data-dyn`-Spans aus `js/content.js`.
- Farben: *l* Okabe-Ito-Blau, *b* Zinnober, Fläche FH-Mint; Dark Mode über Tokens.
- Headless geprüft: alle 31 Schritte vorwärts, rückwärts und per Sprung
  zustandsgleich; Auto-Play/Tempo/Tastatur; Light und Dark.
