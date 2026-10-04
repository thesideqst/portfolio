// The world tour's route: great-circle legs from city to city, laid out flat.
//
// Each leg is flown along its real great circle, at its real length. Where one leg
// meets the next the route turns by the real angle between them, so on the flat plane
// the flight is drawn on, everything near the plane is where it is on Earth (the plane
// is unrolled leg by leg, so only places far from the current leg are out of place, and
// those are below the horizon).
//
// The ground along every leg comes from NASA's Earth at Night imagery, cut into a strip
// that follows the great circle (public/sky/strips/<from city>.png): rows run along the
// track from MARGIN km before the departure city to MARGIN km past the arrival, columns
// across it, HALF km either side. Strips overlap around each city, so each one keeps only
// its own side of the line that bisects the turn there.
//
// The strips were cut with a script that, for each leg, works out the latitude and
// longitude under every strip pixel, fetches that area from NASA GIBS (WMS, layer
// VIIRS_CityLights_2012, 0.02° a pixel) and samples it; brightness is stored less the
// unlit-ground level (18 of 255), in steps of 4.

import { CITIES, DENSITY, KM, lightColour, loadGray, rad, rand, smooth, type City, type Light } from './cities'

/** Strip layout, in km: pixel size, half the width, and the overhang past each end. */
const STEP = 2.5
const HALF = 500
const MARGIN = 500
/** Strip rows lit per chunk, and the most lights a chunk may hold. */
const CHUNK_ROWS = 40
const CHUNK_CAP = 2200
const EARTH_KM = 6371

/**
 * The order the tour visits the cities in, flying east around the world and back.
 * It starts at Rio so the flight opens on the way in to New York.
 */
export const TOUR = ['rio', 'new-york', 'reykjavik', 'london', 'paris', 'istanbul', 'cairo', 'dubai', 'mumbai', 'singapore', 'tokyo', 'las-vegas'].map(
  (id) => CITIES.find((c) => c.id === id)!,
)
const stopAt = (i: number) => TOUR[((i % TOUR.length) + TOUR.length) % TOUR.length]

/** Initial great-circle bearing from a to b, in radians clockwise from north. */
function bearing(a: City, b: City) {
  const dl = rad(b.lon - a.lon)
  return Math.atan2(Math.sin(dl) * Math.cos(rad(b.lat)), Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dl))
}
/** Great-circle distance from a to b, in km. */
function distance(a: City, b: City) {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h))
}
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
/** How far the route turns at the start of leg i: from the heading it arrives on to the one it leaves on. */
const turnAt = (i: number) => wrap(bearing(stopAt(i), stopAt(i + 1)) - (bearing(stopAt(i), stopAt(i - 1)) + Math.PI))

type Vec = [number, number]
const along = (h: number): Vec => [Math.sin(h), Math.cos(h)]
const rightOf = (h: number): Vec => [Math.cos(h), -Math.sin(h)]
const unit = ([x, y]: Vec): Vec => {
  const l = Math.hypot(x, y) || 1
  return [x / l, y / l]
}

export type Leg = {
  /** Counts up forever as the tour loops; the city is TOUR[i % TOUR.length]. */
  i: number
  from: City
  to: City
  km: number
  /** Distance along the whole route where this leg starts, in world units. */
  at: number
  length: number
  /** Heading on the flat plane, radians clockwise from +y. */
  heading: number
  start: Vec
  end: Vec
  dir: Vec
  right: Vec
  /** Normals of the lines bisecting the turns at each end; the leg owns the ground between them. */
  startCut: Vec
  endCut: Vec
  /** Turns the departure city's north-up map onto the plane: compass θ points along θ + rot. */
  rot: number
}

const legs: Leg[] = []
/** Leg i of the route (laid out on first use; i counts up as the tour loops). */
export function leg(i: number): Leg {
  while (legs.length <= i) {
    const n = legs.length
    const prev = legs[n - 1]
    const heading = prev ? prev.heading + turnAt(n) : bearing(stopAt(0), stopAt(1))
    const km = distance(stopAt(n), stopAt(n + 1))
    const start: Vec = prev ? prev.end : [0, 0]
    const dir = along(heading)
    const end: Vec = [start[0] + dir[0] * km * KM, start[1] + dir[1] * km * KM]
    const before = along(heading - turnAt(n))
    const after = along(heading + turnAt(n + 1))
    legs.push({
      i: n,
      from: stopAt(n),
      to: stopAt(n + 1),
      km,
      at: prev ? prev.at + prev.length : 0,
      length: km * KM,
      heading,
      start,
      end,
      dir,
      right: rightOf(heading),
      startCut: unit([before[0] + dir[0], before[1] + dir[1]]),
      endCut: unit([dir[0] + after[0], dir[1] + after[1]]),
      rot: heading - bearing(stopAt(n), stopAt(n + 1)),
    })
  }
  return legs[i]
}

/** The leg a distance along the route falls in. */
export function legAt(s: number) {
  let i = 0
  while (leg(i).at + leg(i).length <= s) i++
  return leg(i)
}

/**
 * Where the plane is, and which way it faces, at a distance along the route. It eases
 * through each turn on a curve rather than pivoting on the city, and flies a little to
 * one side of each city (alternating) so the city isn't hidden under the page's centre.
 */
export function pathAt(s: number) {
  const l = legAt(s)
  const next = leg(l.i + 1)
  const u = s - l.at
  const radius = (a: Leg, b: Leg) => Math.min(150 * KM, 0.4 * a.length, 0.4 * b.length)
  let x: number, y: number, tx: number, ty: number
  const into = l.i > 0 ? radius(leg(l.i - 1), l) : 0
  const out = radius(l, next)
  const curve = (a: Leg, b: Leg, r: number, t: number) => {
    // A quadratic Bézier from r before the corner to r after it, with the corner as control.
    const p0: Vec = [b.start[0] - a.dir[0] * r, b.start[1] - a.dir[1] * r]
    const p2: Vec = [b.start[0] + b.dir[0] * r, b.start[1] + b.dir[1] * r]
    const c = b.start
    return [
      (1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * c[0] + t * t * p2[0],
      (1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * c[1] + t * t * p2[1],
      2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p2[0] - c[0]),
      2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p2[1] - c[1]),
    ]
  }
  if (u < into) [x, y, tx, ty] = curve(leg(l.i - 1), l, into, (u + into) / (2 * into))
  else if (u > l.length - out) [x, y, tx, ty] = curve(l, next, out, (u - (l.length - out)) / (2 * out))
  else [x, y, tx, ty] = [l.start[0] + l.dir[0] * u, l.start[1] + l.dir[1] * u, l.dir[0], l.dir[1]]
  const yaw = Math.atan2(tx, ty)
  // Pass each city 25 km off to one side, sliding over between them.
  const side = (i: number) => (i % 2 ? 1 : -1) * 25 * KM
  const off = side(l.i) + (side(l.i + 1) - side(l.i)) * smooth(0, 1, u / l.length)
  const r = rightOf(yaw)
  return { x: x + r[0] * off, y: y + r[1] * off, yaw, leg: l, kmToGo: (l.length - u) / KM }
}

type Strip = { data: Uint8Array; rows: number; cols: number }
const strips = new Map<string, Promise<Strip>>()
/** Load the strip of ground along a leg, once. */
export function loadStrip(l: Leg) {
  let p = strips.get(l.from.id)
  if (!p) {
    p = loadGray(`/sky/strips/${l.from.id}.png`).then((g) => ({ data: g.data, rows: g.height, cols: g.width }))
    p.catch(() => strips.delete(l.from.id))
    strips.set(l.from.id, p)
  }
  return p
}

/** How many chunks a leg's strip is lit in. */
export const chunkCount = (strip: Strip) => Math.ceil(strip.rows / CHUNK_ROWS)

/**
 * Lights for one chunk of a leg's strip, in world units. Brighter pixels get more
 * lights; around the cities the strip fades out where the detailed city map takes over,
 * and each leg keeps only its own side of the turns at either end.
 */
export function buildChunk(l: Leg, strip: Strip, chunk: number): Light[] {
  const r0 = chunk * CHUNK_ROWS, r1 = Math.min(strip.rows, r0 + CHUNK_ROWS)
  const cellArea = STEP * STEP
  const wants: number[] = []
  let total = 0
  for (let r = r0; r < r1; r++) {
    const s = -MARGIN + (r + 0.5) * STEP
    for (let c = 0; c < strip.cols; c++) {
      const b = strip.data[r * strip.cols + c] / 255
      // Below this it's moonlit desert or haze in the imagery, not lights.
      if (b < 0.1) continue
      const t = -HALF + (c + 0.5) * STEP
      const wx = l.start[0] + (l.dir[0] * s + l.right[0] * t) * KM
      const wy = l.start[1] + (l.dir[1] * s + l.right[1] * t) * KM
      if ((wx - l.start[0]) * l.startCut[0] + (wy - l.start[1]) * l.startCut[1] < 0) continue
      if ((wx - l.end[0]) * l.endCut[0] + (wy - l.end[1]) * l.endCut[1] >= 0) continue
      const fade =
        (1 - smooth(HALF * 0.75, HALF, Math.abs(t))) *
        smooth(l.from.half * 0.7, l.from.half, Math.hypot(s, t)) *
        smooth(l.to.half * 0.7, l.to.half, Math.hypot(s - l.km, t))
      const want = Math.pow(b, 2.5) * DENSITY * cellArea * fade
      if (want <= 0) continue
      wants.push(r, c, want)
      total += want
    }
  }
  const thin = Math.min(1, CHUNK_CAP / (total || 1))
  // Fewer lights, each a little brighter, so thinned country doesn't look dimmer.
  const lift = Math.min(1.6, 1 / Math.sqrt(thin))
  const out: Light[] = []
  for (let k = 0; k < wants.length; k += 3) {
    const r = wants[k], c = wants[k + 1], want = wants[k + 2] * thin
    const b = strip.data[r * strip.cols + c] / 255
    const n = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0)
    for (let q = 0; q < n; q++) {
      const s = -MARGIN + (r + Math.random()) * STEP
      const t = -HALF + (c + Math.random()) * STEP
      out.push({
        x: l.start[0] + (l.dir[0] * s + l.right[0] * t) * KM,
        y: l.start[1] + (l.dir[1] * s + l.right[1] * t) * KM,
        c: lightColour(b, 0.3),
        a: Math.min(1, rand(0.35, 1) * (0.45 + 0.55 * b) * lift),
        glow: Math.random() < 0.006 * b,
        tw: false,
      })
    }
  }
  return out.sort((a, b) => a.c - b.c)
}

/** Distance along a leg's track (world units, from its start) that a chunk covers. */
export const chunkSpan = (chunk: number): [number, number] => [(-MARGIN + chunk * CHUNK_ROWS * STEP) * KM, (-MARGIN + (chunk + 1) * CHUNK_ROWS * STEP) * KM]
