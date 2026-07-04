# Issues — Schräger Wurf

## Offen
- *(keine)*

## Behoben
- **v47-Abwurfwinkel-Inkonsistenz**: Im Standalone-Prototyp stand im HTML `value="70"`, die Anzeige aber „45 °". Modular auf 45° konsistent gesetzt (Slider + Store + Anzeige).

## Bekannte Einschränkungen
- LCD-Digitaluhr-Easteregg wird per Klick auf die Stoppuhr umgeschaltet (wie v47); beiCollapsed Analyse-Sidebar nicht sichtbar (in der SVG-Szene, nicht im Panel).
- Graph-Titel ist als `textContent` gesetzt (kein kursiver Tspan-Symbol); die Achsenlabels verwenden `createStyledSvgText` (kursiv). Didaktisch ausreichend.