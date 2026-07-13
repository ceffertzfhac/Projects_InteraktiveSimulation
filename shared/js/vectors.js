'use strict'

/**
 * Schaft um Marker-Länge `by` kürzen (kanonische Pfeilspitzen-Geometrie,
 * CLAUDE.md: refX=0 + shortenEnd). Gibt {x2,y2} des gekürzten Schaft-Endpunkts
 * zurück, sodaß die refX=0-Spitze exakt auf dem Zielpunkt (x2,y2) landet.
 *
 * Bei `len < by` (Vektor kürzer als die Pfeilspitze) wird **null** zurückgegeben:
 * mit festem Marker ist es geometrisch unmöglich, die Spitze aufs Ziel zu
 * klemmen UND den orient="auto"-Marker korrekt auszurichten (der Schaft bräuchte
 * negative Länge). Früher wurde ein 2px-Stub erzwungen — das ließ die Spitze um
 * `by + 2 - len` px über das Ziel hinausschießen (B23, sichtbar am Federpendel
 * beim Nulldurchgang von v/a). Aufrufer müssen null abfangen und den Vektor
 * verbergen (kein Pfeil bei zu kurzem Vektor statt fehlerhafter Überschieß-Spitze).
 */
export function shortenEnd(x1, y1, x2, y2, by) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy)
  if (len <= by) return null
  const shaft = len - by
  return { x2: x1 + (dx / len) * shaft, y2: y1 + (dy / len) * shaft }
}
