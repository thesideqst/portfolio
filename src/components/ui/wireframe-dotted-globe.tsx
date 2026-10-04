import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { countryAt, loadGeo } from '@/lib/geo'
import { cn } from '@/lib/utils'

// Adapted from 21st.dev's "wireframe dotted globe": country shapes ship with the bundle
// instead of a runtime fetch, colors follow the site palette, and countries and pins are
// clickable so the globe works as a destination picker.

export type Tier = 'client' | 'been'

export type GlobePin = { id: string; name: string; lng: number; lat: number }

type Props = {
  /** Country id → how well Aliya knows it. Countries not listed are still clickable. */
  tiers: Record<string, Tier>
  pins: GlobePin[]
  /** Country id currently selected, outlined on the globe. */
  selectedCountry?: string | null
  /** Where to fly. A new object flies again, even to the same spot. */
  focus?: { lng: number; lat: number } | null
  onPickCountry?: (id: string) => void
  onPickPin?: (id: string) => void
  className?: string
}

const color = {
  ocean: '#120f29',
  rim: 'rgba(237, 230, 218, 0.5)',
  graticule: 'rgba(237, 230, 218, 0.06)',
  border: 'rgba(237, 230, 218, 0.16)',
  dot: 'rgba(154, 147, 184, 0.45)',
  been: 'rgba(237, 230, 218, 0.9)',
  client: '#e8a33d',
  hover: 'rgba(237, 230, 218, 0.14)',
}

export default function RotatingEarth({ tiers, pins, selectedCountry, focus, onPickCountry, onPickPin, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null)
  const flyTo = useRef<(lng: number, lat: number) => void>(() => {})
  const zoomBy = useRef<(f: number) => void>(() => {})
  const live = useRef({ tiers, pins, selectedCountry, onPickCountry, onPickPin })
  useEffect(() => {
    live.current = { tiers, pins, selectedCountry, onPickCountry, onPickPin }
  })

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!wrap || !canvas || !ctx) return

    const { byId, dots } = loadGeo()
    const graticule = d3.geoGraticule10()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let size = 0
    let baseRadius = 0
    let zoom = 1
    const rotation: [number, number] = [-10, -30] // start over Europe, tilted north
    let target: [number, number] | null = null
    let dragging = false
    let idleUntil = 0
    let hoverCountry: string | null = null
    const t0 = performance.now()

    const projection = d3.geoOrthographic().clipAngle(90)
    const path = d3.geoPath(projection, ctx)

    const resize = () => {
      size = wrap.clientWidth
      const dpr = window.devicePixelRatio || 1
      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      baseRadius = size / 2.15
      projection.translate([size / 2, size / 2])
    }

    const isVisible = (lng: number, lat: number) =>
      d3.geoDistance([lng, lat], [-rotation[0], -rotation[1]]) < Math.PI / 2 - 0.02

    const outline = (id: string, fill: string | null, stroke: string | null, width = 1) => {
      const c = byId.get(id)
      if (!c) return
      ctx.beginPath()
      path(c.feature)
      if (fill) {
        ctx.fillStyle = fill
        ctx.fill()
      }
      if (stroke) {
        ctx.strokeStyle = stroke
        ctx.lineWidth = width
        ctx.stroke()
      }
    }

    const render = (now: number) => {
      const { tiers, pins, selectedCountry } = live.current
      const r = baseRadius * zoom
      projection.scale(r).rotate(rotation)
      ctx.clearRect(0, 0, size, size)

      ctx.beginPath()
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2)
      ctx.fillStyle = color.ocean
      ctx.fill()

      ctx.beginPath()
      path(graticule)
      ctx.strokeStyle = color.graticule
      ctx.lineWidth = 1
      ctx.stroke()

      // Soft wash under the countries Aliya knows, so tiny ones (Slovenia) still read.
      for (const [id, tier] of Object.entries(tiers)) {
        outline(id, tier === 'client' ? 'rgba(232, 163, 61, 0.2)' : 'rgba(237, 230, 218, 0.07)', null)
      }
      if (hoverCountry) outline(hoverCountry, color.hover, null)

      ctx.beginPath()
      for (const c of byId.values()) path(c.feature)
      ctx.strokeStyle = color.border
      ctx.lineWidth = 0.6
      ctx.stroke()

      // Halftone dots, batched by color so each group is one fill.
      const dotR = Math.max(0.75, r / 240)
      const groups: Record<string, [number, number][]> = { dot: [], been: [], client: [] }
      for (const d of dots) {
        if (!isVisible(d.lng, d.lat)) continue
        const p = projection([d.lng, d.lat])
        if (p) groups[tiers[d.country] ?? 'dot'].push(p)
      }
      for (const [key, pts] of Object.entries(groups)) {
        ctx.beginPath()
        for (const [x, y] of pts) {
          ctx.moveTo(x + dotR, y)
          ctx.arc(x, y, dotR, 0, Math.PI * 2)
        }
        ctx.fillStyle = color[key as keyof typeof color]
        ctx.fill()
      }

      if (selectedCountry) outline(selectedCountry, null, color.client, 2)

      ctx.beginPath()
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2)
      ctx.strokeStyle = color.rim
      ctx.lineWidth = 1.2
      ctx.stroke()

      const pulse = (Math.sin((now - t0) / 500) + 1) / 2
      for (const pin of pins) {
        if (!isVisible(pin.lng, pin.lat)) continue
        const p = projection([pin.lng, pin.lat])
        if (!p) continue
        ctx.globalAlpha = 0.3 * (1 - pulse)
        ctx.beginPath()
        ctx.arc(p[0], p[1], 3 + pulse * 6, 0, Math.PI * 2)
        ctx.fillStyle = color.client
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(p[0], p[1], 3, 0, Math.PI * 2)
        ctx.fillStyle = color.ocean
        ctx.fill()
        ctx.strokeStyle = color.client
        ctx.lineWidth = 1.6
        ctx.stroke()
      }
    }

    const timer = d3.timer(() => {
      const now = performance.now()
      if (target) {
        const dLng = ((target[0] - rotation[0] + 540) % 360) - 180
        const dLat = target[1] - rotation[1]
        rotation[0] += dLng * 0.08
        rotation[1] += dLat * 0.08
        if (Math.abs(dLng) < 0.1 && Math.abs(dLat) < 0.1) target = null
      } else if (!dragging && !reduceMotion && now > idleUntil && !hoverCountry) {
        rotation[0] += 0.1
      }
      render(now)
    })

    flyTo.current = (lng, lat) => {
      target = [-lng, Math.max(-60, Math.min(60, -lat))]
      idleUntil = performance.now() + 8000
    }
    zoomBy.current = (f) => {
      zoom = Math.max(0.8, Math.min(4, zoom * f))
    }

    const local = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top] as const
    }

    const pinAt = (x: number, y: number) => {
      let best: GlobePin | null = null
      let bestD = 10
      for (const pin of live.current.pins) {
        if (!isVisible(pin.lng, pin.lat)) continue
        const p = projection([pin.lng, pin.lat])
        if (!p) continue
        const d = Math.hypot(p[0] - x, p[1] - y)
        if (d < bestD) [best, bestD] = [pin, d]
      }
      return best
    }

    const hitTest = (x: number, y: number) => {
      const pin = pinAt(x, y)
      if (pin) return { pin, country: null }
      if (Math.hypot(x - size / 2, y - size / 2) > projection.scale()) return { pin: null, country: null }
      const ll = projection.invert?.([x, y])
      return { pin: null, country: ll ? countryAt(ll[0], ll[1]) : null }
    }

    let start: { x: number; y: number; rot: [number, number]; moved: boolean } | null = null

    const onDown = (e: PointerEvent) => {
      start = { x: e.clientX, y: e.clientY, rot: [...rotation], moved: false }
      dragging = true
      target = null
      canvas.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (start) {
        const dx = e.clientX - start.x
        const dy = e.clientY - start.y
        if (Math.hypot(dx, dy) > 4) start.moved = true
        const k = 0.35 / zoom
        rotation[0] = start.rot[0] + dx * k
        rotation[1] = Math.max(-80, Math.min(80, start.rot[1] - dy * k))
        setHover(null)
        return
      }
      if (e.pointerType !== 'mouse') return
      const [x, y] = local(e)
      const hit = hitTest(x, y)
      hoverCountry = hit.country?.id ?? null
      const label = hit.pin?.name ?? hit.country?.name
      canvas.style.cursor = label ? 'pointer' : 'grab'
      setHover(label ? { label, x, y } : null)
    }
    const onUp = (e: PointerEvent) => {
      if (start && !start.moved) {
        const [x, y] = local(e)
        const hit = hitTest(x, y)
        if (hit.pin) live.current.onPickPin?.(hit.pin.id)
        else if (hit.country) live.current.onPickCountry?.(hit.country.id)
      }
      start = null
      dragging = false
      idleUntil = performance.now() + 2500
    }
    const onLeave = () => {
      hoverCountry = null
      setHover(null)
    }
    // Plain scrolling keeps scrolling the page; a trackpad pinch (ctrl + wheel) zooms.
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      zoomBy.current(e.deltaY > 0 ? 0.95 : 1.05)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      timer.stop()
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [])

  useEffect(() => {
    if (focus) flyTo.current(focus.lng, focus.lat)
  }, [focus])

  return (
    <div ref={wrapRef} className={cn('relative aspect-square w-full select-none', className)}>
      <canvas
        ref={canvasRef}
        aria-label="Globe: pick a country to start a trip request"
        role="img"
        className="block cursor-grab touch-pan-y active:cursor-grabbing"
      />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-full bg-bone px-3 py-1 text-xs font-medium text-night shadow-lg"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.label}
        </div>
      )}
      <div className="absolute bottom-2 right-2 flex gap-1">
        {(
          [
            ['−', 0.8, 'Zoom out'],
            ['+', 1.25, 'Zoom in'],
          ] as const
        ).map(([label, f, aria]) => (
          <button
            key={aria}
            type="button"
            aria-label={aria}
            onClick={() => zoomBy.current(f)}
            className="grid size-8 place-items-center rounded-full bg-night-2/90 text-bone/80 ring-1 ring-line transition hover:text-bone hover:ring-bone/50"
          >
            {label}
          </button>
        ))}
      </div>
      <p className="pointer-events-none absolute bottom-3 left-2 font-mono text-[0.65rem] tracking-wider text-ash/80">
        DRAG TO SPIN · TAP A COUNTRY
      </p>
    </div>
  )
}
