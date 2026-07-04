# Feature-Backlog — Schräger Wurf

Mögliche Erweiterungen nach der Migration (v1.0.0). Nicht priorisiert.

## Didaktisch
- **Luftwiderstand-Modell**: Stokes/Newton-Drag als optionaler Schalter — aktuell reine Vakuumkinematik. Didaktisch wertvoll für Realitätsvergleich.
- **Vergleichende Würfe**: Mehrere Flugbahnen gleichzeitig (verschiedene \(\alpha\) bei gleichem \(v_0\)) zur Veranschaulichung des optimalen Abwurfwinkels (45° auf ebenem Boden, <45° bei \(h_0>0\)).
- **Optimalwinkel-Anzeige**: numerisch berechneter \(\alpha_{\text{opt}}\) für maximale Reichweite bei gegebenem \(h_0\), \(v_0\) — bei \(h_0>0\) liegt er unter 45°.
- **Energie-Diagramm**: kinetische/potentielle/gesamtenergie über Zeit (Energieerhaltung visualisieren).
- **Höhenlinie / Reichweitenmarker**: Markierung von \(x_{\text{max}}\) und \(y_{\text{max}}\) in der Szene.

## UX
- **Interaktive Diagramme (Hover)**: Mouseover über SVG-Diagramm zeigt exakte Werte zum Zeitpunkt t (Backlog FR2 der rollenden Körper).
- **PNG/SVG-Export** der Diagramme (ergänzt CSV).
- **\(g\) als Regler**: Erdbeschleunigung einstellbar (Mond/Mars/Venus) — aktuell fest 9,8.

## Technisch
- **\(g = 9{,}81\) angleichen**: an Freier-Fall/Atwood-Standard anpassen (aktuell 9,8 für v47-Parität). Entscheidung didaktisch.
- **Stoppuhr an Atwood-Standard**: LCD-Easteregg ggf. als eigene Umschaltung im Panel statt Klick-auf-Uhr.