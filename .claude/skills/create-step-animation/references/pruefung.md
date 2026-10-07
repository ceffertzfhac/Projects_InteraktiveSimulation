# Prüfung mit den Skill-Werkzeugen

Werkzeuge in `../scripts/` (Node ≥ 22, Chrome, Python mit Pillow; kein npm nötig).
Server **vom Repo-Root**: `python3 -m http.server 8765`.

```bash
S=.claude/skills/create-step-animation/scripts
A=Project_<name>_animation

# 1) Endzustand jedes Schritts — Animationsmodus, dann Präsentationsmodus, dann Stichprobe dunkel
ANIM=$A SPEC="grund:1-20,mult:1-18" OUT=/tmp/shots node $S/cdp.mjs $S/shots.mjs
ANIM=$A SPEC="grund:1-62" MODE=pres OUT=/tmp/shots node $S/cdp.mjs $S/shots.mjs
ANIM=$A SPEC="grund:5,mult:6" THEME=dark OUT=/tmp/shots node $S/cdp.mjs $S/shots.mjs

# 2) Übersichten zum Durchsehen (je 4 Schritte pro Bild)
python3 $S/grid.py /tmp/shots/R1.png /tmp/shots/grund_{1,2,3,4}.png

# 3) Reversibilität beider Modi, Schrittzahlen, Halt-Warnungen (+ Auto-Play mit PLAY=1)
ANIM=$A PLAY=1 node $S/cdp.mjs $S/check.mjs
```

Erwartet: `abweichend: keine` für jedes Kapitel und beide Modi, Auto-Play bis `N/N`,
`NaN: 0`, „keine Warnungen/Fehler“.

## Worauf beim Durchsehen achten

- Kollisionen: Beschriftung ↔ Karte, Pfeil, Achse, andere Beschriftung; Achsenname frei
- Markierungen auf der richtigen Ziffer (Kasten, Pfeil, Einfärbung)
- Karten nicht über Tafeln; Vollfolien randlos; nichts abgeschnitten
- Zwischenzustände kritischer Schritte (Halte im Präsentationsmodus zeigen sie)
- Zahlen in Bühne, Karte und Tabelle identisch
- Fensterbreite: `W=900 H=760` bzw. `W=1280` für die Transportleiste

Für einen einzelnen Zwischenzustand: eigenes Kurzskript mit `B.evalJs`
(`store.presenter.engine.next()` und nach *t* Sekunden `B.shot`).

## Druck

Über `B.send('Page.printToPDF', { landscape: true, printBackground: true, preferCSSPageSize: true })`
nach dem Auslösen des Druckmenüs (`window.print` vorher abfangen). Seitenzahl = Schrittzahl des
aktiven Modus.
