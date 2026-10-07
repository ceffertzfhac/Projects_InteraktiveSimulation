// Prüfungen ohne Bilder: Schrittzahl je Modus, Halt-Warnungen, Reversibilität (sichtbarer
// Zustand: Szene + Karten/Zeilen) vorwärts/rückwärts/Sprung in beiden Modi, Konsolenfehler.
//   ANIM=Project_x_animation node cdp.mjs ./check.mjs        (Auto-Play zusätzlich: PLAY=1)
const { goto, evalJs, sleep, logs, base } = B
await goto(`${base}/${process.env.ANIM}/#`); await sleep(3500)
const res = await evalJs(`(async () => {
  const { store } = await import('/${process.env.ANIM}/js/state.js')
  const P = store.presenter, out = []
  const vis = e => { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return 0
    let o = 1; for (let p = e; p && p !== document.body; p = p.parentElement) o *= +getComputedStyle(p).opacity; return Math.round(o * 100) }
  const snap = () => { const S = store.scene, o = {}; for (const k in S) o[k] = Math.round(S[k] * 1e5) / 1e5
    return JSON.stringify(o) + [...document.querySelectorAll('.slide-card, .slide-card [data-r]')].map(vis).join() }
  for (const md of ['anim', 'pres']) for (const ch of P.chapters) {
    P.setMode?.(md); P.selectChapter(ch.id); const E = P.engine, N = E.total, fwd = []
    for (let i = 0; i <= N; i++) { E.goto(i); fwd.push(snap()) }
    const bad = []
    for (let i = N; i >= 0; i--) { E.goto(i); if (snap() !== fwd[i]) bad.push(i) }
    for (const i of [N, 2, N - 1, 0, Math.floor(N / 2), 1]) { E.goto(i); if (snap() !== fwd[i]) bad.push('j' + i) }
    out.push(md + ' ' + ch.id + ' N=' + N + ' abweichend: ' + (bad.join(',') || 'keine'))
  }
  P.setMode?.('anim')
  return out.join('\\n') })()`, 300000)
console.log(res)
if (process.env.PLAY) for (const md of ['anim', 'pres']) {
  console.log(await evalJs(`(async () => {
    const { store } = await import('/${process.env.ANIM}/js/state.js'); const P = store.presenter, out = []
    for (const ch of P.chapters) {
      P.setMode?.('${md}'); P.selectChapter(ch.id); const E = P.engine; E.goto(0); E.setSpeed(8); E.play()
      for (let k = 0; k < 1500 && (E.index < E.total || E.busy); k++) await new Promise(r => setTimeout(r, 100))
      out.push('${md} ' + ch.id + ' Auto-Play ' + E.index + '/' + E.total + ', NaN: '
        + [...document.querySelectorAll('svg *')].filter(e => [...e.attributes].some(a => /NaN/.test(a.value))).length)
    }
    return out.join('\\n') })()`, 900000))
}
const warn = logs.filter(l => /warn|EXC|error/i.test(l))
console.log(warn.length ? warn.join('\n') : 'keine Warnungen/Fehler')
