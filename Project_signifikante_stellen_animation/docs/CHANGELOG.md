# Changelog – Signifikante Stellen (Schritt-Animation)

## v0.5.1 — 2026-10-02

- Folientexte überarbeitet (PO): Maßband-Teilung als „Markierungen im Abstand von …"
  formuliert, „Genauer können wir mit diesem Maßband nicht messen", wahre Länge „mit dem
  Maßband nicht bestimmbar", Kreis-Folien „Umfang/Fläche aus Radius bestimmen".
  (Direkt in der Webpage-Kopie editiert, ins kanonische Projekt zurückübertragen.)

## v0.5.0 — 2026-10-01

Kreis didaktisch neu nach PO-Konzept (6 statt 2 Schritte), je für *r* = 3,0 m und *r* = 3 m:
- **Radius variieren:** Der Radius springt durch das Intervall, die Beschriftung zeigt
  live den aktuellen (wahren) Wert; Unsicherheitsring mit gestrichelten Rändern.
- **Umfang umlaufend:** Kreis wächst auf *r*_max, eine Spur mit leuchtender Spitze
  läuft einmal herum, der Zähler steigt bis *U*_max; dann dasselbe für *r*_min.
- **Fläche von innen nach außen:** für *r*_max (hell) und *r*_min (kräftig) füllt sich
  die Scheibe vom Mittelpunkt aus, Zähler bis *A*_max bzw. *A*_min.
- **Werte-Protokoll** oben links (*U*_max, *U*_min, *A*_max, *A*_min); Zähler werden
  aus Spur- bzw. Füllradius berechnet. Folien: Intervall → gesicherter Wert.
- Ergebnis: *r* = 3,0 → *U* = 19 m, *A* = 28 m²; *r* = 3 → *U* = 2 · 10¹ m, *A* = 3 · 10¹ m².

## v0.4.1 — 2026-10-01

- Kreis-Schritte vertauscht (PO): erst *r* = 3,0 m, dann *r* = 3 m — der Ring wird
  beim zweiten Schritt sichtbar breiter, *U* und *A* verlieren eine Stelle.

## v0.4.0 — 2026-10-01

- **Kreis mit r = 3 und r = 3,0** (PO-Wunsch), je **Umfang und Fläche**:
  *U* = 2π*r*, *A* = π*r*². Unsicherheitsring (bei „3" 2,5 … 3,5 m — breit, bei
  „3,0" schmal), Radius springt durch das Intervall, *r*, *U* und *A* laufen live mit
  (je Wert ≥ 1 s Standzeit), Kreisfläche zart gefüllt. Ergebnis: grob
  *U* = 2 · 10¹ m, *A* = 3 · 10¹ m²; mit 3,0 *U* = 19 m, *A* = 28 m².
- `formatSig` rundet in Zehnerpotenz-Schreibweise, wenn die Zahl mehr Vorkomma-
  stellen hat als signifikante Stellen (18,85 bei 1 Stelle → „2 · 10¹", nicht „19").
- Merke-Kasten ergänzt um *A* = π · (3,0 m)² = 28 m².

## v0.3.1 — 2026-10-01

- **Pfeilspitzen-Geometrie (CLAUDE.md-Regel) auch für die gekrümmten Einrast-
  Pfeile:** Spitze exakt auf dem Ziel (Unterkante des Maßbands an der Marke),
  Schaft endet an der Dreieck-Basis — gemessen als Bogenlänge entlang der Kurve,
  Kopfrichtung = Sehne Basis→Spitze; kürzer als der Kopf → nicht gezeichnet (wie
  `shortenEnd`/B23). Ebenso der Pfeil „wahre Länge": Spitze genau auf der
  Zahlengeraden (vorher 4 px darunter), Schaft bis zur Kopf-Basis, `butt`-Kappen.
- Begriff „Stange" durchgängig durch „Stab" ersetzt (PO-Vorgabe).

## v0.3.0 — 2026-10-01

PO-Review, zweite Runde (22 Schritte):
- **Messen mit Pfeilen:** Stangenende wird markiert, auf dem Maßband leuchtet der
  Ablesebereich der nächsten Marke auf, ein geschwungener Pfeil rastet auf der
  Marke ein → „abgelesen". 2,8 m → 3 m; Gegenprobe 2,4 m → 2 m; mit 0,1-m-Band
  2,97 m → 3,0 m und 2,93 m → 2,9 m; zwei Stangen (2,97 / 3,02 m) rasten beide auf 3,0 ein.
- **Kreisumfang (neu, 2 Schritte):** Kreis mit gemessenem Radius *r* = 3,0 m,
  Unsicherheitsring, wandernder Radius mit Live-Anzeige *U* = 2π*r* →
  *U* ∈ [18,535 ; 19,164) m, gesichert *U* = 19 m. 2 und π sind exakt (unendlich
  viele Stellen) — nur *r* begrenzt.
- **Eine Rechnung weniger:** Mischung 3 · 2,00 entfällt.
- **Merke-Kasten** mit 3,00 · 2,9, 3,0 · 2,00 und *U* = 2 · π · 3,0 m.
- Live-Rechenwerte (*l* · *b*, *U*) bleiben je Sprung ~1 s länger stehen.
- Shared: Fortschrittsleiste füllt sich kontinuierlich mit dem laufenden Schritt,
  im Auto-Play zusätzlich heller Countdown der Wartezeit (`onTick` der Engine).

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
