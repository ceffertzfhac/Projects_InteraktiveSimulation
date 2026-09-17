# CHANGELOG — Die Integration als Grenzwert

## [1.1.0] — 2026-09-17

Politur-Release nach kritischem Review (→ BACKLOG **B33**–**B43**). Die Physik
war unverändert korrekt; behoben wurden Darstellungsfehler, von denen drei den
didaktischen Kern trafen.

### Behoben — Darstellung des Grenzübergangs
- **Strichcode bei dichter Zerlegung (B33).** Jeder Streifen trug ~1,5 px
  „Tinte" an Konturen (0,6 px Füllungs-Stroke + 0,9 px Obersummen-Kontur),
  unabhängig von seiner Breite. Bei \(n = 200\) sind das ein Drittel der
  Streifenfläche — das Bild wurde zum orange-blauen Strichcode, und die Aussage
  „die Lücke \(O-U\) schließt sich" war ausgerechnet am Ende des
  Verfeinerungslaufs unsichtbar. Unterhalb von `STRIP_OUTLINE_MIN_PX` = 7 **echten
  Bildschirmpixeln** Streifenbreite zeichnen jetzt nur noch die Füllungen
  (Klasse `strips-dense`); die Konturen blenden sich zwischen \(n \approx 96\)
  und \(n \approx 128\) aus. Die Schwelle urteilt in Pixeln, nicht in
  viewBox-Einheiten — dafür liefert `store.mainScale.pxPerUnit` den Maßstab.
- **„Exakte Fläche schattieren" war ein Blindschalter (B34).** Die Schattierung
  liegt unter den Streifen; bei `fill-opacity: .06` verschob sie die Mischfarbe
  um ~8/255 — an der Wahrnehmungsschwelle, mit beiden Summen eingeblendet also
  wirkungslos. Jetzt `.13` (~17/255): ohne Streifen klar als Fläche lesbar, mit
  Streifen sichtbar, ohne die Untersumme ins Teal kippen zu lassen.
- **Leeres Konvergenzdiagramm (B35).** Waren alle drei Verfahren ausgeblendet,
  kollabierte der Wertebereich auf den exakten Wert, die Ordinate spreizte eine
  Handvoll Tausendstel und beschriftete Achsen, zu denen es keine Daten gab.
  Jetzt sinnvoller Bereich um den Grenzwert plus Hinweis, welcher Schalter fehlt.

### Behoben — Flächennutzung und Lesbarkeit
- **Letterboxing (B36).** Die festen Formate (900×470 bzw. 700×410) paßten zu
  keiner realen Zellform: bei 1680 px Fensterbreite ist die gestapelte Sim-Zelle
  1356×414 (Verhältnis 3,27 gegen 1,92), `preserveAspectRatio="meet"` skalierte
  auf 58 % der Breite und ließ 563 px leer. Jetzt wird die **kurze Seite
  festgehalten und die lange aus dem gemessenen Zellverhältnis abgeleitet**
  (`cellShape()`); alle vier Konstellationen (gestapelt/geteilt × ein/zwei
  Diagramme) füllen die Zelle zu 100 %. Da der Maßstab dabei nahe 1 bleibt,
  behalten Schriftgrößen ihre Pixelgröße. `*_MIN`/`*_MAX`-Schranken fangen
  extreme Fensterformate ab; `#main_svg` bekommt `flex-basis: 0`, damit die
  Zellhöhe nicht vom viewBox-Seitenverhältnis abhängt (keine Rückkopplung).
- **Unlesbare Diagramme auf schmalem Viewport (B37).** Fällt der `@media`-Zweig
  auf gestapeltes Layout zurück, wurde die feste Dual-viewBox 1412×410 in eine
  676×380-Zelle gequetscht (Maßstab 0,48 → **5,3 px** Tick-Labels, darunter
  180 px toter Raum). Mit zellrichtiger viewBox liegt der Maßstab bei 0,93 und
  die Beschriftung bei 10,2 px.
- **`exakt = …` lag auf den Daten (B38).** Das Label saß am rechten Ende der
  Grenzwertlinie — genau dort, wo \(O(n)\) in sie einläuft. Jetzt in der oberen
  rechten Plotecke, die hier konstruktionsbedingt frei ist (\(O(n)\) fällt
  monoton, ihr Maximum liegt bei \(n = 1\) ganz links), plus deckende
  Unterlage (`labelWithBg()`, Klasse `.inplot-label-bg`).

### Behoben — Daten, Panel, Kleinteile
- **CSV-Bereich ≠ Diagrammbereich (B39).** „Diagramm (CSV)" exportierte
  \(k = 1 \dots n\), das Konvergenzdiagramm zeigt aber \(1 \dots
  \max(n, N_{\text{VIEW MIN}})\) — bei \(n = 3\) standen 8 Punkte im Bild und
  3 Zeilen in der Datei. Jetzt deckungsgleich.
- **Analyse-Panel blendete berechnete Werte aus (B40).** \(M(n)\) und
  \(|M-I|\) zeigten „—", wenn der *Visualisierungs*-Toggle aus war. Das Panel
  ist eine Datenanzeige — der Toggle steuert die Zeichnung, nicht die Rechnung.
- **Δx-Maßstrich ohne Zerlegung (B41).** Er wurde auch gezeichnet, wenn kein
  Verfahren eingeblendet war, und bemaßte dann nichts Sichtbares.
- **Play sprang zurück (B42).** `syncStepIndex()` wählte die größte Stufe
  \(\le n\); bei einem per Slider gesetzten Zwischenwert (z. B. \(n = 5\))
  sprang der Lauf erst einmal auf 4 zurück. Jetzt die kleinste Stufe \(\ge n\).
- **Typografie (B43).** \(\Delta\) ist ein Operator und steht aufrecht, nur
  das Variablensymbol \(x\) kursiv — im Δx-Maßstrich-Label und im Werte-Overlay
  (vorher beides kursiv). Die Tooltip-Zeile der Integralfunktion heißt jetzt
  \(F = \dots\) statt \(F(x) = \dots\); das aufrechte „(x)" im Rest-Text
  hätte das Variablensymbol aufrecht gesetzt, und die Stelle \(x\) steht
  ohnehin in der ersten Tooltip-Zeile.

### Verifikation
- Vitest unverändert 28/28 grün (Physik nicht berührt).
- Playwright-Regression (headless Chromium): 23 gezielte Prüfungen zu den
  Einzelbefunden, dazu Verfeinerungslauf bis \(n = 200\), alle vier Funktionen,
  Grenzen-Guard, Hover in beiden Slots, Dark Mode, CSV-Download — ohne
  Konsolen-/Seitenfehler.
- **Oszillations-Check** zur adaptiven Geometrie: fünf Viewport-Größen
  (1024…1680 px) und achtmaliges Layout-Toggeln liefern stabile, driftfreie
  viewBoxen — die Rückkopplung Zelle → viewBox → Zelle schwingt nicht.
- Fuzz über alle Controls (80 Runden): kein `NaN`/`Infinity` in SVG-Attributen
  oder Panel-Werten.

## [1.0.0] — 2026-09-17

Neue Simulation (→ BACKLOG **N8**). Schwester-Simulation zu „Die Ableitung als
Grenzwert": dort nähert sich die Sekante mit \(\delta \to 0\) der Tangente, hier
nähern sich Unter- und Obersumme mit \(n \to \infty\) dem bestimmten Integral.

### Features
- **Einschachtelung durch Unter- und Obersumme** als didaktischer Kern: die
  Untersummen-Rechtecke bleiben unter der Kurve, die Obersummen-Rechtecke ragen
  darüber hinaus; \(U(n) \le \int_a^b f\,\mathrm{d}x \le O(n)\). Sind beide Summen
  eingeblendet, wird die Obersumme **nur im Band zwischen Infimum und Supremum**
  gefüllt — die orange Fläche **ist** damit genau die Einschachtelungsdifferenz
  \(O(n)-U(n)\); das volle Obersummen-Rechteck bis zur Achse zeigt die Kontur.
  (Zwei übereinanderliegende halbtransparente Füllungen hätten die
  Untersummenfarbe verfälscht — sie erschien teal statt blau.)
- **Echte Riemann-Unter-/Obersummen**, keine linken/rechten Rechtecksummen:
  Infimum und Supremum je Teilintervall werden exakt aus den Intervallrändern
  plus den hinterlegten kritischen Stellen (\(f'=0\)) bestimmt (`infSup()`).
- **Mittelpunktsregel \(M(n)\)** zuschaltbar — liegt stets zwischen \(U\) und
  \(O\) und konvergiert sichtbar schneller (für lineare \(f\) exakt).
- **Verfeinerungs-Animation**: ▶ Play läuft die Zerlegungsfolge
  `N_SEQUENCE` (1 → 200) hoch und macht den Grenzübergang als Prozess erlebbar.
  Der „Zeit"-Parameter der Animation ist die Stufennummer, nicht eine Zeit.
- **Zwei Diagramme** (I12-Kontrakt, unabhängige Typ-Picker in der linken
  Sidebar, Default „Zwei Diagramme"):
  - *Konvergenz der Näherungen \(S(n)\)* — \(U(n)\) steigt, \(O(n)\) fällt, beide
    laufen gegen die gestrichelte Grenzwert-Linie des exakten Werts. Das
    n-Fenster wächst mit der Verfeinerung mit (Vorschauphase ab \(n=8\), vgl. B9).
  - *Integralfunktion \(F(x)\)* — exakte Flächenbilanz \(F(x)=\int_a^x f\,
    \mathrm{d}t\) und die kumulierten Teilsummen, die sie einschachteln
    (Hauptsatz als Brücke zurück zur Ableitungs-Sim).
- **Layout-Umschalter** in der Topbar (übereinander ↔ nebeneinander); die beiden
  Diagramme ordnen sich **orthogonal** zur Sim/Diagramm-Aufteilung an
  (CLAUDE.md, Referenz Kreis-/Spiralbewegung). Zustand in `localStorage`.
- **Hover-Werte** an beiden Diagrammen (I13.1, `shared/js/hover.js`):
  Führungslinie, hohle Ring-Punkte je Kurve und Tooltip mit den exakten Werten.
  Bewußt **ohne** Dual-Synchronisation (I14) — die beiden Slots haben
  unterschiedliche Abszissen (\(n\) bzw. \(x\)), s. `KNOWN_LIMITATIONS.md`.
- **Vier Funktionen** (Gerade, Parabel, Kubisch, Welle) mit analytischer
  Stammfunktion; Integrationsgrenzen \(a\), \(b\) frei einstellbar
  (Guard: \(b-a \ge 0{,}5\)).
- **Werte-Overlay** am Bild (\(n\), \(\Delta x\), Einschachtelungskette
  \(U \le \int \le O\)), \(\Delta x\)-Maßstrich am ersten Streifen, exakte Fläche
  schattierbar, vollständiges Analyse-Panel mit Fehlern \(|U-I|\), \(|O-I|\),
  \(|M-I|\).
- **CSV-Export**: „Diagramm (CSV)" exportiert den Datensatz des ersten
  Diagramm-Slots, „Alle Daten (CSV)" die vollständige Näherungsfolge
  \(n = 1 \dots 200\) samt Fehlerspalten.

### Verifikation
- `test/integration.physics.test.js` (Vitest, → BACKLOG I3): Stammfunktion
  (\(F' = f\)), Positivität auf dem Definitionsbereich, `infSup` findet innere
  Extrema, Einschachtelung \(U \le I \le O\) mit \(M\) dazwischen, Halbierung des
  Einschachtelungsbands bei Verdopplung von \(n\), Exaktheit der
  Mittelpunktsregel für lineare \(f\), Grenzen-Guard. 7 Tests, alle grün.
- Serve-Smoke vom Repo-Root (alle Modul- und Shared-Pfade 200).
- Playwright-Durchlauf (headless Chromium, 1680×950 und 1000×820): keine
  Konsolen-/Seitenfehler; beide Layouts, Ein-/Zwei-Diagramm-Modus, alle vier
  Funktionen, Grenzen-Guard, Verfeinerungslauf bis \(n=200\), Hover in beiden
  Slots, Dark Mode, CSV-Download und der `@media`-Fallback auf schmalem
  Viewport geprüft.
