# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mono-repo of interactive physics simulations for FH Aachen FB 8 Physik courses. All simulations are pure client-side web apps (no build step, no npm) using Vanilla JS ES Modules, SVG for graphics, and MathJax 3 for formula rendering.

**Current simulations:**
- `Project_rolling_bodies_simulation/` — rolling bodies on inclined planes, comparing body shapes via moment of inertia
- `Project_lorentz_force_simulation/` — Lorentz force between parallel current-carrying conductors on springs
- `Project_freier_fall_simulation/` — free fall / vertical throw (migrated from Standalone v2.1.9)
- `Project_atwood_simulation/` — Atwood machine with coordinate-system fix, stopwatch, multi-graph types
- `AllAnimations/` — **global overview page** (`index.html`) listing every simulation as a card, plus the standalone prototype HTML files and their `Vorschaubilder/` preview images. Lives at repo root (moved out of `Standalone Proto/`). Modular projects link back here via `../AllAnimations/index.html`.
- `Standalone Proto/` — versioned source folders of experimental single-file HTML prototypes (historical; not the canonical versions). The runnable prototype copies live in `AllAnimations/`.

**Issue/Backlog tracking (single source of truth):** `BACKLOG.md` (repo root) is the **one** MoSCoW-prioritized tracker across all sims — bugs (`B#`), tech debt (`T#`), features (`F<sim>#` + repo-wide `I#`), standalone migrations (`M#`), and new-simulation ideas (`N#`). It replaced the per-sim `docs/issues.md`/`docs/FEATURE_BACKLOG.md` (those were retired 2026-07-08 — see `## KONVENTIONEN` at the top of `BACKLOG.md`). **Entry-point rule:** an incoming bug report is always filed as a new `B#` in `BACKLOG.md` `## BUGS`, never only in a per-sim file. Per simulation, only `docs/CHANGELOG.md` (shipped versions) and optional `docs/KNOWN_LIMITATIONS.md` (deliberate local limitations / Won't / scope decisions, with `→ <ID>` links back to `BACKLOG.md`) are kept. Check `BACKLOG.md` before starting work (known issues) and after finishing (record follow-ups). `README.md` and `AGENTS.md` are stale (pre-migration folder names) — prefer this file and `BACKLOG.md`.

## Running a Simulation

ES Modules require an HTTP server — `file://` protocol will fail due to CORS restrictions.

```bash
# From the project subfolder (e.g., Project_rolling_bodies_simulation/)
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000`. No build, no install.

## Git Workflow

Git hooks are active via `core.hooksPath = .githooks` (already configured in this repo):

- **`commit-msg`** enforces **Conventional Commits** format on the first line:
  `<typ>(<scope>): <kurzbeschreibung>` — e.g. `feat(rolling): Ghosting-Snapshots alle 0,5 s hinzugefügt`.
  - Types: `feat | fix | docs | style | refactor | chore | test | perf | ci | build | revert`
  - Scopes (optional): `lorentz | rolling | standalone | global | repo`
  - `Merge`/`Revert`/`fixup!`/`squash!` commits are skipped automatically.
- **`pre-commit`** blocks `.DS_Store`, `.AppleDouble`, and any `test.txt` from being committed. These are also in `.gitignore`. If a commit is rejected, unstage the file (`git restore --staged <datei>`) and retry.

There are no automated tests or linters — verification is manual (open in browser, check physics visually, exercise all sliders/toggles/buttons, test CSV export).

## Architecture

Every simulation follows the same module structure (`global_docs/simulation_instruction.md` is the canonical blueprint):

```
index.html          ← UI layout: sidebar (controls) | main (SVG sim + graphs) | panel (analysis)
js/
  constants.js      ← physical constants (G, DT, etc.) and UI config (colors, scale)
  state.js          ← single store object for all mutable state; DOM element cache
  physics.js        ← stateless computation; precompute() fills result arrays for the full timeline
  render.js         ← pure SVG mutation; physToScreen() converts physics coords → pixels
  ui.js             ← event handlers; owns the requestAnimationFrame animation loop
css/styles.css      ← CSS custom properties for theming; .dark / .light on <body>
docs/
  CHANGELOG.md
  KNOWN_LIMITATIONS.md   ← optional; deliberate local limitations / Won't / scope notes, with → <ID> links to BACKLOG.md
```

> Bugs, features, and tech debt are tracked **centrally** in `BACKLOG.md` (repo root), not in per-sim files. See "Issue/Backlog tracking" above and `## KONVENTIONEN` in `BACKLOG.md`.

**Data flow:** User input → `ui.js` event handler → mutate `store` in `state.js` → `physics.js` → `render.js` (`updateScene()`).

**Physics is precomputed** before animation starts (`precompute()` in `physics.js` fills arrays for the entire run). Animation frames only index into those arrays — no per-frame physics.

**Initialization sequence:** Older sims (rolling, lorentz) use a `js/main.js` entry that calls `state.initDOMCache()` → `ui.setupUI()` → `ui.resetSim()` (via setTimeout for MathJax). Newer sims (atwood, freier_fall) have **no `main.js`** — `js/ui.js` is the ES-module entry (loaded via `<script type="module" src="js/ui.js">` in `index.html`) and calls `state.initDOM()` + `resetSim()` at the bottom of the file. The DOM-cache initializer is named `initDOMCache()` in older sims and `initDOM()` in newer ones.

## Design System (FH Aachen Corporate Design)

Alle Simulationen und die Übersichtsseite verwenden einheitlich:

| Element | Wert |
|---|---|
| **Primärfarbe / Accent** | FH Aachen Mint `#00B1AC` (Pantone 326C) |
| **Accent Dark Mode** | `#00CEC9` |
| **UI-Font** | `DM Sans` (Google Fonts) — Verdana als Fallback |
| **Mono-Font** | `JetBrains Mono` (Google Fonts) — für Zahlenwerte |
| **Abgelöste Fonts** | Syne (nicht mehr verwenden) |
| **Falsche Farben** | Gold `#c49b10`, Blau `#005eb1` — nicht verwenden |

Shared CSS-Tokens: `shared/css/design-system.css` (für neue Sims und Übersichtsseite einbinden).

## Key Conventions

- **Language:** All UI text, comments, and documentation are in German.
- **Decimal separators:** Comma `,` in all UI-facing text/labels; dot `.` in SVG coordinate attributes.
- **Axis labels:** Format `Physikalische Größe / Einheit` (e.g., `t / s`, `a / (m/s²)`). Use `setAxisLabel(el, text)` to render with italic quantity and upright unit via tspan.
- **Physical quantity typography (applies everywhere — axes, titles, labels, HTML):** Variable symbols are always italic, units and descriptive words are always upright. Implementation:
  - SVG axis labels → `setAxisLabel(el, 'y₁ / cm')` — splits at ` / `, left part italic tspan, right part upright
  - SVG graph titles → `setGraphTitle(el, 'Position y₁(t)')` — splits at last space, trailing symbol expression italic tspan
  - SVG simulation labels (mass, force) → tspan with `font-style="italic"` for the symbol, upright tspan for `=value unit`
  - HTML time/value labels → `innerHTML` with `<i>t</i> = 0,00 s` — never plain `textContent` for labels with variable names
- **Coordinate transform:** Always use a central `physToScreen(x, y)` function in `render.js`. Never scatter raw pixel math.
- **State:** All mutable variables live exclusively in `state.js` → `store`. No module-level globals elsewhere.
- **Theming:** Colors via CSS custom properties (`--bg`, `--surface`, `--accent`). Vector colors are standardized: velocity = `#66aaff`, acceleration = `#ff7777`.
- **Documentation:** After every code change, update `docs/CHANGELOG.md` (and bump the version). Log bugs, features, and tech debt **centrally** in `BACKLOG.md` (repo root) as `B#`/`F#`/`T#` — not in per-sim files. Record deliberate sim-specific limitations / Won't / scope decisions in `docs/KNOWN_LIMITATIONS.md`, with `→ <ID>` links to the `BACKLOG.md` entry. An incoming bug report becomes a new `B#` in `BACKLOG.md` `## BUGS` (entry-point rule).
- **Graph background rect:** Extend 10px past axis arrow tips. With `refX=0` and `markerWidth * strokeWidth ≈ 10px`: use `y: -15, width: GRAPH_W + 15, height: GRAPH_H + 15`. Never let the white area end before the arrowheads.
- **Graph title z-order:** `<text class/id="graph_title">` must be the **last child** inside the graph SVG — after `<g class="graph_grid">`, after all `<polyline>` and `<circle>` elements. This ensures the title is rendered on top of data lines and the white background rect. Never place it before polylines/circles.
- **Graph title position:** The title must sit **clearly above** the white graph background rect, not inside it. The graph bg rect starts at `y=-15` (group-relative in FF) and `y=P.top-15` (in Atwood). Title `y` must be at least 5px above the rect top edge. Use `y="-22"` for FF (group-relative), `y="10"` for Atwood (SVG-relative with P.top=30).
- **Achsen-Ticks (beide Achsen):** Jede Achse — Abszisse (Zeit) **und** Ordinate (Wert) — müss **mindestens 4 beschriftete Ticks inklusive 0** haben; mehr ist OK, solange es nicht gequetscht wirkt, **maximal 12** sinnvoll. Bei Achsen mit Nulldurchgang (Wertebereich symmetrisch um 0, z. B. x/v/a beim Federpendel) ist die Ordinate mindestens 5 Ticks (±s, ±2s, 0 — gerade Anzahlen sind bei Symmetrie unmöglich). Verwende eine **feine 1-2-4-5-Nice-Step-Folge** (nicht nur 1-2-5): die 4er-Stufe schließt die Lücke zwischen 2 und 5, sodaß bei A=0,8 nicht nur 3 oder 9 Ticks herauskommen, sondern saubere 5–9. Hilfsfunktion `niceStepLE(range, minDivs)` (größter Nice-Step ≤ range/minDivs, garantiert ≥ minDivs Teilstriche) mit `minDivs=4` für die Ordinate. Für die Zeit-Achse weiterhin `tAxisStep(t_max)` (garantiert ≥3 Divisionen → ≥4 Ticks inkl. 0). Beide sind in `render.js` definiert und auf alle Sims zu übertragen.
- **Display values — sign convention:** Never use `Math.abs()` on directional quantities (velocity, position, acceleration). Always apply `getDisplayV()` / `getDisplayY()` / `getDisplayA()` so displayed values match the configured axis direction.
- **Abszisse am Nulldurchgang:** Hat ein Graph einen Nulldurchgang (Wertebereich umfaßt 0, z. B. Schwingungsgrößen x/v/a), wird die Abszisse (Zeitachse) **bei y=0** gezeichnet, nicht am unteren Plot-Rand. Die Ordinate (Wert-Achse) läuft **volle Plot-Höhe**, beide Achsen kreuzen am Ursprung (links, Mitte). t-Tick-Labels bleiben am unteren Plot-Rand (unabhängig von der Abszissen-Position), Gitterlinien spannen volle Plot-Höhe/-Breite. Bei rein positivem/negativem Wertebereich Achse wie gewohnt am unteren/oberen Rand.
- **Diagramm-Format pro Layout:** Bei nebeneinander angeordnetem Sim+Diagramm (z. B. vertikaler Aufbau) bekommt der Graph ein **Portrait-Format** (z. B. 410×700 statt 700×410 Landscape), sodaß er die hohe, schmale Zelle ausfüllt statt als flacher Streifen winzig zu skalieren. `plotW`/`plotH` und der `graph_svg`-viewBox werden aus der Orientierung/Layout berechnet. Gestapelte Layouts bleiben Landscape.
- **Zwei-Diagramm-Anordnung orthogonal zur Sim/Diagramm-Aufteilung** (canonical reference: Kreis-/Spiralbewegung v1.4.0, Kreisbewegung v1.1.0): Bei Sims mit Nebeneinander-/Übereinander-Layout-Umschalter **und** Zweier-Diagramm-Modus liegen die beiden Diagramme **orthogonal zur Sim/Diagramm-Aufteilung** — Nebeneinander-Layout → Diagramme rechts **übereinander** gestapelt; Übereinander-Layout → Diagramme unten **nebeneinander**. Die Mittellinie (Sim/Diagramm-Trenner, Grid-Partition) verschiebt sich nicht, nur die Anordnung *innerhalb* der Diagrammzelle. Grund: gestapelte Teilgraphen in einer breit-flachen Zelle werden sehr flach/unleserlich, nebeneinander in einer hohen Zelle winzig. Technisch in `render.js`: Geometrie-Funktion liefert pro Diagramm `cellW`/`cellH` + `off2`-Versatz; Übereinander-Dual → viewBox-Breite `2·Diagramm+Gap` + X-Versatz, Nebeneinander-Dual → viewBox-Höhe `2·Slot+Gap` + Y-Versatz. Voll-Rezept in `global_docs/simulation_instruction.md`.
- **MathJax subscripts:** Subscripts that are text abbreviations (words or acronyms like "fall", "imp", "res", "max") must use `\text{}`: e.g. `t_{\text{fall}}`, `v_{\text{imp}}`, `F_{\text{res}}`. Numeric indices or single letters need no `\text{}` (e.g. `y_1`, `y_{1,0}`).
- **SVG background:** Never add a `<rect>` background fill inside the simulation SVG. The SVG is transparent and inherits the page background (`--bg`). No `--sim-bg` token needed.
- **Play/Pause/Reset + Export (kanonische Topbar-Buttonleiste):** Play/Pause/Reset stehen **immer in der Topbar** (`topbar-right`), nicht in einer Sidebar-`btn-row` (bei schmalem Viewport sonst am unteren Bildschirmrand verschüttet). Reihenfolge: Theme-Toggle (`theme-toggle-wrap`) · `▶ Play` (`.btn.primary`) · `⏸ Pause` (`.btn`) · `↺ Reset` (`.btn`) · `Diagramm (CSV)` (`.btn`) · `Alle Daten (CSV)` (`.btn`). Export-Buttons als `.btn` (nicht `.btn.small`) — gleiche Höhe wie Play/Pause/Reset, kein optischer Störpunkt. Reset darf im Header stehen (alte Regel hinfällig). Ausnahme: Sims ohne Start/Stop-Button (z. B. Lorentz, statisches Gleichgewicht) führen nur Theme-Toggle + Reset in der Topbar.
- **Sidebar widths:** All simulations use `grid-template-columns: 280px 1fr 270px`.
- **Einklappbare Analyse-Sidebar (canonical reference: Freier Fall v2.2.x):** The right panel is collapsible via a header toggle on the panel itself (Double-Chevron `»`/`«`, rotating; control sits on the panel, not in the topbar). Collapsed state = 44 px vertical rail with rotated label (stays discoverable); **default is collapsed**. Body is hidden off-screen (`position:fixed; left:-10000px`), **never `display:none`** — MathJax must typeset the formulas in the background so they're rendered when expanded. Full HTML/CSS/JS recipe + gotchas in `global_docs/simulation_instruction.md` § "Einklappbare Analyse-Sidebar". Apply to all future simulations.
- **Hover-Werte am Zeit-Diagramm (canonical reference: Zykloide v1.1.0, → BACKLOG I5):** Mouseover über ein Wert-vs.-Zeit-Diagramm zeigt einen Cursor (gestrichelte Führungslinie + hohle Ring-Punkte je Subjekt, unterscheidbar vom gefüllten Wiedergabe-Marker) und ein Tooltip mit den exakten Werten zum gehoverten Zeitpunkt, via bestehendem `interpolateAt(t)` — keine neue Interpolation. Neues `shared/js/hover.js` (`svgLocalPoint`/`attachGraphHover`): CTM wird auf dem **Hit-Rect selbst** aufgerufen, nie auf dem äußeren `<svg>`, damit dieselbe Funktion unverändert bei eigener Graph-SVG, bei einer Graph-Gruppe in einer geteilten Szene-SVG und bei transformierten Dual-Graph-Slots funktioniert. Hit-Rect-Geometrie wird bei jedem Zeichnen aus denselben Lokalen wie `scaleT`/`scaleY` synchronisiert (nie hartkodiert) und lebt als stabiles Geschwister-Element außerhalb der oft per `innerHTML=''` weggeworfenen Grid-Gruppe. Cursor bleibt auf den bereits gezeichneten Kurvenabschnitt geklammert (`t ∈ [0, min(time_range, simulatedTime)]`); bei wachsendem/scrollendem Zeitfenster korrigiert sich ein offener Hover am Ende jeder Zeichenfunktion selbst nach (`if (store.hoverActive) updateGraphHover(...)`). Räumliche/nicht-monotone Bahnkurven-Diagramme sind out of scope (Nearest-Point-Suche nötig, separates Feature). Voll-Rezept in `global_docs/simulation_instruction.md` § "Hover-Werte am Zeit-Diagramm". **Rollout abgeschlossen** (Rollende Körper v2.1.0, Schräger Wurf v1.3.0, Kreis-/Spiralbewegung v1.5.0) — je eine sim-spezifische Anpassung: Rollende Körper schließt Vergleichskörper aus; Schräger Wurf hat 3 Diagramm-Slots als `<g>`s in derselben Szene-SVG; Kreis-/Spiralbewegung braucht wegen `innerHTML=''`-Vollleerung eigene Geschwister-Gruppen für Hit-Rect/Overlay statt verschachtelter Kinder.
- **Akkordeon-Steuerungs-Sidebar links (canonical reference: Kreis-/Spiralbewegung v1.3.0):** The **left** control sidebar is **not** collapsed as a whole (controls must stay reachable); instead each `.panel-section` cluster is individually collapsible (accordion). `.panel-label` becomes a `<button>` with a large chevron `▾` (rotates `-90°`→`▸` when collapsed) + `aria-expanded`; content hidden via `.panel-section.collapsed > .panel-label ~ * { display: none !important }` — the `!important` is required so JS-toggled `display:block` children don't bleed through when collapsed. `display:none` is safe here (left sidebar = static MathJax labels, typeset at load — no off-screen trick needed, unlike the right analysis panel). **Cluster-Prinzipien vor dem Konvertieren prüfen:** verwandte kleine Cluster zusammenlegen, Single-Control-Sektionen integrieren, Legende direkt nach Visualisierung, ~4–6 Cluster anstreben; default eingeklappt = selten Genutztes. Per sim neu entscheiden which clusters default-collapsed. Full recipe + Gotchas in `global_docs/simulation_instruction.md` § "Akkordeon-Steuerungs-Sidebar". Apply to sims with overlong left sidebars → BACKLOG I8.
- **Preview images (AllAnimations):** When migrating a simulation to modular architecture, keep the existing `Vorschaubilder/<name>.png` — never replace it with an emoji placeholder. Only swap when the Product Owner delivers a new image explicitly.
- **Versioning:** Every code change to a simulation must bump the version in `docs/CHANGELOG.md` (patch = bugfix/style, minor = new feature). The version string in `index.html` (e.g. `v2.0.1`) must match.
- **Force vector colors (colorblind-safe, Okabe-Ito):** Use `--c-fg: #0072b2` (gravity, blue), `--c-fn: #e69f00` (tension, orange), `--c-fr: #cc79a7` (net force, mauve). Dark mode: `#56b4e9` / `#f0e442` / `#e078c3`. Never use purple+green+orange together — indistinguishable for red-green colorblind users.
- **SVG-Text-Labels nie stroke-tragende `vec-*`-Klasse mit den Linien teilen (Faux-Bold-Bug):** Vektor-Linien-Klassen (`.vec-gravity`, `.vec-tension`, `.vec-vel`, …) setzen `stroke: <farbe>`. Trägt ein `<text>`-Label dieselbe Klasse (z. B. `class="force-label vec-tension"`, um dieselbe Farbe als `fill` zu bekommen), erbt es auch den `stroke` → SVG malt eine 1-px-Kontur in Füllfarbe um jeden Glyphen, der Text wirkt **fett / „doppelt gezeichnet"** (klassenloser Text mit reinem inline-`fill` sieht dagegen dünn/korrekt aus — genau dieser Unterschied entlarvt den Bug). Fix: die Text-Label-Klasse (`.force-label`, `.comp-val`) explizit auf `stroke: none` setzen, ODER dem Text eine eigene, nicht-stroke-tragende Klasse geben und die Farbe separat als `fill` vergeben. Betraf 3massen ≤ v1.0.7; Zykloide ist sauber (eigene `tick-label`/`axis-label`-Klassen).
- **Force naming conventions (FH Aachen FB 8):** Seilkraft = `F_S`, Resultierende/Gesamtkraft = `F_{\text{ges}}`, Schwerkraft = `F_G`. Do not use `F_T` or `F_{\text{res}}`.
- **Stopwatch design (canonical reference: Atwood v2.0.x):** Two-hand design. Main face `r=60`, 60 tick marks, main hand rotates 1 rev/60s (color: `--text`). Subdial at `cy=25` r=13`, 10 tick marks, sub hand rotates 1 rev/s (color: `--accent`). Group transform: `translate(340, 55) scale(0.7)`. Sub hand resets to 12 o'clock (`x2=0, y2=13`). Apply this design to all future simulations.
- **Datenexport-Position:** Die Export-Buttons (Diagramm CSV / Alle Daten CSV) stehen in der **Topbar** als Teil der kanonischen Buttonleiste (rechts, nach Reset) — nicht in der Sidebar. „Diagramm (CSV)" exportiert die aktuell gewählte Größe für die aktiven Subjekte, „Alle Daten (CSV)" den Vollständigen Datensatz.
- **Koordinatensystem-Konsistenz:** Lineal/Messinstument, Diagramm, Regler-Anzeigewert und Live-Panel müssen alle **dieselbe physikalische Koordinate** zeigen. Interne Berechnungskoordinaten dürfen abweichen, aber alle nutzersetig sichtbaren Werte müssen einheitlich umgerechnet sein. Beispiel Atwood: Überall „Höhe vom Boden in cm" — niemals intern „Abstand von Apertur" mischen.
- **Lineal / Messgeräte-Nullpunkt:** Der Nullpunkt eines Lineals oder Messgeräts liegt am **physikalisch natürlichen Null** — bei Höhen immer unten (Boden = 0). Skala wächst in Richtung des physikalisch Positiven (oben = mehr Höhe).
- **Regler-Richtung:** Schieberegler für physikalische Größen müssen **intuitiv orientiert** sein: rechts schieben = größerer Wert im physikalischen Sinne (mehr Höhe, mehr Masse, mehr Geschwindigkeit). Slider-`min`/`max` und der intern gespeicherte Wert müssen ggf. umgerechnet werden, damit die Anzeigerichtung stimmt.
- **Diagrammtyp-Beschriftungen:** Dropdown-Optionen werden aus der **Nutzerperspektive** benannt, nicht aus der mathematisch-internen Perspektive. Beschreibend und konkret: „Abstand der Massen" statt „Positionsdifferenz", „Verschiebung ab Start" statt „yrel". Subscript-Symbole (Δy, v₁) ergänzen den Klartext, ersetzen ihn aber nicht.
- **Legende:** Jede Simulation mit farbig codierten Objekten oder Vektoren besitzt eine **Legende** in der linken Sidebar (nach den Visualisierungs-Toggles). Format: `.legend-grid` mit `.legend-swatch` (farbiger Kreis) + `.legend-label` (MathJax-Label). Gilt für Massen, Kräftevektoren, Bewegungsvektoren.
- **Vektoren standardmäßig sichtbar:** Visualisierungs-Toggles für Vektoren sind **beim Start aktiviert** (`checked`-Attribut im HTML). Vektoren werden auch im Ruhezustand (t=0) gezeichnet — `updateScene(0, ...)` in `resetSim()` aufrufen statt explizit zu verstecken.
- **Vektor-Pfeilspitzen (kanonische Geometrie — eine konsistente Kombination, KEINE Doppelkompensation):** Simulations-Vektoren (Ort/Geschwindigkeit/Beschleunigung + ihre x/y-Komponenten) sollen mit der Pfeilspitze **exakt auf dem Zielpunkt** enden (nicht zu lang, nicht zu kurz) und dürfen keinen Schaft seitlich aus der Spitze zeigen. Das Polygon `points="0 0, 5 1.75, 0 3.5"` hat die **Basis bei local x=0** und die **Spitze bei local x=markerWidth (=5)**; `markerUnits=strokeWidth` skaliert alles mit `strokeWidth`, Marker-Länge = `markerWidth · strokeWidth` px. Zwei Stellschrauben, die **zusammen genau einmal** kompensiert werden müssen:
  1. **Marker `refX = 0`** → die Dreieck-**Basis** sitzt am Linien-Endpunkt, die Spitze läuft eine Marker-Länge in Vektor-Richtung nach vorn.
  2. **Schaft am Endpunkt um die Marker-Länge kürzen** via `shortenEnd(x1,y1,x2,y2, markerWidth·strokeWidth)` → das gekürzte Linien-Ende liegt beim Zielpunkt **minus** Marker-Länge.
  Ergebnis: Die Spitze landet exakt **auf** dem Zielpunkt, der Schaft endet an der Dreieck-Basis, das deckend gefüllte Dreieck überdeckt die letzte Marker-Länge vollständig (kein seitliches Herausgucken). Marker-Fills pro Vektorfarbe via CSS (`#<id> polygon { fill: var(--c-…) }`), da das Polygon sonst schwarz rendert.
  - **FALSCH (bekannter, in Lorentz/rolling_bodies/Kreisbewegung ≤v1.0.7 nur halb gefixter Bug):** `refX = markerWidth` **zusammen mit** Schaft-Kürzung — das ist Doppelkompensation: `refX=markerWidth` setzt die Spitze schon ans Linien-Ende, die zusätzliche Kürzung zieht sie um eine Marker-Länge **hinter** den Zielpunkt → Pfeil endet **zu kurz** (z. B. Ortsvektor endet am Rand statt im Zentrum des Massenpunkts). Ebenso falsch: `refX=markerWidth` **ohne** Kürzung → Spitze am Ziel, aber nahe der Spitze ist das Dreieck schmaler als der `1·strokeWidth`-Schaft, die Schaft-Kanten gucken seitlich heraus. Nur die Kombination (1)+(2) oben ist korrekt.
  - **Ausnahme:** Graph-Achsenpfeile (`#graph-arrowhead`) bleiben bewußt auf `refX=0` **ohne** Schaft-Kürzung, weil das Graph-bg-Rect um die (dann überstehende) Pfeilspitze herum dimensioniert ist (Regel „10 px past arrow tips").
- **MathJax — statisch statt dynamisch:** Formeln immer als statisches HTML in `index.html` schreiben, nicht per JS-`innerHTML` einfügen. MathJax rendert beim Seitenstart alle DOM-Elemente zuverlässig. Für konfigurationsabhängige Varianten (z. B. unterschiedliche Vorzeichen je nach Achsenrichtung): alle Varianten als separate `<div id="pf_...">` in die Seite schreiben, Standard-Variante sichtbar, alle anderen `style="display:none"`. JS macht nur `el.style.display` show/hide — kein `typesetPromise`-Aufruf zur Laufzeit.
- **Standalone-Prototypen (`AllAnimations/*.html` + Taschenrechner) — Design-System-Anbindung:** `<link rel="stylesheet" href="../shared/css/design-system.css">` (Taschenrechner: `../../shared/`) **vor** dem Inline-`<style>` einbinden. Surface-/Text-/Border-Vars (`--bg-color`/`--text-color`/`--control-bg`/`--label-color`/`--border-color` o. Ä.) als Alias auf shared Tokens (`var(--bg)`/`var(--surface)`/`var(--text)`/`var(--text2)`/`var(--border)`) mappen — **zwingend auf `body` (nicht `:root`)**. Grund: CSS-Variablen lösen **eager** am deklarierenden Element; Kinder erben den bereits aufgelösten Wert (W3C css-variables-1, CSSWG #2793). Da `body.dark` die Tokens auf `body` redefiniert, würde ein Remap auf `:root` `var(--bg)` mit dem **Light**-Wert einfrieren → Dark Mode greift nicht (war der R4/R5/R6-Fehler, s. Session 2026-07-08). Auf `body` deklariert, wird mit der `body.dark`-Kaskade korrekt (dark/light) aufgelöst und an die Kinder vererbt — **kein separater `body.dark`-Block** nötig. Konstante Marken-/Akzentfarben (`--fh-blue: var(--fh-mint)`, `--fh-red`, `--fh-green`, Plot-/Vektorfarben) dürfen auf `:root` bleiben, da sie nicht dark-mode-abhängig sind. Markenfarbe `#005eb1` → `var(--fh-mint)` (in CSS) bzw. `#00B1AC` (literales Hex in SVG-`fill`/`stroke`-Attributen — `var()` funktioniert **nicht** als SVG-Attribut). Font-Stacks: `system-ui,…` → `var(--font-ui)`, `monospace` → `var(--font-mono)`. Plot-/Vektor-/Körperfarben als lokale Hex belassen. Fixed Back-Button (`← Übersicht`) + Theme-Toggle als `position:fixed`-Overlay direkt nach `<body>` (stört zentrierte Flex-Layouts nicht). Pro Datei bewerten, welche Elemente sinnvoll sind — nicht jeder Prototyp braucht Back-Button/Toggle/Dark Mode (z. B. rein Diagrammatisches); unpassende weglassen.
- **Dark-Mode-LocalStorage-Key:** Einheitlich `fh_theme` (Unterstrich) auf **allen** Seiten (Übersicht, Standalones, Taschenrechner), damit der Dark-Mode-Status beim Navigieren Übersicht↔Sim persistiert. Nicht `fh-theme` (Bindestrich) o. Ä.
- **Kategorialfarben (Punkte/Objekte P1–P4, Schwerpunkt SP, v/a-Vektoren):** aus shared beziehen — `--c-p1`/`--c-p2`/`--c-p3`/`--c-p4`, `--c-sp`, `--c-vel` (Geschwindigkeit), `--c-acc` (Beschleunigung); jeweils mit Dark-Mode-Varianten. Keine Bulma-Palette (`#485fc7`/`#48c78e`/`#f14668`/`#ffae42`) oder ad-hoc-Hex für kategorial codierte Objekte verwenden.

## Code Style

- ES6+: `const`/`let`, arrow functions, template literals, no semicolons
- `'use strict'` at the top of each module
- Naming: `UPPER_SNAKE_CASE` for constants, `camelCase` for variables/functions, `snake_case` for DOM IDs, `_prefix` for module-private variables
- Max line length ~100 characters

## Adding a New Simulation

Follow the blueprint in `global_docs/simulation_instruction.md`. Scaffold the six-module structure above (per-sim docs = `docs/CHANGELOG.md` + optional `docs/KNOWN_LIMITATIONS.md`; bugs/features/tech-debt go in the repo-root `BACKLOG.md`, not per-sim files), then:
1. Define inputs/outputs in `constants.js`
2. Register all mutable state in `state.js`
3. Implement `precompute()` in `physics.js`
4. Implement `drawBackground()` (static SVG) and `updateScene(t)` (animated) in `render.js`
5. Wire sliders to `resetSim()` in `ui.js`

Checklist before shipping:
- [ ] Live-Slider-Updates (Reset bei jeder Parameteränderung)
- [ ] Koordinatensystem-Konsistenz: Lineal = Diagramm = Regler-Label = Live-Panel
- [ ] Regler-Richtung intuitiv (rechts = physikalisch größer)
- [ ] Vektoren beim Start sichtbar (Toggles `checked`, `updateScene(0,…)` in `resetSim`)
- [ ] Legende vorhanden für alle farbigen Objekte/Vektoren
- [ ] Diagrammtitel: letztes SVG-Element, klar über weißem Hintergrund
- [ ] Beide Achsen: ≥4 beschriftete Ticks inkl. 0 (`niceStepLE`/`tAxisStep`)
- [ ] Abszisse am Nulldurchgang bei Werten um 0 (z. B. Schwingungsgrößen)
- [ ] Dropdown-Labels aus Nutzerperspektive benannt
- [ ] CSV-Export: `;` Trenner, `,` Dezimal, alle anzeigbaren Typen abgedeckt
- [ ] MathJax-Formeln rendern (statisch, kein dynamic typesetPromise)
- [ ] Dark Mode lesbar (alle Farben via CSS Custom Properties)
- [ ] Physikalische Größen kursiv überall (setAxisLabel, setGraphTitle, `<i>`)
- [ ] Versionsnummer in `index.html` und `docs/CHANGELOG.md` synchron
