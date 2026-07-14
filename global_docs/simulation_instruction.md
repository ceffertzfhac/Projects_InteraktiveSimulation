# Blueprint: Physik-Simulationen (FH-Standard)

Dieser Guide beschreibt den Aufbau, das Design und die technische Implementierung von interaktiven Physik-Simulationen. Ziel ist ein konsistentes „Look & Feel“ sowie eine wartbare, modulare Codebasis.

## 1. Tech-Stack & Frameworks
- **Kern:** HTML5, CSS3, Vanilla JavaScript (ES Modules).
- **Grafik:** SVG (Scalable Vector Graphics) für Simulation und Graphen.
- **Mathematik:** [MathJax 3](https://www.mathjax.org/) für Formeldarstellung.
- **Typografie:**
  - `DM Sans` (Fallback Verdana): Für UI-Text, Headlines und Labels.
  - `JetBrains Mono`: Für numerische Werte und Code-Elemente.
  - *`Syne` ist abgelöst und wird **nicht mehr** verwendet.*
- **Design-System:** Alle Tokens (Farben, Fonts, Layout) aus `shared/css/design-system.css` beziehen; Akzent = FH Aachen Mint `#00B1AC` (Dark Mode `#00CEC9`).

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
- Farben müssen über CSS-Variablen (Shared-Tokens) gesteuert werden (`--bg`, `--surface`, `--accent`) — **nie** feste Hex, damit Dark Mode greift.
- Vektoren folgen einem festen Farbschema über Shared-Tokens (mit Dark-Mode-Varianten):
  - Geschwindigkeit $v$: `--c-vel` (Blau; Light `#2060d0`, Dark `#66aaff`)
  - Beschleunigung $a$: `--c-acc` (Rot; Light `#c03030`, Dark `#ff7777`)
  - Kräfte — **colorblind-safe Okabe-Ito**, **nie** Violett+Grün+Orange zusammen (für Rot-Grün-Blinde ununterscheidbar):
    - Schwerkraft $F_G$: `--c-fg` (Blau `#0072b2`)
    - Seil-/Normalkraft $F_S$/$F_N$: `--c-fn` (Orange `#e69f00`)
    - Resultierende $F_{\text{ges}}$: `--c-fr` (Mauve `#cc79a7`)
  - Kraft-Namen: Seilkraft `F_S`, Resultierende `F_{\text{ges}}`, Schwerkraft `F_G` — **nicht** `F_T`/`F_{\text{res}}`.
- **Vektor-Pfeilspitzen (kanonische Geometrie — eine konsistente Kombination):** Ziel: Pfeilspitze **exakt auf dem Zielpunkt** (nicht zu lang/kurz), kein Schaft seitlich aus der Spitze. Polygon `points="0 0, 5 1.75, 0 3.5"` → Basis bei local x=0, Spitze bei local x=markerWidth; `markerUnits=strokeWidth`, Marker-Länge = `markerWidth · strokeWidth` px. **Genau einmal kompensieren** mit beiden Stellschrauben zusammen:
  1. **Marker `refX = 0`** → Dreieck-Basis am Linien-Endpunkt, Spitze eine Marker-Länge nach vorn.
  2. **Schaft um Marker-Länge kürzen** via `shortenEnd(x1,y1,x2,y2, markerWidth·strokeWidth)` → gekürztes Ende = Zielpunkt − Marker-Länge.
  → Spitze exakt auf dem Zielpunkt, Schaft endet an der Dreieck-Basis, das deckend gefüllte Dreieck überdeckt die letzte Marker-Länge (kein Herausgucken). **FALSCH:** `refX=markerWidth` **plus** Kürzung = Doppelkompensation → Pfeil endet um eine Marker-Länge **zu kurz** (bekannter Halb-Fix in Lorentz/rolling_bodies/Kreisbewegung ≤v1.0.7). **Ausnahme:** Graph-Achsenpfeile (`#graph-arrowhead`) bleiben auf `refX=0` **ohne** Schaft-Kürzung (Graph-bg-Rect ist um die überstehende Spitze dimensioniert, „10 px past arrow tips"). Marker-Fills pro Vektorfarbe via CSS (`#<id> polygon { fill: var(--c-…) }`), da das Polygon sonst schwarz rendert.
  - **Zu kurze Vektoren (`len ≤ by`, → BACKLOG B23):** `shortenEnd()` (in `shared/js/vectors.js`) gibt bei Vektorlängen ≤ Marker-Länge **`null`** zurück — mit festem Marker ist es geometrisch unmöglich, die Spitze aufs Ziel zu klemmen (der Schaft bräuchte negative Länge). Aufrufer **müssen** null abfangen und den Vektor verbergen (`if (!end) { el.style.visibility='hidden'; return }`, bzw. bei build-and-return-Helfern eine `display:'none'`-Linie zurückgeben) — kein Pfeil bei zu kurzem Vektor statt fehlerhafter Überschieß-Spitze. Ausnahme: Pfeile mit fester Länge ≫ Marker-Länge (Achsen, Legenden-Swatches, log-skalierte Lorentz-Kraft-/Strompfeile) erreichen `len ≤ by` nie und brauchen keinen null-Check.

### UI-Layout
- **Topbar (oben, `topbar-right`):** kanonische Buttonleiste in fester Reihenfolge — Theme-Toggle · `▶ Play` (`.btn.primary`) · `⏸ Pause` · `↺ Reset` · `Diagramm (CSV)` · `Alle Daten (CSV)`. Play/Pause/Reset **gehören in die Topbar**, **nicht** in eine Sidebar-`.btn-row` (bei schmalem Viewport sonst am unteren Bildschirmrand verschüttet). Export-Buttons als `.btn` (nicht `.btn.small`). Sims ohne Zeit-Animation (Lorentz, statisches Gleichgewicht) führen nur Theme-Toggle + Reset.
- **Sidebar (Links):** Parameter-Steuerung via Slider und Radio-Buttons, Visualisierungs-Toggles, **Legende** (`.legend-grid`) für alle farbcodierten Objekte/Vektoren.
- **Main (Mitte):** 
  - Oben: SVG-Simulationsbereich.
  - Unten: SVG-Diagrammbereich.
- **Panel (Rechts):** Live-Analyse, Energiebilanz (Balkendiagramme) und Formel-Erklärungen (einklappbar, Default eingeklappt).

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

> **Maßgeblich ist die Repo-Root `CLAUDE.md`** — bei Widersprüchen gilt sie. Dieser Blueprint fasst die Sim-Aufbau-Regeln zusammen; die vollständige Konventionsliste (inkl. der folgenden Punkte) steht dort:
> - **Stoppuhr-Design** (kanonisch: Atwood v2.0.x) — Zweizeiger, Hauptzifferblatt `r=60` + Subdial, `translate(340,55) scale(0.7)`.
> - **Faux-Bold-Bug:** SVG-`<text>`-Labels nie eine stroke-tragende `vec-*`-Klasse mit den Linien teilen (`.force-label`/`.comp-val` explizit `stroke:none`) — sonst 1-px-Kontur → „fett".
> - **MathJax-Subscripts:** Wort-/Akronym-Indizes mit `\text{}` (`t_{\text{fall}}`, `F_{\text{ges}}`); numerische/Einzelbuchstaben-Indizes ohne (`y_1`).
> - **Anzeigewerte-Vorzeichen:** nie `Math.abs()` auf gerichtete Größen — `getDisplayV()`/`getDisplayY()`/`getDisplayA()` gemäß Achsenrichtung.
> - **Lineal-/Regler-/Diagramm-Konsistenz**, **Legende** für alle farbcodierten Objekte, **Standalone-Design-System-Anbindung** (Remap auf `body`, nicht `:root`), **Webpage-Deploy-Sync** (`scripts/sync-webpage.sh` vor Commit).

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
- **Zwei-Diagramm-Anordnung orthogonal zur Sim/Diagramm-Aufteilung** (kanonische
  Referenz: Kreis-/Spiralbewegung v1.4.0, Kreisbewegung v1.1.0): Hat eine Simulation
  einen Nebeneinander-/Übereinander-Layout-Umschalter **und** einen Zweier-Diagramm-Modus,
  liegen die beiden Diagramme **orthogonal zur Sim/Diagramm-Aufteilung** — sie füllen
  die Form des Diagrammbereichs, die Mittellinie (Sim/Diagramm-Trenner = Grid-Partition)
  verschiebt sich nicht, nur die Anordnung *innerhalb* der Diagrammzelle:
  | Layout | Sim | zwei Diagramme |
  |---|---|---|
  | **Nebeneinander** (Diagrammzelle hoch) | links | rechts **übereinander** gestapelt |
  | **Übereinander** (Diagrammzelle breit-flach) | oben | unten **nebeneinander** |
  Grund: übereinander gestapelte Teilgraphen in einer *breit-flachen* Zelle werden
  sehr flach und schlecht lesbar; nebeneinander in einer *hohen* Zelle würden winzig.
  Technisch (in `render.js`): eine Geometrie-Funktion liefert pro Diagramm `cellW`/
  `cellH` + `off2`-Versatz für die zweite Diagrammgruppe. Übereinander-Dual →
  viewBox-Breite `2·(Diagramm-Breite)+Gap`, zweite Gruppe versetzt in **X**; Neben-
  einander-Dual → viewBox-Höhe `2·(Slot-Höhe)+Gap`, zweite Gruppe versetzt in **Y**
  (wie gehabt). Beim Bahnkurven-Sonderfall (gleichskalierte x/y-Achsen) bleibt der
  zentrierte quadratische Plot pro Diagramm erhalten. Keine CSS-Grid-Änderung.

### Hover-Werte am Zeit-Diagramm (I5, Best Practice)

Mouseover über ein Zeit-Diagramm (Wert vs. *t*) soll einen Cursor zeigen, der der
gezeichneten Kurve folgt, plus ein Tooltip mit den exakten Werten zum gehoverten
Zeitpunkt. Kanonische Referenzimplementierung: **`Project_zykloide_simulation/`
ab v1.1.0**. Betrifft nur Sims mit `precompute()`-Zeitreihen und einem bereits
vorhandenen `interpolateAt(t)`-Helfer (praktisch alle modularen Sims haben das).

**UX-Regeln (best practice):**
- Hover-Cursor ist **visuell unterscheidbar** vom Wiedergabe-Marker: Wiedergabe
  = gefüllter Punkt, Hover = **hohler Ring-Punkt** (gleiche Farbe, nur Kontur).
  Beide können gleichzeitig sichtbar sein (Hovern während die Sim läuft), ohne
  verwechselt zu werden.
- Cursor bleibt auf dem **bereits gezeichneten Kurvenabschnitt** geklammert
  (`t ∈ [0, min(time_range, simulatedTime)]`) — kein Cursor auf leerer Fläche
  jenseits des aktuellen Wiedergabepunkts, auch wenn die Daten bereits
  precomputet sind.
- Tooltip zeigt **nur die aktuell geplottete Größe** für alle aktiven Subjekte
  (deckt sich mit den sichtbaren Kurven) — nicht das volle Live-Panel.
- Tooltip wird **innerhalb der Plot-Fläche geklammert**, damit er am Rand nicht
  abgeschnitten wird.
- Räumliche/nicht-monotone Bahnkurven-Diagramme (z. B. Schräger Wurf y(x)/x(y))
  sind **out of scope** — dort bräuchte man eine Nearest-Point-Suche statt der
  einfachen Pixel→Zeit-Umkehrung; separates Folge-Feature.

**Shared Helfer** (`shared/js/hover.js`):
```javascript
// Pointer-Event → lokale SVG-Koordinate. CTM wird auf dem Hit-Rect SELBST
// aufgerufen (nie auf dem äußeren <svg>) — komponiert dadurch automatisch
// alle Vorfahren-Transforms (z. B. eine <g transform="translate(...)"> bei
// Dual-Graph-Slots), keine Sim-spezifische Sonderrechnung nötig.
export function svgLocalPoint(referenceEl, evt) {
  const svg = referenceEl.ownerSVGElement || referenceEl;
  const ctm = referenceEl.getScreenCTM();
  if (!ctm) return null;
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  const loc = pt.matrixTransform(ctm.inverse());
  return { x: loc.x, y: loc.y };
}

export function attachGraphHover(hitRectEl, { onMove, onLeave }) {
  const move = evt => { const loc = svgLocalPoint(hitRectEl, evt); if (loc) onMove(loc.x, loc.y); };
  const leave = () => onLeave();
  hitRectEl.addEventListener('pointermove', move);
  hitRectEl.addEventListener('pointerleave', leave);
  hitRectEl.addEventListener('pointercancel', leave);
  return () => { /* Detach, s. Quelldatei */ };
}
```

**HTML-Struktur** (`index.html`, innerhalb der Graph-`<svg>`, nach dem Titel):
```html
<line id="graph_hover_line" class="graph-hover-line" visibility="hidden"/>
<circle id="graph_hover_point_sp" class="graph-hover-point" r="6" visibility="hidden"/>
<!-- … ein <circle> je Subjekt … -->
<g id="graph_hover_tooltip" visibility="hidden">
  <rect id="graph_hover_tooltip_bg" class="graph-hover-tooltip-bg"/>
  <text id="graph_hover_tooltip_text" class="graph-hover-tooltip-text"></text>
</g>
<rect id="graph_hit_rect" class="graph-hit-rect"/>   <!-- letztes Element: gewinnt Hit-Testing -->
```
`graph_hit_rect` bekommt **keine** `x/y/width/height` im HTML — die setzt die
Zeichenfunktion bei jedem Aufruf aus denselben Lokalen, die auch `scaleT`/
`scaleY` bestimmen (siehe unten). CSS: alle Hover-Overlay-Elemente
`pointer-events:none`, nur `.graph-hit-rect { fill:none; pointer-events:all; }`.

**JS-Rezept** (`render.js`):
```javascript
// In der Diagramm-Zeichenfunktion, nach Berechnung von padL/padT/plotW/plotH:
DOM.graphHitRect.setAttribute('x', padL);
DOM.graphHitRect.setAttribute('y', padT);
DOM.graphHitRect.setAttribute('width', plotW);
DOM.graphHitRect.setAttribute('height', plotH);
// … und nach Berechnung der Werte-Range (val_min/val_max/time_range/quantity):
store.graphScale = { padL, padT, plotW, plotH, time_range, val_min, val_max, quantity, active };
// Ganz am Ende der Funktion — Selbstkorrektur bei offenem Hover:
if (store.hoverActive) updateGraphHover(store.hoverLocalX);

// Neue exportierte Funktion, liest NUR store.graphScale (keine eigene Range-
// Berechnung — sonst Drift zwischen Zeichnung und Hover):
export function updateGraphHover(localX) {
  store.hoverActive = localX !== null;
  store.hoverLocalX = localX;
  const gs = store.graphScale;
  if (localX === null || !gs || gs.active.length === 0) { /* alles verstecken */ return; }
  const { padL, plotW, time_range } = gs;
  const xClamped = Math.max(padL, Math.min(padL + plotW, localX));
  const rawT = ((xClamped - padL) / plotW) * time_range;
  const t = Math.max(0, Math.min(rawT, time_range, store.simulatedTime));
  const interp = interpolateAt(t);   // bestehende Funktion, keine neue Interpolation
  // … Cursor/Punkte/Tooltip positionieren, siehe Zykloide render.js für Details.
}
```
```javascript
// ui.js — Bootstrap, nahe anderen addEventListener-Aufrufen:
attachGraphHover(DOM.graphHitRect, {
  onMove: x => updateGraphHover(x),
  onLeave: () => updateGraphHover(null),
});
```

**CSS** (`shared/css/design-system.css`, Token-basiert, gilt für alle Rollout-Sims):
```css
.graph-hover-line { stroke: var(--text3); stroke-width: 1.5; stroke-dasharray: 4,3; pointer-events: none; }
.graph-hover-point { fill: none; stroke-width: 2; pointer-events: none; }
.graph-hover-tooltip-bg { fill: var(--surface2); stroke: var(--border2); stroke-width: 1; rx: 4; }
.graph-hover-tooltip-text { fill: var(--text); font-size: 11px; font-family: var(--font-mono); pointer-events: none; }
.graph-hit-rect { fill: none; pointer-events: all; cursor: crosshair; }
```
Pro Subjekt zusätzlich lokal `#graph_hover_point_${s} { stroke: var(--c-${s}); }`
(Farbkopplung analog dem bestehenden `#graph_point_${s} { fill: var(--c-${s}) }`-Muster).

**Gotchas:**
- **CTM auf dem Hit-Rect, nie auf dem äußeren `<svg>`** aufrufen — nur so
  funktioniert dieselbe Funktion unverändert bei eigener Graph-`<svg>`
  (Zykloide, Rollende Körper), bei einer Graph-Gruppe innerhalb einer
  geteilten Szene-`<svg>` (Schräger Wurf) und bei transformierten Dual-Graph-
  Slots (Kreis-/Spiralbewegung) — die CTM-Kette komponiert alle Vorfahren-
  Transforms automatisch.
- **Hit-Rect-Geometrie nie hartkodieren**, immer aus denselben Lokalen wie
  `scaleT`/`scaleY` synchronisieren — sonst Drift zwischen Klickfläche und
  tatsächlicher Plot-Fläche, besonders bei Sims mit dynamischer Geometrie
  (Portrait/Landscape-Umschalter).
- **Wachsende/scrollende Zeitfenster** (z. B. `time_range = max(WINDOW_S, t)`):
  ohne die Selbstkorrektur (`if (store.hoverActive) updateGraphHover(...)` am
  Ende jeder Zeichenfunktion) läuft ein offener Tooltip bei laufender
  Wiedergabe aus dem Ruder, weil sich die Skala unter ihm ändert.
- **`.graph-bg`-Rect wird oft bei jedem Redraw neu erzeugt** (`innerHTML=''`)
  — das Hit-Rect muß ein **stabiles Geschwister-Element außerhalb** dieser
  Wegwerf-Gruppe sein, sonst gehen die Event-Listener bei jedem Frame verloren.
  **Prüfen, WELCHE Gruppe geleert wird:** manche Sims leeren nur eine innere
  Unter-Gruppe (z. B. `grid_group`, wie Zykloide/Rolling/Schräger Wurf) — dort
  reicht ein Hit-Rect als Geschwister *innerhalb* der äußeren Graph-Gruppe.
  Andere (z. B. Kreis-/Spiralbewegung) leeren die **gesamte** Graph-Gruppe
  (`graphGroup.innerHTML=''`) bei jedem Aufruf — dort muß das Hit-Rect/Overlay
  in einer eigenen, **außerhalb** dieser Gruppe liegenden Geschwister-`<g>`
  leben, deren `transform` (inkl. Dual-Layout-Versatz) in der äußeren
  Orchestrierungsfunktion synchron zur Graph-Gruppe gesetzt wird — sonst wird
  das Hit-Rect selbst bei jedem Frame mit zerstört.
- **Dual-Graph-Sims** (Kreis-/Spiralbewegung) brauchen 2 unabhängige Hit-Rects
  + 2 `store.graphScale`-Äquivalente (`graphScale[1]`/`graphScale[2]`, als
  Objekt statt zweier separater Variablen — vermeidet Copy-Paste-Drift) + 2
  `attachGraphHover()`-Aufrufe — mechanische Duplikation, kein neues Muster.
  Beim Umschalten Single↔Dual den jeweils ausgeblendeten Slot aufräumen
  (`graphScale[2] = null` + Hover verstecken), sonst bleibt ein Tooltip im
  unsichtbaren Slot "offen" und bläht beim nächsten Dual-Wechsel falsch auf.
- **Vergleichs-/Mehrkörper-Modi** (Rollende Körper): Hover iteriert nur über
  die primär ausgewählten Subjekte, nicht über Vergleichskörper-Daten.
- **Sims mit mehreren Diagramm-Slots in derselben Szene-`<svg>`** (Schräger
  Wurf: Single/Stacked-Top/Stacked-Bottom als transformierte `<g>`s neben der
  Animation): pro Slot ein eigenes Hit-Rect + `store.graphScale[slot]`-Eintrag
  (String-Key statt Zahl, z. B. `'single'`/`'top'`/`'bottom'`), analog zum
  Dual-Graph-Fall. Beim Wechsel zwischen Single- und Stacked-Modus den jeweils
  ausgeblendeten Slot/die ausgeblendeten Slots aufräumen.
- **Diagrammtypen mit räumlicher (nicht-Zeit-)Achse** (z. B. Bahnkurve y(x)
  bei Schräger Wurf): `store.graphScale[slot] = null` setzen und Hover
  verstecken, sobald dieser Diagrammtyp aktiv ist — die einfache Pixel→Zeit-
  Umkehrung gilt nur für Zeit-Achsen-Diagramme (siehe UX-Regeln oben).

## 5. Implementierungs-Workflow

1.  **Definitionsphase:** Festlegen der Eingabeparameter und der gesuchten physikalischen Größen.
2.  **State-Setup:** Alle veränderlichen Werte in `state.js` im `store`-Objekt registrieren.
3.  **Physik-Engine:** Formeln in `physics.js` implementieren. Eine `precompute()` Funktion füllt Arrays für den gesamten Zeitverlauf.
4.  **Rendering:** 
    - `drawBackground()`: Statische Elemente (Rampe, Gitter).
    - `updateScene(t)`: Animierte Elemente basierend auf Zeitstempel $t$.
5.  **UI-Integration:** Slider mit `resetSim()` verknüpfen, um bei Parameteränderung die Physik neu zu berechnen.

## 6. Checkliste für neue Simulationen
- [ ] Reagiert die Simulation auf alle Slider-Eingaben sofort (Live-Update, `resetSim()` je Änderung)?
- [ ] Koordinatensystem-Konsistenz: Lineal = Diagramm = Regler-Label = Live-Panel (dieselbe physikalische Koordinate)?
- [ ] Regler-Richtung intuitiv (rechts schieben = physikalisch größer)?
- [ ] Vektoren beim Start sichtbar (Toggles `checked`, `updateScene(0,…)` in `resetSim`) und **Legende** für alle farbigen Objekte/Vektoren vorhanden?
- [ ] Play/Pause/Reset **und** CSV-Export in der Topbar (`topbar-right`), nicht in der Sidebar?
- [ ] Ist die Energiebilanz zu jedem Zeitpunkt konsistent (falls Energie-Ansicht)?
- [ ] Werden im CSV-Export Kommas als Dezimaltrenner und Semicolons als Spaltentrenner genutzt (alle anzeigbaren Typen)?
- [ ] Beide Achsen: ≥4 beschriftete Ticks inkl. 0 (`niceStepLE`/`tAxisStep`, 1-2-4-5-Folge)?
- [ ] Abszisse am Nulldurchgang bei Werten um 0 (z. B. Schwingungsgrößen)?
- [ ] Diagramm-Format paßt zum Layout (Portrait bei nebeneinander, Landscape bei gestapelt)?
- [ ] Diagrammtitel als **letztes** SVG-Kind, klar über weißem Hintergrund-Rechteck?
- [ ] Dropdown-/Diagrammtyp-Labels aus Nutzerperspektive benannt (beschreibend, nicht intern-mathematisch)?
- [ ] Sind alle Formeln via MathJax **statisch** (kein Laufzeit-`typesetPromise`) korrekt gerendert?
- [ ] Physikalische Größen **überall kursiv** (`setAxisLabel`, `setGraphTitle`, `<i>`), Einheiten/Wörter aufrecht?
- [ ] Dark Mode durchgängig lesbar (alle Farben via CSS Custom Properties, Umgebung/Objekte sichtbar)?
- [ ] Versionsnummer in `index.html` und `docs/CHANGELOG.md` synchron?

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
   Topbar (Back-Button, Titel+Version, Theme-Toggle **+ kanonische
   Buttonleiste `▶ Play / ⏸ Pause / ↺ Reset / Diagramm (CSV) / Alle
   Daten (CSV)` in `topbar-right`** — nicht in einer Sidebar-`.btn-row`),
   linke Sidebar (Parameter, Visualisierungs-Toggles, **Legende**
   `.legend-grid`), einklappbare rechte Analyse-Sidebar (Default eingeklappt).
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
