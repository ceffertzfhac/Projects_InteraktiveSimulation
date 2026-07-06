# Issues — Statisches Kräftegleichgewicht (3-Massen-Umlenkrollen)

Stand: 2026-07-06 (v1.0.0)

## Bekannte Übernahme-Quecks
- **m₃-Default 1,1 vs. Display „2,1 kg" (Prototyp):** Der v2-Prototyp trug im HTML `value="1.1"` am m₃-Slider, aber den Anzeigetext „2.1 kg" (staler Platzhalter). Runtime-relevant war der Sliderwert 1,1. Die Migration übernimmt 1,1 kg als Default (Verhalten wie der Prototyp beim Laden). Falls didaktisch 2,1 kg gewünscht war, läßt sich der Default in `constants.js` (`M3_DEFAULT`) auf 2,1 ändern — bitte Abnahme klären.
- **`Standalone Proto/3Massen_umlenkrollen/`** enthält weitere Varianten (`_v3`, `_winkelkraft_correct`, `_old`, `symbolische_berechnung.ipynb`), die nicht migriert wurden. Sie sind historische Proto-Quellen und bleiben im Proto-Ordner; ggf. stilllegen, falls sie nicht mehr benötigt werden.

## Offen
- (keine)