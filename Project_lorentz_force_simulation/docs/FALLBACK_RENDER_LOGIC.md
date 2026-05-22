# Fallback Render Logic: Robust 3D Spring

This document preserves the robust "sine-wave" approximation for the 3D spring rendering. This implementation is guaranteed to be visible and stable even under extreme compression/extension, although it lacks the sophisticated "closed ends" of the advanced version.

## Usage
If the advanced `draw3DSpring` function fails or produces visual glitches, replace it with the code below in `js/render.js`.

## Code

```javascript
/**
 * Draws a guaranteed visible 3D spring using a sine-wave approximation with stroke-width variation.
 */
function draw3DSpring(g, x, yStart, yEnd) {
  g.innerHTML = ''
  
  // Safe-guard against invalid coordinates
  if (!isFinite(yStart) || !isFinite(yEnd)) return

  const numCoils = 14
  const width = 8
  const totalH = yEnd - yStart
  const hookH = 10
  const activeH = totalH - 2 * hookH
  
  if (activeH <= 0) {
    // Just a straight line if too compressed
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    l.setAttribute('x1', x); l.setAttribute('y1', yStart)
    l.setAttribute('x2', x); l.setAttribute('y2', yEnd)
    l.setAttribute('stroke', '#666'); l.setAttribute('stroke-width', '2')
    g.appendChild(l)
    return
  }

  // 1. Top Hook
  const topPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  topPath.setAttribute('d', `M ${x} ${Y_CEILING} L ${x} ${yStart + hookH}`)
  topPath.setAttribute('fill', 'none'); topPath.setAttribute('stroke', '#666'); topPath.setAttribute('stroke-width', '2')
  g.appendChild(topPath)

  // 2. Coils (Sine Wave with layering)
  const hPerCoil = activeH / numCoils
  
  // Draw back layer (dark)
  let dBack = ''
  for(let i=0; i<numCoils; i++) {
    const y0 = yStart + hookH + i*hPerCoil
    const y1 = y0 + hPerCoil
    const yMid = y0 + hPerCoil/2
    dBack += ` M ${x} ${y0} Q ${x-width} ${y0} ${x-width} ${yMid} Q ${x-width} ${y1} ${x} ${y1}`
  }
  const back = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  back.setAttribute('d', dBack); back.setAttribute('fill', 'none'); back.setAttribute('stroke', '#333'); back.setAttribute('stroke-width', '1.5')
  g.appendChild(back)

  // Draw front layer (metallic)
  let dFront = ''
  for(let i=0; i<numCoils; i++) {
    const y0 = yStart + hookH + i*hPerCoil
    const y1 = y0 + hPerCoil
    const yMid = y0 + hPerCoil/2
    dFront += ` M ${x} ${y0} Q ${x+width} ${y0} ${x+width} ${yMid} Q ${x+width} ${y1} ${x} ${y1}`
  }
  const front = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  front.setAttribute('d', dFront); front.setAttribute('fill', 'none'); front.setAttribute('stroke', '#bbb'); front.setAttribute('stroke-width', '2.5'); front.setAttribute('stroke-linecap', 'round')
  g.appendChild(front)
  
  // Highlight
  const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  highlight.setAttribute('d', dFront); highlight.setAttribute('fill', 'none'); highlight.setAttribute('stroke', '#fff'); highlight.setAttribute('stroke-width', '0.8'); highlight.setAttribute('stroke-opacity', '0.6')
  g.appendChild(highlight)

  // 3. Bottom Hook
  const botPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  botPath.setAttribute('d', `M ${x} ${yEnd - hookH} L ${x} ${yEnd}`)
  botPath.setAttribute('fill', 'none'); botPath.setAttribute('stroke', '#666'); botPath.setAttribute('stroke-width', '2')
  g.appendChild(botPath)
}
```
