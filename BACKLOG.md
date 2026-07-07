# Projekt-Backlog: Interaktive Physik-Simulationen

Stand: 2026-07-04 | Priorisierung: MoSCoW (ausstehend)

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
| T3 | ✅ AGENTS.md und README.md aktualisieren | Repo | **Erledigt (Session 2026-07-07):** Beide neu geschrieben auf die aktuelle Repo-Struktur (9 `Project_*`-Sims, `AllAnimations/`, `Standalone Proto/`, `shared/`, `global_docs/`), veraltete Namen (`zykloide_schiefe_ebene/`, `lorentz_force_simulation/`, v1.0.0/v1.6.0) entfernt. AGENTS.md verweist auf CLAUDE.md als kanonische Quelle. ~~ Ursprünglich: referenzierten noch alte Verzeichnisnamen. ~~ |
| T4 | GEMINI.md aufräumen | Repo | `global_docs/GEMINI.md` ist inhaltlich nahezu identisch mit `CLAUDE.md`. Entweder konsolidieren oder klar abgrenzen. |
| T6 | Einheitliche `fmt()`-Funktion | Beide | Projekt 1 nutzt `toLocaleString('de-DE')`, Projekt 2 `toFixed().replace()`. Projekt 2 ist robuster (NaN-Check). Angleichen. |
| T7 | Magic Numbers in render.js | Lorentzkraft | Feder-Parameter (14 Windungen, Radius 7, Drahtbreite 2,6, 12 Helix-Schritte) sind hardcodiert. Zu Konstanten machen. |
| T8 | ✅ Combining-Pfeil-Vektorlabels repo-weit angleichen | Alle (v/a/F-Sims) | **Erledigt (Session 2026-07-07):** PO-Entscheid — nur **bestehende** Labels angleichen, keine neuen an label-lose Sims. Rollende Körper (v2.0.4) + Lorentz (v1.5.4) auf `F⃗`+Index (Serif-Italic, `stroke:none`, Werte bewußt entfernt) gebracht; `--font-serif` in shared CSS zentralisiert. Nachbesserungen: Rolling v2.0.5 (Kräfte-Beträge im Analyse-Tab), 3-Massen v1.2.0 (Winkel α zur Horizontalen in Grafik + Analyse). 6 label-lose Sims (Freier Fall, Schräger Wurf, Zykloide, Atwood, Federpendel, Kreisbewegung) bewußt unangetastet — separates Feature. ~~ Ursprünglich: 3-Massen (v1.0.7+) setzt Vektor-Labels als Symbol mit Combining-Arrow U+20D7 (`F⃗`) in Serif-Italic + `stroke:none` (kein Faux-Bold, s. CLAUDE.md „SVG-Text-Labels nie stroke-tragende vec-Klasse"). Andere Sims beschriften ihre v/a/F-Vektoren uneinheitlich. Nur die Label-Notation angleichen — Pfeilspitzen-Geometrie (`refX=0`+`shortenEnd`) war bereits repo-weit gefixt (Session 2026-07-06). ~~ |

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
| S2 | ✅ Dark Mode für alle Standalone-Sims | Alle | **Erledigt (Sprint 3, R4–R6):** Alle 14 Standalone-Prototypen + Taschenrechner auf FH-Design-System umgestellt (shared-CSS-Link, Token-Mapping, Dark Mode via `body.dark`-Kaskade, Theme-Toggle mit einheitlichem `fh_theme`-localStorage-Key, Back-Button). |
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
| I2 | ✅ Shared Design-System | **Erledigt (Sprint 3, R0/R7):** `shared/css/design-system.css` an CLAUDE.md/FF-Referenz angleichen (Tokens, Okabe-Ito-Kraftfarben, Grid 280/1fr/270, Klapp-Sidebar-CSS). Alle modularen Sims (Atwood/Rolling/Lorentz) und die Übersicht linken shared; Standalones via `<link>` vor Inline-`<style>`. `shared/js/` (fmt/Math/SVG-Helper) weiterhin offen (siehe I3-Kontext). |
| I3 | Unit-Tests für Physik-Module | Vitest-Setup für `physics.js` beider Projekte. Kernformeln (k-Faktor, Gleichgewicht, Precompute) testbar machen. |
| I4 | ✅ Blueprint um Werkzeug-Schale + Migrations-Workflow erweitern | **Erledigt (Sprint 4a):** `global_docs/simulation_instruction.md` um §7 „Werkzeug-Schale" (diagrammatische Werkzeuge, keine Sim-Controls) und §8 „Migrations-Workflow: Standalone → Modular" (Schritt-für-Schritt incl. Konsolidierungs-Prüfung) ergänzt. |

---

## MIGRATION: STANDALONE → MODULAR

| ID | Titel | Versionen | Beschreibung |
|----|-------|-----------|--------------|
| M1 | ✅ Schräger Wurf migrieren | 47 | **Erledigt (Sprint 4b):** `Project_schraeger_wurf_simulation/` v1.0.0 — precompute + interpolateAt, volle Feature-Parität zum v47-Prototyp. Fehlabgelegtes `AllAnimations/schräger_wurf.html` (Rollender-Zylinder-Dup) gelöscht. Commit `8880539`. |
| M4 | ✅ Zykloide migrieren | zykloide3 | **Erledigt (Sprint 4b):** `Project_zykloide_simulation/` v1.0.0 — gleicher Scaffold wie M1, Trochoiden-Physik (ω=Vc/R, r=0,9·R), Kamera-Follow, 5 Subjekte × 8 Größen, CSV. `AllAnimations/zykloide3.html` gelöscht. Commit `2378737`. |
| M5 | ✅ Federpendel migrieren | federpendel | **Erledigt (Sprint 4e):** `Project_federpendel_simulation/` v1.0.0 — 6-Modul, precompute + interpolateAt, kanonische Topbar-Buttonleiste, einklappbare Sidebar, gestapeltes Center-Layout, statisches MathJax, CSV (sep=;). `AllAnimations/federpendel.html` + `Standalone Proto/Federpendel/` stillgelegt. |
| M6 | Kreisbewegung migrieren | kreisbewegung (+kreiskinematik_v5) | → `Project_kreisbewegung_simulation/`. **Vorher prüfen**, ob `kreiskinematik_v5` darin aufgeht (thematisch nah, größte Datei) — Konsolidierung statt Doppelmigration. |
| M7 | Atwood-Energie migrieren | atwood_energy | Entweder eigene `Project_atwood_energy_simulation/` *oder* Energie-Graphen als Diagrammtyp-Option in `Project_atwood_simulation/` aufnehmen (Produktentscheidung bei Umsetzung). |
| M8 | Elastischer Stoß migrieren | elastischerStoß | → `Project_stoss_simulation/`. **Größter Physik-Eingriff:** Per-Frame-Physik → `precompute()` umstellen. |
| M9 | ✅ 3-Massen-Umlenkrollen migrieren | 3massen_umlenkrollen_v2 | **Erledigt (Sprint 4):** `Project_3massen_umlenkrollen_simulation/` v1.0.0 — als **Sim-Schale** (analog Lorentz: Topbar Theme+Reset, kein Play/Pause/Stoppuhr/CSV) umgesetzt. `computeEquilibrium()` löst Winkel analytisch aus dem Kräftedreieck; SVG-`<text>`-Labels (kein HTML-Overlay), kanonische Pfeilspitzen, Okabe-Ito-Farben, einklappbare Analyse-Sidebar. Standalone-HTML ins `legacy_archive/` verschoben; Karte auf Modular umgehängt. |

## WERKZEUG-SCHALE (Diagrammatische Werkzeuge, in-place)

| ID | Titel | Datei | Beschreibung |
|----|-------|------|--------------|
| W1 | Ableitung → Werkzeug-Schale | ableitung.html | Keine Animation → Werkzeug-Schale (§7 Blueprint): Topbar + Back + Theme + Tokens, keine Play/Pause/Reset/Stoppuhr/CSV. Legende + Graph-Konventionen (`setAxisLabel`). Statisches MathJax. |
| W2 | Geschwindigkeit → Werkzeug-Schale | geschwindigkeit.html | Wie W1. Step-Button-Widgets bleiben; Achsenbeschriftung kanonisch. |
| W3 | Grundbegriffe Kinematik → Werkzeug-Schale | grundbegriffe_kin.html | Wie W1. Viele Toggles bleiben; kein Sim-Loop. |

---

## ROLLOUT: Neue UI/UX & Design-System (Sprint 3)

Vollständiger Plan: `.claude/plans/crystalline-giggling-flamingo.md`.
Referenzimplementierung: `Project_freier_fall_simulation/` v2.2.x (einklappbare Sidebar, `--fh-mint`-Tokens, Dark Mode, Grid 280/1fr/270, Back-Button).
Blueprint: `global_docs/simulation_instruction.md` § „Einklappbare Analyse-Sidebar".
Adressiert bestehende Items **I2** (Shared Design-System linken) und **S2** (Dark Mode für Standalone-Sims) — **beide mit R0/R4/R5/R6/R7 geschlossen (Sprint 3).**

**Status (Sprint 3):** R0–R8 erledigt (R8 bewusst nicht umgesetzt — siehe unten); R9 = dieser Abschluss.

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
| R8 | Could | ~~Freier Fall linkt shared~~ (bewusst nicht umgesetzt) | R0 | `Project_freier_fall_simulation/` ist die kanonische Referenz, aus der `shared` abgeleitet wurde — bereits voll konform. Ein `@import` würde eine Cleanup der per-Sim `styles.css` (Base-Tokens + Klapp-CSS) erfordern und die Referenz riskieren, für marginalen DRY-Nutzen. Entscheidung: FF bleibt selbstständig. |
| R9 | Must | Rollout abschließen: Doku & Backlog aktualisieren | R1–R8 | CLAUDE.md/BACKLOG: I2, S2 als erledigt markieren; Statistik; ggf. Konventionen um neu gewonnene Erkenntnisse ergänzen. Commit `docs(repo)`/`docs(global)`. |

---

## ERLEDIGT (Sprint 2 — 2026-06-15)

| ID | Titel | Version | Anmerkung |
|----|-------|---------|-----------|
| M2 | Freier Fall / Senkrechter Wurf migrieren | v2.1.9 | `Project_freier_fall_simulation/` — modular, Dark Mode, Precompute, CSV-Export |
| M3 | Atwood migrieren | v2.1.9 | `Project_atwood_simulation/` — inkl. Koordinatensystem-Fix, tAxisStep, yrel-Diagrammtyp |
| T5 | Zwei index.html konsolidieren | Sprint 3 | Veraltete `Standalone Proto/index.html` entfernt; `AllAnimations/` an Repo-Root gehoben — `AllAnimations/index.html` ist die einzige Übersichtsseite. Back-Buttons in Atwood/Freier Fall und Projekt-Links korrigiert. |

---

## ERLEDIGT (Sprint 3 — 2026-07-03): Rollout UI/UX & Design-System

Vollständiger Plan: `.claude/plans/crystalline-giggling-flamingo.md`. Referenz: `Project_freier_fall_simulation/` v2.2.x.

| ID | Titel | Commit / Version | Anmerkung |
|----|-------|------------------|-----------|
| R0 | `shared/css/design-system.css` an CLAUDE.md angleichen + Klapp-CSS | `refactor(repo)` 8a6614b | Tokens, Okabe-Ito-Kraftfarben, Grid 280/1fr/270, Klapp-Sidebar-CSS (off-screen Body). |
| R1 | Atwood: einklappbare Sidebar + shared import | `feat(atwood)` 9ad770d · v2.2.0 | Hat schon Grid/Back-Button/Stopwatch/Legende/Okabe-Ito. |
| R2 | Rolling: Design-System + Sidebar + Legende + Stopwatch | `feat(rolling)` 1116404 · v2.0.0 | Grid 255/295 → 280/270; kanonische Stopwatch (precompute-basiert); Legende SP/P1–P4. |
| R3 | Lorentz: Gold-Reste & `:root`-Bugfix + Sidebar + Legende | `fix(lorentz)` 1674c7b · v1.5.0 | Stale Gold → Mint; doppeltes `:root`/`body.dark` entfernt; Okabe-Ito F_L/F_S. Keine Stopwatch (statisches Gleichgewicht). |
| R4 | 11 FH-blau-alt Standalone-Prototypen umstellen | `style(standalone)` f432622 | `--fh-blue`/`#005eb1` → `var(--fh-mint)`/`#00B1AC`; Token-Mapping (auto Dark Mode); Font-Stacks → `--font-ui`/`--font-mono`; Back-Button + Theme-Toggle. |
| R5 | 2 Bulma-Outlier umstellen | `style(standalone)` a76292c | `schräger_wurf` & `zykloide3`: Bulma-Kategorialpalette → FH-Tokens `--c-p1..p4`/`--c-sp`/`--c-vel`/`--c-acc`. |
| R6 | Taschenrechner umstellen | `style(standalone)` 0517442 | `../../shared/`-Pfad; Equals-Button → Mint; Back-Button → `../AllAnimations/index.html`. |
| R7 | Übersicht linkt shared Design-CSS | `refactor(standalone)` fe5b098 | Token-DRY; `fh-theme` → `fh_theme` (Dark Mode persistiert übersicht↔sim). |
| R8 | Freier Fall linkt shared | — (bewusst nicht umgesetzt) | Siehe R8-Zeile oben; FF bleibt selbstständige Referenz. |
| R9 | Rollout abschließen: Doku & Backlog | `docs(repo)`/`docs(global)` (this) | I2/S2 als erledigt markiert; CLAUDE.md um Standalone-Konvertierungs-Konventionen ergänzt; Statistik aktualisiert. |

---

## SPRINT 4: Vereinheitlichung aller Sims auf den modularen Soll-Zustand

**Ziel:** Alle in `AllAnimations/index.html` verlinkten Simulationen auf
**EINEN** einheitlichen Standard bringen (Technik, Design, UX/UI), von dem
nur in gut begründeten Ausnahmefällen leicht abgewichen wird. Maßstab:
**echte Best-Practice = wartbar, verwaltbar, übersichtlich.**

**Sprint-3-Klarstellung:** R0–R9 haben die Standalone-Prototypen nur
**token- und chrome-seitig** vereinheitlicht (Farben/Schrift/Back-Button/
Theme-Toggle via R4/R5). Layout, UX-Struktur und Architektur wurden *nicht*
angefasst — die Prototypen bleiben Einzel-HTML mit je eigenem Layout.
Sprint 4 schließt diese Lücke.

**Strategische Entscheidungen (Sprint 4a):**
1. **Dubletten stilllegen:** `atwood.html` und `freier_fall_senkrechter_wurf.html`
   waren verwaiste Dubletten der modularen Projects (ungelinkt) — gelöscht.
2. **Hybrid als Standard:** Echte (animierte) Simulationen → volle 6-Modul-
   Architektur als neues `Project_<name>/` (Migrations-Workflow §8 Blueprint).
   Diagrammatische Werkzeuge → eigene leichte Werkzeug-Schale (§7 Blueprint),
   in-place, keine Sim-Controls.
3. **Konsolidierung prüfen** statt Doppelmigration (schräger_wurf↔zykloide3,
   kreisbewegung↔kreiskinematik_v5, atwood_energy↔Project_atwood).

**Sprint 4a (erledigt):** Dubletten gelöscht; Blueprint §7 + §8 ergänzt
(I4 erledigt); Roadmap als M4–M9 + W1–W3 ins Backlog eingetragen.
Die einzelnen Migrationen (M1, M4–M9) und Werkzeug-Umstellungen (W1–W3)
sind je eigene Folge-Iterationen mit eigenem Plan/Commit.

**Sprint 4b (erledigt):** M1 (Schräger Wurf) + M4 (Zykloide) als gepaarte
modulare Migration auf gemeinsamem Scaffold überführt (beide v1.0.0).
Beide Prototypen (`schräger_wurf.html`, `zykloide3.html`) aus `AllAnimations/`
entfernt, Karten auf die neuen `Project_*` geleitet. Plan:
`.claude/plans/jazzy-mixing-newell.md`. Offen: M5–M9, W1–W3.

---

## ERLEDIGT (Sprint 4b — 2026-07-04): M1 + M4 gepaarte Migration

Gemeinsamer Scaffold (Atwood-Muster: `precompute()` + `interpolateAt(t)`,
6-Modul-Architektur, shared Design-System, 3-Spalten-Layout, einklappbare
Analyse-Sidebar, Dark Mode via `fh_theme`). Plan:
`.claude/plans/jazzy-mixing-newell.md`.

| ID | Titel | Commit / Version | Anmerkung |
|----|-------|------------------|-----------|
| M1 | Schräger Wurf migrieren | `feat(standalone)` 8880539 · v1.0.0 | Aus `Standalone Proto/Schräger_Wurf/…v47.html` (1049 Zeilen). Volle Feature-Parität: Vektoren + Komponenten, Y-Achsen-Konfig, Strichmännchen, Stoppuhr + LCD-Easteregg, Zoom-Auto-Fit, Single/Stacked-Graph, CSV. Fehlabgelegtes `AllAnimations/schräger_wurf.html` (Rollender-Zylinder-Dup) gelöscht. |
| M4 | Zykloide / Rollender Zylinder migrieren | `feat(standalone)` 2378737 · v1.0.0 | Aus `AllAnimations/zykloide3.html` (863 Zeilen). Trochoiden-Physik (ω=Vc/R, r=0,9·R hardcoded), 5 Subjekte × 8 Größen, Kamera-Follow, Traces + Z-Order, Subjekt-Checkboxen (statisches HTML), CSV 5×8. `zykloide3.html` gelöscht. |

## ERLEDIGT (Session 2026-07-06): Vektor-Pfeilspitzen — kanonische Geometrie repo-weit

**Problem (vom PO gemeldet, Kreisbewegung):** Vektor-Pfeilspitze soll exakt auf
dem Zielpunkt sitzen (nicht zu lang/kurz), Schaft nicht aus der Spitze gucken.

**Ursachenanalyse (deterministisch, nicht per Augenmaß):** Die bisherige
CLAUDE.md-Regel „`refX = markerWidth` **und** Schaft kürzen" war **intern
widersprüchlich** = Doppelkompensation. `refX = markerWidth` setzt die Spitze
bereits ans Linien-Ende; die zusätzliche Schaft-Kürzung zog sie um eine
Marker-Länge **dahinter** → Pfeil endete zu kurz. Genau deshalb wurde der Bug in
mehreren Sims über Monate nur „halb" gefixt.

**Kanonische Lösung (eine konsistente Kombination):** Marker `refX = 0`
(Dreieck-**Basis** am Linien-Ende) **+** Schaft um Marker-Länge
`markerWidth · strokeWidth` kürzen (Helfer `shortenEnd()`). → Spitze exakt auf
dem Zielpunkt, Schaft an der Basis vom deckenden Dreieck überdeckt.

**Geänderte Dateien:**

| Bereich | Änderung |
|---|---|
| `CLAUDE.md` + `global_docs/simulation_instruction.md` | Widersprüchliche Pfeilspitzen-Regel durch die deterministische `refX=0`+Kürzungs-Regel ersetzt (inkl. „FALSCH"-Beispiel). Ausnahme Graph-Achsenpfeile (`#graph-arrowhead`, `refX=0` ohne Kürzung) unverändert. |
| Kreisbewegung → **v1.0.8** | 10 Animations-Marker `refX 5→0`; Kommentar in `render.js` korrigiert. `shortenEnd()` existierte bereits. Commit `08eafdb`. |
| Rollende Körper → **v2.0.3** | 5 Marker + dyn. Koordinatensystem-Marker `refX 6/5→0`; `shortenEnd()` neu; angewandt in `drawArrow` (sw 2,2), `drawAxis` (sw 2, mw 6) und Legende `addLeg`. |
| Lorentzkraft → **v1.5.3** | 4 Marker `refX 6→0`; `shortenEnd()` neu; angewandt auf Strom-Pfeile (`<path>`, sw 2) und Kraft-Pfeile `F_L`/`F_s` (Linien mit **dynamischer** Strichbreite → `by = 7 · dynamicWidth`). |

**Verifikation:** Alle drei Sims per Headless-Chrome-Screenshot geprüft (Server
**muss im Repo-Root** wurzeln, sonst 404 auf `../shared/css/design-system.css` →
kollabiertes Layout). Spitzen sitzen auf dem Endpunkt, kein Schaft-Überstand.

**Edge case in `shortenEnd()`:** Bei Vektoren kürzer als die Marker-Länge bleibt
ein 2px-Stub (damit `orient="auto"` eine Richtung hat); die Spitze überschießt
dann minimal — akzeptierter Grenzfall, betrifft nur sehr kurze Vektoren.

**Noch offen:** Weitere Sims mit Vektoren (Freier Fall, Atwood, Zykloide,
Schräger Wurf) wurden in **dieser** Session **nicht** geprüft — bei nächster
Berührung gegen die kanonische Regel abgleichen.

---

## STATISTIK

- **Gesamt-Items (offen):** 38
- **Bugs:** 3
- **Technische Schulden:** 7 (davon T8, T3 erledigt)
- **Features (bestehende Projekte):** 11
- **Standalone-Verbesserungen:** 4 (davon S2 erledigt)
- **Neue Simulationen:** 6
- **Infrastruktur:** 4 (davon I2, I4 erledigt)
- **Migrationen:** 4 offen (M6–M9) — M1, M2, M3, M4, M5 erledigt
- **Werkzeug-Schale:** 3 (W1–W3)
- **Rollout UI/UX (Sprint 3):** 10 (R0–R9 — **alle erledigt**; R8 bewusst als nicht umgesetzt dokumentiert)
- **Erledigt:** 21 (M2, M3 — Sprint 2; T5, I2, S2, R0–R9 — Sprint 3; I4 — Sprint 4a; M1, M4 — Sprint 4b; M5 — Sprint 4e; T8, T3 — Session 2026-07-07)
