# Ablaufskript: Kreiskinematik und Vektorrechnung

Ziel: Schrittweise, klickbare Animation für eine Vorlesung im ersten Semester. Die Erklärung erfolgt live bzw. über die Tonspur durch Christian. Die Animation enthält minimalen Text: nur Formeln, gegebenenfalls eine Überschrift oder ein Stichwort. Formeln werden schrittweise aufgebaut und farblich codiert. Die konkreten Farben und die didaktische Feinausarbeitung werden von der später folgenden KI bzw. dem Programmierer maximal didaktisch sinnvoll festgelegt.

## Szene 1: Normalform der Ebene

- Ein rechtshändiges kartesisches Koordinatensystem (x, y, z) baut sich auf und dreht sich in die typische Lage im Raum.
- Eine Ebene erscheint. Auf ihr werden mehrere Ortsvektoren zu Punkten der Ebene gezeigt, die durchanimiert werden, sowie ein eindeutiger Normalenvektor.
- Erläuterung: Die Ebene ist eindeutig durch einen Ortsvektor und einen Normalenvektor bestimmt.
- Der Normalenvektor wird verlängert und verkürzt, die Ebene bleibt dabei unverändert. Ebenso wird gezeigt, dass Länge und Vorzeichen des Normalenvektors die Ebene nicht verändern.
- Die Formeln der Normalform (mit Skalarprodukt) bauen sich schrittweise auf.
- Drei Beispielebenen: eine mit Normalenvektor entlang der z-Achse durch den Ursprung, eine mit Normalenvektor entlang der x-Achse nicht durch den Ursprung, eine schiefe Ebene im Raum.
- Die Szene endet ohne Zusammenfassung und geht direkt in Szene 2 über.

## Szene 2: Kreisbahn in einer Ebene

- Die letzte Ebene verschwindet. Eine Ebene (z. B. XY oder XZ) erscheint, die nicht durch den Ursprung geht, ohne Ortsvektor und ohne Normalenvektor.
- In der Ebene erscheint eine Kreisbahn mit einem Objekt, das sich auf der Bahn bewegt.
- Der Mittelpunkt der Kreisbahn wird als Punkt in der Ebene eingeführt, ohne eigenen Ortsvektor.
- Der Radius erscheint einmal kurz als Strecke vom Mittelpunkt zur Bahn und verschwindet danach wieder.
- Das Objekt durchläuft zwei Umdrehungen. Bei der ersten Umdrehung hinterlässt es eine Spur, bei der zweiten folgt es derselben Bahn.
- Während der zweiten Umdrehung wird der Ortsvektor vom Ursprung auf das Objekt eingeblendet.
- Am Ende friert die Position des Objekts ein. Der Ortsvektor zeigt vom Ursprung auf das Objekt, das Objekt liegt in der Ebene.
- Die Bahnspur bleibt in den weiteren Szenen sichtbar.

## Szene 3: Winkelgeschwindigkeitsvektor Omega

- Zur Kreisbahn erscheint der Winkelgeschwindigkeitsvektor Omega als Normalenvektor der Ebene.
- Es folgen zwei weitere Bahndurchläufe: einer mit Viertelperiode und einer mit vierfacher Periode. Gezeigt wird, dass sich bei Änderung der Periodendauer nur die Länge von Omega ändert, nicht seine Richtung.
- Übergang: Dieselbe Kreisbahn erscheint in einer anderen Ebene, in der Omega parallel zu einer Koordinatenachse liegt. Ortsvektor und Omega bleiben sichtbar. Der Winkel Omega zu anderen Achsen spielt keine Rolle.
- Übergang zur dritten Ebene: Die Ebene wird nur parallel verschoben. Omega bleibt entlang derselben Achse und gleich lang, da die Periode gleich bleibt. Der Ortsvektor ändert seinen Winkel zur Achse, bleibt aber sichtbar.
- Dritte Ebene: Ebene durch den Punkt mit Ortsvektor (1, 1, 1), Normalenvektor (1, 1, -2). Kreisbahn mit Mittelpunkt und Radius. Der Ortsvektor zeigt vom Ursprung auf einen Punkt der Bahn.
- Die Ebene kippt zurück. Es erscheint eine Kreisbahn parallel zur XZ-Ebene, rein horizontal, um plus 2 in Y-Richtung verschoben (Y vertikal, X horizontal, Z aus dem Bildschirm heraus).
- Dieselbe Kreisbahn wird erneut gezeigt. Anschließend wird am Beispiel dieser Konfiguration die Tangentialgeschwindigkeit v\_T über das Kreuzprodukt hergeleitet. Danach folgt dasselbe für die beiden anderen Ebenen.

## Szene 4: Zentripetal- und Tangentialbeschleunigung

- Die Zentripetalbeschleunigung wird über ein doppeltes Kreuzprodukt gezeigt.
- Einführung von Alpha (Winkelbeschleunigung). Betrachtet werden nur die Fälle, in denen Alpha und Omega parallel oder antiparallel sind (Winkel 0 Grad oder 180 Grad).
- Verschiedene Längen und Richtungen von Alpha werden zunächst an einer Ebene gezeigt.
- Mit Alpha wird über das Kreuzprodukt die Tangentialbeschleunigung eingeführt.
- Kontrolle des Ergebnisses an den anderen Ebenen.

## Szene 5: Schiefe Spiralbahn

- Die schief im Raum liegende Ebene erscheint mit schiefem Normalenvektor und schiefem Ortsvektor.
- Einblendung der Formel der Spiralbahn in kartesischen Koordinaten: x(t), y(t), z(t).
- Übergang: Die Monsterformel wird ausgeblendet. Gezeigt wird, dass für die Beschreibung nur die skalare Funktion r(t), die skalare Funktion phi(t), die Vektorfunktionen Omega(t) und Alpha(t) sowie ein Ortsvektor nötig sind.
- Das ist das Ende der Szenenfolge.

## Hinweise für die spätere Ausarbeitung

- Die Details (Farbcodierung, Transparenzen, genaue Animationsschritte, Reihenfolge innerhalb der Szenen, didaktische Feinabstimmung) werden von einer zweiten KI aus diesem Skript maximal didaktisch sinnvoll erarbeitet.
- Text in der Animation minimal halten, Erklärung erfolgt durch Christian auf der Tonspur.
