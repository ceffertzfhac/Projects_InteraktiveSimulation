---
name: create-physics-sim
description: >-
  Erstellt eine neue interaktive Physik-Simulation (Vanilla-JS/ES-Module, SVG,
  MathJax) für die FH-Aachen-FB-8-Lehre nach dem kanonischen Blueprint.
  Einsetzen, wenn der Nutzer eine neue Simulation, Animation oder ein
  interaktives Diagramm wünscht — aus einer Physik-Übungsaufgabe, einem
  Phänomen oder einer fertigen Spezifikation. Trigger u. a.: "neue Simulation",
  "Sim erstellen", "aus dieser Aufgabe eine Simulation bauen",
  "animiere/visualisiere <Phänomen>", "Simulation für <Thema>" (schiefer Wurf,
  Federpendel, Atwood, Kreisbewegung, Wellen). Beginnt mit einem Klärungs-Gate:
  bei vagen Anfragen werden zuerst Parameter, gesuchte Größen und Diagramme
  erfragt, bevor Recherche-/Code-Aufwand entsteht; präzise Anfragen gehen direkt
  in die Erstellung. Nicht-triviale Physik wird konditional an den
  physics-model-researcher-Subagenten delegiert. Nicht für Bugfixes/Änderungen
  an bestehenden Sims oder die Standalone→Modular-Migration (Blueprint §8).
---

# Neue Physik-Simulation erstellen

Orchestriert den Bau einer neuen Sim. **Dies ist die Entscheidungs- und
Ablaufschicht — die Detailrezepte stehen im Blueprint und den Referenzdateien;
hier wird nicht dupliziert.**

- Kanonisch & maßgeblich: `CLAUDE.md` + `global_docs/simulation_instruction.md`
  (bei Konflikt gewinnen sie). Startpunkt-Skelett: `_scaffold_neue_sim/`.
- Details dieser Skill: [`references/klaerung-gate.md`](references/klaerung-gate.md)
  und [`references/bau-und-verifikation.md`](references/bau-und-verifikation.md).

## Ablauf

### Phase 0 — Klärungs-Gate (immer zuerst, entscheidet den Rest)
Prüfe die Anfrage gegen die Pflichtangaben in `references/klaerung-gate.md`.
- **Unvollständig/vage** → die offenen Punkte **gebündelt per `AskUserQuestion`**
  klären, *bevor* Recherche oder Code entsteht. Grund: Aufwand an einer falsch
  verstandenen Aufgabe ist teuer zu verwerfen.
- **Präzise genug** (Phänomen, Parameter, gesuchte Größen/Diagramme klar; oder
  Formeln mitgeliefert) → **direkt zu Phase 2**, keine Rückfrage-Schleife.
- Nebenbei entscheiden: echte Zeit-Animation (Sim-Schale) oder statisches
  interaktives Werkzeug (Blueprint §7)? Das ändert Schale und Umfang.

### Phase 1 — Physik-Modell (konditional delegiert)
- **Delegieren** an den Subagenten `physics-model-researcher`, wenn das Modell
  hergeleitet/verifiziert werden muss oder Kursmaterial nachzuschlagen ist.
  Grund: Recherche verbrennt Kontext (Web, Herleitungs-Sackgassen), der sonst
  die ganze Erstellung mitschleppt; zurück kommt nur eine kompakte Physik-Spec.
- **Überspringen**, wenn die Aufgabe die Formeln/Parameter schon liefert oder
  das Modell trivial ist (z. B. gleichförmig beschleunigt) — ein kalter
  Subagent-Kontext lohnt dort nicht.

### Phase 2 — Erstellung
`_scaffold_neue_sim/` kopieren, dann die 6 Module gemäß Physik-Spec füllen.
Reihenfolge & Modul-Mapping: `references/bau-und-verifikation.md` + Blueprint
§9 (Neubau) / §2–§4 (Struktur, Design, Konventionen).

### Phase 3 — Verifikation (billig, inline) + Übergabe
Deterministische Checks selbst laufen lassen (`node --check`, `precompute`-
Node-Test, Serve-Smoke **vom Repo-Root**, Drift-Check). Die **visuelle Abnahme
übergibst du dem Nutzer** (VS-Code-Preview) — Headless nur nach Rückfrage.
Reihenfolge: erst Checkliste §6 **Gruppe A (MVP)**, dann **Gruppe B (Politur)**.

### Phase 4 — Abschluss
Karte in `AllAnimations/index.html`, `bash scripts/sync-webpage.sh` +
`check-webpage-drift.sh`, Version in `index.html` ↔ `docs/CHANGELOG.md`,
`BACKLOG.md`-Follow-ups, Conventional-Commit. Details ebenda.

## Feste Regeln (mit Begründung)

- **Erst klären, dann investieren** — weil Recherche/Code an einer
  fehlverstandenen Aufgabe komplett verworfen werden muss.
- **Physik zuerst isoliert absichern** (Node-Test der DOM-freien `physics.js`),
  bevor UI-Aufwand fließt — ein falsches Modell macht jede Politur wertlos
  (Checkliste §6, Gruppe A vor B).
- **Vom Repo-Root servieren** — die Module importieren `../../shared`; ein im
  Sim-Ordner wurzelnder Server löst das über seine Wurzel hinaus auf → 404.
- **Visuelle Abnahme dem Menschen** (VS-Code-Preview), Headless-Browser nur nach
  Rückfrage — entspricht der etablierten Praxis und vermeidet unnötigen Aufwand.
- **Vor dem Commit `sync-webpage.sh` + Drift-Check** — sonst driftet die
  öffentliche Pages-Site (I11). Der `pre-commit`-Hook blockt bei Drift.
- **Blueprint referenzieren, nicht duplizieren** — `CLAUDE.md` und
  `simulation_instruction.md` bleiben die einzige Wahrheit; diese Skill altert
  sonst weg.
- **Vorschaubild erhalten** — bestehendes `Vorschaubilder/<name>.png` nie durch
  Emoji-Platzhalter ersetzen; neues Bild nur, wenn der Product Owner es liefert.
