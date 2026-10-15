'use strict'
// Füllt die data-dyn-Spans der Folienkarten aus dem Modell (eine Quelle für jede Zahl).
import { fmt } from '../../shared/js/format.js'
import { store } from './state.js'
import { MU, G_TRUE, uncertaintyDecimals } from './model.js'

export function fillCards(root = document) {
  const D = store.data
  const f = x => fmt(x, 2)
  const sum = n => D.values.slice(0, n).reduce((a, b) => a + b, 0)
  const t = D.tally
  const tallyText = t.inside >= 5 && t.inside <= 9
    ? 'Das passt zu etwa 68 %.'
    : 'Das weicht ab: Bei nur 10 Werten schwankt der Anteil stark. Erst viele Messungen nähern sich 68,3 %.'
  // ḡ und μ_g je Stichprobengröße mit den Nachkommastellen nach FMU20; σ_g wie die Messwerte
  const dec = r => uncertaintyDecimals(r.u)
  const fR = (x, r) => fmt(x, dec(r))
  const v = {
    mean100u: fR(D.n100.mean, D.n100), u100: fR(D.n100.u, D.n100), mean100s: f(D.n100.mean), sigma100: f(D.n100.sigma),
    loU100: fR(D.n100.mean - D.n100.u, D.n100), hiU100: fR(D.n100.mean + D.n100.u, D.n100),
    loS100: f(D.n100.mean - D.n100.sigma), hiS100: f(D.n100.mean + D.n100.sigma),
    gE: f(MU), gTrue: f(G_TRUE),
    sum10: f(sum(10)), mean10: f(D.n10.mean), sigma10: f(D.n10.sigma),
    lo10: f(D.n10.mean - D.n10.sigma), hi10: f(D.n10.mean + D.n10.sigma),
    tIn: String(t.inside), tOut: String(t.outside), tallyText,
    mean20: fR(D.n20.mean, D.n20), sigma20: f(D.n20.sigma), u20: fR(D.n20.u, D.n20),
    mean30: fR(D.n30.mean, D.n30), u30: fR(D.n30.u, D.n30), sigma30: f(D.n30.sigma),
    mean40: fR(D.n40.mean, D.n40), sigma40: f(D.n40.sigma), u40: fR(D.n40.u, D.n40),
  }
  root.querySelectorAll('[data-dyn]').forEach(el => {
    const k = el.dataset.dyn
    if (k in v) el.textContent = v[k]
  })
}
