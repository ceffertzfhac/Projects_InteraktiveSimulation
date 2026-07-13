# Known Limitations — Rollender Zylinder / Zykloide

Bewußte lokale Einschränkungen. Bugs, Features und Tech-Schulden werden zentral
in `../../BACKLOG.md` getrackt (siehe `## KONVENTIONEN` dort). Sim-spezifische
Feature-Wünsche: → **FZ1**–**FZ7**; Querschnitts-Features → **I5**/**I6**/**I7**.

## Bekannte Einschränkungen
- **Graph-Titel als `textContent`** gesetzt (kein kursiver Tspan-Symbol); die
  Achsenlabels verwenden `createStyledSvgText` (kursiv). Didaktisch ausreichend.
- **Vektor-Skalierung fest** (`V_VECTOR_SCALE = 50`): bei v_c = 1,0 m/s werden
  Vektoren 50 px lang — bei kleinen Werten entsprechend kürzer. Bewußt für
  Parität zum v2.8-Prototyp. → **FZ6**.
- **Live-Analyse-Subjekt-Gruppen** nutzen `display:none` für inaktive Subjekte
  (MathJax typset die Inline-Math beim Laden zuverlässig; Aufklappen zeigt
  fertige Formeln).
- **Hover-Cursor (I5) nur auf bereits gezeichnetem Kurvenabschnitt**: Hover wird
  auf `[0, min(time_range, simulatedTime)]` geklammert — es gibt keinen Cursor
  auf noch nicht abgespielter (aber schon precomputeter) Fläche. Bewußte
  Design-Entscheidung, damit der Cursor nie auf leerem Diagrammbereich landet.
  Gilt als Konvention für den I5-Rollout auf die anderen 3 Sims. → **I5**.
- **Kein Energie-Diagramm (bewußt)**: Die Zykloide/Rollender Zylinder ist eine
  *Kinematik*-Simulation (Bahn, Geschwindigkeit, Beschleunigung des rollenden
  Punkts); eine Energiebilanz wäre eine *Dynamik*-Größe und paßt thematisch nicht
  zum Schwerpunkt dieser Sim. Energie-Diagramme daher bewußt nicht angeboten. → **I7**.