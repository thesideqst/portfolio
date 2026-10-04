import { useEffect, useRef } from 'react'
import { HI, LO, NEBULA_PALETTES, milkyWayCanvas, milkyWayPixels, nebulaCanvas, nebulaPixels, paintSpikedStar } from './sky/paint'

// A slow fall through deep space.
//
// Layers share one perspective and one "fall" speed, each moving at its own pace
// so depth reads as parallax: the Milky Way hangs at infinity, nebulae drift in
// from far away, constellations travel through the middle distance,
// and loose stars stream past up close. Turning the wheel, or any wheel or drag
// on the page, speeds the fall up.
//
// Hovering a constellation (over open sky, not over page content) brings it to
// rest, lights it up, and shows a fun fact about it.

type Star = { x: number; y: number; z: number; px: number; py: number; tint: string; spiked: boolean }
type Shape = { name: string; fact: string; points: number[][]; lines: number[][] }
type Body = { shape: Shape; x: number; y: number; z: number; spin: number; angle: number; size: number; glow: number; pace: number }
type Cloud = { sprite: number; x: number; y: number; z: number; spin: number; angle: number; size: number }

const STAR_COUNT = 560
const DEPTH = 1600
const BASE_SPEED = 0.55
const TINTS = ['225,232,255', '225,232,255', '225,232,255', '180,200,255', '255,236,215', '255,200,180', '200,180,255']

// Rates relative to the star stream: smaller is farther away.
const BODY_RATE = 0.32
const CLOUD_RATE = 0.1

/** Page content that should keep the pointer for itself; hovering the sky only counts outside these. */
const CONTENT = 'a,button,input,iframe,img,p,h1,h2,h3,li,dt,dd,blockquote,[role=option],[role=dialog],[role=tab],.ring-1'

const SHAPES: Shape[] = [
  { name: 'Cassiopeia', fact: 'Named for a vain queen of Greek myth. From most of the northern hemisphere her W never sets.', points: [[0, 0.3], [0.25, 0.75], [0.5, 0.45], [0.75, 0.8], [1, 0.2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { name: 'Orion', fact: 'Betelgeuse, Orion’s red shoulder, is so large that in the Sun’s place it would reach past the orbit of Mars.', points: [[0.2, 0], [0.8, 0.05], [0.42, 0.48], [0.5, 0.5], [0.58, 0.52], [0.15, 1], [0.85, 0.95]], lines: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]] },
  { name: 'Ursa Major', fact: 'The Big Dipper lives here. Its two end stars point straight to Polaris, the North Star.', points: [[0, 0.2], [0.2, 0.3], [0.38, 0.35], [0.55, 0.5], [0.58, 0.85], [0.9, 0.9], [0.95, 0.5]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { name: 'Lyra', fact: 'Its brightest star, Vega, was the North Star 14,000 years ago and will be again about 12,000 years from now.', points: [[0.5, 0], [0.3, 0.45], [0.7, 0.5], [0.25, 1], [0.65, 1]], lines: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]] },
  { name: 'Cygnus', fact: 'The swan flies along the Milky Way, and holds Cygnus X-1, one of the first black holes ever found.', points: [[0.5, 0], [0.5, 0.4], [0.5, 1], [0, 0.35], [1, 0.45]], lines: [[0, 1], [1, 2], [3, 1], [1, 4]] },
  { name: 'Scorpius', fact: 'Its red heart is Antares, whose name means “rival of Mars” for its color.', points: [[0.9, 0], [0.8, 0.2], [0.7, 0.35], [0.6, 0.55], [0.45, 0.75], [0.25, 0.85], [0.1, 0.75], [0.05, 0.55]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]] },
  { name: 'Leo', fact: 'Every November, the Leonid meteor shower seems to pour out of the lion’s head.', points: [[0.15, 0.1], [0.05, 0.3], [0.2, 0.45], [0.4, 0.5], [0.85, 0.55], [0.95, 0.85], [0.45, 0.85]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { name: 'Gemini', fact: 'The twin stars Castor and Pollux. Castor alone turns out to be six stars orbiting each other.', points: [[0.2, 0], [0.6, 0.05], [0.15, 0.5], [0.55, 0.55], [0.1, 1], [0.5, 1]], lines: [[0, 2], [2, 4], [1, 3], [3, 5], [0, 1]] },
]

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** A point on a ring around the centre, so things stay clear of the wheel and the name. */
const offCentre = (min: number, max: number) => {
  const a = rand(0, Math.PI * 2)
  const r = rand(min, max)
  return [Math.cos(a) * r, Math.sin(a) * r * 0.7]
}

export function Starfield({ hidden = false }: { hidden?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const tip = tipRef.current
    if (!canvas || !tip) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingQuality = 'high'
    }
    resize()

    // Paint the expensive textures once.
    // Quick textures first, so the sky appears at once; a worker paints detailed
    // ones (same shapes, finer grain) and they're swapped in as each finishes.
    const nebulaSeed = (i: number) => 1000 + i * 37
    const nebulaSprites = NEBULA_PALETTES.map((p, i) => nebulaCanvas(nebulaPixels(p, nebulaSeed(i), LO.nebula), LO.nebula, nebulaSeed(i)))
    let milkyWay = milkyWayCanvas(milkyWayPixels(...LO.milkyWay), ...LO.milkyWay)
    const worker = new Worker(new URL('./sky/sky.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<{ kind: 'nebula' | 'milkyWay'; i: number; px: Uint8ClampedArray }>) => {
      const { kind, i, px } = e.data
      if (kind === 'nebula') nebulaSprites[i] = nebulaCanvas(px, HI.nebula, nebulaSeed(i))
      else milkyWay = milkyWayCanvas(px, ...HI.milkyWay)
    }
    worker.postMessage('paint')
    const spikes = ['225,232,255', '255,225,200', '190,205,255'].map(paintSpikedStar)

    const spawnStar = (far = false): Star => ({
      x: rand(-1300, 1300),
      y: rand(-1300, 1300),
      z: far ? DEPTH : rand(1, DEPTH),
      px: NaN,
      py: NaN,
      tint: TINTS[Math.floor(Math.random() * TINTS.length)],
      spiked: Math.random() < 0.025,
    })
    const stars = Array.from({ length: STAR_COUNT }, () => spawnStar())

    let nextShape = 0
    const spawnBody = (z: number): Body => {
      const [x, y] = offCentre(420, 950)
      return { shape: SHAPES[nextShape++ % SHAPES.length], x, y, z, spin: rand(-0.0012, 0.0012), angle: rand(-0.4, 0.4), size: rand(260, 380), glow: 0, pace: 1 }
    }
    const bodies = Array.from({ length: 4 }, (_, i) => spawnBody(DEPTH * (0.35 + i * 0.17)))

    let nextCloud = 0
    const spawnCloud = (z: number): Cloud => {
      const [x, y] = offCentre(150, 900)
      return { sprite: nextCloud++ % nebulaSprites.length, x, y, z, spin: rand(-0.0003, 0.0003), angle: rand(0, Math.PI * 2), size: rand(1300, 2100) }
    }
    const clouds = Array.from({ length: 4 }, (_, i) => spawnCloud(DEPTH * (0.3 + i * 0.2)))

    const mouse = { x: 0, y: 0, tx: 0, ty: 0, px: -9999, py: -9999, sky: false }
    let boost = 0
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / w) * 2 - 1
      mouse.ty = (e.clientY / h) * 2 - 1
      mouse.px = e.clientX
      mouse.py = e.clientY
      mouse.sky = !(e.target instanceof Element && e.target.closest(CONTENT))
      if (e.buttons) boost += Math.min(Math.abs(e.movementY) * 0.08, 2)
    }
    const onLeave = () => {
      mouse.px = mouse.py = -9999
    }
    const onWheel = (e: WheelEvent) => {
      boost += Math.min(Math.abs(e.deltaY) * 0.02, 4)
    }

    let shownTip: Body | null = null
    let frame = 0
    const draw = () => {
      frame = requestAnimationFrame(draw)
      mouse.x += (mouse.tx - mouse.x) * 0.04
      mouse.y += (mouse.ty - mouse.y) * 0.04
      boost *= 0.94
      const speed = reduced ? 0 : BASE_SPEED + Math.min(boost, 18)

      const cx = w / 2 + mouse.x * 40
      const cy = h / 2 + mouse.y * 40
      const fov = Math.max(w, h) * 0.55
      const project = (x: number, y: number, z: number) => {
        const k = fov / z
        return [cx + x * k, cy + y * k, k] as const
      }
      const depthAlpha = (z: number) => Math.min(1, (DEPTH - z) / 300) * Math.min(1, z / 160)

      // Deep space, nearly black, with a little navy and violet.
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      const bg = ctx.createLinearGradient(0, 0, w * 0.3, h)
      bg.addColorStop(0, '#03040c')
      bg.addColorStop(0.5, '#070a1c')
      bg.addColorStop(1, '#0d0820')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // The Milky Way hangs at infinity: it only shifts a little with the cursor.
      ctx.save()
      ctx.translate(w / 2 - mouse.x * 8, h * 0.52 - mouse.y * 8)
      ctx.rotate(-0.42)
      const mwW = Math.hypot(w, h) * 1.15
      ctx.globalAlpha = 0.9
      ctx.drawImage(milkyWay, -mwW / 2, -mwW * 0.19, mwW, mwW * 0.38)
      ctx.restore()

      // Nebulae.
      ctx.globalCompositeOperation = 'lighter'
      const big = Math.max(w, h)
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i]
        c.z -= speed * CLOUD_RATE
        c.angle += reduced ? 0 : c.spin
        if (c.z < 80) clouds[i] = spawnCloud(DEPTH)
        const [x, y, k] = project(c.x, c.y, c.z)
        const s = c.size * k
        // Fade as a cloud gets so close it would wash out the screen.
        const tooClose = Math.min(1, Math.max(0, (big * 3 - s) / (big * 1.2)))
        ctx.save()
        ctx.globalAlpha = depthAlpha(c.z) * tooClose * 0.85
        ctx.translate(x, y)
        ctx.rotate(c.angle)
        ctx.drawImage(nebulaSprites[c.sprite], -s / 2, -s / 2, s, s)
        ctx.restore()
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'

      // Constellations.
      let hoveredBody: Body | null = null
      let tipBox: [number, number, number, number] = [0, 0, 0, 0]
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i]
        const cos = Math.cos(b.angle), sin = Math.sin(b.angle)
        const pts = b.shape.points.map(([px, py]) => {
          const lx = (px - 0.5) * b.size, ly = (py - 0.5) * b.size
          return project(b.x + lx * cos - ly * sin, b.y + lx * sin + ly * cos, b.z)
        })
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
        const hovered = mouse.sky && mouse.px > minX - 24 && mouse.px < maxX + 24 && mouse.py > minY - 24 && mouse.py < maxY + 24
        b.pace += ((hovered ? 0 : 1) - b.pace) * 0.08
        b.glow += ((hovered ? 1 : 0) - b.glow) * 0.08
        b.z -= speed * BODY_RATE * b.pace
        b.angle += reduced ? 0 : b.spin * b.pace
        // Retire a constellation before it gets close enough to sprawl across the page.
        if (b.z < 420 || maxX - minX > Math.min(w, h) * 0.75) {
          bodies[i] = spawnBody(DEPTH)
          continue
        }
        if (hovered) {
          hoveredBody = b
          tipBox = [minX, minY, maxX, maxY]
        }
        const fade = depthAlpha(b.z) * Math.min(1, (b.z - 420) / 220), g = b.glow
        ctx.strokeStyle = `rgba(190,180,255,${(0.16 + g * 0.5) * fade})`
        ctx.lineWidth = 0.75 + g * 0.5
        ctx.beginPath()
        b.shape.lines.forEach(([a, c]) => {
          ctx.moveTo(pts[a][0], pts[a][1])
          ctx.lineTo(pts[c][0], pts[c][1])
        })
        ctx.stroke()
        // Each star is a small spiked point, brighter and larger while hovered.
        for (const [x, y, k] of pts) {
          const size = 14 + k * 10 + g * 14
          ctx.globalAlpha = Math.min(1, (0.75 + g * 0.25) * fade)
          ctx.drawImage(spikes[0], x - size / 2, y - size / 2, size, size)
        }
        ctx.globalAlpha = 1
      }

      // Fun-fact card next to the hovered constellation.
      if (hoveredBody !== shownTip) {
        shownTip = hoveredBody
        if (shownTip) {
          tip.querySelector('[data-name]')!.textContent = shownTip.shape.name
          tip.querySelector('[data-fact]')!.textContent = shownTip.shape.fact
        }
        tip.style.opacity = shownTip ? '1' : '0'
      }
      if (shownTip) {
        const tw = tip.offsetWidth, th = tip.offsetHeight
        const [bx0, by0, bx1, by1] = tipBox
        const right = bx1 + 18
        const left = right + tw > w - 12 ? bx0 - tw - 18 : right
        const top = Math.min(Math.max(12, (by0 + by1) / 2 - th / 2), h - th - 12)
        tip.style.transform = `translate(${Math.max(12, left)}px, ${top}px)`
      }

      // The near stream.
      for (const s of stars) {
        s.z -= speed
        if (s.z < 1) Object.assign(s, spawnStar(true))
        const [x, y] = project(s.x, s.y, s.z)
        if (x < -50 || x > w + 50 || y < -50 || y > h + 50) {
          Object.assign(s, spawnStar(true))
          continue
        }
        const near = 1 - s.z / DEPTH
        const r = 0.25 + near * near * 1.9
        const a = Math.min(1, 0.15 + near * 1.2)
        if (s.spiked && speed <= 2) {
          const size = 10 + near * 34
          ctx.globalAlpha = a
          ctx.drawImage(spikes[s.tint.startsWith('255') ? 1 : s.tint.startsWith('180') ? 2 : 0], x - size / 2, y - size / 2, size, size)
          ctx.globalAlpha = 1
        } else if (!Number.isNaN(s.px) && speed > 2) {
          ctx.strokeStyle = `rgba(${s.tint},${a * 0.8})`
          ctx.lineWidth = r
          ctx.beginPath()
          ctx.moveTo(s.px, s.py)
          ctx.lineTo(x, y)
          ctx.stroke()
        } else {
          ctx.fillStyle = `rgba(${s.tint},${a})`
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fill()
        }
        s.px = x
        s.py = y
      }
    }
    draw()

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      worker.terminate()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('wheel', onWheel)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-500 ${hidden ? 'opacity-0' : 'opacity-100'}`}
      />
      <div
        ref={tipRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-20 w-64 rounded-xl bg-night-2/85 p-3.5 opacity-0 ring-1 ring-line backdrop-blur-md transition-opacity duration-300"
      >
        <p data-name className="font-display text-xl font-light" />
        <p data-fact className="mt-1 text-sm leading-snug text-bone/80" />
      </div>
    </>
  )
}
