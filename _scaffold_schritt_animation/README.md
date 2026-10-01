# `_scaffold_schritt_animation/` — Vorlage für eine Schritt-Animation

Ein **minimal lauffähiges** Skelett für Lehr-Animationen, die Schritt für Schritt
vorgeführt werden (Vorlesung, Lernvideo) — Gegenstück zu `_scaffold_neue_sim/`
für interaktive Simulationen. Rezept und Regeln: `global_docs/simulation_instruction.md`
§10. Nicht in `AllAnimations/index.html` verlinkt, kein `Project_*`-Ordner →
von Sync-/Drift-/Deploy-Skripten ignoriert.

## Lokal ausprobieren

**Vom Repo-Root servieren** (die Module importieren `../../shared/js/…`):

```bash
python3 -m http.server 8000
# → http://localhost:8000/_scaffold_schritt_animation/
```

Bedienung: → / Leertaste weiter, ← zurück, Pos1 Anfang, `P` Auto-Play,
`F` Vollbild, `H` Bedienung ausblenden.

## Als Startpunkt verwenden

```bash
cp -r _scaffold_schritt_animation Project_<name>_animation
```

Dann der Reihe nach:

1. `js/constants.js` — Bühnengeometrie (`VIEW`), Timing, Inhalte
2. `js/model.js` — alle angezeigten Zahlen als reine Funktionen (+ Vitest-Test)
3. `js/state.js` — jede animierbare Größe als **Zahl** in `createScene()`
4. `js/render.js` — Elemente einmal in `initStage()` bauen, in `renderScene(S)` setzen
5. `js/steps.js` — das Drehbuch: `{ title, hold?, build(tl, S) }` je Schritt
6. `index.html` — Titel/Version, Folienkarten (statisches HTML + MathJax)
7. `js/ui.js` — Kapitel für den Presenter

**Goldene Regel:** `build()` hängt nur Tweens/Sets an die Timeline — keine
Callbacks mit Seiteneffekten, keine Strings in der Szene (Texte als Index in eine
Tabelle). Nur dann führt „Zurück" exakt in den Vorzustand.

Danach: Version in `index.html` + `docs/CHANGELOG.md`, Karte in `AllAnimations/`,
Eintrag in `BACKLOG.md`.
