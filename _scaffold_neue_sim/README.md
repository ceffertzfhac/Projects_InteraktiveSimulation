# `_scaffold_neue_sim/` — Vorlage für eine neue Simulation

Ein **minimal lauffähiges** Skelett der kanonischen 6-Modul-Architektur
(`global_docs/simulation_instruction.md` §2). Beispielphysik: gleichförmig
beschleunigte 1-D-Bewegung. Nicht in `AllAnimations/index.html` verlinkt und
kein `Project_*`-Ordner → wird von Sync-/Drift-/Deploy-Skripten ignoriert.

> Der Ordner liegt bewusst **auf Repo-Ebene** (Geschwister der `Project_*`),
> damit die relativen Importpfade (`../../shared/js/…`) **exakt** denen einer
> echten Sim entsprechen — Kopieren + Umbenennen läuft ohne Pfad-Anpassung.

## Lokal ausprobieren

**Vom Repo-Root servieren** (nicht aus dem Sim-Ordner) — die Module importieren
`../../shared/js/…`; ein Server, der im Sim-Ordner wurzelt, würde diese Pfade
über seine Wurzel hinaus auflösen und 404 liefern:

```bash
# im Repo-Root:
python3 -m http.server 8000    # ES-Module brauchen HTTP (file:// scheitert an CORS)
# → http://localhost:8000/_scaffold_neue_sim/
```

## Als Startpunkt für eine echte Sim verwenden

```bash
cp -r _scaffold_neue_sim Project_<name>_simulation
```

Dann der Reihe nach anpassen (Details: Blueprint §9 „Neubau-Workflow"):

1. **`js/constants.js`** — Geometrie, Skalen, Zeitfenster für dein Problem.
2. **`js/state.js`** — `store`-Felder (Eingaben + Ergebnis-Arrays) + `initDOM()`.
3. **`js/physics.js`** — `xToScreen`/`physToScreen`, dein Modell, `precompute()`.
4. **`js/render.js`** — `drawBackground()` (statisch), `drawGraph()`, `updateScene(t)`.
5. **`js/ui.js`** — Slider/Toggles an `resetSim()` hängen, Animations-Loop.
6. **`index.html`** — Titel, Version, Slider, Legende, Formeln (statisches MathJax).
7. **`css/styles.css`** — nur sim-spezifische Farben/Klassen; Struktur bleibt shared.

Zum Schluss: Version in `index.html` und `docs/CHANGELOG.md` synchron halten,
Karte in `AllAnimations/index.html` ergänzen, `bash scripts/sync-webpage.sh` laufen
lassen und die Checkliste (Blueprint §6) durchgehen.

## Was diese Vorlage bereits demonstriert

- 6-Modul-Split, State ausschließlich im `store`, **DOM-freie** `physics.js`
- `precompute()` füllt Arrays; `updateScene()` **interpoliert nur** (rechnet keine Physik)
- Shared-Helfer: `fmt`, `setAxisLabel`/`setGraphTitle`, `getNiceTick`/`tAxisStep`, `shortenEnd`
- kanonische Topbar (Play/Pause/Reset/Export), 3-Spalten-Layout
- einklappbare Analyse-Sidebar rechts (Default eingeklappt), Akkordeon-Cluster links
- Pfeilspitzen: `refX=0` + `shortenEnd` + **null-Guard** (zu kurzer Vektor → verbergen, B23)
- Achsen ≥4 Ticks inkl. 0, Titel als letztes SVG-Kind, statische MathJax-Formeln
- CSV-Export (`;`-Trenner, `,`-Dezimal), Dark Mode über Tokens
