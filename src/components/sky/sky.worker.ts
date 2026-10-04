// Paints the detailed sky textures off the main thread, so the page never stalls
// while they're generated. Results are transferred back one at a time.
import { HI, NEBULA_PALETTES, milkyWayPixels, nebulaPixels } from './paint'

self.onmessage = () => {
  NEBULA_PALETTES.forEach((palette, i) => {
    const px = nebulaPixels(palette, 1000 + i * 37, HI.nebula)
    self.postMessage({ kind: 'nebula', i, px }, { transfer: [px.buffer] })
  })
  const [W, H] = HI.milkyWay
  const px = milkyWayPixels(W, H)
  self.postMessage({ kind: 'milkyWay', px }, { transfer: [px.buffer] })
}
