# Phase 0 — Klärungs-Gate

Ziel: **kein Recherche-/Code-Aufwand an einer unklaren Aufgabe.** Erst prüfen,
was fehlt; nur das Fehlende bündeln und per `AskUserQuestion` fragen; dann
weiter. Präzise Anfragen passieren das Gate ohne Rückfrage.

## Pflichtangaben (fehlt eines → fragen)

| Was | Warum es den Bau bestimmt |
|---|---|
| **Phänomen / Aufgabe** | legt das physikalische Modell fest (Phase 1) |
| **Einstellbare Parameter** (Slider) + sinnvolle Bereiche/Einheiten | `constants.js`/`state.js` + Slider; ohne Bereiche keine Skalen |
| **Gesuchte Größen** (was der Nutzer ablesen/verstehen soll) | Live-Panel, Anzeige, Vektoren |
| **Diagramm(e)** — welche Größe über welcher (meist über *t*) | `render.js`-Graph, Achsen, CSV-Spalten |
| **Sim oder Werkzeug?** (Zeit-Animation vs. statisch-interaktiv) | Sim-Schale (§2–§6) vs. Werkzeug-Schale (§7) |
| **Zielniveau** (MPM Physik 1. Sem. als Default) | Wertebereiche, Formeltiefe, Beschriftung |

Nicht-blockierend, aber kurz mitnehmen, wenn unklar: Vergleichs-/Mehrkörper-
Modus? Energieansicht? Layout nebeneinander/gestapelt? Diese haben sinnvolle
Defaults und dürfen nachgezogen werden.

## Wann gilt die Anfrage als „präzise genug" (Gate offen, direkt zu Phase 2)

- Formeln/Modell sind mitgeliefert **oder** das Phänomen ist eindeutig
  Standard (freier Fall, schiefer Wurf, Federpendel, Atwood, Kreisbewegung …),
- die Parameter samt Bereichen sind genannt oder aus dem Phänomen offensichtlich,
- gesuchte Größe(n) und mindestens ein Diagramm sind erkennbar.

Dann **nicht** rückfragen — direkt bauen. Rückfragen bei bereits klarer Lage
sind genau der Zwischenschritt, den dieser Workflow vermeiden soll.

## Frageführung

- Offene Punkte in **einem** `AskUserQuestion`-Aufruf bündeln (bis 4 Fragen),
  nicht einzeln nachhaken.
- Konkrete Optionen mit Default/Empfehlung anbieten (der Nutzer wählt schneller,
  als er frei formuliert) — z. B. Parameterbereiche als Vorschlag, Diagrammtyp
  als Auswahl, „Sim vs. Werkzeug" als Entscheidung.
- Nach der Klärung: entscheiden, ob Phase 1 (Physik-Subagent) nötig ist oder
  ob die Angaben direkt in Phase 2 tragen.

## Sim vs. Werkzeug (kurz)

Keine zeitliche Animation (rein statisch oder nur slider-getrieben, kein
`requestAnimationFrame`) → **Werkzeug** (Blueprint §7): leichte Schale, kein
Play/Pause/Reset, keine Stoppuhr, kein CSV, Einzeldatei. Sonst **Sim**: volle
6-Modul-Schale.
