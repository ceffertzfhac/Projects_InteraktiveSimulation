// Endzustand jedes Schritts als PNG.
//   ANIM=Project_x_animation SPEC="grund:1-20,mult:1-18" [MODE=pres] [THEME=dark] OUT=<ordner> node cdp.mjs ./shots.mjs
import { mkdirSync } from 'node:fs'
const { goto, evalJs, sleep, shot, logs, base } = B
const url = `${base}/${process.env.ANIM}/`
const out = process.env.OUT || 'shots'; mkdirSync(out, { recursive: true })
const th = process.env.THEME || 'light', p = process.env.MODE === 'pres' ? 'p' : ''
await goto(url); await sleep(1500)
await evalJs(`localStorage.setItem('fh_theme','${th}'); 1`)
await goto(url + '?r=1'); await sleep(1500)
await evalJs('MathJax.startup.promise.then(() => document.fonts.ready).then(() => 1)', 30000)
for (const part of process.env.SPEC.split(',')) {
  const [ch, r] = part.split(':'); const [a, b] = r.split('-').map(Number)
  for (let i = a; i <= (b ?? a); i++) {
    await evalJs(`location.hash='#${ch}/${p}${i}'; 1`)
    await sleep(350)
    await shot(`${out}/${p ? 'P' : ''}${ch}_${i}${th === 'dark' ? '_d' : ''}.png`)
  }
}
if (logs.length) console.log(logs.join('\n'))
