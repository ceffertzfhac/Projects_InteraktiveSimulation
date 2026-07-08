# Blueprint: Physik-Simulationen (FH-Standard)

Dieser Guide beschreibt den Aufbau, das Design und die technische Implementierung von interaktiven Physik-Simulationen. Ziel ist ein konsistentes „Look & Feel“ sowie eine wartbare, modulare Codebasis.

## 1. Tech-Stack & Frameworks
- **Kern:** HTML5, CSS3, Vanilla JavaScript (ES Modules).
- **Grafik:** SVG (Scalable Vector Graphics) für Simulation und Graphen.
- **Mathematik:** [MathJax 3](https://www.mathjax.org/) für Formeldarstellung.
- **Typografie:** 
  - `Syne`: Für Headlines und UI-Elemente.
  - `JetBrains Mono`: Für numerische Werte und Code-Elemente.

## 2. Projektstruktur (Modularer Aufbau)
Jede Simulation muss strikt in folgende Module unterteilt werden:

1.  `index.html`: UI-Struktur (Sidebar links, Simulation Mitte, Analyse rechts).
2.  `js/constants.js`: Physikalische Konstanten ($g, \Delta t$) und UI-Konfigurationen.
3.  `js/state.js`: Zentrales `store`-Objekt für alle mutablen Variablen und der DOM-Cache.
4.  `js/physics.js`: Analytische Berechnungen. **Wichtig:** Pfade vorab berechnen (`precompute`), statt in jedem Frame zu rechnen.
5.  `js/render.js`: Reine SVG-Logik. Trennung zwischen physikalischen Koordinaten (m) und Screen-Pixeln (px).
6.  `js/ui.js`: Event-Listener und Steuerung der Animations-Loop (`requestAnimationFrame`).

## 3. Design-System (Look & Feel)

### Farben & Themes
- **Standard:** Light Mode. **Optional:** Dark Mode.
- Farben müssen über CSS-Variablen gesteuert werden (`--bg`, `--surface`, `--accent`).
- Vektoren folgen einem festen Farbschema:
  - Geschwindigkeit $v$: Blau (`#66aaff`)
  - Beschleunigung $a$: Rot (`#ff7777`)
  - Kräfte $F$: Violett/Grün/Orange je nach Typ.
- **Vektor-Pfeilspitzen (kanonische Geometrie — eine konsistente Kombination):** Ziel: Pfeilspitze **exakt auf dem Zielpunkt** (nicht zu lang/kurz), kein Schaft seitlich aus der Spitze. Polygon `points="0 0, 5 1.75, 0 3.5"` → Basis bei local x=0, Spitze bei local x=markerWidth; `markerUnits=strokeWidth`, Marker-Länge = `markerWidth · strokeWidth` px. **Genau einmal kompensieren** mit beiden Stellschrauben zusammen:
  1. **Marker `refX = 0`** → Dreieck-Basis am Linien-Endpunkt, Spitze eine Marker-Länge nach vorn.
  2. **Schaft um Marker-Länge kürzen** via `shortenEnd(x1,y1,x2,y2, markerWidth·strokeWidth)` → gekürztes Ende = Zielpunkt − Marker-Länge.
  → Spitze exakt auf dem Zielpunkt, Schaft endet an der Dreieck-Basis, das deckend gefüllte Dreieck überdeckt die letzte Marker-Länge (kein Herausgucken). **FALSCH:** `refX=markerWidth` **plus** Kürzung = Doppelkompensation → Pfeil endet um eine Marker-Länge **zu kurz** (bekannter Halb-Fix in Lorentz/rolling_bodies/Kreisbewegung ≤v1.0.7). **Ausnahme:** Graph-Achsenpfeile (`#graph-arrowhead`) bleiben auf `refX=0` **ohne** Schaft-Kürzung (Graph-bg-Rect ist um die überstehende Spitze dimensioniert, „10 px past arrow tips"). Marker-Fills pro Vektorfarbe via CSS (`#<id> polygon { fill: var(--c-…) }`), da das Polygon sonst schwarz rendert.

### UI-Layout
- **Sidebar (Links):** Parameter-Steuerung via Slider und Radio-Buttons.
- **Main (Mitte):** 
  - Oben: SVG-Simulationsbereich.
  - Unten: SVG-Diagrammbereich.
- **Panel (Rechts):** Live-Analyse, Energiebilanz (Balkendiagramme) und Formel-Erklärungen.

### Einklappbare Analyse-Sidebar (Best Practice)

Die rechte Sidebar soll **eingeklappt** werden können, damit die Simulations-/Diagrammfläche den vollen Platz erhält. Kanonische Referenzimplementierung: **`Project_freier_fall_simulation/` ab v2.2.x**. Für neue Simulationen dieses Muster übernehmen:

**UX-Regeln (best practice):**
- Die Steuerung sitzt **am Panel selbst** als Kopfzeile (Header), nicht fern in der Topbar — Nähe signalisiert, was kontrolliert wird.
- Icon ist ein **Double-Chevron `»`/`«`** (SVG), kein Einzelpfeil — die etablierte „Sidebar ein-/ausklappen"-Metapher (Slack/IDEs). Das Icon **rotiert** beim Zustandswechsel.
- Eingeklappt bleibt ein **44 px schmaler Schienen-Streifen** mit **vertikalem Label** sichtbar — offensichtlich, dass das Panel existiert und wieder aufklappbar ist (kein `display:none`-Verschwinden).
- **Default-Zustand ist eingeklappt** — die Sim-/Diagrammfläche hat beim Laden maximal Platz.
- `aria-expanded` / `aria-controls` + `:focus-visible`-Ring für Barrierefreiheit.

**HTML-Struktur** (`index.html`):
```html
<div class="app-layout analysis-collapsed">   <!-- analysis-collapsed = Default eingeklappt -->
  ...
  <aside class="panel right-panel" id="right_panel">
    <button class="panel-header" id="analysis_toggle" type="button"
            title="Live-Analyse ein-/ausklappen" aria-expanded="false" aria-controls="right_panel">
      <span class="ph-label">Analyse</span>
      <svg class="ph-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 4 L8 8 L3 12"/><path d="M8 4 L13 8 L8 12"/>
      </svg>
    </button>
    <div class="panel-body">
      <!-- alle panel-sections (Live-Analyse, Kennwerte, Export, Physik) -->
    </div>
  </aside>
</div>
```

**CSS** (`css/styles.css`):
```css
.app-layout { display: grid; grid-template-columns: 280px 1fr 270px;
              transition: grid-template-columns .25s ease; }
.app-layout.analysis-collapsed { grid-template-columns: 280px 1fr 44px; }
/* WICHTIG: off-screen statt display:none, damit MathJax die Formeln im
   Hintergrund typesetten kann (MathJax ignoriert display:none-Elemente). */
.app-layout.analysis-collapsed .right-panel .panel-body {
  position: fixed; left: -10000px; top: 0; width: 270px; pointer-events: none;
}

.panel-header { display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 12px 16px; background: var(--surface2);
  border: none; border-bottom: 1px solid var(--border);
  cursor: pointer; transition: background .15s, color .15s;
  font-family: 'DM Sans','Verdana',sans-serif; color: var(--text2); }
.panel-header:hover { background: var(--surface3); color: var(--text); }
.panel-header:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.ph-label { font-size: .72rem; font-weight: 700; letter-spacing: .14em;
  color: var(--text3); text-transform: uppercase; }
.ph-chevron { width: 15px; height: 15px; flex-shrink: 0; transition: transform .2s ease; }

/* Eingeklappt: vertikale Schiene */
.app-layout.analysis-collapsed .panel-header {
  flex-direction: column; justify-content: center; align-items: center;
  height: 100%; padding: 14px 0; gap: 10px; border-bottom: none; }
.app-layout.analysis-collapsed .ph-label { writing-mode: vertical-rl; transform: rotate(180deg); }
.app-layout.analysis-collapsed .ph-chevron { transform: rotate(180deg); }
```

**JS** (`js/state.js` + `js/ui.js`):
```javascript
// state.js — im DOM-Cache:
DOM.analysisToggle = q('analysis_toggle');
DOM.appLayout      = document.querySelector('.app-layout');

// ui.js — Bootstrap:
DOM.analysisToggle.addEventListener('click', () => {
  const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed');
  DOM.analysisToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
});
```

**Gotchas:**
- **MathJax:** Eingeklappt darf der Body **nicht** `display:none` sein, sonst typesetted MathJax die Formeln nicht und beim Aufklappen bleibt Roh-Code sichtbar. Deshalb off-screen positionieren (`position:fixed; left:-10000px`). Die Formeln sind dann fertig gerendert, sobald der Nutzer aufklappt — kein Laufzeit-`typesetPromise` nötig.
- **SVG-Resize:** Das SVG nutzt `viewBox` + `preserveAspectRatio="xMidYMid meet"`, skaliert also beim Klappen automatisch — keine Neuberechnung (`resetSim`) nötig.
- **Default eingeklappt:** `.app-layout` im HTML die Klasse `analysis-collapsed` geben und `aria-expanded="false"` setzen; nicht erst per JS einklappen (vermeidet Aufblitzen).

### Akkordeon-Steuerungs-Sidebar (links)

Die **linke** Steuerungs-Sidebar wird — anders als die rechte Analyse-Sidebar — **nicht als Ganzes** eingeklappt (die Steuerung soll jederzeit sichtbar/bedienbar bleiben), sondern jede thematische `.panel-section` wird **einzelnes ein-/ausklappbar** gemacht (Akkordeon). Das komprimiert eine überlange Sidebar, ohne sie zu verstecken. Kanonische Referenzimplementierung: **`Project_kreis_spiralbewegung_simulation/` ab v1.3.0**. Für Simulationen mit überlanger linker Sidebar (≥ 5 Cluster oder solche, die über den unteren Rand reichen) dieses Muster übernehmen → BACKLOG I8.

**UX-Regeln (best practice):**
- Die Sidebar als Ganzes bleibt stehen; jedes `.panel-section`-Cluster ist einzeln auf-/zuklappbar.
- `.panel-label` wird zum klickbaren `<button>` mit Chevron `▾` (rotiert `-90°` → `▸` bei eingeklappt) — die etablierte Akkordeon-Metapher.
- Chevron **groß** (`1,4 rem`) für gute Sichtbarkeit/Klickbarkeit.
- `aria-expanded` pro Cluster + `:focus-visible`-Ring; `<button>` → Enter/Space nativ (kein Key-Handler nötig).
- **Default-Zustand pro Cluster:** häufig Genutztes offen (Parameter, Visualisierung, Legende, Diagramme), selten Genutztes eingeklappt (Modus & Szenarien, Abspielgeschwindigkeit/Auto-Stopp). Pro Sim neu entscheiden, nicht starr übernehmen.

**Cluster-Prinzipien (Konsolidierung & Sortierung)** — vor dem Konvertieren prüfen, sonst entstehen zu viele winzige Cluster:
- **Cluster-Inflation vermeiden:** verwandte kleine Cluster zusammenlegen (Bsp. *Abspielgeschwindigkeit + Auto-Stopp* → ein Cluster).
- **Single-Control-Cluster integrieren:** eine Sektion mit nur einem Steuerlement (Bsp. *Winkeleinheit* = nur ein Dropdown) nicht als eigene Sektion führen, sondern in einen verwandten Cluster integrieren (Bsp. *Diagramme*).
- **Legende direkt nach Visualisierung:** die Legende dokumentiert die Visualisierungs-Vektoren/Objekte → unmittelbar unter dem Visualisierungs-Cluster platzieren.
- **Diagramm-/Konfig-Cluster gruppieren:** Diagramm-Auswahl + zugehörige Anzeigeoptionen (z. B. Winkeleinheit) zusammen.
- Ziel: ~4–6 Cluster, die ohne Scrollen Überblick geben; Seltenes default weggeklappt.

**HTML-Struktur** (`index.html`) — pro `.panel-section`:
```html
<div class="panel-section collapsible collapsed">   <!-- collapsed = Default eingeklappt; ohne = offen -->
  <button class="panel-label" type="button" aria-expanded="false">   <!-- false bei collapsed, true sonst -->
    Modus &amp; Szenarien<span class="acc-chevron" aria-hidden="true">▾</span>
  </button>
  <!-- Section-Inhalt: Slider, Toggles, Selects … alles NACH .panel-label -->
</div>
```

**CSS** (`css/styles.css`):
```css
/* .panel-label wird zum Akkordeon-Header (Button). Shared .panel-label-Typografie
   (uppercase Klein-Label) bleibt erhalten; hier nur Button-Reset + Flex-Zeile. */
.panel-section.collapsible > .panel-label {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  width: 100%; margin-bottom: 11px; padding: 2px 0;
  background: transparent; border: none; text-align: left;
  font-family: var(--font-ui); cursor: pointer; user-select: none;
  transition: color .15s;
}
.panel-section.collapsible > .panel-label:hover { color: var(--text2); }
.panel-section.collapsible > .panel-label:focus-visible {
  outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 3px;
}
.acc-chevron { flex: 0 0 auto; color: var(--text3); font-size: 1.4rem; line-height: 1;
  transition: transform .2s ease; }
.panel-section.collapsed > .panel-label { margin-bottom: 0; }
.panel-section.collapsed > .panel-label .acc-chevron { transform: rotate(-90deg); }
/* !important dominiert JS-gesteuerte display:block-Kinder (#n_control_group,
   #dual_graph_control, decomp-fieldsets) — sonst blitzen sie eingeklappt durch. */
.panel-section.collapsed > .panel-label ~ * { display: none !important; }
```

**JS** (`js/ui.js` — Bootstrap, einmalig):
```javascript
// Akkordeon-Steuerungs-Sidebar: linke Cluster ein-/ausklappbar.
// .panel-label ist <button> → Enter/Space triggert click nativ.
document.querySelectorAll('.panel-section.collapsible > .panel-label').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.parentElement
    const collapsed = section.classList.toggle('collapsed')
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
  })
})
```

**Gotchas:**
- **`display:none` ist hier erlaubt** (linke Sidebar = statische MathJax-Labels, beim Laden typeset) — das off-screen-Mysterium des rechten Analyse-Panels (`position:fixed; left:-10000px`) braucht es hier **nicht**.
- **`!important` zwingend:** ohne es würden JS-gesteuerte `display:block`-Kinder (conditional sichtbare Controls wie `#n_control_group`, `#dual_graph_control`, Zerlegungs-Fieldsets) im eingeklappten Zustand durchblitzen, weil Inline-Styles die CSS-Regel sonst schlagen.
- **Geschwister-Selector `~ *`** setzt voraus, daß `.panel-label` das **erste Kind** der `.panel-section` ist (bei allen Sims der Fall) — kein zusätzlicher Content-Wrapper nötig.
- **Kein State-Verlust:** Slider-/Toggle-Werte bleiben erhalten (DOM bleibt, nur `display`) — Klappen löst kein `resetSim` aus.
- **Pro Sim** neu entscheiden, welche Cluster default eingeklappt sind (Nutzungshäufigkeit) und ob Konsolidierung nötig ist — nicht die Kreis-Spiral-Zustände starr übernehmen.

## 4. Konventionen (Mandatorisch)

### Numerik & Notation
- **Dezimaltrennzeichen:** In der UI (Texte, Slider, Labels) immer das **Komma (`,`)**.
- **SVG-Attribute:** Intern in Attributen (Pfaddaten, Koordinaten) immer der **Punkt (`.`)**.
- **Achsenbeschriftung:** Immer im Format `Physikalische Größe / Einheit` (z. B. $a 	ext{ / (m/s²)}$ oder $t 	ext{ / s}$).

### Koordinaten-Transformation
Nutze immer eine zentrale Funktion für die Umrechnung:
```javascript
function physToScreen(xLoc, yLoc) {
  return {
    x: state.store.rampStartX + xLoc * state.store.ppm,
    y: state.store.rampStartY - yLoc * state.store.ppm
  };
}
```

### Graph-Achsen (Ticks, Nulldurchgang, Format)
- **Mindestens 4 beschriftete Ticks inkl. 0 pro Achse** (Abszisse **und**
  Ordinate); mehr ist OK, solange es nicht gequetscht wirkt, **maximal 12**
  sinnvoll. Bei symmetrischem Wertebereich um 0 (Schwingungsgrößen x/v/a) ist
  die Ordinate mindestens 5 (gerade Anzahlen unmöglich bei Symmetrie).
- **Nice-Step-Folge 1-2-4-5** (nicht nur 1-2-5): die 4er-Stufe schließt die
  Lücke zwischen 2 und 5, sodaß nicht nur 3 oder 9 Ticks herauskommen,
  sondern saubere 5–9. Hilfsfunktion `niceStepLE(range, minDivs)` (größter
  Nice-Step ≤ `range/minDivs`, garantiert ≥ `minDivs` Teilstriche) mit
  `minDivs=4` für die Ordinate. Zeit-Achse: `tAxisStep(t_max)` (≥3 Divisionen
  → ≥4 Ticks inkl. 0). Beide in `render.js`, auf alle Sims übertragen.
- **Abszisse am Nulldurchgang:** Hat ein Graph einen Nulldurchgang (Wert-
  bereich umfaßt 0), wird die Abszisse **bei y=0** gezeichnet, nicht am
  unteren Plot-Rand. Die Ordinate läuft **volle Plot-Höhe**, beide Achsen
  kreuzen am Ursprung (links, Mitte). t-Tick-Labels bleiben am unteren
  Plot-Rand (unabhängig von der Abszissen-Position), Gitterlinien spannen
  volle Plot-Höhe/-Breite. Rein positiv/negativ → Achse am unteren/oberen Rand.
- **Diagramm-Format pro Layout:** Nebeneinander angeordnetes Sim+Diagramm →
  **Portrait-Graph** (z. B. 410×700), sodaß er die hohe, schmale Zelle füllt
  statt als flacher Streifen winzig zu skalieren. `plotW`/`plotH` und der
  `graph_svg`-viewBox aus der Orientierung/Layout berechnen. Gestapelt → Landscape.

## 5. Implementierungs-Workflow

1.  **Definitionsphase:** Festlegen der Eingabeparameter und der gesuchten physikalischen Größen.
2.  **State-Setup:** Alle veränderlichen Werte in `state.js` im `store`-Objekt registrieren.
3.  **Physik-Engine:** Formeln in `physics.js` implementieren. Eine `precompute()` Funktion füllt Arrays für den gesamten Zeitverlauf.
4.  **Rendering:** 
    - `drawBackground()`: Statische Elemente (Rampe, Gitter).
    - `updateScene(t)`: Animierte Elemente basierend auf Zeitstempel $t$.
5.  **UI-Integration:** Slider mit `resetSim()` verknüpfen, um bei Parameteränderung die Physik neu zu berechnen.

## 6. Checkliste für neue Simulationen
- [ ] Reagiert die Simulation auf alle Slider-Eingaben sofort (Live-Update)?
- [ ] Ist die Energiebilanz zu jedem Zeitpunkt konsistent?
- [ ] Werden im CSV-Export Kommas als Dezimaltrenner und Semicolons als Spaltentrenner genutzt?
- [ ] Beide Achsen: ≥4 beschriftete Ticks inkl. 0 (`niceStepLE`/`tAxisStep`, 1-2-4-5-Folge)?
- [ ] Abszisse am Nulldurchgang bei Werten um 0 (z. B. Schwingungsgrößen)?
- [ ] Diagramm-Format paßt zum Layout (Portrait bei nebeneinander, Landscape bei gestapelt)?
- [ ] Sind alle Formeln via MathJax korrekt gerendert?
- [ ] Ist die schiefe Ebene/Umgebung im Dark Mode gut sichtbar?

## 7. Werkzeug-Schale (Diagrammatische Werkzeuge)

Nicht jeder verlinkte Eintrag in `AllAnimations/index.html` ist eine
*Animationssimulation*. Einige sind **interaktive diagrammatische Werkzeuge**:
die SVG-Grafik *ist* die Darstellung (z. B. „Ableitung als Grenzwert",
„Geschwindigkeit als Steigung", „Grundbegriffe der Kinematik"). Für diese
gilt die Sim-Schale aus §3 *nicht* — es gibt keine Zeit-Animation, also
keine `▶ Play / ⏸ Pause / ↺ Reset`, keine Stoppuhr und keinen CSV-Export.
Solche Controls wären nicht-funktional und verwirrend.

Best-Practice: die Architektur **passt zur Interaktionsart**. Werkzeuge
bekommen eine **eigene leichte, einheitliche Schale** — ebenfalls
Token-gebunden, aber ohne Sim-Controls.

**Kriterium „Werkzeug, keine Sim":** Es gibt keine zeitliche Animation
(entweder rein statisch oder nur durch Slider-Tritt veränderlich, ohne
`requestAnimationFrame`-Loop). Beispiele im Repo: `ableitung`,
`geschwindigkeit`, `grundbegriffe_kin`.

**Aufbau (Werkzeug-Schale):**
```html
<link rel="stylesheet" href="../shared/css/design-system.css">
<style> /* nur werkzeugspezifische Ergänzungen, Tokens aus shared */ </style>

<header class="tool-topbar">
  <a class="back-btn" href="../AllAnimations/index.html">← Übersicht</a>
  <span class="tool-title">Titel <span class="version">v…</span></span>
  <button class="theme-toggle" id="theme_toggle" …></button>
</header>

<main class="tool-layout">
  <aside class="tool-controls">… Slider, Radio, Toggles …</aside>
  <section class="tool-canvas"><svg …>… die diagrammatische Darstellung …</svg></section>
</main>
```

**Verbindlich für die Werkzeug-Schale:**
- **Topbar** mit Back-Button, Titel+Version, Theme-Toggle (gleiche Tokens wie
  die Sim-Schale, einheitlicher localStorage-Key `fh_theme`).
- **Tokens** aus `shared/css/design-system.css`; Dark Mode via `body.dark`-Kaskade
  (kein separater `body.dark`-Block). UI-Text in *DM Sans*, Zahlen in
  *JetBrains Mono*.
- **Keine** Play/Pause/Reset-`.btn-row`, **keine** Stoppuhr, **kein** CSV-Export.
- **Kein** `requestAnimationFrame`-Loop; die Darstellung ändert sich nur als
  Reaktion auf Slider/Toggle-Eingaben.
- **Graph-Konventionen** wo Achsen auftreten: `setAxisLabel` / `setGraphTitle`
  (italic Größe, upright Einheit), Titel als letztes SVG-Kind, `tAxisStep` nur
  bei Zeit-Achsen (bei Werkzeugen meist N/A).
- **MathJax statisch:** Formeln als statisches HTML, kein Laufzeit-
  `typesetPromise`.
- Darf eine **Legende** (`.legend-grid`) haben, wenn farbcodierte Elemente
  vorkommen.

Werkzeuge bleiben **Einzeldatei** (kein 6-Modul-Split) — ihr Umfang ist klein
und der modulare Split würde die Übersichtlichkeit verringern statt erhöhen.
Die Schale wird *in-place* aufgezogen (Tokens + Topbar + Token-gebundene
Controls), nicht als neues `Project_/` migriert.

## 8. Migrations-Workflow: Standalone → Modular

Echte Animationssimulationen werden aus der Einzel-HTML in die kanonische
modulare Architektur (§2) überführt. Referenzimplementierung:
`Project_freier_fall_simulation/` und `Project_atwood_simulation/`.

**Schritt-für-Schritt:**

1. **Scaffold anlegen:** Neues `Project_<name>_simulation/` mit
   `index.html`, `js/{constants,state,physics,render,ui}.js`,
   `css/styles.css`, `docs/{CHANGELOG,KNOWN_LIMITATIONS}.md`.
   Kein `main.js` (neuere Sims: `js/ui.js` ist der ES-Module-Einstieg via
   `<script type="module" src="js/ui.js">`). **Bugs, Features und Tech-Schulden
   werden zentral im Repo-Root `BACKLOG.md` getrackt** (als `B#`/`F<sim>#`/`T#`),
   *nicht* in per-Sim-Dateien; `docs/KNOWN_LIMITATIONS.md` führt nur bewußte
   lokale Einschränkungen / Won't / Scope-Entscheidungen mit `→ <ID>`-Verweis
   auf `BACKLOG.md`. Siehe `## KONVENTIONEN` in `BACKLOG.md` und CLAUDE.md.
2. **`shared/css/design-system.css` einbinden** vor der per-Sim `css/styles.css`
   (DRY). Per-Sim nur noch simspezifische Tokens + SVG-Target-Regeln.
3. **Layout-Schale aufbauen** nach §3: 3-Spalten-App `280px 1fr 270px`,
   Topbar (Back-Button, Titel+Version, Theme-Toggle), linke Sidebar
   (Parameter, Visualisierungs-Toggles, **Legende** `.legend-grid`),
   `.btn-row` mit `▶ Play / ⏸ Pause / ↺ Reset`, einklappbare rechte
   Analyse-Sidebar (Default eingeklappt).
4. **State extrahieren:** Alle mutablen Variablen aus dem Einzel-`<script>`
   in `state.js` → `store` + DOM-Cache (`initDOM()`).
5. **Physik auf `precompute()` umstellen:** Per-Frame-Berechnung
   (`requestAnimationFrame` mit Live-Physik) → `precompute()` füllt Arrays
   für den gesamten Zeitverlauf; die Animations-Loop indiziert nur noch in
   diese Arrays. *(Größter Eingriff bei sims mit Per-Frame-Physik, z. B.
   `elastischerStoß`.)*
6. **Render aufspalten:** `drawBackground()` (statisch) +
   `updateScene(t)` (animiert, indiziert in precompute-Arrays); zentrale
   `physToScreen(x,y)`-Transformation.
7. **Graph-Helper übernehmen:** `setAxisLabel` / `setGraphTitle` /
   `tAxisStep` / `niceStepLE` (statt lokalem `getNiceTickStep` und direktem
   `textContent`). Titel als **letztes** SVG-Kind; Hintergrund-Rechteck 10px
   über Pfeilspitzen. **Beide Achsen ≥4 Ticks inkl. 0** (1-2-4-5-Folge),
   **Abszisse am Nulldurchgang** bei Werten um 0, **Diagramm-Format pro Layout**.
8. **MathJax statisch machen:** Laufzeit-`MathJax.typesetPromise([...])`-
   Aufrufe entfernen; alle Formeln als statisches HTML in `index.html`,
   konfigurationsabhängige Varianten als separate `<div>` mit
   `style="display:none"` (JS macht nur show/hide).
9. **Karten-Link umhängen:** In `AllAnimations/index.html` die Karte von der
   Einzel-HTML auf `../Project_<name>_simulation/index.html` umstellen;
   Vorschaubild (`Vorschaubilder/<name>.png`) bleibt erhalten.
10. **Einzel-HTML entsorgen:** Nach erfolgreicher Migration die
    Standalone-Datei aus `AllAnimations/` löschen (oder — bei noch laufender
    Abnahme — vorübergehend ins `legacy_archive/` der neuen Sim verschieben).
11. **Versions-/Changelog-Pflege:** Versionsnummer in `index.html` und
    `docs/CHANGELOG.md` synchron; Conventional-Commit
    `feat(<scope>): … migriert (vX.Y.Z)`.

**Vor der Migration prüfen (Konsolidierung statt Doppelmigration):**
- Besteht inhaltliche Überschneidung mit einer anderen Standalone oder einem
  bestehenden modularen Project? (Beispiele: `schräger_wurf`↔`zykloide3`
  teilen den Scaffold; `kreisbewegung`↔`kreiskinematik_v5` thematisch
  nah; `atwood_energy` ist eine Variante von `Project_atwood_simulation`.)
  Ggf. zusammenführen oder Energie-/Zusatz-Ansichten als Diagrammtyp-Option
  in die bestehende modulare Sim aufnehmen statt eine zweite Sim anzulegen.
- Ist es überhaupt eine Sim oder ein diagrammatisches Werkzeug (§7)?
