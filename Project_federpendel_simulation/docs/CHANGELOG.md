# Changelog — Federpendel

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org/): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.0.10 — 2026-07-06

### Fix
- **Mindestens 4 beschriftete Ticks pro Achse (inkl. 0)**: die Ordinate
  (y-Achse) verwendete `getNiceTick(valRng)` (minDivs 3), was durch Auf-
  runden auf die 1-2-5-Folge bei A=0,8 nur 3 Ticks (−0,5 / 0 / 0,5) lieferte.
  Neue Funktion `niceStepLE(range, minDivs)` wählt den größten Nice-Step
  aus einer feineren 1-2-4-5-Folge, der ≤ range/minDivs ist → garantiert
  ≥ minDivs Teilstriche. Mit `minDivs=4` liefert die Ordinate jetzt 5–7
  Ticks inkl. 0 (z. B. −0,8 / −0,4 / 0 / 0,4 / 0,8). Die 4er-Stufe schließt
  die Lücke zwischen 2 und 5 (rein 1-2-5 gäbe sonst nur 3 oder 9 Ticks).
  Abszisse (t-Achse) liefert über `tAxisStep` ohnehin 6 Ticks (tMax ≥10 s).
  Maximum ≤12 (5–9 y-Ticks, 6 t-Ticks).

## v1.0.9 — 2026-07-06

### Feature
- **Diagramm-Format pro Aufbau**: horizontales Pendel → Landscape-Graph
  (700×410), vertikales Pendel → Portrait-Graph (410×700). Der Graph paßt
  in die hohe, schmale Zelle neben dem vertikalen Oszillator, statt als
  flacher Streifen winzig zu skalieren. `updateGraph` berechnet plotW/plotH
  aus der Orientierung; `setupScene` setzt den `graph_svg`-viewBox.
- **Abszisse am Nulldurchgang**: bei Graphen mit Nulldurchgang
  (Wertebereich um 0 symmetrisch — alle drei Größen x/v/a) wird die
  Zeitachse (Abszisse) jetzt bei y=0 plaziert, nicht am unteren Plot-Rand.
  Ordinate läuft volle Plot-Höhe, Achsen kreuzen am Ursprung (links, Mitte).
  t-Tick-Labels bleiben am unteren Rand (unabhängig von der Abszissen-
  Position), Gitterlinien spannen volle Plot-Höhe/-Breite. Titel pro
  Format neu zentriert.

## v1.0.8 — 2026-07-05

### Feature
- **Achsen vergrößert**: horizontale x-Achse (Abszisse) von 1,5 m auf 1,8 m
  verlängert, vertikale y-Achse (Ordinate) von 1,0 m auf 1,8 m. Die Ordinate
  überdeckt jetzt die volle Schwingungsamplitude (Slider-Max 1,5 m) mit Margin;
  vorher endete sie bei 1,0 m, so daß bei A>1,0 m die Masse über die Achsspitze
  hinausschwang. Sim-Größe und Layout unverändert.

## v1.0.7 — 2026-07-05

### Feature
- **Horizontaler Aufbau vergrößert**: Stoppuhr nach rechts auf Oszillator-Höhe
  verschoben (`translate(340,180)`), damit der obere Bereich frei wird. viewBox
  weiter (`0 125 600 225`, Aspect 2,67) — das Sim-SVG füllt die breite Zelle
  jetzt in der Breite (vorher höhenlimitiert mit Seitenrändern → zu schmal,
  Schrift zu klein). x-Achse (Abszisse) erweitert von 1,0 m auf 1,5 m
  (`scale(1.5)`), passend zum Amplituden-Slider.
- **Trennlinie nach oben**: Sim-/Diagramm-Reihen von `1fr/1fr` auf
  `0,9fr/1,1fr` — Diagramm bekommt ≈55 %, Sim ≈45 % der Höhe.
- **Vertikaler Aufbau korrekt skaliert**: viewBox von `0 0 450 480` auf den
  tatsächlichen Inhaltsbereich gestrafft (`135 5 300 475`, Aspect 0,63). Der
  Oszillator (y-Achse bei x≈145, Equilibrium-Label bis x≈405) plus Stoppuhr
  oben-rechts füllen die hohe, schmale Zelle — vorher skalierte der Inhalt im
  450-breiten viewBox mit großem linken Leerraum winzig.

## v1.0.6 — 2026-07-05

### Fix
- **Diagramm in gestapelter Ansicht abgeschnitten**: `#graph_svg` hatte keine
  `width/height:100%`-Regel (nur `#main_svg` ist in shared definiert). Das SVG
  fiel auf seine intrinsische Größe zurück (breit, Höhe = Breite/Aspect ≫
  Zellenhöhe) und wurde von `overflow:hidden` der `graph-wrapper` unten
  beschnitten → nur die obere Hälfte sichtbar. `#graph_svg` jetzt explizit auf
  `100%/100%` gesetzt, wie `#main_svg`.

## v1.0.5 — 2026-07-05

### Feature
- **Aufbauabhängiges Layout**: horizontales Pendel → gestapelt (Sim oben,
  Diagramm unten; breites Sim-SVG paßt in die breite Zelle). Vertikales
  Pendel → nebeneinander (Sim links, Diagramm rechts; hohes Sim-SVG
  paßt in die hohe, schmale Zelle). Umschaltung per `.layout-side`-Klasse
  in `setupScene`. Media-Query (<1100px) fällt immer auf gestapelt zurück.

## v1.0.4 — 2026-07-05

### Fix
- **Diagramm vollständig sichtbar**: `updateGraph` auf gepaddetes Plot-
  Gebiet umgestellt (padL 60 / padR 18 / padT 30 / padB 42, wie Zykloide).
  Zuvor lagen y-Ticks (x = −5) und y-Achsenlabel (x = −40) links außerhalb
  des viewBox und wurden beschnitten. Jetzt sind Achsen, Ticks und Labels
  komplett innerhalb 700×410. Plot-Bereich 622×338, Titel oberhalb.
- **Diagramm +5 % Höhe**: Center-Layout `1.5fr 1fr` → `1.25fr 1fr`
  (Sim ≈55 %, Diagramm ≈45 %).

## v1.0.3 — 2026-07-05

### Fix
- **Sim nutzt SVG-Fläche effizienter**: Layout zurück auf gestapelt
  (rows `1.5fr 1fr`). Der Simulationsinhalt füllte das 450×480-viewBox
  nicht aus (horizontaler Aufbau: Inhalt y ≈ 88–320, 56 % Leerraum).
  `setupScene` setzt den viewBox jetzt pro Aufbau: horizontal
  `0 75 450 260` (Inhalt ~88–320, aspect 1,73 statt 0,94 → Inhalt
  ~1,8× größer auf der Zelle), vertikal `0 0 450 480` (volle Höhe, da
  Auslenkung amplitudeabhängig nach unten reicht).
- **Stoppuhr-Verschiebung**: Gruppen-Transform `translate(250,60)` →
  `translate(220,60)`, damit analoger Kreis (x bis 459) und LCD-Rahmen
  (x bis 481) nicht über den 450-breiten viewBox hinausragen (waren im
  Prototyp mit 900-breitem viewBox ok, bei der Migration beschnitten).

## v1.0.2 — 2026-07-05

### Fix
- **Sim-Anzeige nutzt verfügbare Fläche**: Center-Layout von gestapelt
  (rows) auf **side-by-side** (columns `1.5fr 1fr`) umgestellt. Das fast
  quadratische Sim-SVG (450×480) blieb in der breiten Center-Zelle bei
  gestapeltem Layout immer höhenlimitiert (leere Fläche links/rechts).
  Side-by-side macht die Sim-Zelle hoch und quadratisch → das SVG füllt
  sie aus. Media-Query (`max-width: 1100px`) fällt auf gestapeltes
  Layout zurück.

## v1.0.1 — 2026-07-05

### Fix
- **Sim-Anzeige vergrößert**: Center-Layout von `1fr 1fr` auf
  `1.5fr 1fr` geändert — die fast quadratische Sim-SVG (450×480) wirkt
  in der breiten Center-Zelle höhenlimitiert sonst klein; Sim-Zelle
  bekommt jetzt ≈60 %, Diagramm ≈40 % der Höhe.

## v1.0.0 — 2026-07-04

Erste modulare Version. Migration des bisherigen Standalone-Prototypen
`AllAnimations/federpendel.html` (v6.2, 642 Zeilen, Einzel-Datei) in die
kanonische 6-Modul-Architektur des Repos.

### Features
- **6-Modul-Architektur**: `constants.js` · `state.js` · `physics.js` ·
  `render.js` · `ui.js` (ES-Module-Einstieg) · `index.html`/`css/styles.css`.
  Entry-Point ist `js/ui.js` (kein `main.js`); DOM-Cache-Initializer
  heißt `initDOM()`.
- **Precompute + Interpolation**: `precompute()` füllt die Zeitreihen
  für `max(4T, 10 s)`; `interpolateAt(t)` interpoliert linear. Animation
  indiziert nur in die Arrays — keine Per-Frame-Physik. Dynamische
  Erweiterung via `extendMotionData`, wenn die Sim-Zeit ans Ende stößt.
- **Kanonische Topbar-Buttonleiste**: `▶ Play` · `⏸ Pause` · `↺ Reset` ·
  `Diagramm (CSV)` · `Alle Daten (CSV)` in der Topbar (nicht in der Sidebar).
- **3-Spalten-Layout** `280px 1fr 270px` mit **einklappbarer Analyse-Sidebar**
  (default eingeklappt, 44-px-Schiene, Body off-screen — nie `display:none`,
  damit MathJax die Formeln im Hintergrund typesetted).
- **Gestapeltes Center-Layout** (Simulation oben, Diagramm unten) analog
  Rollende Körper / Zykloide.
- **Shared Design-Tokens**: `../shared/css/design-system.css` vor per-sim
  `css/styles.css` verlinkt. FH-Mint, `DM Sans`/`JetBrains Mono` via
  `--font-ui`/`--font-mono`, Okabe-Ito-Vektorfarben (`--c-sp` Auslenkung,
  `--c-vel` Geschwindigkeit, `--c-acc` Beschleunigung) mit Dark-Mode-
  Varianten.
- **Dark Mode** über einheitlichen LocalStorage-Key `fh_theme` (persistiert
  beim Navigieren Übersicht↔Sim).
- **CSV-Export** mit `sep=;`-Header, Semikolon-Trenner, Komma-Dezimal:
  „Diagramm (CSV)" exportiert die aktuell gewählte Größe,
  „Alle Daten (CSV)" den vollständigen Datensatz (t, x, v, a, E_kin, E_pot,
  E_ges).
- **Legende** in der linken Sidebar für alle farbcodierten Vektoren + Masse.
- **Vektoren default sichtbar** (Toggles `checked`), auch im Ruhezustand
  (`updateScene(0,…)` in `resetSim`).
- **Statisches MathJax**: Formeln als statisches HTML in `index.html`,
  orientierungsabhängiges \(x_0\)/\(y_0\)-Label via JS-`innerHTML`-Wechsel
  (kein Laufzeit-`typesetPromise`).
- **Physik-Schreibweise**: \(x(t)=x_0\cos(\omega t)\),
  \(v(t)=-x_0\omega\sin(\omega t)\), \(a(t)=-\omega^2 x(t)\);
  \(\omega=\sqrt{k/m}\), \(T=2\pi/\omega\).
- Horizontaler und vertikaler Aufbau (Radio), Masse- und Federdicke skalieren
  mit \(m\) bzw. \(k\), analoge Stoppuhr + LCD-Digitaluhr-Easteregg
  (Klick auf Stoppuhr schaltet um), manuelle Zeitmessung mit
  „Zeitmessung starten"-Button, Abspielgeschwindigkeit 1×/½×/¼×.
- Diagrammtyp-Dropdown (Auslenkung/Geschwindigkeit/Beschleunigung vs. Zeit)
  aus Nutzerperspektive benannt; `tAxisStep` garantiert ≥3 Ticks auf der
  t-Achse; Diagrammtitel als letztes SVG-Kind, klar über weißem Hintergrund.

### Migrations-Hinweise
- Der Prototyp `AllAnimations/federpendel.html` und der Quellordner
  `Standalone Proto/Federpendel/` wurden nach erfolgreicher Migration
  stillgelegt (Dubletten-Regel aus `BACKLOG.md`).
- Vorschaubild in `AllAnimations/Vorschaubilder/` belassen (kein
  Emoji-Platzhalter).