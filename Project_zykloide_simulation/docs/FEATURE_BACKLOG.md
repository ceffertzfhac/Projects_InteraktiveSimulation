# Feature-Backlog — Rollender Zylinder / Zykloide

Mögliche Erweiterungen nach der Migration (v1.0.0). Nicht priorisiert.

## Didaktisch
- **Punktradius als Regler**: \(r/R\) einstellbar (aktuell fest 0,9) — zeigt Übergang von Zykloide (\(r=R\)) über Trochoiden zur Geraden (\(r=0\), SP).
- **Gleiten mit Schlupf**: \(\omega \neq v_c/R\) entkoppeln — Rollen vs. Gleiten vergleichbar machen.
- **Vergleich mit reiner Zykloide**: Sonderfall \(r=R\) als Referenzbahn einblendbar (Punkt auf der Lauffläche).
- **Energie-Diagramm**: kinetische Energie der Punkte (Translation + Rotation) über Zeit.
- **Winkel \(\varphi(t)\) als Diagrammgröße**: zusätzlich zu x/y/v/a auch den Drehwinkel selbst anbieten.

## UX
- **Interaktive Diagramme (Hover)**: Mouseover über SVG-Diagramm zeigt exakte Werte zum Zeitpunkt t.
- **PNG/SVG-Export** der Diagramme (ergänzt CSV).
- **Einzelne Subjekt-CSVs**: Export nur des ausgewählten Subjekts statt immer alle 5×8.

## Technisch
- **Vektor-Skalierung adaptiv**: V_VECTOR_SCALE/A_VECTOR_SCALE aktuell fest 50 — bei kleinen/large \(v_c\) ggf. auto-fit.
- **Kamera-Trigger sichtbar**: optionale Markierung des Kamera-Follow-Startpunkts.