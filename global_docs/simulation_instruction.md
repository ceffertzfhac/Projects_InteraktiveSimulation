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
