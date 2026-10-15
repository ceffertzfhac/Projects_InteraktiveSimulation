// Selbstprüfung einer interaktiven Sim (dev-only, ohne npm) — Aufnahmen + automatische Befunde.
//   SIM=Project_x_simulation OUT=<ordner> node ../../create-step-animation/scripts/cdp.mjs ./sim-check.mjs
// Server vom Repo-Root: python3 -m http.server 8765
// Umgebung: WIDTHS (Standard "1600x1000,1280x800,900x760"), WAIT (ms Laufzeit vor der Aufnahme,
// Standard 2500), EXTREMES=0 (Regler-Extreme überspringen), TOGGLES=0 (Schalter-Test überspringen)
//
// Aufnahmen: Grundzustand je Breite × hell/dunkel, jeder Diagrammtyp (hell + dunkel), 2-Diagramm-
// Modus, jeder Regler auf min und max. Befunde (alle Zustände): Konsolenfehler, NaN/undefined in
// SVG-Attributen, überlappende SVG-Texte, abgeschnittene SVG-Texte, Schalter ohne sichtbare Wirkung,
// CSV je Diagrammtyp (Zeilen, Spalten, NaN/undefined/leer). Befunde sind Hinweise — die Bilder
// trotzdem ansehen (Text auf Kurven/Pfeilspitzen, Verdeckung durch Stoppuhr erkennt das Skript nicht).
import { mkdirSync } from 'node:fs'
const { send, goto, evalJs, sleep, shot, logs, base } = B
const SIM = process.env.SIM, url = `${base}/${SIM}/`
const out = process.env.OUT || 'sim-shots'; mkdirSync(out, { recursive: true })
const WAIT = +(process.env.WAIT || 2500)
const WIDTHS = (process.env.WIDTHS || '1600x1000,1280x800,900x760').split(',').map(s => s.split('x').map(Number))
const findings = []
const note = (where, msg) => findings.push(`[${where}] ${msg}`)

const size = ([w, h]) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })

async function load(theme) {
  await goto(url); await sleep(800)
  await evalJs(`localStorage.setItem('fh_theme','${theme}'); 1`)
  await goto(url + '?r=' + Date.now()); await sleep(1500)
  await evalJs(`(window.MathJax?.startup?.promise ?? Promise.resolve()).then(() => document.fonts.ready).then(() => 1)`, 30000)
  // CSV-Downloads abfangen statt speichern
  await evalJs(`window.__csv = []; const o = URL.createObjectURL.bind(URL)
    URL.createObjectURL = b => { window.__csv.push(b); return o(b) }
    HTMLAnchorElement.prototype.click = function () {}; 1`)
  await sleep(300)
}

const click = id => evalJs(`(() => { const b = document.getElementById('${id}'); if (b && !b.disabled) { b.click(); return 1 } return 0 })()`)
async function run() { if (await click('play_btn')) { await sleep(WAIT); await click('pause_btn') } await sleep(400) }

// Prüfungen im Seitenkontext: NaN, Textüberlappung, abgeschnittene Texte
const AUDIT = `(() => {
  const vis = t => { const r = t.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.right < 0 || r.bottom < 0) return null
    if (getComputedStyle(t).visibility === 'hidden') return null
    for (let p = t; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p)
      if (cs.display === 'none' || +cs.opacity === 0) return null }
    return r }
  const T = [...document.querySelectorAll('svg text')].filter(t => t.textContent.trim())
    .map(t => ({ t, r: vis(t), s: t.textContent.trim().slice(0, 30) })).filter(x => x.r)
  const over = []
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    const a = T[i].r, b = T[j].r, w = Math.min(a.right, b.right) - Math.max(a.left, b.left),
      h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    if (w > 2 && h > 2) over.push('„' + T[i].s + '“ × „' + T[j].s + '“') }
  const clip = []
  for (const { t, r, s } of T) { let svg = t.ownerSVGElement; while (svg?.ownerSVGElement) svg = svg.ownerSVGElement
    const R = svg.getBoundingClientRect()
    if (r.left < R.left - 1 || r.right > R.right + 1 || r.top < R.top - 1 || r.bottom > R.bottom + 1) clip.push('„' + s + '“') }
  const nan = [...document.querySelectorAll('svg *')].filter(e => [...e.attributes]
    .some(a => /NaN|undefined|Infinity/.test(a.value))).map(e => e.tagName + '#' + (e.id || '?'))
  const live = [...document.querySelectorAll('.panel [id], .live-panel [id]')].filter(e => !e.children.length
    && /NaN|undefined|Infinity/.test(e.textContent)).map(e => '#' + e.id)
  return JSON.stringify({ over, clip, nan: nan.concat(live) }) })()`
async function audit(where) {
  const r = JSON.parse(await evalJs(AUDIT) || '{}')
  if (r.nan?.length) note(where, 'NaN/undefined: ' + r.nan.slice(0, 8).join(', '))
  if (r.over?.length) note(where, 'Texte überlappen: ' + r.over.slice(0, 6).join('; '))
  if (r.clip?.length) note(where, 'Text ragt aus der SVG: ' + r.clip.slice(0, 6).join(', '))
}

const setVal = (sel, v) => evalJs(`(() => { const e = document.querySelector('${sel}'); if (!e) return 0
  e.value = '${v}'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return 1 })()`)
const svgHash = () => evalJs(`(() => { let h = 0; const s = [...document.querySelectorAll('main svg, .main svg, .sim-area svg, .graph-area svg')]
  .map(e => e.outerHTML).join(''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h })()`)

// 1) Grundzustand je Breite × Theme
for (const th of ['light', 'dark']) for (const wh of WIDTHS) {
  await size(wh); await load(th); await run()
  const tag = `${wh[0]}_${th}`; await audit('Grundzustand ' + tag); await shot(`${out}/basis_${tag}.png`)
}

// 2) Diagrammtypen (+ CSV) und 2-Diagramm-Modus, hell und dunkel
await size(WIDTHS[0])
const info = JSON.parse(await evalJs(`JSON.stringify({
  graphs: [...(document.querySelector('select[id^=graph_select]')?.options ?? [])].map(o => o.value),
  sel: document.querySelector('select[id^=graph_select]')?.id ?? null,
  dual: !!document.querySelector('input[name=diagram_mode][value="2"]'),
  ranges: [...document.querySelectorAll('input[type=range]')].filter(e => e.id).map(e => ({ id: e.id, min: e.min, max: e.max, v: e.value })),
  boxes: [...document.querySelectorAll('input[type=checkbox]')].filter(e => e.id && !e.disabled).map(e => e.id) })`))
for (const th of ['light', 'dark']) {
  await load(th)
  for (const g of info.graphs) {
    await setVal('#' + info.sel, g); await run(); await audit(`Diagramm ${g} ${th}`)
    await shot(`${out}/diagramm_${g}_${th}.png`)
    if (th === 'light' && await click('export_diagram_btn')) {
      await sleep(300)
      const c = JSON.parse(await evalJs(`(async () => { const b = window.__csv.at(-1); if (!b) return '{}'
        const t = await b.text(), L = t.trim().split(/\\r?\\n/)
        return JSON.stringify({ n: L.length - 1, head: L[0], bad: /NaN|undefined|Infinity|;;|;\\s*$/m.test(t), dot: /\\d\\.\\d/.test(L.slice(1).join()) }) })()`) || '{}')
      if (!c.head) note(`CSV ${g}`, 'kein Download (Fehler im Export?)')
      else {
        console.log(`CSV ${g}: ${c.n} Zeilen · ${c.head}`)
        if (c.n < 2) note(`CSV ${g}`, 'weniger als 2 Datenzeilen')
        if (c.bad) note(`CSV ${g}`, 'NaN/undefined/leere Zelle')
        if (c.dot) note(`CSV ${g}`, 'Punkt als Dezimaltrenner?')
      }
    }
  }
  if (info.dual) {
    await evalJs(`(() => { const r = document.querySelector('input[name=diagram_mode][value="2"]'); r.checked = true
      r.dispatchEvent(new Event('change', { bubbles: true })); return 1 })()`)
    await run(); await audit('2 Diagramme ' + th); await shot(`${out}/zwei_diagramme_${th}.png`)
  }
}
await load('light')
if (await click('export_all_btn')) { await sleep(300)
  const n = await evalJs(`(async () => { const b = window.__csv.at(-1); return b ? (await b.text()).trim().split('\\n')[0] : '' })()`)
  if (!n) note('CSV alle', 'kein Download'); else console.log('CSV alle: ' + n) }

// 3) Regler auf min und max (je einzeln, übrige Standard) — Verdeckung, Ränder, NaN
if (process.env.EXTREMES !== '0') for (const r of info.ranges) for (const k of ['min', 'max']) {
  await load('light'); await setVal('#' + r.id, r[k]); await run()
  await audit(`${r.id}=${r[k]} (${k})`); await shot(`${out}/regler_${r.id}_${k}.png`)
}

// 4) Schalter ohne sichtbare Wirkung (Blindschalter, B34)
if (process.env.TOGGLES !== '0') {
  await load('light'); await run()
  for (const id of info.boxes) {
    const h0 = await svgHash()
    await evalJs(`document.getElementById('${id}').click(); 1`); await sleep(300)
    if (await svgHash() === h0) note(id, 'Schalter ändert im Ruhezustand nichts an den SVGs (Blindschalter? ggf. nur bei Lauf/anderer Einstellung wirksam)')
    await evalJs(`document.getElementById('${id}').click(); 1`); await sleep(200)
  }
}

const errs = logs.filter(l => /EXC|error/i.test(l))
for (const e of errs) note('Konsole', e.slice(0, 300))
console.log(`\nAufnahmen in ${out}/ — Diagrammtypen: ${info.graphs.join(', ') || '–'} · Regler: ${info.ranges.length} · Schalter: ${info.boxes.length}`)
console.log(findings.length ? `\n${findings.length} Befunde:\n` + findings.join('\n') : '\nkeine automatischen Befunde')
