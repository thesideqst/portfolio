// The tour's cities: what they're called, where they are, a fun fact, and their lights.
//
// Each city's lights come from NASA's Earth at Night imagery (VIIRS City Lights 2012,
// public domain): a north-up crop around the city, saved as a small grayscale map in
// public/sky/cities/ (about 0.4 km a pixel). Brighter pixels get more lights, so
// coastlines, rivers and sprawl land where they are on the ground. A few landmarks are
// added at their real coordinates: the Luxor's beam, the Eiffel Tower's sparkle, the
// pyramids. The country between cities comes from the route's strips (see route.ts).
//
// To refresh or add a city's map, fetch a square crop from NASA GIBS (WMS, layer
// VIIRS_CityLights_2012, 160 px spanning `half` km each way from the centre) and save
// its brightness, less the unlit-ground level (18 of 255), as an 8-bit grayscale PNG
// named after the city's id.

/** Light colours, as rgb strings: sodium orange, warm white, LED white, highway amber. */
export const PALETTE = ['255,164,78', '255,210,150', '226,236,255', '255,132,60']

/** World units per kilometre. */
export const KM = 7
/** Lights per square km where NASA's map is fully bright. */
export const DENSITY = 2.2
const MAP_SIZE = 160
/** Street spacing and the size of a district with its own grid, in world units. */
const STREET = 5
const DISTRICT = 4 * KM

export type Light = { x: number; y: number; c: number; a: number; glow: boolean; tw: boolean }
type Landmark = { lat: number; lon: number; kind: 'beam' | 'sparkle' | 'glow' | 'ships' }
export type City = {
  id: string
  name: string
  place: string
  fact: string
  lat: number
  lon: number
  /** Half the width of the map, in km. */
  half: number
  /** Share of white LED light in the brightest parts. */
  led: number
  /** Heading of the main street grid, in degrees clockwise from north. Random when unset. */
  grid?: number
  landmarks?: Landmark[]
  /** Turns on the northern lights while this city is in view (Reykjavík). */
  aurora?: boolean
}

export const CITIES: City[] = [
  {
    id: 'new-york',
    name: 'New York',
    place: '40.71° N, 74.01° W',
    fact: 'Manhattan’s street grid was drawn up in 1811, long before most of the island was built on.',
    lat: 40.74, lon: -73.95, half: 35, led: 0.45, grid: 29,
  },
  {
    id: 'paris',
    name: 'Paris',
    place: '48.86° N, 2.35° E',
    fact: 'Every hour after dark, the Eiffel Tower sparkles with 20,000 bulbs for five minutes.',
    lat: 48.86, lon: 2.35, half: 30, led: 0.15,
    landmarks: [{ lat: 48.8584, lon: 2.2945, kind: 'sparkle' }],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    place: '35.68° N, 139.69° E',
    fact: 'The biggest city on Earth, about 37 million people. Shinjuku Station alone handles more than 3 million passengers a day.',
    lat: 35.68, lon: 139.75, half: 45, led: 0.75,
  },
  {
    id: 'las-vegas',
    name: 'Las Vegas',
    place: '36.17° N, 115.14° W',
    fact: 'The beam on top of the Luxor is the strongest in the world. On a clear night, pilots can see it from about 275 miles away.',
    lat: 36.15, lon: -115.17, half: 25, led: 0.3, grid: 0,
    landmarks: [{ lat: 36.0955, lon: -115.1761, kind: 'beam' }],
  },
  {
    id: 'cairo',
    name: 'Cairo',
    place: '30.04° N, 31.24° E',
    fact: 'Nearly all of Egypt lives along the Nile. From above at night it’s a thin gold thread through black desert, opening into a fan at the delta.',
    lat: 30.05, lon: 31.23, half: 40, led: 0.2,
    landmarks: [
      { lat: 29.9792, lon: 31.1342, kind: 'glow' },
      { lat: 29.9761, lon: 31.1308, kind: 'glow' },
      { lat: 29.9725, lon: 31.1283, kind: 'glow' },
    ],
  },
  {
    id: 'dubai',
    name: 'Dubai',
    place: '25.20° N, 55.27° E',
    fact: 'The Burj Khalifa is so tall you can watch the sun set from the street, ride to the top, and watch it set again.',
    lat: 25.15, lon: 55.25, half: 35, led: 0.6,
    landmarks: [{ lat: 25.1972, lon: 55.2744, kind: 'glow' }],
  },
  {
    id: 'london',
    name: 'London',
    place: '51.51° N, 0.13° W',
    fact: 'Underneath it all runs the Tube. Opened in 1863, it’s the oldest underground railway in the world.',
    lat: 51.51, lon: -0.12, half: 35, led: 0.3,
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    place: '19.08° N, 72.88° E',
    fact: 'The curve of streetlights along Marine Drive is called the Queen’s Necklace, because from above at night it looks like a string of pearls.',
    lat: 19.05, lon: 72.88, half: 30, led: 0.25,
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    place: '22.91° S, 43.17° W',
    fact: 'Christ the Redeemer, lit up on its mountain, is struck by lightning a few times a year, so the city keeps spare soapstone for repairs.',
    lat: -22.92, lon: -43.25, half: 30, led: 0.3,
    landmarks: [{ lat: -22.9519, lon: -43.2105, kind: 'glow' }],
  },
  {
    id: 'reykjavik',
    name: 'Reykjavík',
    place: '64.15° N, 21.94° W',
    fact: 'The world’s northernmost capital. Almost every home is heated with geothermal water piped straight up from underground.',
    lat: 64.13, lon: -21.85, half: 20, led: 0.6,
    aurora: true,
  },
  {
    id: 'istanbul',
    name: 'Istanbul',
    place: '41.01° N, 28.98° E',
    fact: 'The only major city on two continents. The Bosphorus runs between Europe and Asia here, and its bridges glow in changing colours at night.',
    lat: 41.03, lon: 29.0, half: 35, led: 0.3,
  },
  {
    id: 'singapore',
    name: 'Singapore',
    place: '1.35° N, 103.82° E',
    fact: 'From the air at night you can see hundreds of ships lit up offshore, waiting their turn at one of the busiest ports in the world.',
    lat: 1.33, lon: 103.82, half: 30, led: 0.85,
    landmarks: [{ lat: 1.24, lon: 103.95, kind: 'ships' }],
  },
]

export const rad = (d: number) => (d * Math.PI) / 180
export const rand = (a: number, b: number) => a + Math.random() * (b - a)
export const smooth = (e0: number, e1: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/** Decode a grayscale PNG into brightness values, row by row. */
export async function loadGray(src: string) {
  const img = new Image()
  img.src = src
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.drawImage(img, 0, 0)
  const rgba = g.getImageData(0, 0, c.width, c.height).data
  const v = new Uint8Array(c.width * c.height)
  for (let i = 0; i < v.length; i++) v[i] = rgba[i * 4]
  return { data: v, width: c.width, height: c.height }
}

const loading = new Map<string, Promise<Uint8Array>>()
/** Load a city's light map, once; brightness values row by row from the north edge. */
export function loadCityMap(city: City) {
  let p = loading.get(city.id)
  if (!p) {
    p = loadGray(`/sky/cities/${city.id}.png`).then((g) => g.data)
    p.catch(() => loading.delete(city.id))
    loading.set(city.id, p)
  }
  return p
}

/** Light colour for a pixel of brightness b: white LED downtown, sodium orange elsewhere. */
export const lightColour = (b: number, led: number) => (Math.random() < led * (b > 0.85 ? 1.1 : 0.35) ? 2 : Math.random() < 0.25 ? 1 : 0)

/**
 * Scatter a city's lights over its map, in world units around the city centre, turned
 * by `rot` (a compass heading θ points along θ + rot in the world). The map fades out
 * toward its edge, where the route's strip takes over. Sorted by colour for drawing.
 * Also returns where any searchlights stand.
 */
export function buildCity(city: City, map: Uint8Array, rot: number) {
  const out: Light[] = []
  const add = (x: number, y: number, c: number, a: number, glow = false, tw = false) => out.push({ x, y, c, a, glow, tw })
  const half = city.half

  // The satellite map is coarse and saturated downtown, so lights are lined up along
  // streets: a grid every half kilometre, its heading shifting from district to
  // district the way real street plans do.
  const base = city.grid === undefined ? rand(0, Math.PI) : rad(city.grid)
  const district = new Map<number, number>()
  const street = (x: number, y: number): [number, number] => {
    const key = Math.floor(x / DISTRICT) * 1000 + Math.floor(y / DISTRICT)
    let turn = district.get(key)
    if (turn === undefined) {
      turn = city.grid !== undefined && Math.hypot(x, y) < half * KM * 0.35 ? 0 : Math.random() < 0.6 ? 0 : rand(-0.6, 0.6)
      district.set(key, turn)
    }
    const a = base + turn, cos = Math.cos(a), sin = Math.sin(a)
    // In the grid's frame: u across the avenues, v along them.
    let u = x * cos - y * sin, v = x * sin + y * cos
    const roll = Math.random()
    if (roll < 0.45) u = Math.round(u / STREET) * STREET + rand(-0.3, 0.3)
    else if (roll < 0.75) v = Math.round(v / (STREET * 0.6)) * STREET * 0.6 + rand(-0.3, 0.3)
    return [u * cos + v * sin, -u * sin + v * cos]
  }

  // Brightness to light count: the power keeps suburbs sparse and downtown dense.
  // Big, bright cities are thinned to a cap so the frame rate holds; the lights that
  // remain are a little brighter so they don't look dimmer.
  const cellKm = (half * 2) / MAP_SIZE
  const wants = new Float32Array(map.length)
  let total = 0
  for (let j = 0; j < MAP_SIZE; j++) {
    for (let i = 0; i < MAP_SIZE; i++) {
      const b = map[j * MAP_SIZE + i] / 255
      if (b < 0.1) continue
      const km = Math.hypot(((i + 0.5) / MAP_SIZE) * 2 * half - half, half - ((j + 0.5) / MAP_SIZE) * 2 * half)
      const want = Math.pow(b, 2.5) * DENSITY * cellKm * cellKm * (1 - smooth(half * 0.7, half, km))
      wants[j * MAP_SIZE + i] = want
      total += want
    }
  }
  const thin = Math.min(1, 9000 / total)
  const lift = Math.min(1.6, 1 / Math.sqrt(thin))
  for (let j = 0; j < MAP_SIZE; j++) {
    for (let i = 0; i < MAP_SIZE; i++) {
      const want = wants[j * MAP_SIZE + i] * thin
      if (!want) continue
      const b = map[j * MAP_SIZE + i] / 255
      const n = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0)
      for (let q = 0; q < n; q++) {
        const xKm = ((i + Math.random()) / MAP_SIZE) * 2 * half - half
        const yKm = half - ((j + Math.random()) / MAP_SIZE) * 2 * half
        const [x, y] = street(xKm * KM, yKm * KM)
        add(x, y, lightColour(b, city.led), Math.min(1, rand(0.35, 1) * (0.45 + 0.55 * b) * lift), Math.random() < 0.012 * b)
      }
    }
  }

  const beams: [number, number][] = []
  const kmPerLon = 111.32 * Math.cos(rad(city.lat))
  for (const l of city.landmarks ?? []) {
    const x = (l.lon - city.lon) * kmPerLon * KM
    const y = (l.lat - city.lat) * 111.32 * KM
    if (l.kind === 'beam') {
      beams.push([x, y])
      add(x, y, 2, 1, true)
    } else if (l.kind === 'glow') {
      add(x, y, 1, 1, true)
    } else if (l.kind === 'sparkle') {
      for (let i = 0; i < 28; i++) add(x + rand(-3, 3), y + rand(-3, 3), 2, rand(0.6, 1), true, true)
    } else {
      // Ships at anchor: lights scattered over the dark water only.
      const extent = half * KM
      for (let placed = 0, tries = 0; placed < 140 && tries < 2000; tries++) {
        const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 9 * KM
        const sx = x + Math.cos(a) * r * 1.5, sy = y + Math.sin(a) * r
        const i = Math.floor(((sx + extent) / (2 * extent)) * MAP_SIZE)
        const j = Math.floor(((extent - sy) / (2 * extent)) * MAP_SIZE)
        if (i < 0 || j < 0 || i >= MAP_SIZE || j >= MAP_SIZE || map[j * MAP_SIZE + i] > 60) continue
        add(sx, sy, 2, rand(0.35, 0.8))
        placed++
      }
    }
  }

  const cos = Math.cos(rot), sin = Math.sin(rot)
  const turn = ([x, y]: [number, number]): [number, number] => [x * cos + y * sin, -x * sin + y * cos]
  for (const p of out) [p.x, p.y] = turn([p.x, p.y])
  out.sort((a, b) => a.c - b.c)
  return { lights: out, beams: beams.map(turn), R: half * KM * 0.75 }
}
