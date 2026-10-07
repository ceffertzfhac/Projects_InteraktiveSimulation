// CDP-Treiber für Schritt-Animationen (dev-only, ohne npm): startet Chrome headless und
// stellt globalThis.B = { send, evalJs, shot, goto, sleep, logs } für ein Prüfskript bereit.
//   node cdp.mjs ./shots.mjs      (Server vom Repo-Root: python3 -m http.server 8765)
// Umgebung: CHROME (Pfad), BASE (http://localhost:8765), W/H (1600×1000)
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const CH = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const W = +(process.env.W || 1600), H = +(process.env.H || 1000)
const port = 9300 + Math.floor(Math.random() * 500)
const dir = mkdtempSync(tmpdir() + '/cdp')
const proc = spawn(CH, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${dir}`,
  `--remote-debugging-port=${port}`, `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let targets
for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break } catch { await sleep(200) } }
const ws = new WebSocket(targets.find(x => x.type === 'page').webSocketDebuggerUrl)
await new Promise(r => { ws.onopen = r })
let id = 0
const pend = new Map(), logs = []
ws.onmessage = e => {
  const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(m.params.exceptionDetails).slice(0, 1500))
  if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.type + ' ' + m.params.args.map(a => a.value ?? a.description).join(' '))
}
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
await send('Runtime.enable'); await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
const evalJs = async (expr, timeout = 15000) => {
  const r = await Promise.race([send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }),
    sleep(timeout).then(() => ({ timeout: true }))])
  if (r.timeout) return 'TIMEOUT'
  return r.result?.exceptionDetails ? 'ERR ' + JSON.stringify(r.result.exceptionDetails).slice(0, 500) : r.result?.result?.value
}
const shot = async file => {
  const r = await Promise.race([send('Page.captureScreenshot', { format: 'png' }), sleep(15000).then(() => null)])
  if (r) writeFileSync(file, Buffer.from(r.result.data, 'base64'))
  else console.log('SHOT TIMEOUT', file)
}
const goto = async url => { await send('Page.navigate', { url }); await sleep(300) }
globalThis.B = { send, evalJs, shot, goto, sleep, logs, base: process.env.BASE || 'http://localhost:8765' }
try { await import(pathToFileURL(resolve(process.argv[2])).href) } catch (e) { console.error(e) }
ws.close(); proc.kill()
