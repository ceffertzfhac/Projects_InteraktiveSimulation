'use strict'

/**
 * Nice-Tick-Primitive (1-2-5-10-Serie), Ziel ~tgt Ticks. Exportiert (nicht nur
 * intern von tAxisStep genutzt): Atwood/Atwood-Energie/Freier Fall rufen sie
 * direkt für ihre Werteachse auf (kein niceStepLE-Vertrag dort, T9).
 */
export function getNiceTick(range, tgt = 8) {
  if (!(range > 0)) return 1
  const step0 = range / tgt
  const exp = Math.floor(Math.log10(step0))
  const p = Math.pow(10, exp)
  const f = step0 / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p
}

/**
 * Zeitachsen-Schritt: größter Nice-Step, der noch ≥minDivs Teilstriche liefert
 * (garantiert ≥minDivs+1 Ticks inkl. 0, CLAUDE.md-Vertrag „≥3 Divisionen").
 */
export function tAxisStep(range, minDivs = 3) {
  if (!(range > 0)) return 1
  let step = getNiceTick(range, 6)
  if (Math.floor(range / step) < minDivs) {
    const ms = range / minDivs
    const m = Math.pow(10, Math.floor(Math.log10(ms)))
    step = [5, 2, 1].map(f => f * m).find(s => s <= ms + 1e-9) ?? m
  }
  return step
}

/**
 * Nice-Step (1-2-4-5-Serie, feiner als 1-2-5) ≤ range/minDivs — garantiert
 * ≥minDivs Teilstriche auf der Ordinate (CLAUDE.md „niceStepLE(range, minDivs)").
 */
export function niceStepLE(range, minDivs) {
  if (!(range > 0)) return 1
  const ms = range / minDivs
  const m = Math.pow(10, Math.floor(Math.log10(ms)))
  return [5, 4, 2, 1].map(f => f * m).find(s => s <= ms + 1e-9) ?? m
}
