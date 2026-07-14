# Changelog – Vorlage: Neue Simulation

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
