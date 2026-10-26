'use strict'

/**
 * Pointer-Event → lokale SVG-Koordinate (I5, Hover-Werte-Rezept).
 * CTM wird bewußt auf `referenceEl` selbst aufgerufen, nie auf dem äußeren
 * <svg> — dadurch komponiert getScreenCTM() automatisch alle Vorfahren-
 * Transforms (z. B. eine übergeordnete <g transform="translate(...)">
 * bei Dual-Graph-Slots), ohne sim-spezifische Sonderrechnung.
 */
export function svgLocalPoint(referenceEl, evt) {
  const svg = referenceEl.ownerSVGElement || referenceEl
  const ctm = referenceEl.getScreenCTM()
  if (!ctm) return null
  const pt = svg.createSVGPoint()
  pt.x = evt.clientX
  pt.y = evt.clientY
  const loc = pt.matrixTransform(ctm.inverse())
  return { x: loc.x, y: loc.y }
}

/**
 * Verdrahtet pointermove/pointerleave/pointercancel auf einem Hit-Rect.
 * Gibt eine Detach-Funktion zurück (Hygiene, auch wenn aktuell ungenutzt).
 */
export function attachGraphHover(hitRectEl, { onMove, onLeave }) {
  const move = evt => {
    const loc = svgLocalPoint(hitRectEl, evt)
    if (loc) onMove(loc.x, loc.y)
  }
  const leave = () => onLeave()
  hitRectEl.addEventListener('pointermove', move)
  hitRectEl.addEventListener('pointerleave', leave)
  hitRectEl.addEventListener('pointercancel', leave)
  return () => {
    hitRectEl.removeEventListener('pointermove', move)
    hitRectEl.removeEventListener('pointerleave', leave)
    hitRectEl.removeEventListener('pointercancel', leave)
  }
}

/**
 * Nächster Punkt auf einer Strecke A→B zum Punkt P (alles in Pixeln) — für den
 * Hover auf räumlichen Bahnkurven (I13.4: y(x)/x(y)), wo es keine Pixel→Zeit-
 * Umkehrung gibt. Liefert den Parameter a ∈ [0, 1] des Lotfußpunkts (zum
 * Interpolieren von t, x, y zwischen zwei Stützpunkten) und den Abstand².
 */
export function nearestOnSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy
  const a = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0
  const qx = ax + a * dx - px, qy = ay + a * dy - py
  return { a, d2: qx * qx + qy * qy }
}
