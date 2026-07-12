# Changelog — Grundbegriffe der Kinematik

Alle nennenswerten Änderungen an dieser Simulation. Version folgt
[SemVer](https://semver.org/): patch = Bugfix/Style, minor = Feature,
major = brechende Änderung. Die Versionsnummer in `index.html` wird
mitgeführt.

## v1.0.0 — 2026-07-12

M11 — Migration von `AllAnimations/grundbegriffe_kin.html` (Prototyp) auf
die 6-Modul-Architektur (`constants.js`/`state.js`/`physics.js`/`render.js`/
`ui.js`/`css/styles.css`). Reaktives Werkzeug ohne Zeit-Animation (kein
Play/Pause/Stoppuhr/CSV, wie Ableitung/Geschwindigkeit): feste Bahnkurve
\(x(t)=t,\ y(t)=0{,}5\sin(2t)+0{,}5t\), zwei Zeit-Regler \(t_A/t_B\)
markieren zwei Punkte A/B darauf.

### Geändert (gegenüber dem Prototyp)
- **Erklär-Varianten umgezogen**: die 8 statischen Erklär-Texte (Ortsvektor,
  Verschiebung, Abstand, Weglänge, Strecke) lagen im Original in einem
  `<foreignObject>` innerhalb des skalierten `#main_svg` — genau das Muster,
  das in Federpendel (B21) zu einem Skalierungsbug führte (HTML-Layout
  skaliert nicht mit dem SVG-`viewBox`). Hier von Anfang an als echtes HTML
  in der rechten, einklappbaren Analyse-Sidebar (repo-weite Konvention),
  kein `<foreignObject>` mehr im SVG.
- **`store.currentVariant` neu eingeführt**: im Original war „welche
  Erklär-Variante ist sichtbar" nur implizit über DOM-`display`-Styles
  erkennbar, keine eigene Zustandsvariable. Jetzt einzige Quelle der
  Wahrheit, von Hover/Klick/Leave synchron gehalten.
- **Titel-Typo behoben**: „Grundbegriffe der Kinetmatik" → „Kinematik" (in
  `<title>` und `<h1>` des Originals) — bei der früheren „Werkzeug-Schale"-
  Politur (W3) bewusst ausgespart, aber eine volle Neuerstellung ist der
  natürliche Zeitpunkt für den Fix.
- **Kanonische Pfeilspitzen-Geometrie** (`refX=0` + `shortenEnd`, CLAUDE.md)
  für alle Vektorpfeile (Ortsvektoren, Verschiebungen) — das Original nutzte
  `refX=markerWidth` ohne Schaft-Kürzung (das bekannte, halb-falsche Muster).
- **Achsenbeschriftung** auf das repo-weite Format „Symbol / Einheit"
  (`x / m`, `y / m`) vereinheitlicht — statt der deskriptiven Original-Labels
  „x-Position"/„y-Position" (inkonsistent mit allen anderen Sims).
- **Effizienz**: die feste Bahnkurve (2000 Abtastpunkte) wird nur noch
  einmalig beim Laden berechnet (`physics.js::computePath()`), nicht mehr bei
  jeder Zeit-Slider-Bewegung neu abgetastet wie im Original — reine
  Effizienzverbesserung ohne Verhaltensänderung, da die Kurve ohnehin nie von
  \(t_A\)/\(t_B\) abhängt.
- Akkordeon-Steuerungs-Sidebar links (I8: Zeitpunkte · Visualisierung ·
  Legende), einklappbare Analyse-Sidebar rechts (Erklärung).

### Übernommen (unverändert aus dem Prototyp)
- Bahnkurve, Farbcodierung (Ortsvektoren orange, Verschiebung A→B grün,
  Verschiebung B→A rot, Abstand dieselbe grüne Farbe wie A→B, Weglänge
  blau/mint, Strecke grau).
- Hover-Verhalten (Steuerzeile hervorheben + Erklärung zeigen), Klick auf die
  Zeile (außerhalb der Checkbox) togglet den Toggle.
- \(t_A\)/\(t_B\)-Regler-Kopplung: \(t_A\) kann \(t_B\) nicht überholen (und
  umgekehrt) — der jeweils andere Regler zieht nach.
