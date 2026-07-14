# FH Aachen FB 8 — Interaktive Physik-Simulationen

Mono-Repo interaktiver Physik-Simulationen für FH-Aachen-Kurse (FB 8, Lehr- und
Forschungsgebiet Physik). Alle Simulationen sind reine Client-Web-Apps (kein
Build-Schritt, kein npm): Vanilla-JS-ES-Module, SVG-Grafik, MathJax 3 für Formeln.

> **Öffentliche Instanz:** <https://ceffertzfhac.github.io/Projects_InteraktiveSimulation/>
> (Übersichtsseite mit allen Simulationen als Karten). Die Simulationen sind ein
> experimentelles Lehr- und Lernprojekt — siehe
> [**`NOTICE.md`**](./NOTICE.md) für Hinweis & Haftungsausschluss sowie die
> Copyright-Hinweise auf jeder Simulation.

## Struktur

- **`Project_*_simulation/`** — die modularen Simulationen (je `index.html` +
  `js/{constants,state,physics,render,ui}.js` + `css/` + `docs/`). Kanonische
  Quellversionen. Aktuell 16 Simulationen:
  - `Project_3massen_umlenkrollen_simulation/` — Statisches Kräftegleichgewicht (3 Massen)
  - `Project_ableitung_simulation/` — Die Ableitung als Grenzwert
  - `Project_atwood_energy_simulation/` — Atwood-Energie
  - `Project_atwood_simulation/` — Atwood-Maschine
  - `Project_federpendel_simulation/` — Federpendel
  - `Project_freier_fall_simulation/` — Freier Fall / senkrechter Wurf
  - `Project_geschwindigkeit_simulation/` — Geschwindigkeit als Steigung der Ort-Zeit-Kurve
  - `Project_grundbegriffe_kinematik_simulation/` — Grundbegriffe der Kinematik
  - `Project_kreis_spiralbewegung_simulation/` — Kreis- und Spiralbewegung
  - `Project_kreisbewegung_simulation/` — Kreisbewegung
  - `Project_lorentz_force_simulation/` — Lorentzkraft zwischen parallelen Leitern
  - `Project_rolling_bodies_simulation/` — Rollende Körper auf schiefer Ebene
  - `Project_schraeger_wurf_simulation/` — Schräger Wurf
  - `Project_stoss_simulation/` — Elastischer Stoß auf der Luftkissenbahn
  - `Project_wellen_simulation/` — Interferenz zweier Punktquellen
  - `Project_zykloide_simulation/` — Rollender Zylinder / Zykloide

  Aktuelle Versionsnummern stehen im jeweiligen `docs/CHANGELOG.md`.

- **`Webpage/`** — deploybare Kopie aller Simulationen als statische Site (relative
  Pfade, `sim_<name>/`), deployt via GitHub Actions zu GitHub Pages. Build-Target der
  öffentlichen Instanz oben.
- **`AllAnimations/`** — in-repo Übersichtsseite (`index.html`) als Karten-Liste aller
  Simulationen; hier liegen auch die lauffähigen Standalone-Prototypen und
  `Vorschaubilder/`.
- **`shared/`** — geteiltes Design-System (`css/design-system.css`) und JS-Helper
  (z. B. `js/hover.js` für Diagramm-Hover-Werte).
- **`global_docs/`** — Architektur-Blueprint (`simulation_instruction.md`) und KI-Kontext.
- **`ilias_probe/`** — minimale Testumgebung, um mehrteilige modulare Web-Apps in ILIAS
  zu validieren (relatives CSS, ES-Modul-Import, MathJax-CDN).
- **`Standalone Proto/`** — historische Quellordner der Single-File-Prototypen (nicht
  die kanonischen Versionen; die lauffähigen Kopien liegen in `AllAnimations/`).
- **`_temp_archiv/`** — Zwischenstände / Archivmaterial, nicht für die Nutzung gedacht.
- **`scripts/`** — `sync-webpage.sh` (spiegelt `Project_*` → `Webpage/`) und
  `check-webpage-drift.sh` (Drift-Guard im Pages-Workflow).
- **`test/`** — Vitest-Seed-Tests für Physik-Invarianten (dev-only; die Simulationen
  selbst bleiben build-lose Browser-ES-Module ohne npm-Abhängigkeit).

## Starten (lokale Entwicklung)

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
  Features, Migrationen, Ideen).
- **[`NOTICE.md`](./NOTICE.md)** — Hinweis & Haftungsausschluss, Copyright.
- **[`global_docs/simulation_instruction.md`](./global_docs/simulation_instruction.md)**
  — Blueprint zum Anlegen neuer Simulationen.

> **[`AGENTS.md`](./AGENTS.md)** — Kurzreferenz für Coding-Agenten (Repo-Struktur +
> Konventionen in Kurzfassung), synchron zu `CLAUDE.md` gehalten; bei Widersprüchen
> gilt `CLAUDE.md`.
> **[`global_docs/GEMINI.md`](./global_docs/GEMINI.md)** — Einstiegs-Zeiger für den
> Gemini-Assistenten auf `CLAUDE.md`/`BACKLOG.md`.