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

## ERLEDIGT (Sprint 2 — 2026-06-15)

| ID | Titel | Version | Anmerkung |
|----|-------|---------|-----------|
| M2 | Freier Fall / Senkrechter Wurf migrieren | v2.1.9 | `Project_freier_fall_simulation/` — modular, Dark Mode, Precompute, CSV-Export |
| M3 | Atwood migrieren | v2.1.9 | `Project_atwood_simulation/` — inkl. Koordinatensystem-Fix, tAxisStep, yrel-Diagrammtyp |
| T5 | Zwei index.html konsolidieren | Sprint 3 | Veraltete `Standalone Proto/index.html` entfernt; `AllAnimations/` an Repo-Root gehoben — `AllAnimations/index.html` ist die einzige Übersichtsseite. Back-Buttons in Atwood/Freier Fall und Projekt-Links korrigiert. |

---

## STATISTIK

- **Gesamt-Items (offen):** 35
- **Bugs:** 3
- **Technische Schulden:** 6
- **Features (bestehende Projekte):** 11
- **Standalone-Verbesserungen:** 4
- **Neue Simulationen:** 6
- **Infrastruktur:** 4
- **Migrationen:** 1
- **Erledigt:** 3 (M2, M3 — Sprint 2; T5 — Sprint 3)
