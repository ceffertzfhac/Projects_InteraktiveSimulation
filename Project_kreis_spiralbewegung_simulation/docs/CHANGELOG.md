# Changelog — Kreis- und Spiralbewegung

Versionierung: patch = Bugfix/Style, minor = neues Feature, major = brechende Änderung.
Die Version in `index.html` ist mit der neuesten Changelog-Version synchron gehalten.

## [1.1.0] — 2026-07-08
### Neu / Behoben (6 Kreis-Spiral-Punkte → BACKLOG B7–B11, FX6)
- **B7 — Bewegungsparameter-Layout:** Jeder Parameter ist nun eine
  eigenständige `.param-row` (Label | Slider | Wert). `display:none` auf der
  ganzen `v_r`-Zeile (Kreis-Modus) entfernt alle drei Zellen gemeinsam — das
  bisherige CSS-Grid-Auto-Place-Verschieben (Beschriftungen unsichtbar,
  Regler unterschiedlich lang/versetzt) ist behoben. Regler einheitlich
  vollbreit, Wert-Spalte 72 px.
- **B8 — Visualisierung-Anordnung:** `.vis-control` ist jetzt Flex mit
  linksbündigem Label (min-width 84 px) und vollbreitem, lesbarer Dropdown
  (`font-size .82rem`, padding angepaßt). Betrifft Ansicht/Modus/Szenario/
  Winkeleinheit/Diagramm/Anordnung einheitlich.
- **FX6 — Anordnung Sim/Diagramm:** Umschalter „untereinander / nebeneinander"
  (`#layout_mode_select`) in der Diagramme-Sektion. Nebeneinander schaltet
  `.center-area` auf `grid-template-columns: 1fr 1fr` (mit Trennlinie rechts);
  der Graph bekommt Portrait-Geometrie (`graphGeom()`, 460×560/280), um die
  hohe schmale Zelle auszufüllen. Wechsel ist reiner Redraw (kein Reset).
- **B9 — Dynamische Achseneinteilung:** Ordinante nutzt `niceStepLE(range,
  minDivs)` (1-2-4-5-Serie, ≥4 Teilstriche dual / ≥6 single) statt der
  1-2-5-`getNiceTickStep`-Variante; schließt die Lücke zwischen 2 und 5.
- **B10 — Diagramm-Flächenausnutzung:** Plot-Breite/-Höhe und viewBox werden
  aus der layout-abhängigen Geometrie berechnet (Portrait im Seitenmodus),
  `applyGraphLayout()` setzt viewBox + Gruppe-2-Transform pro Zeichnung.
- **B11 — Physik-Analyse-Tab:** Dritte statische MathJax-Variante
  `#formulas_kreis_acc` für Kreis mit \(\alpha\neq0\) (\(\varphi(t)\) mit
  \(\tfrac12\alpha t^2\), Tangentialbeschl. \(a_t=R|\alpha|\),
  \(|\vec a|=R\sqrt{\omega^4+\alpha^2}\)). Umschaltung reagiert live auf den
  \(\alpha\)-Regler (gleichförmig ↔ ungleichförmig), kein Laufzeit-Typeset.

## [1.0.0] — 2026-07-08
### Neu (Migration von `AllAnimations/kreiskinematik_v5.html`)
- Modularisierung der 1479-Zeilen-Standalonedatei in den kanonischen 6-Module-
  Scaffold (`constants`/`state`/`physics`/`render`/`ui` + `css/styles.css`),
  ES-Module-Entry via `js/ui.js` (kein `main.js`), 3-Spalten-Layout 280/1fr/270
  mit einklappbarer Analyse-Sidebar (§3/§8 Blueprint).
- **Dark Mode repariert:** shared Tokens (`--bg`, `--surface`, `--text`, …)
  werden direkt genutzt, kein `:root`-Remap mehr (der in der Quelldatei den
  Light-Wert einfror — CSS-Variablen lösen eager am deklarierenden Element).
  Sim-spezifische Tokens (`--c-r`/`--c-v`/`--c-a`/`--c-omega`/`--c-alpha`/
  `--c-phi`, `--graph-bg`, `--disk-fill`, …) mit `body.dark`-Varianten.
- **Statisches MathJax:** Radius-Label \(R\)/\(R_0\) und Physik-Formelbox als
  zwei `display`-umgeschaltete Varianten — kein `MathJax.typeset` zur Laufzeit.
- **Kanonische Vektor-Pfeilspitzen** (`refX=0` + `shortenEnd`): Haupt- und
  Polar-Komponentenvektoren enden mit der Spitze exakt auf dem Zielpunkt
  (Quelldatei hatte `refX=markerWidth`-Halbfertig-Varianten und einen
  `EXTENSION_PX=10`-Workaround, der entfallen ist).
- **Graph-Konventionen** (`setAxisLabel`/`setGraphTitle`): kursive Größe,
  uprechte Einheit; Titel als letztes SVG-Kind; Abszisse bei \(y=0\) für
  symmetrische Größen (x/y/vx/vy/ax/ay); t-Tick-Labels am unteren Rand;
  Graph-bg-Rect; ≥4 Ticks via `getNiceTickStep`/`tAxisStep`.
- **Precompute auf festes 120 s-Horizont** (statt extend-on-the-fly); Spiral-
  \(R\to0\)-Wächter bricht die Precompute-Schleife ab → `effectiveDuration`
  als konsistentes Cap (interpolateAt, Graph-t_max, CSV-Länge, animate).
- Physik unverändert (analytisch geschlossen): \(\omega(t)=\omega_0+\alpha t\),
  \(\varphi(t)=\varphi_0+\omega_0 t+\tfrac12\alpha t^2\), \(R(t)=R_0+v_r t\)
  (Spirale), v/a mit Coriolis-Term. Auto-Stopp via analytischer Quadrat-Lösung.
- Features portiert: 2D/ISO-Ansicht, kartesische + polare Vektorzerlegung,
  \(\vec{a}_t\) 10×-Skalierung, \(\omega\)/\(\alpha\)-Vektoren (ISO), \(\varphi\)-
  Bogen, Bahnverlauf, Auto-Stopp (n·90°), 4 Szenarien-Presets, deg/rad-Umschalt,
  Ein-/Zwei-Diagramm-Modus, 13 wählbare Größen, CSV-Export (Diagramm + alle
  14 Spalten), Stoppuhr, Auto-Zoom.

### Bekannte Einschränkungen (siehe `issues.md`)
- Farbpalette (Violett+Orange+Grün) bewusst nicht Okabe-Ito-normalisiert
  (Parität zur Quelldatei); Angleichung ist Folge-Aufgabe.
- Stoppuhr ohne kanonische Atwood-Subdial (Quelldatei hat nur Hauptzeiger).