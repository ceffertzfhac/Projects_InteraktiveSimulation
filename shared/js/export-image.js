'use strict'

// shared/js/export-image.js — Diagramm-Export als SVG- bzw. PNG-Datei.
// Ergänzt den bestehenden CSV-Export um eine visuelle Bilddatei. → BACKLOG I6.
//
// Zentrales Gotcha (hier gelöst, nicht pro Sim): CSS-Variablen (`var(--…)`) und
// externe Stylesheets greifen in einer *losgelösten* SVG-Datei nicht — die Linien-
// füll-/Strichfarben würden schwarz oder leer rendern. Deshalb wird vor dem
// Serialisieren für jedes Form-Element die *aufgelöste* Computed-Style (getComputedStyle
// liefert rgb()/px, keine var()) als Inline-Attribut auf den Klon gesetzt. Marker-
// Polygon-Fills (in <defs>) werden ebenso behandelt.
//
// Zwei Aufrufvarianten:
//  1. Standard: `exportSVG(graphSvgEl, name)` — graphSvgEl ist ein <svg> mit viewBox
//     (Separate Graph-SVG, z. B. Rollende Körper/Zykloide/Kreis-Spiralbewegung).
//  2. Zuschnitt: `exportSVG(mainSvgEl, name, { cropViewBox })` — mainSvgEl ist die
//     Szene-SVG, in die das Diagramm als <g> eingebettet ist (Schräger Wurf). Der
//     cropViewBox beschneidet den Export auf den Diagrammbereich; die elterlichen
//     <defs> (Achsenpfeil-Marker) bleiben erhalten. cropViewBox liefert `computeBBox`
//     auf dem aktiven Graph-<g> + dessen Translate.

const NS = 'http://www.w3.org/2000/svg'

// Visuell tragende Eigenschaften → als Inline-Attribut übernehmen (CSS-Name =
// SVG-Attributname, beide hyphenated).
const STYLE_PROPS = [
  'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
  'opacity', 'font-size', 'font-family', 'font-style', 'font-weight',
  'text-anchor', 'visibility',
]

const SHAPE_TAGS = new Set([
  'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'path',
  'text', 'tspan', 'g',
])

// Paralleler Walk über Original (live im DOM, für getComputedStyle) und Klon
// (empfängt die Inline-Attribute). Kinder sind 1:1 korrespondent (deep clone).
function inlineStyles(srcRoot, cloneRoot) {
  const stack = [[srcRoot, cloneRoot]]
  while (stack.length) {
    const [src, clone] = stack.pop()
    if (src.nodeType === 1 && SHAPE_TAGS.has(src.localName)) {
      const cs = getComputedStyle(src)
      for (const prop of STYLE_PROPS) {
        const v = cs.getPropertyValue(prop)
        if (v !== '') clone.setAttribute(prop, v)
      }
    }
    const sc = src.children
    const cc = clone.children
    for (let i = 0; i < sc.length; i++) {
      if (cc[i]) stack.push([sc[i], cc[i]])
    }
  }
}

// Saubere BoundingBox eines Elements in dessen lokalem Koordinatensystem.
// getBBox schließt visibility:hidden-Geometrie ein (Hover-Cursor/Tooltip könnten
// den Bereich sonst verfälschen) → solche Teilbäume kurz display:none setzen,
// getBBox ziehen, dann wiederherstellen. Synchrone Operation → kein sichtbarer
// Reflow. Beim Verstellen des aktiven Graph-<g> (Schräger Wurf) genutzt, um den
// cropViewBox zu berechnen.
export function computeBBox(el) {
  if (!el) return { x: 0, y: 0, width: 0, height: 0 }
  const saved = []
  const walk = (n) => {
    if (n.nodeType !== 1) return
    if (n !== el) {
      const cs = getComputedStyle(n)
      if (cs.visibility === 'hidden' || cs.display === 'none') {
        saved.push([n, n.style.display])
        n.style.display = 'none'
      }
    }
    for (const c of n.children) walk(c)
  }
  walk(el)
  let b
  try { b = el.getBBox() } catch (e) { b = { x: 0, y: 0, width: 0, height: 0 } }
  for (const [n, prev] of saved) n.style.display = prev
  return b
}

// Klon mit xmlns + expliziten width/height + inline-Styles. Optionaler cropViewBox
// ({x,y,w,h}) überschreibt die viewBox (Zuschnitt auf Diagrammbereich bei in die
// Szene eingebettetem Graph — Schräger Wurf).
function prepareClone(svgEl, cropViewBox) {
  const clone = svgEl.cloneNode(true)
  clone.setAttribute('xmlns', NS)
  let vb
  if (cropViewBox) {
    vb = [cropViewBox.x, cropViewBox.y, cropViewBox.w, cropViewBox.h]
  } else {
    vb = (svgEl.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number)
  }
  if (vb[2] && vb[3]) {
    clone.setAttribute('viewBox', vb.map(n => Number.isFinite(n) ? n : 0).join(' '))
    clone.setAttribute('width', String(vb[2]))
    clone.setAttribute('height', String(vb[3]))
  }
  inlineStyles(svgEl, clone)
  return clone
}

function serialize(clone) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    new XMLSerializer().serializeToString(clone)
}

function triggerDownload(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// SVG-Datei: serialisierter Klon als Blob, Download.
// opts.cropViewBox = {x,y,w,h} beschneidet eine Szene-SVG auf den Diagrammbereich.
export function exportSVG(svgEl, filename, opts = {}) {
  if (!svgEl) return
  const clone = prepareClone(svgEl, opts.cropViewBox)
  const blob = new Blob([serialize(clone)], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

// PNG-Datei: serialisierter Klon → Image → Canvas (skaliert, weißer Hintergrund
// für die Fläche außerhalb des graph-bg-Rects) → toDataURL → Download.
export function exportPNG(svgEl, filename, scale = 2, opts = {}) {
  if (!svgEl) return
  const clone = prepareClone(svgEl, opts.cropViewBox)
  const vb = (clone.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number)
  const w = vb[2], h = vb[3]
  if (!w || !h) return
  const blob = new Blob([serialize(clone)], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    triggerDownload(canvas.toDataURL('image/png'), filename)
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    console.error('PNG-Export fehlgeschlagen (SVG ließ sich nicht als Bild laden).')
  }
  img.src = url
}