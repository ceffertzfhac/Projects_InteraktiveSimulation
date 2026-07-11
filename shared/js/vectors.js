'use strict'

/**
 * Schaft um Marker-Länge `by` kürzen (kanonische Pfeilspitzen-Geometrie,
 * CLAUDE.md: refX=0 + shortenEnd). Garantiert einen min. 2px-Schaft-Stub,
 * damit ein Marker mit orient="auto" auch bei Vektorlänge≈0 eine definierte
 * Richtung hat (sonst undefinierte Orientierung bei einer Linie der Länge 0).
 */
export function shortenEnd(x1, y1, x2, y2, by) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy)
  if (len < 1e-6) return { x2, y2 }
  const shaft = Math.max(len - by, 2)
  return { x2: x1 + (dx / len) * shaft, y2: y1 + (dy / len) * shaft }
}
