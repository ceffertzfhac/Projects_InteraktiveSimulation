# Known Limitations — Geschwindigkeit als Steigung der Ort-Zeit-Kurve

Bewußte lokale Einschränkungen, Won't-/Scope-Entscheidungen und Housekeeping.
Bugs, Features und Tech-Schulden werden zentral in `../../BACKLOG.md` getrackt
(siehe `## KONVENTIONEN` dort).

## Bewußte Scope-Entscheidungen

- **Kein Diagramm-Hover (→ BACKLOG I13.2 — Won't):** Diese Werkzeug-Sim
  bekommt **bewusst keinen** Cursor-Hover am Diagramm (gestrichelte
  Führungslinie + hohle Ring-Punkte + Tooltip mit exakten Werten), wie er an
  den Zeit-Achsen-Sims dieser Repo existiert (→ `shared/js/hover.js`,
  BACKLOG I5/I13.1). Grund: reaktives Diagramm ohne Zeitverlauf — ein
  Hover-at-x mit adaptiertem Tooltip (Ort/Geschwindigkeit am x-Punkt statt
  „Wert bei t") wurde im Rahmen von I13.2 erwogen und auf ausdrückliche
  Nutzer-Entscheidung (2026-07-15) verworfen. Dies ist eine bewusste
  Scope-Entscheidung, keine Lücke.