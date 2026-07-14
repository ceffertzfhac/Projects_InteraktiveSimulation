# Phasen 1–4 — Physik, Bau, Verifikation, Abschluss

Detailrezepte für die einzelnen Bausteine im Blueprint
(`global_docs/simulation_instruction.md`); hier nur die Skill-spezifische
Orchestrierung und die konkreten Kommandos.

## Phase 1 — Physik-Spec (Subagent-Vertrag)

Delegation an `physics-model-researcher` **nur** bei nicht-trivialer/unverifizierter
Physik (sonst überspringen, s. SKILL.md). Der Subagent liefert eine kompakte
**Physik-Spec** zurück — genau diese Felder, kein Sim-Code:

- **Parameter:** Name, Symbol, Einheit, sinnvoller Bereich (1.-Sem.-Niveau), Default.
- **Gleichungen:** geschlossene Form bevorzugt; sonst numerisches Schema + Schrittweite.
- **Rand-/Stoppbedingung:** was `t_end` bestimmt (Aufprall, Bahnende, Periode …).
- **Vorzeichenkonvention / Achsenrichtung** (passend zu `getDisplay*`, CLAUDE.md).
- **Anzeigegrößen + Diagrammvorschläge** (welche Größe über *t*).
- **Sanity-Checks:** Dimensionsanalyse, Grenzfälle, ein Zahlen-Stichprobenwert.

## Phase 2 — Bau (Scaffold → 6 Module)

`cp -r _scaffold_neue_sim Project_<name>_simulation`, dann pro Modul die Spec
einsetzen. Mapping (Volltext: Blueprint §9.1 + §2–§4):

1. `constants.js` — Geometrie, Skalen (`PPM`), Zeitfenster (`T_MAX`,`DT`), Konstanten.
2. `state.js` — `store` (Eingaben + `*_data`-Arrays + `t_end` + Laufzeit), `initDOM()`.
3. `physics.js` — `physToScreen`, Modell als reine Funktionen, `precompute()`,
   `interpolateAt()`. **DOM-frei halten** (kein `document.*` im Modulrumpf).
4. `render.js` — `drawBackground()` (statisch), `drawGraph()`, `updateScene(t)`
   (nur interpolieren); Shared-Helfer (`setAxisLabel`/`setGraphTitle`/`getNiceTick`/
   `tAxisStep`/`shortenEnd`).
5. `ui.js` — Slider/Selects/Toggles an `resetSim()`; Animations-Loop; Export; Theme.
6. `index.html` — Titel/Version, Slider, Legende, **statische** MathJax-Formeln.
   `css/styles.css` — nur sim-spezifische Farben/Klassen; Struktur bleibt shared.

Kritische Konventionen, die erfahrungsgemäß schieflaufen (Blueprint §3/§4):
Pfeilspitzen `refX=0` + `shortenEnd` + **null-Guard** (B23); Diagrammtitel als
letztes SVG-Kind; beide Achsen ≥4 Ticks inkl. 0; physikalische Größen kursiv;
Koordinatensystem-Konsistenz Lineal = Diagramm = Regler = Live-Panel.

## Phase 3 — Verifikation (billig, inline)

Deterministische Checks selbst — **vor** der visuellen Abnahme:

```bash
# 1) Syntax aller Module
for f in Project_<name>_simulation/js/*.js; do node --check "$f"; done

# 2) Physik isoliert (DOM-frei importierbar) — Invarianten prüfen
node --input-type=module -e '
import { store } from "./Project_<name>_simulation/js/state.js";
import { precompute } from "./Project_<name>_simulation/js/physics.js";
/* Parameter setzen */ precompute();
console.log(store.t_data.length, store.t_end);'   # Monotonie/Grenzfälle prüfen

# 3) Serve-Smoke VOM REPO-ROOT (../../shared-Importe!)
python3 -m http.server 8000   # → http://localhost:8000/Project_<name>_simulation/
```

Dann **an den Nutzer übergeben** für die visuelle Kontrolle im VS-Code-Preview
(Headless-Screenshot nur, wenn der Nutzer es will). Checkliste §6 in Reihenfolge:
erst **Gruppe A (MVP: läuft & physikalisch korrekt)**, dann **Gruppe B (Politur)**.
Optional: an das Vitest-Seed (`test/`, I3) eine Invariante anschließen.

## Phase 4 — Abschluss

1. Karte in `AllAnimations/index.html` auf `../Project_<name>_simulation/index.html`;
   `Vorschaubilder/<name>.png` (bestehendes Bild erhalten, kein Emoji-Platzhalter).
2. `bash scripts/sync-webpage.sh` **und** `bash scripts/check-webpage-drift.sh`
   (Exit 0) — sonst driftet Pages (I11); der `pre-commit`-Hook blockt ohnehin.
3. Version in `index.html` ↔ `docs/CHANGELOG.md` synchron; Follow-ups nach `BACKLOG.md`.
4. Commit erst auf Nutzer-Wunsch; im Branch. Conventional-Commit
   `feat(<scope>): <name> neu (vX.Y.Z)`. Scopes: `lorentz|rolling|standalone|global|repo`.
