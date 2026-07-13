# AGENTS.md — Agentic Coding Guidelines

> **Kanonischer Leitfaden ist [`CLAUDE.md`](./CLAUDE.md).** Diese Datei gibt nur den
> Repo-Überblick für Agenten; bei Widersprüchen gilt CLAUDE.md. Status & Aufgaben
> liegen im repo-weiten [`BACKLOG.md`](./BACKLOG.md).

## Project Overview

Mono-Repo interaktiver Physik-Simulationen für FH Aachen FB 8. Reine Client-Web-Apps:
Vanilla-JS-ES-Module, SVG-Grafik, MathJax 3. **Kein Build-Schritt, kein npm, keine
automatisierten Tests** — Verifikation erfolgt manuell im Browser.

## Repo Structure

```
Project_<sim>_simulation/   # modulare Sims (je index.html + js/{constants,state,physics,render,ui}.js + css/ + docs/) — 16 Stück
Webpage/                   # deploybare statische Site (sim_<name>/, relative Pfade) — GitHub-Pages-Target (Mirror von Project_*/, s. scripts/sync-webpage.sh)
AllAnimations/              # globale Übersichtsseite (index.html) + lauffähige Standalone-Prototypen + Vorschaubilder/
Standalone Proto/           # historische Quellordner der Single-File-Prototypen (nicht kanonisch)
shared/                     # shared/css/design-system.css (Design-Tokens, Layout, Klapp-Sidebar) + js-Helper
scripts/                    # sync-webpage.sh (Project_*→Webpage spiegeln) + check-webpage-drift.sh (Guard)
global_docs/                # Architektur-Blueprint (simulation_instruction.md) + KI-Kontext
ilias_probe/                # Testumgebung für ILIAS (relatives CSS, ES-Modul-Import, MathJax-CDN)
CLAUDE.md                   # kanonischer Entwicklungsleitfaden (Architektur, Konventionen, Design-System)
BACKLOG.md                  # repo-weites MoSCoW-Backlog
NOTICE.md                   # Hinweis & Haftungsausschluss, Copyright
README.md                   # Repo-Überblick (öffentliche Instanz, Struktur, Leitfäden)
```

Jede modulare Sim folgt dem Sechs-Modul-Aufbau aus `global_docs/simulation_instruction.md`:
`constants.js` / `state.js` / `physics.js` / `render.js` / `ui.js` (+ ggf. `main.js` bei
älteren Sims). Datenfluß: UI → `state.store` → `physics.precompute()` → `render.updateScene()`.

## Running

ES-Module brauchen einen HTTP-Server (`file://` scheitert an CORS). Server im Repo-Root
starten, sonst 404 auf `shared/css/`:

```bash
python3 -m http.server 8000   # dann http://localhost:8000/<sim>/index.html
```

## Conventions (Kurzfassung — s. CLAUDE.md für vollständige Regeln)

- **Sprache:** UI-Text, Kommentare, Doku auf Deutsch.
- **Dezimaltrenner:** Komma `,` in UI-Texten/Labels; Punkt `.` in SVG-Koordinaten.
- **ES6+:** `const`/`let`, Arrow-Functions, Template-Literals, **keine Semikolons**,
  `'use strict'` am Modulanfang.
- **Naming:** `UPPER_SNAKE` Konstanten, `camelCase` Funktionen/Variablen, `snake_case`
  DOM-IDs, `_prefix` modul-private.
- **State:** alle veränderlichen Variablen ausschließlich in `state.js` → `store`.
  Keine modul-globalen Variablen anderswo.
- **Koordinaten:** zentrale `physToScreen(x,y)` in `render.js` — nie pixel-roh streuen.
- **Theming:** Farben via CSS Custom Properties (`--bg`, `--surface`, `--accent` …).
  Vector-Farben standardisiert; `var()` als SVG-Attribut funktioniert **nicht** (lit. Hex
  oder CSS-Klasse nutzen).
- **Versionierung:** jeder Code-Change bump die Version in `docs/CHANGELOG.md` (patch =
  Bugfix/Style, minor = Feature); Version in `index.html` synchron halten.
- **Git-Hooks** (`.githooks`, `core.hooksPath` gesetzt): `commit-msg` erzwingt
  Conventional Commits (`<typ>(<scope>): <beschreibung>`); `pre-commit` blockt
  `.DS_Store`/`test.txt`.

## Notes for AI Agents

- Keine Commits ohne ausdrückliche Anweisung; auf dem Default-Branch erst branchen.
- Formeln als **statisches HTML** in `index.html` schreiben (MathJax rendert beim
  Start), nicht per JS-`innerHTML` einfügen — siehe CLAUDE.md „MathJax statisch".
- Vor dem Löschen/Überschreiben den Inhalt prüfen; bei Widerspruch zur Beschreibung
  zurückmelden statt blind auszuführen.