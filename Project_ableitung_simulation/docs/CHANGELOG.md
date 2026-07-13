# CHANGELOG — Die Ableitung als Grenzwert

## [1.2.6] — 2026-07-13

Copyright-Marke + Disclaimer-Verweis (repo-weit, Vorbereitung I1/ILIAS-Veröffentlichung).

### Geändert
- **Topbar:** Copyright-Marke „© 2026 FH Aachen, FB 8 · Alle Rechte vorbehalten" neben
  dem Institutions-Span ergänzt. Keine Verhaltensänderung — rein rechtlicher Hinweis
  (volle Fassung in repo-root `NOTICE.md` und auf der Übersichtsseite).

## [1.2.5] — 2026-07-11

T9 — shared/js-Helper konsolidieren.

### Geändert
- **`setAxisLabel`/`niceStepLE`** nutzen jetzt `shared/js/svg-text.js` bzw.
  `shared/js/ticks.js` statt lokaler Kopien. Diese Sim war die kanonische
  Quelle für `setAxisLabel` (Kursiv-Verhalten ohne „ / "-Trenner) — keine
  sichtbare Änderung. `niceStepLE` bekommt zusätzlich einen Nullwert-Guard
  (`range=0` → `1` statt `0`, Bugfix ohne praktische Auswirkung hier).

## [1.2.4] — 2026-07-10

Akkordeon-Steuerungs-Sidebar (I8).

### Features
- **Akkordeon-Steuerungs-Sidebar**: 5→4 Cluster konsolidiert — „Funktion"
  (Single-Control: Funktionsauswahl-Dropdown) in „Parameter" integriert
  (Single-Control-Cluster-Regel), neuer Titel „Funktion & Parameter".
  Alle 4 Cluster (kein Abspielgeschwindigkeit-Cluster in diesem Sim)
  bleiben default offen. Referenz: Kreis-/Spiralbewegung v1.3.0. Per
  Playwright verifiziert.

## [1.2.3] — 2026-07-08
### Behoben (δ-Semantik einheitlich)
- **\(\delta\) bedeutet jetzt in beiden Modi dasselbe: den vollen Stützpunkt-
  Abstand \(\Delta x\).** Zuvor war \(\Delta x = 2\delta\) (zentriert) bzw.
  \(\Delta x = \delta\) (vorwärts) — beim Umschalten halbierte/verdoppelte sich die
  tatsächliche Schrittweite, und der Formel-Nenner war einmal \(2\delta\), einmal
  \(\delta\).
- **Neue Aufteilung:** zentriert \(x_1 = x_0 - \tfrac{\delta}{2},\; x_2 = x_0 +
  \tfrac{\delta}{2}\) (statt \(x_0 \pm \delta\)); vorwärts unverändert. Nenner des
  Differenzenquotienten ist jetzt **überall \(\delta\)**; die zentrierte Formel
  zeigt kontextsensitiv \(\tfrac{\delta}{2}\) im Zähler. Beim Umschalten bleibt die
  Schrittweite \(\Delta x = \delta\) konstant.
- `maxAbsDelta` bewußt **modus-unabhängig** belassen (deckt beide Fälle ab) →
  kein Klemm-Sprung von \(\delta\) beim Umschalten. Slider-Label „Abstand \(\delta\)"
  und Panel-\(\Delta x\) sind nun deckungsgleich.

## [1.2.2] — 2026-07-08
### Geändert (Titel-Bezeichnung, PO-Vorgabe)
- **Wort „Funktion:" wieder im Titel** — aber typografisch konsistent: es steht
  jetzt via `\text{Funktion:}` **innerhalb** der MathJax-Formel, teilt also Font
  und Größe mit der Gleichung (kein DM-Sans-/Serifen-Bruch mehr wie in ≤ v1.2.0).
- **Funktion als \(f(x) = y = \dots\) bezeichnet** — im Titel und im Formelblock
  (`pf_*`); die Ableitungszeile bleibt \(f'(x) = \dots\). Passt zur mit „\(y\)"
  beschrifteten Ordinate.

## [1.2.1] — 2026-07-08
### Behoben (Titel-Typografie/Platzierung)
- **Optische Inkonsistenz im Diagramm-Titel behoben.** Bisher stand ein Präfix
  „Funktion:" in DM Sans (17 px) direkt vor der MathJax-Gleichung (Serifen-Mathe­
  font, 15,3 px) — zwei Fonts/Größen auf einer Zeile. Das redundante Präfix
  entfernt (die Sidebar-Sektion ist bereits mit „Funktion" beschriftet); der Titel
  ist jetzt **rein die MathJax-Funktionsgleichung** — einheitlich gesetzt.
- **Titel über dem Plot-Gebiet zentriert** statt über der ganzen SVG: `drawGraph()`
  setzt das Titel-`foreignObject` auf `x = PAD_L`, `width = plotW` (vorher ~16 px
  nach links versetzt gegenüber der Plot-Mitte).

## [1.2.0] — 2026-07-08
### Feature: kubisches Polynom als vierte Funktion
- Neue Auswahl **„Kubisch (3. Grades)"**:
  \(f(x) = 0{,}02\,(x-12{,}5)^3 - 2\,(x-12{,}5)\) mit analytischer Ableitung
  \(f'(x) = 0{,}06\,(x-12{,}5)^2 - 2\). Wendepunkt bei \(x = 12{,}5\), zwei
  Extrema (bei \(x \approx 6{,}7\) und \(18{,}3\)) → die Ableitung wechselt
  zweimal das Vorzeichen (didaktisch reich). Reihenfolge im Dropdown:
  Gerade · Parabel · Kubisch · Komplex.
- Statische MathJax-Varianten für Titel (`title_kubisch`) und Formelblock
  (`pf_kubisch`) ergänzt; Dropdown + Umschaltlogik ziehen die Option automatisch
  aus `FUNCS`.

## [1.1.0] — 2026-07-08
### Feature: umschaltbare Werte im Diagramm
Neue Sidebar-Sektion **„Werte im Diagramm"** mit drei unabhängigen Schaltern,
die steuern, ob die jeweiligen Werte in der Simulationsumgebung (auf dem Graphen)
angezeigt werden:
- **\(\Delta x\)-, \(\Delta y\)-Werte** am Steigungsdreieck (bisher fest an die
  Sekante gekoppelt → jetzt separat abschaltbar; nur bei sichtbarem Dreieck).
- **Sekantensteigung \(m_s\)** als Readout oben links im Plot (Sekantenfarbe).
- **Tangentensteigung** als Readout oben links im Plot (Tangentenfarbe); die
  beiden Readouts stapeln sich dynamisch (nur sichtbare Zeilen belegen Slots).
- Die beiden Steigungs-Readouts sind **unabhängig** von der Linien-Sichtbarkeit
  (Tangente/Sekante) toggelbar — man kann die Zahlenwerte auch ohne die Linien
  zeigen. Werte weiterhin zusätzlich im Analyse-Panel.
- Dynamische Wert-Labels rendern Symbole kursiv über `createStyledSvgText`
  (`Δ`\(x\), `Δ`\(y\), \(m\)) mit eigener, nicht-stroke-tragender CSS-Klasse
  (kein Faux-Bold). Alle drei Schalter im Reset auf „an".

## [1.0.0] — 2026-07-08
### Migriert (§8 Standalone → Modular; ehem. W1-Werkzeug)
Volle Migration des Prototyps `AllAnimations/ableitung.html` in die kanonische
modulare Architektur (6 Module + `css/` + `docs/`). Als **Sim-Schale ohne
Zeit-Animation** umgesetzt (analog `Project_3massen_umlenkrollen_simulation`:
Topbar Theme + Reset, **kein** Play/Pause/Stoppuhr/CSV, kein
`requestAnimationFrame`-Loop).

- **6-Modul-Split:** `constants.js` (Funktionen mit analytischer Funktion +
  Ableitung, Geometrie), `state.js` (`store` + DOM-Cache), `physics.js`
  (`sampleCurve`/`yRange`/`maxAbsDelta`/`analyze` — stateless), `render.js`
  (`physToScreen`, `drawGraph`, `updateOverlay`, `updateAnalysis`), `ui.js`
  (ES-Module-Einstieg, kein `main.js`).
- **Analytische Ableitung** statt des numerischen Zentraldifferenzen-Arrays des
  Prototyps: jede Funktion liefert `f` und `f'` exakt.
- **Dark Mode korrekt:** Achsen/Gitter/Ticks/Kurve über CSS-Tokens
  (`--text`/`--grid-line`/`--graph-bg`/Kategorial-Tokens) statt hartkodiertem
  `black`/`#eee`/`currentColor` → im Dark Mode sichtbar (war im Prototyp defekt).
- **Graph-Konventionen:** `setAxisLabel` (Symbol kursiv), Ticks über `niceStepLE`
  (1-2-4-5-Folge, ≥4 Ticks inkl. 0 auf beiden Achsen), **Abszisse am
  Nulldurchgang** (y = 0), Titel als **letztes SVG-Kind**, kanonische
  Pfeilspitzen (`refX = 0`).
- **Farbblind-sichere Kategorialfarben** (Okabe-Ito-nah): Funktion grau,
  Tangente blau `--c-tan`, Sekante orange `--c-sec`, Stützstelle mauve `--c-pt`
  (ersetzt das Rot/Grün/Violett des Prototyps).
- **Legende** als `.legend-grid` in der linken Sidebar (statt Ad-hoc-SVG-Text).
- **Einklappbare Analyse-Sidebar** (Default eingeklappt) mit Grenzwertanalyse
  (\(m_s\), \(f'(x_0)\), Abweichung \(|m_s-f'(x_0)|\)) und Formelblock.
- **Statisches MathJax** durchgängig: Funktions-Titel (3 Varianten),
  Differenzenquotient (zentriert/vorwärts) und \(f\)/\(f'\) je Funktion als
  `display`-umschaltbare `<div>`s — kein Laufzeit-`typesetPromise`.
- **Diagramm-Interaktion:** Tangente/Sekante/Steigungsdreieck beim Start
  sichtbar; \(\delta\)-Slider dynamisch an den Rand gekoppelt (x₀ ± δ bleibt im
  Definitionsbereich), \(\delta = 0\)-Guard.
- Prototyp `AllAnimations/ableitung.html` nach `legacy_archive/` verschoben (nicht
  gelöscht); AllAnimations-Karte auf Modular umgehängt.
