# Projekt-Backlog: Interaktive Physik-Simulationen

Stand: 2026-06-15 | Priorisierung: MoSCoW (ausstehend)

---

## BUGS

| ID | Titel | Projekt | Beschreibung |
|----|-------|---------|--------------|
| B1 | RHO_CU-Duplikat in ui.js | Lorentzkraft | `0.0178` ist in `ui.js` (Zeile ~26) hart hineinkopiert statt aus `constants.js` importiert. Wenn die Konstante geändert wird, wird der Slider-Minimalwert falsch. |
| B2 | SP-Spur unsichtbar | Rollende Körper | Schwerpunktspur ist trotz korrekter Implementierung nicht sichtbar (vermutlich Clipping oder Z-Index-Problem in SVG-Verschachtelung). |
| B3 | Timing-Sprung bei Pause→Play | Rollende Körper | `lastTs` wird beim Pausieren nicht zurückgesetzt, sodass `simTime` nach Resume einen großen Sprung macht. |

---

## TECHNISCHE SCHULDEN / REFACTORING

| ID | Titel | Projekt | Beschreibung |
|----|-------|---------|--------------|
| T1 | render.js aufteilen (1013 Zeilen) | Rollende Körper | Monolithische `render.js` in thematische Teilmodule zerlegen: z.B. `render-scene.js`, `render-vectors.js`, `render-analysis.js`. |
| T2 | Redundante Projektkopie entfernen | Repo | `Standalone Proto/rolling_bodies_simulation/` ist eine vollständige Kopie von `Project_rolling_bodies_simulation/` — Überbleibsel der Migration. Entfernen. |
| T3 | AGENTS.md und README.md aktualisieren | Repo | Beide Dateien referenzieren noch die alten Verzeichnisnamen (`zykloide_schiefe_ebene/`, `lorentz_force_simulation/`). |
| T4 | GEMINI.md aufräumen | Repo | `global_docs/GEMINI.md` ist inhaltlich nahezu identisch mit `CLAUDE.md`. Entweder konsolidieren oder klar abgrenzen. |
| T6 | Einheitliche `fmt()`-Funktion | Beide | Projekt 1 nutzt `toLocaleString('de-DE')`, Projekt 2 `toFixed().replace()`. Projekt 2 ist robuster (NaN-Check). Angleichen. |
| T7 | Magic Numbers in render.js | Lorentzkraft | Feder-Parameter (14 Windungen, Radius 7, Drahtbreite 2,6, 12 Helix-Schritte) sind hardcodiert. Zu Konstanten machen. |

---

## FEATURES — LORENTZKRAFT

| ID | Titel | Beschreibung |
|----|-------|--------------|
| FL1 | Dynamische Einschwingung | Gedämpfte Schwingung beim Ein-/Ausschalten des Stroms (DGL 2. Ordnung lösen). Aktuell springt der Leiter sofort ins Gleichgewicht. Didaktisch der wichtigste fehlende Aspekt. |
| FL2 | Magnetfeld-Visualisierung | B-Feld-Linien zwischen den Leitern (war in einer früheren Version implementiert, dann entfernt). |
| FL3 | Kraft-Abstands-Diagramm | Interaktives Diagramm: F_L(d) und F_s(d) gemeinsam, zeigt grafisch den stabilen Gleichgewichtspunkt. |
| FL4 | Massenträgheit berücksichtigen | Eigengewicht des hängenden Leiters in die Ausgangslage einrechnen (aktuell vernachlässigt). |
| FL5 | Material-Auswahl | Verschiedene Leiter-Materialien (Kupfer, Aluminium, Gold) mit unterschiedlichem ρ. |

---

## FEATURES — ROLLENDE KÖRPER

| ID | Titel | Beschreibung |
|----|-------|--------------|
| FR1 | Ghosting / Snapshots | Verblasste Körperkopien in festen Zeitintervallen (z.B. alle 0,5 s) zur visuellen Darstellung der Beschleunigung. |
| FR2 | Interaktive Diagramme (Hover) | Mouseover über SVG-Diagramm zeigt exakte Werte zum Zeitpunkt t; Cursor folgt der Kurve. |
| FR3 | Benutzerdefinierter k-Faktor | Texteingabe für beliebigen k-Wert, um experimentell die Rolle des Trägheitsmoments zu untersuchen. |
| FR4 | Mehrere Rampenabschnitte | Simulation mehrerer aufeinanderfolgender Strecken (z.B. schiefe Ebene → horizontal → schiefe Ebene). |
| FR5 | Dynamische Reibung / Gleiten | Übergang Haftreibung → Gleitreibung visualisieren, wenn Rollbedingung manuell unterschritten wird. |
| FR6 | Diagramm-Export (PNG/SVG) | SVG-Diagramme als Bilddatei exportieren (Ergänzung zum bestehenden CSV-Export). |

---

## STANDALONE SIMULATIONEN — INTEGRATION & VERBESSERUNG

| ID | Titel | Simulation | Beschreibung |
|----|-------|-----------|--------------|
| S1 | Wellen-Simulation einpflegen | Interferenz zweier Punktquellen | Ist fertig implementiert (890 Zeilen), aber in keiner Index-Seite verlinkt. Kapitel "Wellen" fehlt in `AllAnimations/index.html` komplett. |
| S2 | Dark Mode für alle Standalone-Sims | Alle | Standalone-Simulationen nutzen ein eigenes, älteres Design-System (kein Dark Mode, andere Fonts). Angleichen an den FH-Standard aus `global_docs/simulation_instruction.md`. |
| S3 | Vorschaubilder vervollständigen | AllAnimations | Einige Karten haben noch kein Vorschaubild (Platzhalter "Vorschau"). |
| S4 | Taschenrechner einordnen | Taschenrechner | Ist kein Physik-Thema im eigentlichen Sinne. Entweder als Hilfsmittel in Index aufnehmen oder aus Standalone herauslösen. |

---

## NEUE SIMULATIONEN (Lehrplan-Lücken)

| ID | Titel | Kapitel | Beschreibung |
|----|-------|---------|--------------|
| N1 | Schiefe Ebene (Gleiten) | 1.2 | Reine Gleitreibung auf schiefer Ebene ohne Rollbewegung — einfacher Einstieg vor den rollenden Körpern. |
| N2 | Fadenpendel | 1.4 | Pendel mit großen Auslenkungen (numerisch, nicht nur harmonische Näherung), Periodenformel. |
| N3 | Zweidimensionaler Stoß | 1.8 | Aktuell gibt es nur den zentralen (1D) elastischen Stoß. Schiefer Stoß mit Impulserhaltung in x/y fehlt. |
| N4 | Elektrisches Feld / Kondensator | 2.x | Feldlinien, Äquipotentiallinien, Plattenkondensator. Kapitel Elektrostatik fehlt komplett. |
| N5 | Magnetfeld eines geraden Leiters | 2.x | Biot-Savart-Visualisierung — sinnvoller Vorläufer zur Lorentzkraft-Simulation. |
| N6 | Gedämpfte / erzwungene Schwingung | 1.x | Erweiterung der Federschwingung um Dämpfung und Resonanz. |

---

## INFRASTRUKTUR & REPOSITORY

| ID | Titel | Beschreibung |
|----|-------|--------------|
| I1 | GitHub Pages Deployment | Automatische Veröffentlichung der Simulationen bei Push auf `main` (GitHub Actions). Studenten könnten direkt über eine URL darauf zugreifen. |
| I2 | Shared Design-System | Gemeinsame `shared/css/` und `shared/js/`-Bibliothek für beide Projekte (Design, `fmt()`, Math-Utils, SVG-Helpers). Reduziert Duplizierung. `shared/css/design-system.css` existiert bereits (145 Zeilen, nicht committed), Simulationen linken noch nicht drauf. |
| I3 | Unit-Tests für Physik-Module | Vitest-Setup für `physics.js` beider Projekte. Kernformeln (k-Faktor, Gleichgewicht, Precompute) testbar machen. |
| I4 | global_docs/simulation_instruction.md erweitern | Aktueller Blueprint beschreibt nur den modularen Aufbau. Fehlend: Umgang mit Standalone-Sims, Migrations-Workflow, Qualitätscheckliste. |

---

## MIGRATION: STANDALONE → MODULAR

| ID | Titel | Versionen | Beschreibung |
|----|-------|-----------|--------------|
| M1 | Schräger Wurf migrieren | 47 | Kandidat Nr. 1: Sehr reife Simulation (v47), didaktisch zentral, hoher Entwicklungsaufwand war da. Sauber in `Project_schraeger_wurf_simulation/` überführen. |

---

## ROLLOUT: Neue UI/UX & Design-System (Sprint 3)

Vollständiger Plan: `.claude/plans/crystalline-giggling-flamingo.md`.
Referenzimplementierung: `Project_freier_fall_simulation/` v2.2.x (einklappbare Sidebar, `--fh-mint`-Tokens, Dark Mode, Grid 280/1fr/270, Back-Button).
Blueprint: `global_docs/simulation_instruction.md` § „Einklappbare Analyse-Sidebar".
Adressiert bestehende Items **I2** (Shared Design-System linken) und **S2** (Dark Mode für Standalone-Sims) — werden mit R0/R4/R5/R6 geschlossen.

| ID | Prio | Titel | Abhängigkeit | Beschreibung |
|----|------|-------|--------------|--------------|
| R0 | Must | `shared/css/design-system.css` an CLAUDE.md angleichen | — | Tokens an FF-Referenz (Surface/Text/Border, `--fh-mint-dark`-Alias), Kraft-Vektorfarben auf Okabe-Ito (`#0072b2`/`#e69f00`/`#cc79a7`), Grid `280px 1fr 270px`, Klapp-Sidebar-CSS einlagern (off-screen Body, MathJax-Gotcha). Gate für R1–R3. Commit `refactor(repo)`. |
| R1 | Must | Atwood: einklappbare Sidebar + shared import | R0 | `<link>` shared; per-Sim Tokens bereinigen; Kollaps-HTML/JS laut Blueprint. v2.1.10 → v2.2.0. Hat schon Grid/Back-Button/Stopwatch/Legende/Okabe-Ito. Commit `feat(atwood)`. |
| R2 | Must | Rolling: Design-System + Sidebar + Legende + Stopwatch | R0 | `<link>` shared; Grid 255/295 → 280/270; Back-Button; `.legend-grid` für SP/P1–P4; kanonische Stopwatch (precompute-basiert); einklappbare Sidebar; Okabe-Ito-Kraftfarben. v1.9.5 → v2.0.0. Commit `feat(rolling)`. |
| R3 | Must | Lorentz: Gold-Reste & :root-Bugfix + Sidebar + Legende | R0 | Stale Gold-`rgba(232,197,71,…)` → Mint; doppeltes `:root`/`body.dark` am EOF entfernen; Grid → 280/270; Back-Button; `.legend-grid` (Strom + F_L/F_s); einklappbare Sidebar. **Keine Stopwatch** (statisches Gleichgewicht, keine Zeitanimation — bewusst). v1.4.1 → v1.5.0. Commit `fix(lorentz)`. |
| R4 | Should | 11 FH-blau-alt Standalone-Prototypen umstellen | R0 | `3massen_umlenkrollen_v2`, `ableitung`, `atwood`, `atwood_energy`, `elastischerStoß`, `federpendel`, `freier_fall_senkrechter_wurf`, `geschwindigkeit`, `grundbegriffe_kin`, `kreisbewegung`, `kreiskinematik_v5`: `<link>` shared, `--fh-blue`/`#005eb1` → Tokens, Font-Stacks → `--font-ui`/`--font-mono`, Dark Mode + Theme-Toggle, Back-Button. Pro Datei `style(standalone)`. |
| R5 | Could | 2 Bulma-Outlier umstellen | R0 | `schräger_wurf.html`, `zykloide3.html`: Bulma-Palette vollständig durch FH-Tokens ersetzen (größerer Eingriff, Layout/Funktion bleibt). |
| R6 | Could | Taschenrechner umstellen | R0 | `Standalone Proto/Taschenrechner/taschenrechner.html`: FH-blau-alt → FH-Design-System, Dark Mode, Back-Button. |
| R7 | Could | Übersicht linkt shared Design-CSS | R0 | `AllAnimations/index.html` nutzt aktuell inline duplizierte Tokens — auf `<link>` shared umstellen. |
| R8 | Could | Freier Fall linkt shared | R0 | `Project_freier_fall_simulation/` optional shared `@import`en lassen (Token-Drift auflösen); Referenz nicht riskieren — erst nach R0 stabil. |
| R9 | Must | Rollout abschließen: Doku & Backlog aktualisieren | R1–R8 | CLAUDE.md/BACKLOG: I2, S2 als erledigt markieren; Statistik; ggf. Konventionen um neu gewonnene Erkenntnisse ergänzen. Commit `docs(repo)`/`docs(global)`. |

---

## ERLEDIGT (Sprint 2 — 2026-06-15)

| ID | Titel | Version | Anmerkung |
|----|-------|---------|-----------|
| M2 | Freier Fall / Senkrechter Wurf migrieren | v2.1.9 | `Project_freier_fall_simulation/` — modular, Dark Mode, Precompute, CSV-Export |
| M3 | Atwood migrieren | v2.1.9 | `Project_atwood_simulation/` — inkl. Koordinatensystem-Fix, tAxisStep, yrel-Diagrammtyp |
| T5 | Zwei index.html konsolidieren | Sprint 3 | Veraltete `Standalone Proto/index.html` entfernt; `AllAnimations/` an Repo-Root gehoben — `AllAnimations/index.html` ist die einzige Übersichtsseite. Back-Buttons in Atwood/Freier Fall und Projekt-Links korrigiert. |

---

## STATISTIK

- **Gesamt-Items (offen):** 45
- **Bugs:** 3
- **Technische Schulden:** 6
- **Features (bestehende Projekte):** 11
- **Standalone-Verbesserungen:** 4
- **Neue Simulationen:** 6
- **Infrastruktur:** 4
- **Migrationen:** 1
- **Rollout UI/UX (Sprint 3):** 10 (R0–R9; R0 Must-Gate, R1–R3 modular, R4–R8 standalone, R9 Abschluss)
- **Erledigt:** 3 (M2, M3 — Sprint 2; T5 — Sprint 3)
