# Feature Backlog — Federpendel

Ideen und gewünschte Erweiterungen für diese Simulation. Priorisierung
nach MoSCoW (Must / Should / Could / Won't).

## Should

- **Dämpfung**: Einführung eines Dämpfungskoeffizienten \(c\) (viskose
  Dämpfung) → gedämpfte Schwingung \(x(t)=x_0\,e^{-\delta t}\cos(\omega t)\)
  mit \(\delta=c/(2m)\). Aperiodischer Grenzfall als Sonderfall. Neuer
  Slider „Dämpfung \(c\)", Diagramm um Dämpfungshüllkurve ergänzen.
- **Antriebsfrequenz (erzwungene Schwingung)**: Sinusförmige äußere Kraft
  mit einstellbarer Frequenz, Resonanzkurve, Phasenverschiebung.

## Could

- **Energie-Diagramm**: Zusätzlicher Diagrammtyp „Energien vs. Zeit"
  (\(E_{\text{kin}}, E_{\text{pot}}, E_{\text{ges}}\) gestapelt) zur
  Veranschaulichung der Energieumwandlung.
- **Phasenraum-Diagramm**: \(v\) gegen \(x\) (Ellipse bei ungedämpfter
  Schwingung) als weiterer Diagrammtyp.
- **Zwei Feder-Masse-Systeme nebeneinander**: Vergleich unterschiedlicher
  \(k\)/\(m\)-Kombinationen in einer Szene.

## Won't (bewusst nicht)

- **Nichtlineare Feder (Duffing)**: Out of scope für FB-8-Einführung.
- **Kopplung mehrerer Pendel**: Separates Thema (Koppelschwinger).