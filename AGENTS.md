# AGENTS.md - Agentic Coding Guidelines

## Project Overview

This is a physics simulation (HTML/CSS/JS) for demonstrating rolling dynamics on inclined planes. The simulation visualizes various rolling bodies (cylinders, spheres) with different form factors, compares their motion, and displays energy analysis.

**Main file:** `index.html`

## Project Structure

```
zykloide_schiefe_ebene/
├── index.html          # Main entry point (ES Modules)
├── css/                 # CSS files (future)
├── js/
│   ├── main.js         # Entry point, initialization
│   ├── constants.js    # Physics & UI constants
│   ├── state.js        # State management & DOM cache
│   ├── physics.js      # Physics calculations
│   ├── render.js      # Rendering functions
│   └── ui.js          # UI event handlers
└── docs/
    ├── README.md       # Project documentation
    └── CHANGELOG.md    # Change log
```

---

## Build / Development Commands

### Running the Project
Requires a local server (ES Modules don't work with file:// protocol):

```bash
# With npx serve
npx serve .

# Or with any other server
python3 -m http.server 8000
```

Then open: http://localhost:3000 (or http://localhost:8000)

### Testing
No automated tests exist. Manual testing involves:
1. Opening the HTML file in a browser
2. Verifying physics calculations visually
3. Checking all UI controls work (sliders, toggles, buttons)
4. Testing CSV export functionality

### Linting
No linting is configured. For JavaScript, follow the existing code style.

---

## Code Style Guidelines

### JavaScript (ES Modules)

- **Use `'use strict'`** at the top of modules
- **Use ES6+ features**: const/let, arrow functions, template literals, modules
- **No semicolons** at statement ends (consistent with existing code)

#### Naming Conventions
- **Constants**: UPPER_SNAKE_CASE (e.g., `G`, `DT`, `SVG_W`)
- **Variables/functions**: camelCase (e.g., `simTime`, `resetSim`)
- **DOM element IDs**: snake_case (e.g., `radius_slider`, `play_btn`)
- **Private variables**: Prefix with underscore (e.g., `_visX0`, `_mjDebounceTimer`)
- **Module names**: lowercase, e.g., `constants.js`, `render.js`

#### Functions
- Keep functions focused and under 50 lines when possible
- Use JSDoc for documentation
- Document complex physics calculations with comments

#### State Management
- Global state stored in `state.js`
- Use `DOM` object for cached DOM references
- State updates trigger `resetSim()` or `updateScene()`
- Use `requestAnimationFrame` for animation loops

### CSS Guidelines
- 2-space indentation
- CSS custom properties in `:root`
- Dark/light theme support with `.light` class
- Use classes over element selectors

### Formatting
- Maximum line length ~100 characters
- One blank line between function definitions
- Use helper functions for repeated operations

---

## Common Tasks

### Adding a New Body Type
1. Add entry to `ALL_TYPES` in `constants.js`
2. Add case in `computeK()` in `physics.js`
3. Add styling in `updateCylinderStyle()` in `render.js`
4. Add radio button in `index.html`

### Adding a New Graph Quantity
1. Add entry to `GRAPH_OPTIONS` in `constants.js`
2. Ensure quantity is computed in `precompute()` in `physics.js`
3. Update `CMP_KEYS` if needed

### Modifying Physics
- Main physics computed in `precompute()` in `physics.js`
- Acceleration formula: `a = g·sin(α) / (1 + k)`
- k-factor: `k = I / (mR²)`

---

## Notes for AI Agents

- This project uses **ES Modules** - no build step required, but needs a local server
- The original single-file version is preserved as `zykloide_schiefe_ebene_v5.html`
- All text is in German (project for FH-Physik course)
- Simulation is deterministic - same inputs always produce same outputs
