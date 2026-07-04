# Issues — Rollender Zylinder / Zykloide

## Offen
- *(keine)*

## Behoben
- *(keine — Erst-Migration v1.0.0)*

## Bekannte Einschränkungen
- Graph-Titel ist als `textContent` gesetzt (kein kursiver Tspan-Symbol); die Achsenlabels verwenden `createStyledSvgText` (kursiv). Didaktisch ausreichend.
- Vektor-Skalierung fest (`V_VECTOR_SCALE = 50`): bei \(v_c = 1{,}0\,\text{m/s}\) werden Vektoren 50 px lang — bei kleinen Werten entsprechend kürzer. Bewusst für Parität zum v2.8-Prototyp.
- Live-Analyse-Subjekt-Gruppen nutzen `display:none` für inaktive Subjekte (MathJax typeset die Inline-Math beim Laden zuverlässig; Aufklappen zeigt fertige Formeln).