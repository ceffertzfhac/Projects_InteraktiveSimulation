'use strict'

// Verschiebbare Trennlinie Simulation ↔ Diagramm (→ BACKLOG I24, Pilot Kreisbewegung).
//
// Opt-in: `<main class="center-area" data-resizable-split>` mit genau zwei Zellen
// (Simulation zuerst, Diagramm danach) und dieses Modul als
// `<script type="module" src="../shared/js/split-divider.js">` einbinden.
// Das Modul setzt am Container die Variablen --split-a / --split-b (Werte für
// `minmax(0, …fr)`); die Sim verwendet sie in ihren grid-template-rows (übereinander)
// bzw. grid-template-columns (nebeneinander). Ausrichtung wird aus dem berechneten
// Grid gelesen — funktioniert also auch, wenn eine Media-Query das Layout umstellt.
//
// Bedienung: Griff auf der Trennlinie ziehen, Pfeiltasten ±2 %, Pos1 bzw.
// Doppelklick = 50:50. Bereich 40:60 … 60:40. Wert je Sim in localStorage.

const MIN = 0.4, MAX = 0.6, DEFAULT = 0.5, STEP = 0.02
const clamp = f => Math.min(MAX, Math.max(MIN, f))

function init(area) {
  const [first] = area.children
  if (!first) return
  const key = 'fh_split_' + (location.pathname.split('/').filter(Boolean).slice(-1)[0] || 'root')
  let frac = clamp(parseFloat(localStorage.getItem(key)) || DEFAULT)

  const handle = document.createElement('div')
  handle.className = 'split-handle'
  handle.tabIndex = 0
  handle.setAttribute('role', 'separator')
  handle.setAttribute('aria-label', 'Trennlinie Simulation/Diagramm verschieben')
  handle.title = 'Ziehen: Größenverhältnis Simulation/Diagramm · Doppelklick: 50:50'
  area.appendChild(handle)

  const horizontal = () => getComputedStyle(area).gridTemplateColumns.trim().split(/\s+/).length > 1

  // Griff mittig auf die Kante der ersten Zelle setzen
  const place = () => {
    const h = horizontal()
    const a = area.getBoundingClientRect(), r = first.getBoundingClientRect()
    handle.classList.toggle('vertical', h)
    if (h) { handle.style.left = `${r.right - a.left}px`; handle.style.top = '0' }
    else { handle.style.top = `${r.bottom - a.top}px`; handle.style.left = '0' }
    handle.setAttribute('aria-orientation', h ? 'vertical' : 'horizontal')
    handle.setAttribute('aria-valuenow', String(Math.round(frac * 100)))
  }
  const apply = (f, save = true) => {
    frac = clamp(f)
    area.style.setProperty('--split-a', `${frac}fr`)
    area.style.setProperty('--split-b', `${1 - frac}fr`)
    if (save) localStorage.setItem(key, String(frac))
    requestAnimationFrame(place)
  }
  handle.setAttribute('aria-valuemin', String(MIN * 100))
  handle.setAttribute('aria-valuemax', String(MAX * 100))

  handle.addEventListener('pointerdown', e => {
    e.preventDefault()
    handle.setPointerCapture(e.pointerId)
    handle.classList.add('dragging')
    document.body.classList.add('split-dragging')
    const move = ev => {
      const a = area.getBoundingClientRect()
      apply(horizontal() ? (ev.clientX - a.left) / a.width : (ev.clientY - a.top) / a.height)
    }
    const up = () => {
      handle.classList.remove('dragging')
      document.body.classList.remove('split-dragging')
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      handle.removeEventListener('pointercancel', up)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
    handle.addEventListener('pointercancel', up)
  })
  handle.addEventListener('dblclick', () => apply(DEFAULT))
  handle.addEventListener('keydown', e => {
    const back = horizontal() ? 'ArrowLeft' : 'ArrowUp', fwd = horizontal() ? 'ArrowRight' : 'ArrowDown'
    if (e.key === back) apply(frac - STEP)
    else if (e.key === fwd) apply(frac + STEP)
    else if (e.key === 'Home') apply(DEFAULT)
    else return
    e.preventDefault(); e.stopPropagation()
  })

  new ResizeObserver(place).observe(area)
  new ResizeObserver(place).observe(first)
  new MutationObserver(() => requestAnimationFrame(place)).observe(area, { attributes: true, attributeFilter: ['class'] })
  apply(frac, false)
}

document.querySelectorAll('[data-resizable-split]').forEach(init)
