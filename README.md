# FH Aachen FB 8 — Interaktive Physik-Simulationen

Mono-Repo interaktiver Physik-Simulationen für FH-Aachen-Kurse. Alle Simulationen
sien reine Client-Web-Apps (kein Build-Schritt, kein npm): Vanilla-JS-ES-Module,
SVG-Grafik, MathJax 3 für Formeln.

## Struktur

- **`Project_*_simulation/`** — die modularen Simulationen (je `index.html` +
  `js/{constants,state,physics,render,ui}.js` + `css/` + `docs/`):
  - `Project_rolling_bodies_simulation/` — Rollende Körper auf schiefer Ebene (v2.0.5)
  - `Project_lorentz_force_simulation/` — Lorentzkraft zwischen parallelen Leitern (v1.5.4)
  - `Project_freier_fall_simulation/` — Freier Fall / vertikaler Wurf (v2.2.4)
  - `Project_atwood_simulation/` — Atwood-Maschine (v2.2.2)
  - `Project_3massen_umlenkrollen_simulation/` — Statisches Kräftegleichgewicht 3 Massen (v1.2.2)
  - `Project_schraeger_wurf_simulation/` — Schräger Wurf (v1.2.2)
  - `Project_zykloide_simulation/` — Zykloide (v1.0.5)
  - `Project_federpendel_simulation/` — Federpendel (v1.0.10)
  - `Project_kreisbewegung_simulation/` — Kreisbewegung (v1.0.8)
- **`AllAnimations/`** — globale Übersichtsseite (`index.html`) als Karten-Liste aller
  Simulationen; hier liegen auch die lauffähigen Standalone-Prototypen + `Vorschaubilder/`.
- **`Standalone Proto/`** — historische Quellordner der Single-File-Prototypen (nicht
  die kanonischen Versionen).
- **`shared/`** — geteiltes Design-System (`css/design-system.css`, ggf. `js/`-Helper).
- **`global_docs/`** — Architektur-Blueprint (`simulation_instruction.md`) und KI-Kontext.

## Starten

ES-Module brauchen einen HTTP-Server (`file://` scheitert an CORS):

```bash
# im jeweiligen Projekt-Unterordner (oder Repo-Root für shared-Pfade)
python3 -m http.server 8000
# dann http://localhost:8000
```

## Leitfäden

- **[`CLAUDE.md`](./CLAUDE.md)** — kanonischer Entwicklungsleitfaden (Architektur,
  Design-System, Konventionen). Maßgeblich bei Widersprüchen.
- **[`BACKLOG.md`](./BACKLOG.md)** — repo-weites MoSCoW-Backlog (Bugs, Tech-Schulden,
  Features, Migrationen).
- **[`global_docs/simulation_instruction.md`](./global_docs/simulation_instruction.md)**
  — Blueprint zum Anlegen neuer Simulationen.