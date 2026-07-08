# Known Limitations — Statisches Kräftegleichgewicht (3-Massen-Umlenkrollen)

Bewußte lokale Einschränkungen, Won't-Entscheidungen und Housekeeping-Notizen.
Bugs, Features und Tech-Schulden werden zentral in `../../BACKLOG.md` getrackt
(siehe `## KONVENTIONEN` dort). Sim-spezifische Feature-Wünsche dieser Sim:
→ **F31**–**F33**.

## Offene Abnahme-Frage
- **m₃-Default 1,1 kg vs. Anzeige „2,1 kg" (Prototyp):** → **B6** in `BACKLOG.md`.
  Der v2-Prototyp trug im HTML `value="1.1"` am m₃-Slider, aber den Anzeigetext
  „2.1 kg" (staler Platzhalter); runtime-relevant war 1,1. Die Migration übernimmt
  1,1 kg (Verhalten wie der Prototyp beim Laden). Falls didaktisch 2,1 kg gewünscht
  war: `M3_DEFAULT` in `constants.js` auf 2,1 ändern — bitte Abnahme klären.

## Housekeeping
- `Standalone Proto/3Massen_umlenkrollen/` enthält weitere Varianten (`_v3`,
  `_winkelkraft_correct`, `_old`, `symbolische_berechnung.ipynb`), die nicht
  migriert wurden. Sie sind historische Proto-Quellen und bleiben im Proto-Ordner;
  ggf. stilllegen, falls sie nicht mehr benötigt werden.

## Won't (bewußt nicht)
- Play/Pause, Stoppuhr, Zeit-Animation — statisches Gleichgewicht, keine
  Zeitreihe (Sim-Schale analog Lorentz).