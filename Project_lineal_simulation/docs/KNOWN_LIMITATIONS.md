# Known Limitations — Schwingendes Lineal

Bewußte lokale Einschränkungen / Won't / Scope-Entscheidungen. Jeder Eintrag
verlinkt auf den zugehörigen `BACKLOG.md`-Eintrag (→ <ID>).

## Won't / Scope

- **Reibungsfrei (→ Aufgabe):** keine Dämpfung. Die Schwingung bleibt ideell
  unendlich erhalten; Real-Lineale dissipieren. Dämpfung wäre ein eigenes
  Feature (ggf. → BACKLOG F-lineal#), hier bewußt weggelassen, da die Aufgabe
  „annähernd reibungsfrei" stellt.
- **Dicke *d* nicht als Parameter:** die Linealdicke (Aufgabe 600 µm) geht nur
  über die Masse (hier eigener Slider) ein und kürzt in *T* heraus. Eine
  Dicken-/Dichte-Steuerung bringt keinen Mehrwert für die Periodendauer.
- **Kein 2-Diagramm-Modus:** Ein-Subjekt-Simulation (ein Pendel) — der
  Mehrfach-Modus (`diagram_mode`/`speed-pill`, → BACKLOG I12) entfällt; der
  Typ-Picker zeigt eine Größe bzw. die Energie-Zusammenschau.
- **Energie modellkonsistent:** *E*_pot wird je nach gewähltem Modell berechnet
  (harmonisch ½·*m*·*g*·*s*·φ² vs. exakt *m*·*g*·*s*·(1−cos φ)), sodaß *E*_ges
  in beiden Fällen eine echte Erhaltungsgröße ist. Die Abweichung zwischen den
  Energie-Formeln bei großen Winkeln ist gewollt (zeigt den Näherungscharakter).

## Offen

- **Vorschaubild fehlt:** die Übersichtskarte nutzt vorerst den CSS-Placeholder
  (→ BACKLOG B/T-lineal#). Bild wird bei Lieferung durch den Product Owner
  eingesetzt (`AllAnimations/Vorschaubilder/lineal.png`).

## Randfälle

- **Achse unterhalb des Schwerpunkts (*s* ≤ 0):** keine stabile Schwingung;
  *T* = ∞, Anzeige „instabil", das Lineal ruht am Anfangswinkel. Tritt nur auf,
  wenn Lochposition ≥ *l*/2 gewählt wird (Slider lassen den Grenzfall zu, um die
  Divergenz *T* → ∞ bei *s* → 0 zu demonstrieren).
- **Loop-Sprung bei extremer Divergenz:** das Wiedergabefenster ist *N*·*T*;
  wird es an `T_WINDOW_MAX` geplafondet (sehr kleines *s*), schließt es nicht
  mehr mit einer ganzzahligen Periodenanzahl ab → minimaler Sprung am Loop.