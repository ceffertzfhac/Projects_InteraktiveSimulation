# Changelog – Vorlage: Neue Simulation

## v0.2.0 — 2026-07-15

Feature (→ BACKLOG I13.1): Hover-Werte am Zeit-Diagramm im Scaffold verdrahtet.
Bisher war Hover nur über das Rezept in der Anleitung §4 dokumentiert — eine
neue Sim aus dem Scaffold lieferte ohne manuelles Nachrüsten **keinen** Hover.
Jetzt ist er voll verdrahtet und demonstriert das kanonische Muster:

- **Hover-Overlay** (`index.html` in `#graph_group`): `graph_hover_line`
  (gestrichelte Führungslinie), `graph_hover_point` (hohler Ring-Punkt,
  unterscheidbar vom gefüllten Wiedergabe-Marker) + `graph_hover_tooltip`
  (Tooltip mit `t`- und Wert-Zeile); `graph_hit_rect` als letztes Kind (gewinnt
  Hit-Testing). CSS-Klassen in `shared/css/design-system.css` (Token-basiert,
  Tooltip-Hintergrund 70 % transparent).
- **State** (`state.js`): `store.graphScale` (einzige Quelle der Wahrheit,
  von `drawGraph` befüllt, von `updateScene` für den Marker und von
  `updateGraphHover` für den Cursor gelesen — keine Drift), `hoverActive`/
  `hoverLocalX`; 6 DOM-Cache-Einträge für die Hover-Elemente.
- **render.js**: `updateGraphHover(localX)` + `drawHoverAtT`/`hideGraphHover`/
  `renderHoverTooltip` — liest nur `store.graphScale` + `store.simulatedTime`,
  invertiert `localX→t` aus denselben Lokalen wie `scX`, klammert den Cursor auf
  `t ∈ [0, min(tMax, simulatedTime)]` (kanonische UX, s. §4). Hit-Rect-Geometrie
  wird in `drawGraph` aus denselben Lokalen wie `scX`/`scY` synchronisiert;
  Selbstkorrektur am Ende (`if (store.hoverActive) updateGraphHover(...)`).
  `store.gScale` → `store.graphScale` umbenannt (einheitlicher Name).
- **ui.js**: `attachGraphHover` (aus `shared/js/hover.js`) auf dem Hit-Rect.

**Hinweis 2-Diagramm-Modus (I14):** dieses Scaffold ist bewusst ein
Ein-Diagramm-Sim (kein `diagram_mode`). Für den 2-Diagramm-Ausbau (synchronisierter
Dual-Hover) `graphScale` zu einem Slot-Index-Objekt (`graphScale['single'/
'top'/'bottom']`) machen, `hoverSourceSlot`/`hoverT` + `refreshHover()` ergänzen
und den Cursor-Redraw einmalig am Ende der Orchestrierungsfunktion (`drawGraphs`)
vornehmen — vollständiges Rezept in Anleitung §4 „Hover-Werte am Zeit-Diagramm"
(I14-Abschnitt).

## v0.1.0 — Scaffold

Minimal lauffähiges Skelett (6-Modul-Struktur) als Startpunkt für neue
Simulationen. Beispielphysik: gleichförmig beschleunigte 1-D-Bewegung
\(x(t) = v_0 t + \tfrac12 a t^2\).

Demonstriert die verbindlichen Muster aus `global_docs/simulation_instruction.md`:
- 6-Modul-Split, `store`-only State, DOM-freie `physics.js`
- `precompute()` + `interpolateAt()` (Animation indiziert nur)
- Shared-Helfer (`format`, `svg-text`, `ticks`, `vectors`)
- kanonische Topbar-Buttonleiste, 3-Spalten-Layout
- einklappbare Analyse-Sidebar rechts, Akkordeon-Cluster links
- Pfeilspitzen-Geometrie `refX=0` + `shortenEnd` + null-Guard (B23)
- statische MathJax-Formeln, CSV-Export, Dark Mode über Tokens
