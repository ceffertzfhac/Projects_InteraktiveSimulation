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
