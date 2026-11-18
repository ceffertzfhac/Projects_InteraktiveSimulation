'use strict'

// Verschiebbare Trennlinie Simulation ↔ Diagramm (→ BACKLOG I24, Pilot Kreisbewegung).
//
// Opt-in: `<main class="center-area" data-resizable-split>` mit genau zwei Zellen
// (Simulation zuerst, Diagramm danach) und dieses Modul als
// `<script type="module" src="../shared/js/split-divider.js">` einbinden.
// Das Modul setzt am Container die Variablen
//   --split-a / --split-b   (fr-Werte für `minmax(0, var(--split-a, 1fr))` im Grid) und
//   --split-a-pct           (Anteil der Sim-Zelle in %, für Flex: `flex: 0 0 var(--split-a-pct, 50%)`).
// Grid: in grid-template-rows (übereinander) bzw. -columns (nebeneinander).
// Flex: Ausrichtung aus flex-direction. Ausrichtung wird jeweils aus dem berechneten
// Stil gelesen — funktioniert also auch, wenn eine Media-Query das Layout umstellt.
//
// Standard: Solange der Nutzer nicht zieht, setzt das Modul KEINE Variablen — dann gilt
// der in der Sim-CSS hinterlegte Fallback (z. B. 0.9fr/1.1fr, 54 %). Doppelklick bzw.
// Pos1 stellt diesen Standard wieder her (I24-Rollout 2026-11-18).
// Nach jeder Änderung feuert ein (rAF-gedrosseltes) `resize`-Ereignis am window, damit
// Sims ihre Diagramme an die neue Zellform anpassen.
//
// Bedienung: Griff auf der Trennlinie ziehen, Pfeiltasten ±2 %. Bereich 40:60 … 60:40.
// Wert je Sim in localStorage.

const MIN = 0.4, MAX = 0.6, STEP = 0.02
const clamp = f => Math.min(MAX, Math.max(MIN, f))

function init(area) {
  const [first] = area.children
  if (!first) return
  const key = 'fh_split_' + (location.pathname.split('/').filter(Boolean).slice(-1)[0] || 'root')
  const stored = parseFloat(localStorage.getItem(key))
  let frac = Number.isFinite(stored) ? clamp(stored) : null    // null = CSS-Standard der Sim

  const handle = document.createElement('div')
  handle.className = 'split-handle'
  handle.tabIndex = 0
  handle.setAttribute('role', 'separator')
  handle.setAttribute('aria-label', 'Trennlinie Simulation/Diagramm verschieben')
  handle.title = 'Ziehen: Größenverhältnis Simulation/Diagramm · Doppelklick: Standard'
  area.appendChild(handle)

  const horizontal = () => {
    const cs = getComputedStyle(area)
    if (cs.display.includes('flex')) return cs.flexDirection.startsWith('row')
    return cs.gridTemplateColumns.trim().split(/\s+/).length > 1
  }
  // Aktueller Anteil der Sim-Zelle aus der Geometrie (für Standard ohne gesetzte Variablen)
  const measured = () => {
    const a = area.getBoundingClientRect(), r = first.getBoundingClientRect()
    return horizontal() ? (r.right - a.left) / (a.width || 1) : (r.bottom - a.top) / (a.height || 1)
  }
  let resizeRaf = 0
  const notify = () => {
    if (resizeRaf) return
    resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; window.dispatchEvent(new Event('resize')) })
  }

  // Griff mittig auf die Kante der ersten Zelle setzen
  const place = () => {
    const h = horizontal()
    const a = area.getBoundingClientRect(), r = first.getBoundingClientRect()
    handle.classList.toggle('vertical', h)
    if (h) { handle.style.left = `${r.right - a.left}px`; handle.style.top = '0' }
    else { handle.style.top = `${r.bottom - a.top}px`; handle.style.left = '0' }
    handle.setAttribute('aria-orientation', h ? 'vertical' : 'horizontal')
    handle.setAttribute('aria-valuenow', String(Math.round((frac ?? measured()) * 100)))
  }
  const apply = (f, save = true) => {
    if (f === null) {                               // Standard der Sim (CSS-Fallback)
      frac = null
      ;['--split-a', '--split-b', '--split-a-pct'].forEach(v => area.style.removeProperty(v))
      localStorage.removeItem(key)
    } else {
      frac = clamp(f)
      area.style.setProperty('--split-a', `${frac}fr`)
      area.style.setProperty('--split-b', `${1 - frac}fr`)
      area.style.setProperty('--split-a-pct', `${(frac * 100).toFixed(2)}%`)
      if (save) localStorage.setItem(key, String(frac))
    }
    requestAnimationFrame(place)
    notify()
  }
  handle.setAttribute('aria-valuemin', String(MIN * 100))
  handle.setAttribute('aria-valuemax', String(MAX * 100))

  handle.addEventListener('pointerdown', e => {
    e.preventDefault()
    handle.setPointerCapture(e.pointerId)
    handle.classList.add('dragging')
    document.body.classList.add('split-dragging')
    document.body.classList.toggle('split-col', horizontal())
    const move = ev => {
      const a = area.getBoundingClientRect()
      apply(horizontal() ? (ev.clientX - a.left) / a.width : (ev.clientY - a.top) / a.height)
    }
    const up = () => {
      handle.classList.remove('dragging')
      document.body.classList.remove('split-dragging', 'split-col')
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      handle.removeEventListener('pointercancel', up)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
    handle.addEventListener('pointercancel', up)
  })
  handle.addEventListener('dblclick', () => apply(null))
  handle.addEventListener('keydown', e => {
    const back = horizontal() ? 'ArrowLeft' : 'ArrowUp', fwd = horizontal() ? 'ArrowRight' : 'ArrowDown'
    const cur = frac ?? measured()
    if (e.key === back) apply(cur - STEP)
    else if (e.key === fwd) apply(cur + STEP)
    else if (e.key === 'Home') apply(null)
    else return
    e.preventDefault(); e.stopPropagation()
  })

  new ResizeObserver(place).observe(area)
  new ResizeObserver(place).observe(first)
  new MutationObserver(() => requestAnimationFrame(place)).observe(area, { attributes: true, attributeFilter: ['class'] })
  if (frac !== null) apply(frac, false)
  else requestAnimationFrame(place)
}

document.querySelectorAll('[data-resizable-split]').forEach(init)
