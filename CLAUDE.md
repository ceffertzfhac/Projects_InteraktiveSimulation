# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Collection of interactive physics simulations for FH Aachen (FB 8 – Physik) courses. All UI text and code comments are in **German**. The architectural standard for every simulation is defined in `global_docs/simulation_instruction.md` — read it first when starting a new project.

### Active Projects

| Directory | Description | Current Version |
|---|---|---|
| `Project_rolling_bodies_simulation/` | Rolling dynamics on inclined planes (cylinders, spheres, k-factor comparison) | v1.9.4 |
| `Project_lorentz_force_simulation/` | Lorentz force between two parallel conductors (spring equilibrium) | v1.0.0 |

`Standalone Proto/` contains historical prototypes. `legacy_archive/` folders hold superseded single-file versions.

## Running a Simulation

No build step, no npm. ES Modules require a local HTTP server — `file://` will fail with CORS errors.

```bash
# From inside a project directory (e.g. Project_rolling_bodies_simulation/)
python3 -m http.server 8000
# open http://localhost:8000

# or
npx serve .
# open http://localhost:3000
```

There are no automated tests. Manual browser testing covers: slider live-updates, energy conservation, vector toggles, CSV export (verify comma decimal separators and semicolon column separators in the exported file).

## Shared Architecture

Every project follows this exact module split:

```
index.html          ← UI structure: sidebar | simulation SVG | analysis panel
js/
  main.js           ← bootstrap + requestAnimationFrame loop + error handling
  constants.js      ← physical constants (G, MU0, …) + UI config (colors, scale)
  state.js          ← single store object (all mutable state) + DOM cache object
  physics.js        ← pure/stateless computation; precompute() fills full-path arrays
  render.js         ← SVG-only mutation; physToScreen() coordinate transform
  ui.js             ← event handlers; wires sliders → resetSim() or computePhysics()
css/styles.css      ← CSS custom properties for full color system; .dark class on body
docs/
  CHANGELOG.md      ← updated after every change (newest entry first)
  FEATURE_BACKLOG.md / issues.md  ← planned work and known issues
```

**Data flow:** User input → `ui.js` handler → mutate `store` in `state.js` → call physics → call render. Physics is event-driven (recalculated on parameter change); the animation loop only advances the frame index.

## Code Conventions

### JavaScript
- `'use strict'` at the top of every module
- ES6+: `const`/`let`, arrow functions, template literals — **no semicolons**
- Constants: `UPPER_SNAKE_CASE` | Variables/functions: `camelCase` | DOM IDs: `snake_case`
- Private/internal variables: leading underscore (`_mjDebounceTimer`)
- `precompute()` in `physics.js` calculates the entire trajectory into arrays before animation starts; never compute per-frame if the result depends only on parameters

### Numerics & Notation
- **Decimal separator:** Comma (`,`) in all UI-visible strings; dot (`.`) inside SVG path data and attribute values
- **Axis labels:** `Physikalische Größe / Einheit` format, e.g. `t / s` or `a / (m/s²)`
- Coordinate transform from physical metres to screen pixels must go through a central `physToScreen()` function

### CSS
- All colors via CSS custom properties in `:root`
- Dark mode: toggle `.dark` class on `<body>` (not `.light` — light is the default)
- Semantic color names in use: `--c-vel` (blue), `--c-acc` (red), `--c-force-l` (purple), `--c-force-s` (green), `--c-current` (gold), `--c-current-phys` (orange)
- Fonts: `Syne` for headlines/UI; `JetBrains Mono` for numeric values

## Git Workflow

### Commit-Format (Conventional Commits — automatisch erzwungen)

```
<typ>(<scope>): <kurzbeschreibung in Deutsch>
```

| Typ | Wann |
|---|---|
| `feat` | Neue Funktion / neue Simulation |
| `fix` | Bugfix |
| `docs` | Nur Dokumentation (CHANGELOG, README, …) |
| `style` | CSS, Formatierung — keine Logikänderung |
| `refactor` | Umbau ohne Verhaltensänderung |
| `chore` | Tooling, .gitignore, Hooks, Build |
| `perf` | Performance-Verbesserung |

| Scope | Bedeutung |
|---|---|
| `lorentz` | `Project_lorentz_force_simulation/` |
| `rolling` | `Project_rolling_bodies_simulation/` |
| `standalone` | `Standalone Proto/` |
| `global` | `global_docs/` |
| `repo` | Root-Dateien (CLAUDE.md, .gitignore, …) |

**Beispiele:**
```
feat(rolling): Ghosting-Snapshots alle 0,5 s hinzugefügt
fix(lorentz): Federlängen-Fallback bei d < 5 px korrigiert
docs(rolling): CHANGELOG für v1.9.5 aktualisiert
chore(repo): .gitignore um *.bak ergänzt
```

### Hooks (automatisch aktiv)

Die Hooks liegen in `.githooks/` und sind versioniert. Sie werden automatisch angewendet, weil `core.hooksPath = .githooks` in der lokalen Git-Konfiguration gesetzt ist.

> **Neuer Klon:** Nach dem Klonen einmalig ausführen:
> ```bash
> git config core.hooksPath .githooks
> ```

- **`commit-msg`** — lehnt Commits ab, die nicht dem Conventional-Commits-Format entsprechen.
- **`pre-commit`** — blockiert das Einchecken von `.DS_Store`, `test.txt` und ähnlichen Junk-Dateien.

## After Every Code Change

Update `docs/CHANGELOG.md` (add entry at top) and, if relevant, `docs/FEATURE_BACKLOG.md` or `docs/issues.md`.

## Adding a New Simulation Project

1. Copy the module structure above into a new `Project_<name>/` directory
2. Follow the design checklist in `global_docs/simulation_instruction.md` §6
3. Register the project in this file's table above
