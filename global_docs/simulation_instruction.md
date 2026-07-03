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
- [ ] Sind alle Formeln via MathJax korrekt gerendert?
- [ ] Ist die schiefe Ebene/Umgebung im Dark Mode gut sichtbar?
