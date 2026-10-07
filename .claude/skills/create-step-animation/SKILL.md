---
name: create-step-animation
description: >-
  Erstellt eine neue Schritt-Animation (Lehr-Animation, `Project_<name>_animation/`) für
  Physik oder Mathematik in der FH-Aachen-FB-8-Lehre — ein festes, didaktisch durchdachtes
  Drehbuch, das Schritt für Schritt in Vorlesung oder Lernvideo vorgeführt wird (GSAP-Timeline,
  SVG-Bühne, Folienkarten, Animations- und Präsentationsmodus, PDF-Druck). Einsetzen bei
  „Animation erstellen“, „Lehr-Animation“, „Schritt-Animation zu <Thema>“, „animiere die
  Herleitung von …“, „Folien-Animation für die Vorlesung“, „erkläre <Konzept> Schritt für
  Schritt“, auch für größere Überarbeitungen bestehender Schritt-Animationen nach PO-Feedback.
  Nicht für interaktive Simulationen mit Reglern (→ create-physics-sim).
---

# Neue Schritt-Animation erstellen

Ziel ist eine Animation in der Qualität der Referenz **Signifikante Stellen** (v1.1.0):
fachlich exakt, didaktisch klar aufgebaut, ruhig und hochwertig gestaltet, kollisionsfrei,
reversibel, mit Animations- und Präsentationsmodus.

**Diese Skill ist die Ablaufschicht. Maßgeblich sind:**
- [`global_docs/animation_guideline.md`](../../../global_docs/animation_guideline.md) — Didaktik,
  Gestaltung, Bedienung, Arbeitsweise, Abnahme-Checkliste (**vor Beginn ganz lesen**)
- `global_docs/simulation_instruction.md` §10 — technischer Bauplan, Engine, Kamera
- `CLAUDE.md` — Repo-Regeln (Design-Tokens, Typografie, Versionierung, Webpage-Sync)
- Vorlage `_scaffold_schritt_animation/`, Referenz `Project_signifikante_stellen_animation/`

Details dieser Skill: [`references/drehbuch.md`](references/drehbuch.md) (Drehbuch-Methode,
Halte, Folienmuster) und [`references/pruefung.md`](references/pruefung.md) (Werkzeuge in `scripts/`).

## Ablauf

### Phase 0 — Klärung (vor jedem Code)
Gebündelt per `AskUserQuestion` klären, was fehlt: **Lernziel** (ein Satz, was danach
verstanden ist), **Zielgruppe/Vorwissen**, **Kapitel**, **durchgehendes Beispiel** mit
realistischen, nicht runden Werten, **Regel/Merksatz** am Ende jedes Kapitels, Einsatz
(Vorlesung, Video). Ist die Anfrage präzise genug → direkt Phase 1.

### Phase 1 — Fachmodell und Recherche
- Alle Zahlen als reine Funktionen in `js/model.js` + Vitest-Test (`test/<name>.model.test.js`).
- Regeln und Merksätze **vor dem Formulieren recherchieren** (Lehrplan, Schulbuch,
  OpenStax, Hochschulskripte, Fachdidaktik: typische Fehlvorstellungen). Quelle im CHANGELOG.
- Nicht-triviale Physik: Subagent `physics-model-researcher` (wie bei create-physics-sim).

### Phase 2 — Drehbuch (vor der Umsetzung, dem Nutzer zeigen)
Nach `references/drehbuch.md`: Kapitel → Schritte mit Titel, Folienkarte, Bühnenhandlung,
**Zwischenhalten** (Präsentationsmodus ≈ 2,5–3×), Kapitelende (Zusammenfassung in zwei
Schritten + Merke) und Abschlusskapitel. Bei offenen Didaktik-Entscheidungen beide Varianten
vorsehen. Das Drehbuch als kompakte Tabelle dem Nutzer vorlegen; bei großem Umfang auf
Freigabe warten.

### Phase 3 — Bau
`cp -r _scaffold_schritt_animation Project_<name>_animation`, dann constants → model →
state → render → steps → index.html → ui (Reihenfolge und Regeln: Scaffold-README, §10).
Bühnenplatz von Anfang an planen (Kartenfläche rechts oben freihalten). Gemeinsame
Bausteine (Vergleichstafel, Taschenrechner, Zusammenfassung, Druck) wiederverwenden.

### Phase 4 — Prüfung (selbst, vollständig)
Mit den Werkzeugen aus `scripts/` (siehe `references/pruefung.md`): **jeden** Schritt-Endzustand
in beiden Modi aufnehmen und ansehen, Reversibilität und Auto-Play prüfen, Halt-Warnungen = 0,
Dark Mode und Fensterbreiten stichprobenartig. Gefundenes sofort beheben und erneut prüfen.
Die Abnahme-Checkliste der Leitlinie (§6) ist erst erfüllt, wenn **alle** Punkte belegt sind.

### Phase 5 — Abschluss
Karte in `AllAnimations/index.html` (Vorschaubild nur vom PO), Version in `index.html` =
`docs/CHANGELOG.md`, `BACKLOG.md` (Eintrag + Follow-ups), `bash scripts/sync-webpage.sh` +
`check-webpage-drift.sh` (nur wenn freigegeben, sonst `NICHT_OEFFENTLICH`), Conventional
Commits. **Merge/Push nur auf Kommando.** Bericht: was gebaut wurde, Prüfbelege, offene
PO-Entscheidungen.

## Feste Regeln (mit Begründung)

- **Didaktik vor Effekt** — jede Bewegung muss einen Gedanken tragen; Effekte ohne Aussage
  lenken ab (Leitlinie §1).
- **Keine schiefen Metaphern, keine vorweggenommenen Begriffe, Regeln vollständig mit
  Rechenart** — diese drei Fehler hat der PO am häufigsten korrigiert.
- **Jede Zahl aus dem Modell** — handgetippte Zahlen driften zwischen Bühne, Karte und Tabelle.
- **Reversibel bauen** (nur Tweens/Sets auf Zahlen; `beat(tl)` für Halte) — sonst liefert
  „Zurück“ einen anderen Zustand, und der Präsentationsmodus friert mitten im Tween ein.
- **Selbst vollständig sichtprüfen** — ein fehlerfreies Log sagt über Kollisionen nichts;
  der PO hat jede übersehene Überlappung gefunden.
- **Textmaße erst nach dem Schrift-Laden** — sonst sitzen Markierungen neben der Ziffer (B54).
- **Feedback erst ins Backlog, dann gebündelt umsetzen** — ein Commit je Punkt,
  Version +0.0.1, danach Schlusskontrolle (Leitlinie §5).
