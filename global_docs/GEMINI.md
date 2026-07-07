# GEMINI.md — Kontext für den Gemini-Assistenten

> **Kanonischer Leitfaden ist [`../CLAUDE.md`](../CLAUDE.md).** Diese Datei ist nur
> der Einstiegspunkt für den Gemini-Assistenten; bei Widersprüchen gilt CLAUDE.md.
> Status & Aufgaben liegen im repo-weiten [`../BACKLOG.md`](../BACKLOG.md).
>
> Frühere Fassung dieser Datei war eine rollende-Körper-spezifische Doppelspur zu
> CLAUDE.md und enthielt veraltete/false Aussagen (u. a. „Syne"-Font, der inzwischen
> abgeschafft ist, und die Behauptung, `index.html` ließe sich per `file://` öffnen —
> ES-Module scheitern aber an CORS, siehe CLAUDE.md § „Running a Simulation").
> Daher konsolidiert auf diesen Zeiger (T4, Session 2026-07-07).

## Repo-Überblick

Mono-Repo interaktiver Physik-Simulationen für FH Aachen FB 8 — reine Client-Web-Apps:
Vanilla-JS-ES-Module, SVG-Grafik, MathJax 3. **Kein Build-Schritt, kein npm, keine
automatisierten Tests** — Verifikation erfolgt manuell im Browser.

## Wo was liegt

- `CLAUDE.md` — kanonischer Leitfaden (Architektur, Design-System, Konventionen,
  Checkliste „Neue Simulation", Git-Workflow).
- `BACKLOG.md` — MoSCoW-priorisiertes, repo-weites Backlog (Bugs, Tech-Schulden,
  Features, Migrationen, Werkzeug-Schalen).
- `global_docs/simulation_instruction.md` — Blueprint zum Aufbau einer Simulation
  (§7 Werkzeug-Schale, §8 Migrations-Workflow Standalone → Modular).
- `Project_*/` — die modularen Simulationen (jeweils 6-Modul-Architektur).
- `AllAnimations/` — repo-weite Übersichtsseite (`index.html`) + ausgelagerte
  Standalone-Prototypen.
- `shared/css/design-system.css` — gemeinsame Design-Tokens (FH Aachen Corporate
  Design, Okabe-Ito-Kraftfarben, Klapp-Sidebar-CSS).

## Für Gemini

Beginne jede Arbeit mit `CLAUDE.md` und `BACKLOG.md`. Versionsstände, Konventionen
und physikalische Regeln stehen dort verbindlich; diese Datei pflegt keine eigene
Inhaltsspur, um Drift zu vermeiden.