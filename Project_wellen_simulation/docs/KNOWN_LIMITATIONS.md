# Known Limitations — Wellen (Interferenz zweier Punktquellen)

Bewusste lokale Einschränkungen / Scope-Entscheidungen. Zentrale
Bugs/Features/Tech-Debt stehen in `BACKLOG.md` (Repo-Root); hier nur
Design-Entscheidungen, die keine offenen Aufgaben sind.

## Architektur-Ausnahme: kein precompute()/interpolateAt()

Alle anderen modularen Sims in diesem Repo precomputen die Physik vor
Animationsstart in Arrays (`precompute()`), die Animation indiziert nur noch
hinein (`interpolateAt(t)`), s. `CLAUDE.md` § Architecture. Diese Sim
weicht davon **bewusst** ab: `physics.js` enthält ausschließlich zustandslose
Formeln, `render.js`s Canvas-Loop (`drawField()`) ruft sie **live pro Frame**
für jeden der bis zu 400×400×DPR² Pixel auf.

**Grund:** Das Wellenfeld ist eine kontinuierliche, unbeschränkte Funktion
von `t` (die Wellenausbreitung läuft beliebig lange weiter, kein fester
Zeit-Horizont wie bei einer Wurfbahn). Ein Vorab-Snapshot-Array müsste
entweder auf eine willkürliche Zeitobergrenze gedeckelt werden (widerspricht
dem „läuft beliebig weiter"-Charakter) oder wäre pro Frame ein komplettes
Pixel-Rechteck (400×400×4 Byte ≈ 640 KB je Snapshot bei DPR=1, mehr bei
High-DPI) — bei z. B. 60 Snapshots/Sekunde über mehrere Minuten Laufzeit
speicherseitig nicht sinnvoll. Live-Neuberechnung pro Frame ist hier der
pragmatische, korrekte Ansatz — identisch zum Original-Prototyp, nur sauber
in `physics.js` (Formeln) / `render.js` (Canvas-Loop) getrennt.

## Frequenz ist fest (nicht regelbar)

`CONFIG.freq = 1.0` Hz ist eine Konstante (`constants.js::FREQ`), kein
Regler — wie im Original-Prototyp. Nur die Wellenlänge `λ` ist regelbar
(daraus ergibt sich die Ausbreitungsgeschwindigkeit `v = λ·f`). Falls eine
zukünftige Anforderung eine regelbare Frequenz verlangt, wäre das eine neue
`F`-Backlog-Position, keine Lücke in dieser Migration.

## Kein CSV-Export

Anders als die meisten physikalischen Sims dieses Repos gibt es hier keinen
CSV-Export-Button. Es gibt keinen diskreten, endlichen Datensatz zum
Exportieren — das Wellenfeld ist ein kontinuierliches, live berechnetes
Feld ohne feste Zeitreihen-Struktur (im Gegensatz zu z. B. Federpendel, wo
`tData`/`xData`-Arrays eine natürliche CSV-Zeile pro Zeitschritt ergeben).
