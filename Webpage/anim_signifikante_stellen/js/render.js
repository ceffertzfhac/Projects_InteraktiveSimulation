'use strict'
// Rendering: liest NUR die Szene und schreibt SVG-Attribute bzw. die
// dynamischen Zahlen der Folienkarten. Keine Logik, keine Zeit.
// initStage() baut alle Elemente einmal, renderScene() läuft pro Frame.

import {
  svgEl, viewOf, createAxis, createPool, readSlots, clamp, lerp, smooth, backOut,
} from '../../shared/js/step-kit.js'
import { fmt } from '../../shared/js/format.js'
import {
  TEXTS, TAPE, ROD, READING_Y, CIRCLE, SIG_ROW, SIG_TOKENS, LUPE_BOX, LUPE_BIG, CALC, B_FINAL,
} from './constants.js'
import { DYN, LUPE, COMPARE, RANGES, SUMMARY, CORNERS } from './content.js'
import { parseMeasured } from './model.js'
const B_VALUE = parseMeasured(B_FINAL).value
import {
  createClaimRow, createUnitBracket, verdict, claimLabel, claimRange, createCompareBoard, compareLine,
  createCalculator, fillSummary, uncIndex,
} from './stellen.js'
import { HITS } from './state.js'

const E = {}
const FAR = 4000                // Koordinaten weit außerhalb der Sicht kappen (SVG-Präzision)
const LEVELS = [0, 1, 2, 3]

const text = (parent, cls, attrs = {}, content) => {
  const t = svgEl('text', { class: cls, ...attrs }, parent)
  if (content !== undefined) t.textContent = content
  return t
}
const set = (el, attrs) => { for (const k in attrs) el.setAttribute(k, attrs[k]) }
const op = (el, a) => { el.style.opacity = a; el.style.display = a <= 0.002 ? 'none' : '' }

// <text>: kursives Symbol + aufrechter Rest (Repo-Konvention Größen kursiv)
function symbolLabel(parent, cls, sym, attrs) {
  const t = text(parent, cls, attrs)
  svgEl('tspan', { class: 'sym' }, t).textContent = sym
  const val = svgEl('tspan', {}, t)
  return { t, val }
}
// „A_min": kursives A, tiefgestelltes aufrechtes „min" (dy statt baseline-shift → Firefox)
function subLabel(parent, cls, sym, sub, attrs) {
  const t = text(parent, cls, attrs)
  svgEl('tspan', { class: 'sym' }, t).textContent = sym
  svgEl('tspan', { dy: 7, 'font-size': '72%' }, t).textContent = sub
  return t
}
function gradient(defs, id, stops, vertical = true) {
  const g = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: vertical ? 0 : 1, y2: vertical ? 1 : 0 }, defs)
  stops.forEach(([o, cls]) => svgEl('stop', { offset: o, class: cls }, g))
}

function subText(parent, cls, sym, sub, attrs) {
  const t = text(parent, cls, attrs)
  svgEl('tspan', { class: 'sym' }, t).textContent = sym
  svgEl('tspan', { dy: 6, 'font-size': '72%' }, t).textContent = sub
  return t
}

// Text mit markierter letzter Ziffer (= unsichere Stelle). Neu aufgebaut nur bei Änderung.
function setMarked(el, str, on) {
  const key = `${str}|${on}`
  if (el._mk === key) return
  el._mk = key
  el.textContent = ''
  const i = on ? uncIndex(str) : -1
  if (i < 0) { el.textContent = str; return }
  el.append(str.slice(0, i))
  svgEl('tspan', { class: 'unc-digit' }, el).textContent = str[i]
  el.append(str.slice(i + 1))
}

// Ziffernzeile „3,000 m" mit Zählmarken 1…4 und Klammern
function buildSigRow() {
  E.sig = svgEl('g', { class: 'sig-row' }, E.root)
  E.sigBr = {}
  for (const k of ['S', 'U', 'Z']) {
    const g = svgEl('g', { class: `sig-br sig-br-${k}` }, E.sig)
    E.sigBr[k] = { g, path: svgEl('path', {}, g), t: text(g, 'sig-br-text', { 'text-anchor': 'middle' }) }
  }
  // „unsicher" als Pfeil auf die letzte Ziffer (eine Klammer sähe wie ein Intervall aus)
  E.sigBr.U.head = svgEl('path', { class: 'sig-arrow-head' }, E.sigBr.U.g)
  E.sigBr.S.t.textContent = 'gesichert'
  E.sigBr.U.t.textContent = 'unsicher'
  // zweizeilig, damit sie neben „gesichert" Platz hat (beide stehen bei 0,003120 km gleichzeitig)
  ;['nur Stellenwert –', 'nicht signifikant'].forEach((l, n) =>
    svgEl('tspan', { dy: n ? 17 : 0 }, E.sigBr.Z.t).textContent = l)
  E.tok = {}
  for (const [id, ch] of SIG_TOKENS) {
    const unit = id[0] === 'U'
    E.tok[id] = text(E.sig, `sig-tok ${unit ? 'sig-unit' : ''} ${id === 'D4' ? 'unc-digit' : ''}`,
      { 'font-size': unit ? SIG_ROW.size * 0.6 : SIG_ROW.size, 'text-anchor': unit ? 'start' : 'middle' }, ch)
  }
  E.badges = [1, 2, 3, 4].map(n => {
    const g = svgEl('g', { class: 'sig-badge' }, E.sig)
    svgEl('circle', { r: 14 }, g)
    text(g, '', { 'text-anchor': 'middle', y: 5 }, String(n))
    return g
  })
}

// Tafel „Welche Stelle ist unsicher?" — liegt über der (dimmbaren) Szene, damit
// sie im Erklärschritt groß und hell im Mittelpunkt stehen kann (slBig).
function buildLupe() {
  const B = LUPE_BOX
  E.lupe = svgEl('g', { class: 'lupe-panel' }, E.top)
  svgEl('rect', { class: 'panel-bg', x: B.x, y: B.y, width: B.w, height: B.h, rx: 14 }, E.lupe)
  E.lupeTitle = text(E.lupe, 'lupe-title', { x: B.x + 20, y: B.y + 24 })
  E.lupeClaim = createClaimRow(E.lupe, { size: 32 })
  E.lupeAxis = createAxis(E.lupe, 'x', { labelGap: 20 })
  E.lupeBand = svgEl('rect', { class: 'lupe-band', height: 14, rx: 3 }, E.lupe)
  E.lupeBracket = createUnitBracket(E.lupe)
  E.lupeVerdict = text(E.lupe, 'verdict verdict-sm', { x: B.x + 20, y: B.y + B.h - 9 })
}

// Tafel „Ziffern vergleichen": A_max, A_min, l · b untereinander, Spaltenzeiger
function buildCompare() {
  const B = LUPE_BOX
  E.cmpPanel = svgEl('g', { class: 'lupe-panel' }, E.top)
  svgEl('rect', { class: 'panel-bg', x: B.x, y: B.y, width: B.w, height: B.h, rx: 14 }, E.cmpPanel)
  text(E.cmpPanel, 'lupe-title', { x: B.x + 20, y: B.y + 24 }, 'Ziffern vergleichen')
  E.cmp = createCompareBoard(E.cmpPanel, { size: 28 })
  E.cmpVerdict = text(E.cmpPanel, 'verdict verdict-sm', { x: B.x + 20, y: B.y + B.h - 10 })
}

export function initStage(svg, DOM) {
  // nur die eigenen dynamischen Zahlen (lvl/cmb/circ) — andere Kapitel füllen ihre selbst
  E.dyn = DOM.dyn.filter(el => el.dataset.dyn.split('.')[0] in DYN)
  fillSummary(DOM.cards.m_sum, SUMMARY)
  DOM.cards.corners.querySelectorAll('.corner-row').forEach((row, i) => {
    row.querySelector('.c-val').textContent = CORNERS[i].text
    row.style.setProperty('--slot', i)
  })
  const defs = svgEl('defs', {}, svg)
  gradient(defs, 'grad_l', [[0, 'gl-edge'], [0.5, 'gl-mid'], [1, 'gl-edge']])
  // Rundstab: dunkle Kanten, Glanzstreifen im oberen Drittel, Reflex unten (Zylinder-Schattierung)
  gradient(defs, 'grad_rod', [[0, 'rod-lo'], [0.14, 'rod-mid'], [0.3, 'rod-hi'], [0.42, 'rod-mid'],
    [0.78, 'rod-lo'], [0.9, 'rod-edge-s'], [1, 'rod-mid']])
  // Stirnfläche: gedrehte, leicht gewölbte Scheibe (hell oben links → dunkel unten rechts)
  const rg = svgEl('radialGradient', { id: 'grad_rod_end', cx: 0.4, cy: 0.35, r: 0.75 }, defs)
  ;[[0, 'rod-hi'], [0.55, 'rod-mid'], [1, 'rod-lo']].forEach(([o, cls]) => svgEl('stop', { offset: o, class: cls }, rg))
  gradient(defs, 'grad_tape', [[0, 'tape-hi'], [1, 'tape-lo']])
  const clip = svgEl('clipPath', { id: 'plot_clip' }, defs)
  E.clipRect = svgEl('rect', {}, clip)

  E.top = svgEl('g', {}, svg)                 // Kapitelgruppe (Grundlagen + Multiplikation)
  E.root = svgEl('g', {}, E.top)              // die Szene — dimmbar

  // ── Maßband und Stäbe ──
  E.tape = svgEl('g', { class: 'tape' }, E.root)
  E.tapeBody = svgEl('rect', { class: 'tape-body', rx: 4 }, E.tape)
  E.tapeHook = svgEl('rect', { class: 'tape-hook', rx: 2 }, E.tape)
  E.zone = svgEl('rect', { class: 'zone' }, E.tape)                   // unter Strichen/Zahlen
  E.zoneEdge = [0, 1].map(() => svgEl('line', { class: 'zone-edge' }, E.tape))
  E.tapeMarks = createPool(svgEl('g', {}, E.tape), () => svgEl('line', { class: 'tape-mark' }))
  E.tapeLabels = createPool(svgEl('g', {}, E.tape), () => svgEl('text', { class: 'tape-label', 'text-anchor': 'middle' }))
  // Gehäuse am Bandende (Ausrollen in Schritt 1, wie in der Addition); die Spule dreht mit
  const th = TAPE.h
  E.tapeCase = svgEl('g', { class: 'tape-case' }, E.tape)
  svgEl('rect', { class: 'tape-case-body', x: 0, y: -th / 2 - 12, width: 2 * th + 10, height: th + 24, rx: 14 }, E.tapeCase)
  E.tapeReel = svgEl('g', {}, E.tapeCase)
  svgEl('circle', { class: 'tape-case-reel', cx: th + 5, cy: 0, r: th / 2 + 4 }, E.tapeReel)
  svgEl('line', { class: 'tape-case-spoke', x1: th + 5, y1: -th / 2, x2: th + 5, y2: th / 2 }, E.tapeReel)
  svgEl('line', { class: 'tape-case-spoke', x1: 5 + th / 2, y1: 0, x2: 5 + 1.5 * th, y2: 0 }, E.tapeReel)
  E.rods = ROD.map(() => {
    const g = svgEl('g', { class: 'rod' }, E.root)
    return {
      g, back: svgEl('ellipse', { class: 'rod-back' }, g),                     // linkes Ende: Zylinderrundung
      body: svgEl('rect', { class: 'rod-body' }, g),
      line: svgEl('path', { class: 'rod-outline' }, g),                     // Mantellinien oben/unten
      gloss: svgEl('rect', { class: 'rod-gloss', rx: 1 }, g),                 // Glanzlicht
      cap: svgEl('ellipse', { class: 'rod-cap' }, g),                          // rechtes Ende: Stirnfläche
      capHi: svgEl('ellipse', { class: 'rod-cap-hi' }, g),
    }
  })
  E.marks = ROD.map(() => svgEl('line', { class: 'rod-marker' }, E.root))
  E.snaps = ROD.map(() => {
    const g = svgEl('g', { class: 'snap' }, E.root)
    return { g, path: svgEl('path', {}, g), head: svgEl('path', { class: 'snap-head' }, g) }
  })
  E.rd = [0, 1].map(() => {
    const t = text(E.root, 'reading', { 'text-anchor': 'middle' })
    svgEl('tspan', { class: 'reading-pre' }, t).textContent = 'abgelesener Messwert: '
    return { t, val: svgEl('tspan', {}, t) }
  })

  // ── Pfeil „wahre Länge" (unter der Achse, damit Tick-Labels darüber liegen) ──
  E.arrow = svgEl('g', { class: 'true-arrow' }, E.root)
  E.arLine = svgEl('line', {}, E.arrow)
  E.arHead = svgEl('path', {}, E.arrow)
  E.ping = svgEl('circle', { class: 'ping' }, E.root)

  // ── Plot (geclippt): Bänder, Rechteck, Flächenbereich ──
  const plot = svgEl('g', { 'clip-path': 'url(#plot_clip)' }, E.root)
  E.bStrip = svgEl('rect', { class: 'strip-b' }, plot)
  E.lStrip = svgEl('rect', { class: 'strip-l' }, plot)
  E.lEdge = [0, 1].map(() => svgEl('line', { class: 'strip-edge-l' }, plot))
  E.bEdge = [0, 1].map(() => svgEl('line', { class: 'strip-edge-b' }, plot))
  E.ghost = svgEl('rect', { class: 'band-ghost', rx: 4 }, plot)
  E.lBand = svgEl('rect', { class: 'band-l', rx: 4 }, plot)
  E.rectFill = svgEl('rect', { class: 'area-fill' }, plot)
  E.region = svgEl('path', { class: 'area-region', 'fill-rule': 'evenodd' }, plot)
  E.minRect = svgEl('rect', { class: 'area-bound' }, plot)
  E.maxRect = svgEl('rect', { class: 'area-bound' }, plot)
  E.rectStroke = svgEl('rect', { class: 'area-stroke' }, plot)
  E.aSym = text(plot, 'area-sym', { 'text-anchor': 'middle', 'dominant-baseline': 'middle' })
  E.aSym.textContent = 'A'
  E.dl = [0, 1].map(() => symbolLabel(plot, 'dim-label dim-l', 'l', { 'text-anchor': 'middle' }))
  E.db = [0, 1].map(() => symbolLabel(plot, 'dim-label dim-b', 'b', { 'text-anchor': 'start' }))

  E.xAxis = createAxis(E.root, 'x')
  E.yAxis = createAxis(E.root, 'y', { skipZero: true })
  // Achsenbeschriftung „l / m", „b / m": Größe kursiv, Einheit aufrecht
  E.nameL = symbolLabel(E.root, 'axis-name', 'l', { 'text-anchor': 'start' }).t
  E.nameL.lastChild.textContent = ' / m'
  E.nameB = symbolLabel(E.root, 'axis-name', 'b', { 'text-anchor': 'middle' }).t
  E.nameB.lastChild.textContent = ' / m'

  E.tagMin = subLabel(E.root, 'area-tag', 'A', 'min', { 'text-anchor': 'end' })
  E.tagMax = subLabel(E.root, 'area-tag', 'A', 'max', { 'text-anchor': 'start' })

  E.endLo = svgEl('circle', { class: 'end-closed', r: 6.5 }, E.root)
  E.endHi = svgEl('circle', { class: 'end-open', r: 6.5 }, E.root)
  E.bndLo = text(E.root, 'bound-label', { 'text-anchor': 'end' })
  E.bndHi = text(E.root, 'bound-label', { 'text-anchor': 'start' })
  E.hits = Array.from({ length: HITS }, () => svgEl('circle', { class: 'hit', r: 5.5 }, E.root))
  // ±-Maßpfeile unter dem Intervall: vom Messwert bis zu den Grenzen
  E.pm = svgEl('g', { class: 'pm' }, E.root)
  E.pmLine = [0, 1].map(() => svgEl('line', {}, E.pm))
  E.pmHead = [0, 1].map(() => svgEl('path', {}, E.pm))
  E.pmTick = svgEl('line', {}, E.pm)
  E.pmLbl = text(E.pm, 'pm-label', { 'text-anchor': 'middle' })
  E.pmCap = text(E.pm, 'pm-cap', { 'text-anchor': 'middle' }, '½ Einheit der letzten Stelle')
  // Markierung der unsicheren letzten Ziffer am Messpunkt-Label
  E.ucBox = svgEl('rect', { class: 'unc-box', rx: 6 }, E.root)
  E.ucTag = text(E.root, 'unc-tag', { 'text-anchor': 'middle' }, 'unsicher')
  E.pHalo = svgEl('circle', { class: 'halo-l' }, E.root)
  E.pDot = svgEl('circle', { class: 'dot-l' }, E.root)
  E.pl = [0, 1].map(() => text(E.root, 'value-label val-l', { 'text-anchor': 'middle' }))
  E.qHalo = svgEl('circle', { class: 'halo-b' }, E.root)
  E.qDot = svgEl('circle', { class: 'dot-b' }, E.root)
  E.ql = [0, 1].map(() => text(E.root, 'value-label val-b', { 'text-anchor': 'start' }))
  // ── Kreis: Radius variieren, Umfang umlaufend, Fläche von innen nach außen ──
  E.circ = svgEl('g', { class: 'circle' }, E.root)
  const C0 = { cx: CIRCLE.cx, cy: CIRCLE.cy }
  E.disc = svgEl('circle', { class: 'circ-disc', ...C0 }, E.circ)
  E.fill = [svgEl('circle', { class: 'fill-max', ...C0 }, E.circ), svgEl('circle', { class: 'fill-min', ...C0 }, E.circ)]
  E.cRing = svgEl('circle', { class: 'circ-ring', ...C0 }, E.circ)
  E.cEdge = [0, 1].map(() => svgEl('circle', { class: 'circ-edge', ...C0 }, E.circ))
  E.cLine = svgEl('circle', { class: 'circ-line', ...C0, transform: `rotate(-90 ${CIRCLE.cx} ${CIRCLE.cy})` }, E.circ)
  E.trace = [0, 1].map(i => {
    const g = svgEl('g', { class: `trace trace-${i ? 'min' : 'max'}` }, E.circ)
    return { g, line: svgEl('polyline', {}, g), tip: svgEl('circle', { r: 6.5 }, g) }
  })
  E.cRad = svgEl('g', {}, E.circ)
  E.cRadLine = svgEl('line', { class: 'circ-radius', x1: CIRCLE.cx, y1: CIRCLE.cy }, E.cRad)
  E.cRadEnd = svgEl('circle', { class: 'circ-radius-end', r: 5 }, E.cRad)
  svgEl('circle', { class: 'circ-center', ...C0, r: 4.5 }, E.cRad)
  E.rl = [0, 1].map(() => symbolLabel(E.cRad, 'dim-label dim-l', 'r', { 'text-anchor': 'middle' }))
  E.rLive = symbolLabel(E.cRad, 'dim-label dim-l r-live', 'r', { 'text-anchor': 'middle' })
  // Werte-Protokoll: U_max, U_min, A_max, A_min (Zähler laufen mit der Animation)
  E.log = [['U', 'max', 'm'], ['U', 'min', 'm'], ['A', 'max', 'm²'], ['A', 'min', 'm²']].map(([sym, sub, unit], i) => {
    const t = text(E.circ, `log-line log-${sym === 'U' ? 'u' : 'a'}`, { x: CIRCLE.logX, y: CIRCLE.logY + i * 34 })
    svgEl('tspan', { class: 'sym' }, t).textContent = sym
    svgEl('tspan', { dy: 6, 'font-size': '70%' }, t).textContent = sub
    const val = svgEl('tspan', { dy: -6 }, t)
    return { t, val, unit }
  })

  // Grenzen l_min … b_max an den Streifenkanten (Teil R)
  // l_min links, l_max rechts ihrer Kante (bei schmalen Streifen sonst übereinander)
  E.edge = [['l', 'min', 'end'], ['l', 'max', 'start'], ['b', 'min', 'start'], ['b', 'max', 'start']].map(([sym, sub, anchor]) =>
    subText(E.root, `edge-label edge-${sym}`, sym, sub, { 'text-anchor': anchor }))

  buildSigRow()
  E.calc = createCalculator(E.root, CALC)        // Taschenrechner neben dem Rechteck
  buildLupe()
  buildCompare()

  E.ro = text(E.root, 'readout', { 'text-anchor': 'start' })
  svgEl('tspan', { class: 'sym' }, E.ro).textContent = 'l'
  svgEl('tspan', {}, E.ro).textContent = ' · '
  svgEl('tspan', { class: 'sym' }, E.ro).textContent = 'b'
  E.roVal = svgEl('tspan', {}, E.ro)
  return E.top
}

function rectWorld(el, V, x0, y0, x1, y1) {
  const a = clamp(V.sx(Math.min(x0, x1)), V.L - FAR, V.R + FAR)
  const b = clamp(V.sx(Math.max(x0, x1)), V.L - FAR, V.R + FAR)
  const c = clamp(V.sy(Math.max(y0, y1)), V.T - FAR, V.B + FAR)
  const d = clamp(V.sy(Math.min(y0, y1)), V.T - FAR, V.B + FAR)
  set(el, { x: a, y: c, width: Math.max(0, b - a), height: Math.max(0, d - c) })
}

// Maßband-Teilung: je Stufe k Striche im Abstand 10^-k, wachsen gestaffelt
// vom Stabende aus; gröbere Striche sind länger. Beschriftung, sobald Platz ist.
function renderTape(S, V, top, xe) {
  const marks = new Map()
  const half = (V.x1 - V.x0) / 2
  for (const k of LEVELS) {
    const g = S['tg' + k]
    const step = 10 ** -k
    if (g <= 0.002 || (V.x1 - V.x0) / step > 500) continue
    const px = step * V.kx
    const dens = smooth(4, 10, px), labD = smooth(38, 56, px)
    for (let i = Math.max(0, Math.ceil(V.x0 / step - 1e-9)); i * step <= V.x1 + 1e-12; i++) {
      const v = i * step
      const t = clamp((g * 1.5 - Math.min(1, Math.abs(v - S.rod0) / half)) / 0.5, 0, 1)
      if (t <= 0) continue
      const len = (22 - 4 * k) * backOut(t), mo = dens * Math.min(1, 2 * t)
      const la = labD * clamp((t - 0.4) / 0.6, 0, 1)
      const key = v.toFixed(9)
      const m = marks.get(key)
      if (!m) marks.set(key, { v, len, mo, la, dec: k })
      else {
        m.len = Math.max(m.len, len); m.mo = Math.max(m.mo, mo)
        if (la > m.la + 1e-6 || (la >= m.la - 1e-6 && k > m.dec)) { m.la = la; m.dec = k }
      }
    }
  }
  E.tapeMarks.begin(); E.tapeLabels.begin()
  for (const m of marks.values()) {
    const x = V.sx(m.v)
    if (x < V.L - 30 || x > Math.min(V.R + 30, xe) || m.mo < 0.01) continue
    const ln = E.tapeMarks.next()
    set(ln, { x1: x, x2: x, y1: top, y2: top + m.len }); ln.style.opacity = m.mo
    if (m.la < 0.01) continue
    const lb = E.tapeLabels.next()
    set(lb, { x, y: top + TAPE.h - 7 }); lb.textContent = fmt(m.v, m.dec); lb.style.opacity = m.la
  }
  E.tapeMarks.end(); E.tapeLabels.end()
}

// Pfeilspitzen-Geometrie (CLAUDE.md „Vektor-Pfeilspitzen", auch für gekrümmte Pfeile):
// Spitze exakt AUF dem Zielpunkt, Schaft endet an der Dreieck-Basis (eine Kopflänge
// vor der Spitze, entlang der Kurve gemessen) — kein Schaft guckt aus der Spitze.
// Ist der (bisher gezeichnete) Pfeil kürzer als der Kopf, wird nichts gezeichnet
// (analog shortenEnd → null, B23).
const HEAD = { len: 12, half: 6 }
const headPath = (tx, ty, bx, by) => {
  const L = Math.hypot(tx - bx, ty - by) || 1, ux = (tx - bx) / L, uy = (ty - by) / L
  return `M${tx} ${ty}L${bx - uy * HEAD.half} ${by + ux * HEAD.half}L${bx + uy * HEAD.half} ${by - ux * HEAD.half}Z`
}

// Geschwungener Pfeil unter dem Maßband vom Stabende zur abgelesenen Marke,
// progressiv gezeichnet (quadratische Bézierkurve). Ziel = Unterkante des Maßbands.
function snapArc(el, x0, x1, y, d, a) {
  const h = clamp(16 + 0.3 * Math.abs(x1 - x0), 16, 38)
  const cx = (x0 + x1) / 2, cy = y + 2 * h
  const P = t => [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1,
    (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * y]
  // Bogenlängen-Tabelle bis zum aktuellen Zeichenstand d
  const n = 48, pts = [P(0)], cum = [0]
  for (let i = 1; i <= n; i++) {
    const p = P(d * i / n), q = pts[i - 1]
    pts.push(p); cum.push(cum[i - 1] + Math.hypot(p[0] - q[0], p[1] - q[1]))
  }
  const total = cum[n]
  op(el.g, a)
  if (a <= 0.002 || total < HEAD.len + 2) { op(el.g, 0); return }
  // Basispunkt: Bogenlänge total − Kopflänge
  const sb = total - HEAD.len
  let j = 1
  while (cum[j] < sb) j++
  const f = (sb - cum[j - 1]) / (cum[j] - cum[j - 1] || 1)
  const base = [lerp(pts[j - 1][0], pts[j][0], f), lerp(pts[j - 1][1], pts[j][1], f)]
  const shaft = pts.slice(0, j).concat([base])
  el.path.setAttribute('d', 'M' + shaft.map(p => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L'))
  const [tx, ty] = pts[n]
  el.head.setAttribute('d', headPath(tx, ty, base[0], base[1]))
}

// Kreis-Szene (Bildschirmkoordinaten, Maßstab K px/m). Umfang: die Spur läuft
// oben beginnend im Uhrzeigersinn um den größten bzw. kleinsten Kreis, der
// Zähler zeigt 2π·r·(gelaufener Anteil). Fläche: Scheibe wächst von innen nach
// außen, Zähler π·ρ². Die Zähler werden aus der Szene berechnet, nicht gespeichert.
function renderCircle(S) {
  const { cx, cy, K } = CIRCLE
  const rK = S.kR * K, TAU = 2 * Math.PI
  set(E.disc, { r: rK }); op(E.disc, S.kDisc)
  E.fill.forEach((c, i) => { set(c, { r: Math.max(0, S[`f${i}R`] * K) }); op(c, S[`f${i}A`]) })
  set(E.cRing, { r: (S.kLo + S.kHi) / 2 * K, 'stroke-width': Math.max(1.5, (S.kHi - S.kLo) * K) })
  op(E.cRing, S.kRing)
  E.cEdge.forEach((c, i) => { set(c, { r: (i ? S.kHi : S.kLo) * K }); op(c, S.kRing) })
  const circ = TAU * rK
  set(E.cLine, { r: rK, 'stroke-dasharray': `${(circ * S.kDraw).toFixed(1)} ${circ.toFixed(1)}` })
  // Spuren
  E.trace.forEach((T, i) => {
    const R = S[`tr${i}R`] * K, d = S[`tr${i}D`]
    op(T.g, d > 0.001 ? S[`tr${i}A`] : 0)
    if (d <= 0.001) return
    const n = Math.max(2, Math.ceil(120 * d)), pts = []
    for (let k = 0; k <= n; k++) {
      const a = -Math.PI / 2 + TAU * d * k / n
      pts.push(`${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`)
    }
    T.line.setAttribute('points', pts.join(' '))
    const a = -Math.PI / 2 + TAU * d
    set(T.tip, { cx: cx + R * Math.cos(a), cy: cy + R * Math.sin(a) }); op(T.tip, d < 0.999 ? 1 : 0)
  })
  // Radius + Beschriftung (Nennwert bzw. live während der Variation)
  const ang = -Math.PI / 5, ex = cx + rK * Math.cos(ang), ey = cy + rK * Math.sin(ang)
  set(E.cRadLine, { x2: ex, y2: ey }); set(E.cRadEnd, { cx: ex, cy: ey })
  op(E.cRad, S.kRadA)
  const lx = (cx + ex) / 2 - 20, ly = (cy + ey) / 2 - 16
  readSlots(S, 'rl').forEach((sl, n) => {
    set(E.rl[n].t, { x: lx, y: ly + sl.o }); setMarked(E.rl[n].val, ` = ${TEXTS[sl.i]} m`, S.ucA > 0.5)
    op(E.rl[n].t, sl.a * (1 - S.rLive))
  })
  set(E.rLive.t, { x: lx, y: ly }); E.rLive.val.textContent = ` = ${fmt(S.kR, 3)} m`; op(E.rLive.t, S.rLive)
  // Werte-Protokoll
  const vals = [TAU * S.tr0R * S.tr0D, TAU * S.tr1R * S.tr1D, Math.PI * S.f0R ** 2, Math.PI * S.f1R ** 2]
  const alph = [S.tr0A * (S.tr0D > 0.001), S.tr1A * (S.tr1D > 0.001), S.f0A, S.f1A]
  E.log.forEach((L, i) => { L.val.textContent = ` = ${fmt(vals[i], 2)} ${L.unit}`; op(L.t, alph[i]) })
}

let dynKey = '', dynAlpha = -1

export function renderScene(S) {
  const V = viewOf(S)
  E.root.style.opacity = 1 - 0.62 * S.dim
  set(E.clipRect, { x: V.L - 1, y: V.T - 1, width: V.R - V.L + 2, height: V.B - V.T + 2 })
  const axY = clamp(V.sy(0), V.T, V.B)
  const axX = clamp(V.sx(0), V.L, V.R)

  // ── Maßband ──
  const top = TAPE.top + S.tapeY
  op(E.tape, S.tapeA)
  if (S.tapeA > 0.002) {
    const x0 = clamp(V.sx(0), V.L - 80, V.R + 80)
    const xe = lerp(x0, V.R + 80, S.tapeR)                     // ausgerolltes Bandende
    set(E.tapeBody, { x: x0 - 10, y: top, width: Math.max(0, xe - x0 + 10), height: TAPE.h })
    set(E.tapeHook, { x: x0 - 14, y: top - 6, width: 8, height: TAPE.h + 6 })
    E.tapeCase.setAttribute('transform', `translate(${xe} ${top + TAPE.h / 2})`)
    E.tapeReel.setAttribute('transform', `rotate(${(S.tapeR * 1080) % 360} ${TAPE.h + 5} 0)`)
    op(E.tapeCase, S.tapeR < 0.999 ? 1 : 0)
    renderTape(S, V, top, xe)
  }
  // ── Stäbe ──
  ;[0, 1].forEach(i => {
    const R = E.rods[i], len = S[`rod${i}`], sh = S[`rod${i}S`]
    op(R.g, S[`rod${i}A`])
    const a = clamp(V.sx(sh), V.L - FAR, V.R + FAR), b = clamp(V.sx(sh + len), V.L - FAR, V.R + FAR)
    // Zylinder in leichter Schrägsicht: Mantel zwischen zwei Ellipsen (Halbachse ER);
    // der Mittelpunkt der Stirnfläche rechts liegt genau am Stabende — dort läuft der Messstrich
    const y = ROD[i].top + S.tapeY, h = ROD[i].h, ER = 5, cy = y + h / 2
    const m0 = a + ER, m1 = Math.max(m0, b)
    set(R.back, { cx: m0, cy, rx: ER, ry: h / 2 })
    set(R.body, { x: m0, y, width: m1 - m0, height: h })
    set(R.line, { d: `M${m0} ${y + 0.5}H${m1}M${m0} ${y + h - 0.5}H${m1}` })
    set(R.gloss, { x: m0 + 2, y: y + h * 0.24, width: Math.max(0, m1 - m0 - 4), height: 2.2 })
    set(R.cap, { cx: m1, cy, rx: ER, ry: h / 2 })
    set(R.capHi, { cx: m1 - 1, cy: cy - h * 0.14, rx: ER * 0.45, ry: h * 0.22 })
  })
  // ── Ablesebereich, Stabende, „Einrasten" auf die nächste Marke ──
  const zb = top + TAPE.h
  const z0 = clamp(V.sx(S.zLo), V.L - FAR, V.R + FAR), z1 = clamp(V.sx(S.zHi), V.L - FAR, V.R + FAR)
  set(E.zone, { x: z0, y: top, width: Math.max(0, z1 - z0), height: TAPE.h }); op(E.zone, S.zA)
  E.zoneEdge.forEach((ln, i) => {
    const x = i ? z1 : z0
    set(ln, { x1: x, x2: x, y1: top - 8, y2: zb + 8 }); op(ln, S.zA)
  })
  ;[0, 1].forEach(i => {
    const x = V.sx(S[`rod${i}`]), ya = ROD[i].top + S.tapeY - 6
    set(E.marks[i], { x1: x, x2: x, y1: ya, y2: lerp(ya, zb + 2, S[`mk${i}D`]) })
    op(E.marks[i], S[`mk${i}A`] * smooth(0, 0.05, S[`mk${i}D`]))
    snapArc(E.snaps[i], x, V.sx(S.rdX), zb, S[`sn${i}D`], S[`sn${i}A`])
  })

  // ── Ablesung ──
  const rx = V.sx(S.rdX)
  readSlots(S, 'rd').forEach((s, n) => {
    set(E.rd[n].t, { x: rx, y: READING_Y + S.tapeY + s.o }); E.rd[n].val.textContent = TEXTS[s.i]
    op(E.rd[n].t, s.a * S.rdA)
  })

  // ── Pfeil „wahre Länge" ──
  // Spitze genau auf der Zahlengeraden, Schaft endet an der Kopf-Basis
  const ax = V.sx(S.rod0), y0 = ROD[0].top + S.tapeY - 3
  const tip = lerp(y0, axY, S.arD)
  op(E.arrow, y0 - tip > HEAD.len + 2 ? S.arA : 0)
  set(E.arLine, { x1: ax, x2: ax, y1: y0, y2: tip + HEAD.len })
  set(E.arHead, { d: headPath(ax, tip, ax, tip + HEAD.len) })
  set(E.ping, { cx: ax, cy: axY, r: 6 + 20 * S.ping }); op(E.ping, S.arA * (1 - S.ping) * 0.9)

  // ── Achsen ──
  E.xAxis.render(V, {
    at: axY, draw: S.axisDraw, ticks: S.xTicks, alpha: S.xA,
    fixed: LEVELS.map(k => ({ step: 0.5 * 10 ** -k, grow: S['ag' + k], center: S.pX })),
  })
  E.yAxis.render(V, { at: axX, draw: S.yDraw, alpha: S.yAlpha * S.xA, ticks: S.yAlpha })
  set(E.nameL, { x: V.R + 42, y: axY + 7 }); op(E.nameL, Math.max(S.names, S.nameLA) * S.xA)
  set(E.nameB, { x: axX, y: V.T - 34 }); op(E.nameB, S.names * S.xA)

  // ── Intervall l: kompaktes Band auf der Zahlengeraden ↔ Streifen im 2D-Teil ──
  const x0 = V.sx(S.lLo), x1 = V.sx(S.lHi)
  const lw = Math.max(1.5, x1 - x0), lm = (x0 + x1) / 2
  const bt = lerp(axY - 20, V.T, S.lSpan), bb = lerp(axY + 20, axY, S.lSpan)
  set(E.lBand, { x: lm - lw / 2, y: axY - 20, width: lw, height: 40 })
  op(E.lBand, S.lA * (1 - S.lSpan))
  set(E.lStrip, { x: lm - lw / 2, y: bt, width: lw, height: Math.max(0, bb - bt) })
  op(E.lStrip, S.lA * S.lSpan * S.stripA)
  const edgeA = S.lA * S.lSpan * Math.min(1, (lw - 4) / 20)
  E.lEdge.forEach((ln, i) => {
    const x = i ? x1 : x0
    set(ln, { x1: x, x2: x, y1: bt, y2: bb }); op(ln, Math.max(0, edgeA))
  })
  const g0 = clamp(V.sx(S.gLo), V.L - FAR, V.R + FAR), g1 = clamp(V.sx(S.gHi), V.L - FAR, V.R + FAR)
  set(E.ghost, { x: g0, y: axY - 20, width: Math.max(0, g1 - g0), height: 40 })
  op(E.ghost, S.gA * (1 - S.lSpan))
  const endA = S.lA * S.lEndA * (1 - S.lSpan)
  set(E.endLo, { cx: x0, cy: axY }); op(E.endLo, endA)
  set(E.endHi, { cx: x1, cy: axY }); op(E.endHi, endA)
  const dec = Math.round(S.lBndD)
  set(E.bndLo, { x: x0 - 9, y: axY - 30 }); E.bndLo.textContent = fmt(S.lLo, dec); op(E.bndLo, S.lBndA)
  set(E.bndHi, { x: x1 + 9, y: axY - 30 }); E.bndHi.textContent = fmt(S.lHi, dec); op(E.bndHi, S.lBndA)

  // ── Treffer (wahre Werte) — auf der Achse bzw. an der Rechteckecke ──
  E.hits.forEach((c, i) => {
    set(c, { cx: V.sx(S[`h${i}x`]), cy: V.sy(S[`h${i}y`]) }); op(c, S[`h${i}a`])
    set(c, { class: `hit hc${Math.round(S[`h${i}c`])}` })            // Ecken-Test: Farbe der Ecke
  })

  // ── Messpunkte mit Wertelabel ──
  const px = V.sx(S.pX)
  set(E.pHalo, { cx: px, cy: axY, r: 22 * S.pS }); op(E.pHalo, S.pA)
  set(E.pDot, { cx: px, cy: axY, r: 8 * S.pS }); op(E.pDot, S.pA)
  readSlots(S, 'pl').forEach((s, n) => {
    set(E.pl[n], { x: px, y: axY - 52 + s.o }); setMarked(E.pl[n], TEXTS[s.i], S.ucA > 0.5); op(E.pl[n], s.a)
  })
  const qy = V.sy(B_VALUE)
  set(E.qHalo, { cx: axX, cy: qy, r: 22 * S.qS }); op(E.qHalo, S.qA)
  set(E.qDot, { cx: axX, cy: qy, r: 8 * S.qS }); op(E.qDot, S.qA)
  readSlots(S, 'ql').forEach((s, n) => {
    set(E.ql[n], { x: axX + 24, y: qy - 16 + s.o }); setMarked(E.ql[n], TEXTS[s.i], S.ucA > 0.5); op(E.ql[n], s.a)
  })

  // ── Intervall b als waagrechter Streifen ──
  const yb0 = V.sy(S.bHi), yb1 = V.sy(S.bLo)
  const bh = Math.max(1.5, yb1 - yb0), bm = (yb0 + yb1) / 2
  set(E.bStrip, { x: axX, y: bm - bh / 2, width: Math.max(0, V.R - axX), height: bh })
  op(E.bStrip, S.bA * S.stripA)
  const bEdgeA = S.bA * Math.min(1, (bh - 4) / 20)
  E.bEdge.forEach((ln, i) => {
    const y = i ? yb1 : yb0
    set(ln, { x1: axX, x2: V.R, y1: y, y2: y }); op(ln, Math.max(0, bEdgeA))
  })

  // ── Rechteck, Flächenbereich ──
  rectWorld(E.rectFill, V, 0, 0, S.rW, S.rH); op(E.rectFill, S.rA)
  rectWorld(E.rectStroke, V, 0, 0, S.rW, S.rH); op(E.rectStroke, S.rA)
  rectWorld(E.minRect, V, 0, 0, S.lLo, S.bLo); op(E.minRect, Math.max(S.uA, S.mnA))
  rectWorld(E.maxRect, V, 0, 0, S.lHi, S.bHi); op(E.maxRect, Math.max(S.uA, S.mxA))
  E.minRect.classList.toggle('hot', S.mnA > 0.5); E.maxRect.classList.toggle('hot', S.mxA > 0.5)
  // Grenzen an den Streifenkanten
  ;[[S.lLo, 0, -5], [S.lHi, 1, 5]].forEach(([v, n, dx]) => { set(E.edge[n], { x: V.sx(v) + dx, y: V.T + 22 }); op(E.edge[n], S.edA) })
  ;[[S.bLo, 2], [S.bHi, 3]].forEach(([v, n]) => { set(E.edge[n], { x: axX + 14, y: V.sy(v) + (n === 2 ? 24 : -10) }); op(E.edge[n], S.edA) })
  const cx = v => clamp(V.sx(v), V.L - FAR, V.R + FAR), cy = v => clamp(V.sy(v), V.T - FAR, V.B + FAR)
  const [ox, oy, ix, iy, mx, my] = [cx(0), cy(0), cx(S.lLo), cy(S.bLo), cx(S.lHi), cy(S.bHi)]
  E.region.setAttribute('d', `M${ox} ${oy}H${mx}V${my}H${ox}ZM${ox} ${oy}H${ix}V${iy}H${ox}Z`)
  op(E.region, S.uA)
  set(E.tagMin, { x: ix - 10, y: iy + 28 }); op(E.tagMin, S.uTagA)
  set(E.tagMax, { x: mx + 10, y: my - 12 }); op(E.tagMax, S.uTagA)
  set(E.aSym, { x: V.sx(S.rW / 2), y: V.sy(S.rH / 2) }); op(E.aSym, S.aSym)
  readSlots(S, 'dl').forEach((s, n) => {
    set(E.dl[n].t, { x: V.sx(S.rW / 2), y: V.sy(0) - 22 + s.o })
    setMarked(E.dl[n].val, ' = ' + TEXTS[s.i] + ' m', S.ucA > 0.5); op(E.dl[n].t, s.a)
  })
  readSlots(S, 'db').forEach((s, n) => {
    set(E.db[n].t, { x: V.sx(0) + 18, y: V.sy(S.rH / 2) + 8 + s.o })
    setMarked(E.db[n].val, ' = ' + TEXTS[s.i] + ' m', S.ucA > 0.5); op(E.db[n].t, s.a)
  })
  // Live-Produkt an der wandernden Ecke („Taschenrechner")
  set(E.ro, { x: Math.min(cx(S.rW) + 14, V.R - 150), y: Math.max(cy(S.rH) - 16, V.T + 20) })
  E.roVal.textContent = ' = ' + fmt(S.rW * S.rH, Math.round(S.roD)) + ' m²'
  op(E.ro, S.roA)

  // ── Kreis: Abrollen (Umfang) und Sektoren → Rechteck (Fläche) ──
  op(E.circ, S.kA)
  if (S.kA > 0.002) renderCircle(S)

  const R = RANGES[Math.round(S.cmb)]
  E.calc.render({ alpha: S.calcA, input: R.calcIn, output: R.calcOut, t: S.calcT })

  renderUnc(S, V, axY)
  renderSigRow(S)
  renderLupe(S)
  renderCompare(S)

  // ── Dynamische Zahlen in den Folienkarten ──
  const key = `${Math.round(S.lvl)}|${Math.round(S.cmb)}|${Math.round(S.circ)}`
  if (key !== dynKey) {
    dynKey = key
    for (const el of E.dyn) {
      const [grp, field] = el.dataset.dyn.split('.')
      const v = DYN[grp][Math.round(S[grp])][field]
      // Felder mit Endung „H" sind vorberechnetes HTML aus model.js (Ziffern-Spans)
      if (field.endsWith('H')) el.innerHTML = v
      else el.textContent = v
    }
  }
  if (S.dynA !== dynAlpha) {
    dynAlpha = S.dynA
    for (const el of E.dyn) el.style.opacity = S.dynA
  }
}

// Unsichere Ziffer am Messpunkt-Label + ±-Maßpfeile vom Messwert zu den Grenzen
function renderUnc(S, V, axY) {
  const sl = readSlots(S, 'pl'), n = sl[1].a > sl[0].a ? 1 : 0
  const act = sl[n], el = E.pl[n]
  const show = S.ucBox * act.a
  if (show > 0.002 && el._mk && el.getNumberOfChars() > 0) {
    const str = el.textContent, i = uncIndex(str)
    const r = el.getExtentOfChar(i)
    set(E.ucBox, { x: r.x - 5, y: r.y + 2, width: r.width + 10, height: r.height - 2 })
    set(E.ucTag, { x: r.x + r.width / 2, y: r.y - 8 })
  }
  op(E.ucBox, show); op(E.ucTag, show)

  op(E.pm, S.pmA)
  if (S.pmA <= 0.002) return
  const y = axY + 72, c = V.sx(S.pX)
  const ends = [V.sx(S.lLo), V.sx(S.lHi)]
  ends.forEach((e, n) => {
    const tip = lerp(c, e, S.pmD), dir = Math.sign(e - c) || 1
    const ok = Math.abs(tip - c) > HEAD.len + 2
    set(E.pmLine[n], { x1: c, x2: tip - dir * HEAD.len, y1: y, y2: y })
    set(E.pmHead[n], { d: headPath(tip, y, tip - dir * HEAD.len, y) })
    op(E.pmLine[n], ok ? 1 : 0); op(E.pmHead[n], ok ? 1 : 0)
  })
  set(E.pmTick, { x1: c, x2: c, y1: y - 9, y2: y + 9 })
  const dec = Math.round(S.lBndD)
  set(E.pmLbl, { x: c, y: y - 12 }); E.pmLbl.textContent = `± ${fmt((S.lHi - S.lLo) / 2, dec)}`
  set(E.pmCap, { x: c, y: y + 24 })
}

// Ziffernzeile: Token an ihren (getweenten) Spalten, Zählmarken über D1…D4
function renderSigRow(S) {
  op(E.sig, S.sgA)
  if (S.sgA <= 0.002) return
  const cw = SIG_ROW.size * 0.6, X = c => SIG_ROW.cx + c * cw
  const y = SIG_ROW.y
  for (const [id] of SIG_TOKENS) {
    const t = E.tok[id], unit = id[0] === 'U'
    set(t, { x: X(S[`tk${id}x`]) + (unit ? 0 : cw / 2), y: unit ? y - 2 : y })
    op(t, S[`tk${id}a`])
  }
  const dx = id => X(S[`tk${id}x`]) + cw / 2
  E.badges.forEach((g, n) => {
    const a = S[`bg${n + 1}`]
    g.setAttribute('transform', `translate(${dx(`D${n + 1}`)} ${y - SIG_ROW.size - 8}) scale(${0.6 + 0.4 * a})`)
    op(g, a)
  })
  const bracket = (B, x0, x1, yy, a) => {
    set(B.path, { d: `M${x0} ${yy - 6}V${yy}H${x1}V${yy - 6}` })
    const xm = (x0 + x1) / 2
    set(B.t, { x: xm, y: yy + 20 }); op(B.g, a)
    for (const ts of B.t.children) ts.setAttribute('x', xm)
  }
  bracket(E.sigBr.S, dx('D1') - cw / 2 + 3, dx('D3') + cw / 2 - 3, y + 16, S.brS)
  // Pfeil von unten auf die unsichere Ziffer: Spitze knapp unter der Ziffer, Schaft endet an der Kopf-Basis
  const ux = dx('D4'), tipY = y + 14, footY = y + 52
  set(E.sigBr.U.path, { d: `M${ux} ${footY}V${tipY + HEAD.len}` })
  set(E.sigBr.U.head, { d: headPath(ux, tipY, ux, tipY + HEAD.len) })
  set(E.sigBr.U.t, { x: ux, y: footY + 20 }); op(E.sigBr.U.g, S.brU)
  bracket(E.sigBr.Z, dx('Z1') - cw / 2 + 3, dx('Z3') + cw / 2 - 3, y + 16, S.brZ * S.tkZ1a)
}

// Tafel „Welche Stelle ist unsicher?": Angabe bis zur betrachteten Stelle, Mini-
// Zahlengerade mit Band (A_min … A_max: was die Messung hergibt) und Klammer
// (Rundungsintervall der Angabe: was sie verspricht). slBig: groß in der Bildmitte.
function renderLupe(S) {
  op(E.lupe, S.slA)
  if (S.slA <= 0.002) return
  const B = LUPE_BOX, G = LUPE_BIG, k = S.slBig
  const sc = lerp(1, G.w / B.w, k)
  const tx = lerp(B.x, G.x, k) - B.x * sc, ty = lerp(B.y, G.y, k) - B.y * sc
  E.lupe.setAttribute('transform', `translate(${tx} ${ty}) scale(${sc})`)
  E.lupeTitle.textContent = k > 0.5 ? 'Wie viele Stellen gebe ich an?' : 'Welche Stelle ist unsicher?'
  const L = LUPE[Math.round(S.slI)], { info } = L, p = Math.round(S.slD)
  E.lupe.classList.toggle('big', k > 0.5)
  E.lupeClaim.render(info, p, { x: B.x + 22, y: B.y + 60, alpha: 1, colored: p >= S.slC, unit: L.unit })
  // Mini-Zahlengerade: Ausschnitt 4 Einheiten der Stelle slP (stetig → Zoom)
  const w = 4 * 10 ** S.slP, x0 = Math.max(info.value - w / 2, 0)
  const Lx = B.x + 30, Rx = B.x + B.w - 34, kx = (Rx - Lx) / w
  const V = { x0, x1: x0 + w, kx, L: Lx, R: Rx, sx: v => Lx + (v - x0) * kx }
  const ay = B.y + 128
  E.lupeAxis.render(V, { at: ay, draw: 1, ticks: 1, alpha: 1 })
  const a = clamp(V.sx(info.lo), Lx, Rx), b = clamp(V.sx(info.hi), Lx, Rx)
  set(E.lupeBand, { x: a, y: ay - 26, width: Math.max(0, b - a) })
  E.lupeBracket.render(V, { ...claimRange(info, p), y0: ay - 34, y1: ay - 4, alpha: S.slB,
    text: claimLabel(info, p), above: true })
  E.lupeVerdict.textContent = verdict(info, p)
  op(E.lupeVerdict, S.slV)
}

// Tafel „Ziffern vergleichen": Maximum · Rechner · Minimum
function renderCompare(S) {
  op(E.cmpPanel, S.dcA)
  if (S.dcA <= 0.002) return
  const B = LUPE_BOX, D = COMPARE[Math.round(S.dcI)], p = Math.round(S.dcP)
  E.cmp.render(D, { x: B.x + 120, y: B.y + 64, gap: 34, alpha: 1, p, pointerA: S.dcV, colorFrom: S.dcC })
  E.cmpVerdict.textContent = compareLine(S, D)
  op(E.cmpVerdict, S.dcV)
}
