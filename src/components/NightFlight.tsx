import { useEffect, useRef } from 'react'
import { KM, PALETTE, buildCity, loadCityMap, type City, type Light } from './sky/cities'
import { buildChunk, chunkCount, chunkSpan, leg, loadStrip, pathAt, type Leg } from './sky/route'
import { setFlightStatus } from './sky/mode'
import { cloudCanvas, glowCanvas } from './sky/paint'

// A night flight around the world.
//
// The flight follows the route in sky/route.ts: great-circle legs between twelve
// cities, at their real lengths, turning by the real angles between them. The ground is
// NASA's night imagery along every leg, and the Earth curves away below, so the horizon
// is where it really is from this height (the view is from about 100 km up, higher than
// a plane, so more of the ground fits in the window). Over dark ocean and desert the
// flight speeds up on its own, and slows again for lights and cities. Moving the cursor
// banks the plane a little; turning the wheel, or any wheel or drag on the page, speeds
// it up.
//
// Hovering a city (over open sky, not over page content) slows the flight, lights
// the city up, and shows a fun fact about it.

type Stop = City & { leg: number; x: number; y: number; lights: Light[]; beams: [number, number][]; R: number; glow: number; age: number }
type Cloud = { sprite: number; x: number; y: number; size: number }
/** A chunk of ground's lights, with a circle around them for skipping it when it's out of view. */
type Chunk = { lights: Light[]; x: number; y: number; r: number }

const ALT = 700
const EARTH = 6371 * KM
/** Distance to the horizon from this height. */
const FAR = Math.sqrt(2 * EARTH * ALT)
const DIP = Math.atan((2 * ALT) / FAR)
const BASE_SPEED = 5
const CLOUD_ALT = 320
const STAR_COUNT = 160

/** Page content that should keep the pointer for itself; hovering the sky only counts outside these. */
const CONTENT = 'a,button,input,iframe,img,p,h1,h2,h3,li,dt,dd,blockquote,[role=option],[role=dialog],[role=tab],.ring-1'

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function NightFlight({ hidden = false }: { hidden?: boolean }) {
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
    }
    resize()
    const dprNow = () => canvas.width / w

    const clouds = [11, 23, 37].map((s) => cloudCanvas(s))
    const halo = glowCanvas('255,150,60')
    const glows = PALETTE.map((c) => glowCanvas(c, 32))
    // The northern lights: one soft vertical stroke, stretched into curtains.
    const curtain = document.createElement('canvas')
    curtain.width = 4
    curtain.height = 128
    {
      const g = curtain.getContext('2d')!
      const grad = g.createLinearGradient(0, 0, 0, 128)
      grad.addColorStop(0, 'rgba(140,90,255,0)')
      grad.addColorStop(0.45, 'rgba(110,200,255,0.35)')
      grad.addColorStop(0.85, 'rgba(90,255,170,1)')
      grad.addColorStop(1, 'rgba(90,255,170,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, 4, 128)
    }
    const stars = Array.from({ length: STAR_COUNT }, () => ({ x: Math.random(), y: Math.pow(Math.random(), 1.4), a: rand(0.2, 0.9), p: rand(0, 6) }))

    // The camera: where it is along the route, and its place and heading on the plane.
    // It starts on the leg in from Rio, a few hundred km short of New York.
    let along = leg(0).length - 380 * KM
    let cam = pathAt(along)
    let sinY = 0, cosY = 1
    let tanT = 0.4, cosT = 0, sinT = 0, f = 0, cx = 0, cy = 0
    const frameView = (mx: number, my: number) => {
      f = Math.max(w, h) * 0.55
      cx = w / 2 + mx * 30
      cy = h / 2 + my * 20
      // Tilted down so the true horizon (DIP below level) sits near the top of the screen.
      const t = DIP + Math.atan((h / 2 - h * 0.13) / f)
      tanT = Math.tan(t - DIP)
      cosT = Math.cos(t)
      sinT = Math.sin(t)
    }
    frameView(0, 0)
    /**
     * Screen position and scale of a point on the ground (or `height` above it). The
     * Earth curves away below, so farther points sit lower; past the horizon, nothing.
     */
    const project = (gx: number, gy: number, height = 0) => {
      const dx = gx - cam.x, dy = gy - cam.y
      const d = dx * sinY + dy * cosY
      const x = dx * cosY - dy * sinY
      if (x * x + d * d > FAR * FAR * 1.02) return null
      const alt = ALT - height + (x * x + d * d) / (2 * EARTH)
      const z = d * cosT + alt * sinT
      if (z < 1) return null
      const k = f / z
      return [cx + x * k, cy + (alt * cosT - d * sinT) * k, k, d] as const
    }
    const haze = (dist: number) => Math.min(1, (FAR - dist) / 1200) * (0.45 + 0.55 * Math.exp(-dist / 5000))

    // Ground along the route, lit a chunk at a time as it comes over the horizon.
    let alive = true
    const loadedStrips = new Map<number, Awaited<ReturnType<typeof loadStrip>>>()
    const chunks = new Map<string, Chunk>()
    const stops = new Map<number, Stop>()
    const loading = new Set<string>()
    const want = (key: string, load: () => Promise<unknown>) => {
      if (loading.has(key)) return
      loading.add(key)
      load().catch(() => loading.delete(key))
    }
    /** Legs whose ground could be in view: the one we're on, the one behind, and those ahead. */
    const nearbyLegs = () => {
      const out: Leg[] = []
      if (cam.leg.i > 0) out.push(leg(cam.leg.i - 1))
      for (let i = cam.leg.i; leg(i).at < along + FAR + 600 * KM; i++) out.push(leg(i))
      return out
    }
    const stream = () => {
      const legs = nearbyLegs()
      const keep = new Set<string>()
      const todo: [number, string, Leg, number][] = []
      for (const l of legs) {
        want(`strip:${l.i}`, () => loadStrip(l).then((s) => alive && loadedStrips.set(l.i, s)))
        // The city at the start of each leg.
        want(`city:${l.i}`, () =>
          loadCityMap(l.from).then((map) => {
            if (!alive) return
            const built = buildCity(l.from, map, l.rot)
            stops.set(l.i, { ...l.from, ...built, leg: l.i, x: l.start[0], y: l.start[1], glow: 0, age: 0 })
          }),
        )
        const strip = loadedStrips.get(l.i)
        if (!strip) continue
        const u = along - l.at
        for (let c = 0; c < chunkCount(strip); c++) {
          const [a, b] = chunkSpan(c)
          if (b < u - 300 * KM || a > u + FAR + 200 * KM) continue
          const key = `${l.i}:${c}`
          keep.add(key)
          if (!chunks.has(key)) todo.push([Math.abs((a + b) / 2 - u), key, l, c])
        }
      }
      // A couple of chunks a frame, nearest first, so streaming never stalls a frame.
      todo.sort((p, q) => p[0] - q[0])
      for (const [, key, l, c] of todo.slice(0, 2)) {
        const lights = buildChunk(l, loadedStrips.get(l.i)!, c)
        let x = 0, y = 0, r = 0
        for (const p of lights) {
          x += p.x
          y += p.y
        }
        x /= lights.length || 1
        y /= lights.length || 1
        for (const p of lights) r = Math.max(r, Math.hypot(p.x - x, p.y - y))
        chunks.set(key, { lights, x, y, r })
      }
      for (const key of chunks.keys()) if (!keep.has(key)) chunks.delete(key)
      const legIds = new Set(legs.map((l) => l.i))
      for (const i of stops.keys()) if (!legIds.has(i)) stops.delete(i)
      for (const i of loadedStrips.keys()) if (!legIds.has(i)) loadedStrips.delete(i)
      for (const key of loading) {
        const i = Number(key.split(':')[1])
        if (!legIds.has(i)) loading.delete(key)
      }
      // Get the next leg's ground ready before it's needed.
      void loadStrip(leg(cam.leg.i + 1)).catch(() => {})
    }

    const drift: Cloud[] = []
    let cloudAt = along
    const spawnClouds = () => {
      while (cloudAt < along + FAR) {
        const p = pathAt(cloudAt)
        const side = rand(-5000, 5000)
        drift.push({ sprite: Math.floor(Math.random() * clouds.length), x: p.x + Math.cos(p.yaw) * side, y: p.y - Math.sin(p.yaw) * side, size: rand(1800, 3600) })
        cloudAt += rand(1500, 3500)
      }
    }

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

    let pace = 1
    let warp = 1
    let lit = 0
    let bank = 0
    let aurora = 0
    let shownTip: Stop | null = null
    let frame = 0
    let tick = 0
    const draw = () => {
      frame = requestAnimationFrame(draw)
      tick++
      mouse.x += (mouse.tx - mouse.x) * 0.04
      mouse.y += (mouse.ty - mouse.y) * 0.04
      boost *= 0.94

      // Fast-forward over the dark: quickly over open ocean, gently over sparse country,
      // and back to cruising near a city.
      let nearest = Infinity
      for (const c of stops.values()) nearest = Math.min(nearest, Math.hypot(c.x - cam.x, c.y - cam.y))
      const target = nearest < 400 * KM ? 1 : lit < 250 ? 12 : lit < 1200 ? 4 : 1.5
      warp += (target - warp) * (target > warp ? 0.01 : 0.04)
      const speed = reduced ? 0 : (BASE_SPEED * warp + Math.min(boost, 18) * 3.2) * pace
      along += speed
      const yaw = cam.yaw
      cam = pathAt(along)
      sinY = Math.sin(cam.yaw)
      cosY = Math.cos(cam.yaw)
      // Bank into turns.
      const turnRate = Math.atan2(Math.sin(cam.yaw - yaw), Math.cos(cam.yaw - yaw)) / Math.max(speed, 0.001)
      bank += (Math.max(-0.12, Math.min(0.12, -turnRate * 140)) - bank) * 0.05
      stream()
      spawnClouds()
      for (let i = drift.length - 1; i >= 0; i--) {
        const c = drift[i]
        if ((c.x - cam.x) * sinY + (c.y - cam.y) * cosY < -2000) drift.splice(i, 1)
      }
      if (tick % 20 === 1) setFlightStatus({ from: cam.leg.from.name, to: cam.leg.to.name, km: cam.kmToGo })

      frameView(mouse.x, mouse.y)
      const horizon = cy - f * tanT
      // Banking: the whole view tilts a little toward the cursor, and into turns.
      const roll = -mouse.x * 0.045 + bank
      const rc = Math.cos(-roll), rs = Math.sin(-roll)
      // The pointer, in the unbanked frame everything is projected in.
      const mx = w / 2 + (mouse.px - w / 2) * rc - (mouse.py - h / 2) * rs
      const my = h / 2 + (mouse.px - w / 2) * rs + (mouse.py - h / 2) * rc

      const dpr = dprNow()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.fillStyle = '#02030a'
      ctx.fillRect(0, 0, w, h)
      ctx.translate(w / 2, h / 2)
      ctx.rotate(roll)
      ctx.translate(-w / 2, -h / 2)

      // Sky above the horizon, ground below, a band of haze where they meet.
      const sky = ctx.createLinearGradient(0, horizon - h * 0.6, 0, horizon)
      sky.addColorStop(0, '#02030a')
      sky.addColorStop(1, '#0c1430')
      ctx.fillStyle = sky
      ctx.fillRect(-w, -h, w * 3, horizon + h)
      const ground = ctx.createLinearGradient(0, horizon, 0, h)
      ground.addColorStop(0, '#0b1024')
      ground.addColorStop(0.25, '#05070f')
      ground.addColorStop(1, '#020308')
      ctx.fillStyle = ground
      ctx.fillRect(-w, horizon, w * 3, h * 2)

      for (const s of stars) {
        const y = s.y * (horizon - 8)
        ctx.globalAlpha = s.a * (0.4 + 0.6 * Math.min(1, (horizon - y) / 80)) * (0.85 + 0.15 * Math.sin(tick * 0.03 + s.p))
        ctx.fillStyle = '#dfe6ff'
        ctx.fillRect(s.x * w * 1.2 - w * 0.1, y, 1.2, 1.2)
      }

      ctx.globalCompositeOperation = 'lighter'
      const limb = ctx.createLinearGradient(0, horizon - 26, 0, horizon + 18)
      limb.addColorStop(0, 'rgba(80,190,150,0)')
      limb.addColorStop(0.55, 'rgba(80,190,150,0.16)')
      limb.addColorStop(0.75, 'rgba(110,150,255,0.22)')
      limb.addColorStop(1, 'rgba(110,150,255,0)')
      ctx.globalAlpha = 1
      ctx.fillStyle = limb
      ctx.fillRect(-w, horizon - 26, w * 3, 44)

      // Northern lights, while Reykjavík is in view.
      const wantAurora = [...stops.values()].some((c) => c.aurora && Math.hypot(c.x - cam.x, c.y - cam.y) < FAR * 1.2)
      aurora += ((wantAurora ? 1 : 0) - aurora) * 0.01
      if (aurora > 0.01) {
        const strips = 70
        for (let i = 0; i < strips; i++) {
          const x = (i / strips) * w * 1.3 - w * 0.15
          const wave = Math.sin(i * 0.21 + tick * 0.006) * 0.5 + Math.sin(i * 0.07 - tick * 0.004) * 0.5
          const tall = 90 + wave * 60
          const base = horizon - 10 - Math.sin(i * 0.11 + tick * 0.003) * 18
          ctx.globalAlpha = aurora * 0.22 * (0.4 + 0.6 * Math.max(0, wave + 0.4))
          ctx.drawImage(curtain, x, base - tall, (w * 1.3) / strips + 2, tall)
        }
      }

      let litNow = 0
      const far2 = FAR * FAR
      const inv2R = 1 / (2 * EARTH)
      const drawLights = (lights: Light[], ox: number, oy: number, gain: number) => {
        let color = -1
        for (let i = 0; i < lights.length; i++) {
          const p = lights[i]
          const dx = ox + p.x - cam.x, dy = oy + p.y - cam.y
          const d = dx * sinY + dy * cosY
          if (d < 1) continue
          const x = dx * cosY - dy * sinY
          const dist2 = x * x + d * d
          if (dist2 > far2) continue
          // Down by the horizon lights are packed into a few pixels; a sample of them reads the same.
          const step = d > 4000 ? 4 : d > 2000 ? 2 : 1
          if (i % step) continue
          const alt = ALT + dist2 * inv2R
          const z = d * cosT + alt * sinT
          const k = f / z
          const sx = cx + x * k
          if (sx < -10 || sx > w + 10) continue
          const sy = cy + (alt * cosT - d * sinT) * k
          if (sy > h + 10) continue
          const dist = Math.sqrt(dist2)
          let a = p.a * haze(dist) * gain * (1 + (step - 1) * 0.6)
          if (p.tw) a *= Math.sin(tick * 0.9 + p.x * 7) > 0.2 ? 1 : 0.15
          if (a < 0.02) continue
          if (dist < FAR * 0.6) litNow++
          const s = Math.min(2.8, 0.7 + k * 3)
          if (p.c !== color) {
            color = p.c
            ctx.fillStyle = `rgb(${PALETTE[color]})`
          }
          ctx.globalAlpha = Math.min(1, a)
          ctx.fillRect(sx - s / 2, sy - s / 2, s, s)
          if (p.glow) {
            const g = s * 7
            ctx.globalAlpha = Math.min(1, a * 0.45)
            ctx.drawImage(glows[p.c], sx - g / 2, sy - g / 2, g, g)
          }
        }
      }

      for (const c of chunks.values()) {
        const dx = c.x - cam.x, dy = c.y - cam.y
        if (dx * sinY + dy * cosY < -c.r || Math.hypot(dx, dy) - c.r > FAR) continue
        drawLights(c.lights, 0, 0, 1)
      }

      // Cities.
      let hovered: Stop | null = null
      let tipBox: [number, number, number, number] = [0, 0, 0, 0]
      for (const c of stops.values()) {
        const centre = project(c.x, c.y)
        if (centre) {
          const [sx, , ck] = centre
          const near = project(c.x - sinY * c.R, c.y - cosY * c.R)
          const far = project(c.x + sinY * c.R, c.y + cosY * c.R)
          const top = far ? far[1] : centre[1] - 4, bottom = near ? near[1] : h * 2
          const rx = c.R * ck
          const onScreen = sx + rx > 0 && sx - rx < w && top < h && bottom - top < h * 0.75
          const over = onScreen && mouse.sky && mx > sx - rx * 0.8 - 12 && mx < sx + rx * 0.8 + 12 && my > top - 12 && my < Math.min(bottom, h) + 12
          if (over && !hovered) {
            hovered = c
            tipBox = [Math.max(0, sx - rx * 0.8), top, Math.min(w, sx + rx * 0.8), Math.min(bottom, h)]
          }
          c.glow += ((over ? 1 : 0) - c.glow) * 0.08
          // The glow the city throws up into the haze.
          const hw = rx * 2.6
          ctx.globalAlpha = Math.min(1, haze(Math.hypot(c.x - cam.x, c.y - cam.y)) * (0.5 + c.glow * 0.35) * c.age)
          ctx.drawImage(halo, sx - hw / 2, top - (bottom - top) * 0.3, hw, (bottom - top) * 1.6)
        }
        // A city whose map arrives while it's already in view fades in.
        c.age = Math.min(1, c.age + 0.02)
        drawLights(c.lights, c.x, c.y, (1 + c.glow * 0.7) * c.age)
        for (const beam of c.beams) {
          const base = project(c.x + beam[0], c.y + beam[1])
          const tipPt = project(c.x + beam[0], c.y + beam[1], 2400)
          if (base && tipPt) {
            const grad = ctx.createLinearGradient(base[0], base[1], tipPt[0], tipPt[1])
            grad.addColorStop(0, 'rgba(235,240,255,0.95)')
            grad.addColorStop(1, 'rgba(235,240,255,0)')
            ctx.globalAlpha = haze(Math.hypot(c.x + beam[0] - cam.x, c.y + beam[1] - cam.y)) * c.age
            ctx.strokeStyle = grad
            ctx.lineWidth = 1 + base[2] * 1.2
            ctx.beginPath()
            ctx.moveTo(base[0], base[1])
            ctx.lineTo(tipPt[0], tipPt[1])
            ctx.stroke()
          }
        }
      }
      lit = litNow
      pace += ((hovered ? 0 : 1) - pace) * 0.06

      // Thin, moonlit cloud between us and the ground.
      ctx.globalCompositeOperation = 'source-over'
      for (const cl of drift) {
        const mid = project(cl.x, cl.y, CLOUD_ALT)
        const back = project(cl.x + sinY * cl.size / 2, cl.y + cosY * cl.size / 2, CLOUD_ALT)
        const front = project(cl.x - sinY * cl.size / 2, cl.y - cosY * cl.size / 2, CLOUD_ALT)
        if (!mid || !back) continue
        const cw = cl.size * mid[2]
        const top = back[1], bottom = front ? front[1] : h * 3
        const tooClose = Math.min(1, Math.max(0, (w * 3 - cw) / (w * 1.5)))
        ctx.globalAlpha = Math.min(1, haze(Math.hypot(cl.x - cam.x, cl.y - cam.y)) * tooClose * 0.55)
        ctx.drawImage(clouds[cl.sprite], mid[0] - cw / 2, top, cw, bottom - top)
      }
      ctx.globalAlpha = 1

      // Fun-fact card next to the hovered city.
      if (hovered !== shownTip) {
        shownTip = hovered
        if (shownTip) {
          tip.querySelector('[data-place]')!.textContent = shownTip.place
          tip.querySelector('[data-name]')!.textContent = shownTip.name
          tip.querySelector('[data-fact]')!.textContent = shownTip.fact
        }
        tip.style.opacity = shownTip ? '1' : '0'
      }
      if (shownTip) {
        // Back from the unbanked frame to the screen.
        const bx = (tipBox[0] + tipBox[2]) / 2 - w / 2, by = (tipBox[1] + tipBox[3]) / 2 - h / 2
        const ox = w / 2 + bx * Math.cos(roll) - by * Math.sin(roll)
        const oy = h / 2 + bx * Math.sin(roll) + by * Math.cos(roll)
        const half = (tipBox[2] - tipBox[0]) / 2
        const tw = tip.offsetWidth, th = tip.offsetHeight
        const right = ox + half + 18
        const left = right + tw > w - 12 ? ox - half - tw - 18 : right
        const top = Math.min(Math.max(12, oy - th / 2), h - th - 12)
        tip.style.transform = `translate(${Math.min(Math.max(12, left), w - tw - 12)}px, ${top}px)`
      }
    }
    draw()

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      alive = false
      setFlightStatus(null)
      cancelAnimationFrame(frame)
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
        <p data-place className="text-xs text-ash" />
        <p data-name className="mt-1 font-display text-xl font-light" />
        <p data-fact className="mt-1 text-sm leading-snug text-bone/80" />
      </div>
    </>
  )
}
