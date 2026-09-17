# CHANGELOG — Die Integration als Grenzwert

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
