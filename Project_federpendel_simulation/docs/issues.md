# Issues — Federpendel

Bekannte Fehler, Unschönheiten und technische Schulden. Status:
`[ ]` offen, `[~]` in Arbeit, `[x]` erledigt.

## Offen

- `[ ]` **Manuelle Zeitmessung im gestoppten Zustand**: Wenn die Animation
  pausiert wird, während die manuelle Zeitmessung läuft, stoppt die
  Stoppuhr erwartungsgemäß; beim erneuten Play läuft sie weiter — die
  Sim-Zeit wird jedoch um die Pausendauer nicht versetzt (Play setzt
  `lastFrameTime=0`, so dass der erste Frame nach Pause einen großen
  `deltaTime`-Sprung machen könnte, der auf 0.1 s begrenzt ist). Ggf.
  Pausen-Handling sauberer abbilden.
- `[ ]` **Vertikaler Modus bei großer Masse**: Bei \(m=5{,}0\) kg und
  kleinem \(k\) wird \(\delta L = mg/k\) sehr groß; die Gleichgewichtslage
  kann in den unteren Bereich der Animationsfläche rutschen und die
  Schwingung ragt ggf. knapp an den Rand. Skalierung prüfen.

## Erledigt

- `[x]` (Migration) Einzel-Datei-Prototyp in 6-Modul-Architektur
  überführt — siehe `docs/CHANGELOG.md` v1.0.0.