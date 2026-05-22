# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive physics educational web application (FH Aachen - FB 8 - Physik) that simulates the Lorentz force between two parallel current-carrying conductors. One conductor is fixed to a table; a second hangs from the ceiling on two springs. Parallel currents attract, antiparallel currents repel, changing the spring equilibrium.

## Running the Project

No build step required — pure ES6 modules served directly to the browser.

```bash
# Recommended: local HTTP server (required for ES6 modules)
python3 -m http.server 8000
# Then open: http://localhost:8000

# Alternative
npx http-server .
```

Opening `index.html` directly via `file://` will fail due to ES6 module CORS restrictions.

## Architecture

### Module Dependency Flow

```
index.html (SVG canvas + UI controls)
    └── main.js (bootstrap + requestAnimationFrame loop)
            ├── state.js  ← single source of truth (store + DOM cache)
            ├── constants.js  ← physical constants + rendering parameters
            ├── physics.js  ← stateless computation functions
            ├── render.js  ← SVG mutation
            └── ui.js  ← event handlers (wires inputs → physics → render)
```

### Data Flow

User input → `ui.js` event handler → mutate `store` in `state.js` → call `computePhysics()` from `physics.js` → call `updateScene()` from `render.js`.

The animation loop in `main.js` only drives `updateFlow()` (particle animation); physics and rendering are event-driven, not frame-driven.

### State (`js/state.js`)

Single `store` object holds all app state: electrical parameters (voltage, current, resistance), mechanical parameters (spring constant, initial distance), computed values (forceL, deltaY, equilibrium distance), and UI flags (showBField, showForces, isDarkMode, etc.). A `DOM` object caches all element references, populated at init time.

### Physics (`js/physics.js`)

`computePhysics()` solves the static equilibrium:
- R = ρ·L/A (copper resistivity: ρ = 0.0178 Ω·mm²/m)
- F_L = (μ₀·I²·L) / (2π·d)
- Equilibrium: F_L = 2·D·Δy, where Δy = d₀ - d (parallel) or d - d₀ (antiparallel)
- Reduces to quadratic in d; solved analytically with discriminant check

`calculateMinSpringK()` computes the minimum spring constant that prevents conductor collision in attractive mode; `ui.js` enforces this as a slider minimum.

### Rendering (`js/render.js`)

Pure SVG manipulation — no canvas. `draw3DSpring()` renders a parametric helix with three layered passes (back arcs, front arcs with metallic gradient, highlight). Force arrows use logarithmic scaling for visibility across wide value ranges. MathJax is called to re-typeset formula elements after value updates.

### Styling (`css/styles.css`)

CSS custom properties define the full color system. Dark mode is toggled by adding `.dark` to `<body>`. Key semantic color variables: `--c-current` (technical direction, gold), `--c-current-phys` (electron flow, orange), `--c-force-l` (Lorentz force, purple), `--c-force-s` (spring force, green).

## Key Implementation Notes

- **Dual input modes:** "Voltage mode" computes I = U/R; "Current mode" takes I directly and back-computes U.
- **Two current direction conventions:** "technical" (conventional current) and "physical" (electron flow) — affects arrow rendering and particle animation direction.
- **Spring rendering fallback:** If spring length < ~5px, `draw3DSpring()` falls back to a straight line. A simpler fallback algorithm is documented in `docs/FALLBACK_RENDER_LOGIC.md`.
- **No test suite** — manual browser testing only.
- **No npm/package.json** — zero dependencies except CDN-loaded MathJax 3 and Google Fonts.

## Documentation

- `docs/README.md` — physics model with LaTeX formulas and reference problem (WS 2025/26 assignment)
- `docs/CHANGELOG.md` — version history
- `docs/FEATURE_BACKLOG.md` — planned enhancements with priority labels
- `docs/FALLBACK_RENDER_LOGIC.md` — alternative spring rendering algorithm
