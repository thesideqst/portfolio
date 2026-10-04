// Offscreen painters for the sky: noise-textured nebulae, a Milky Way band,
// and spiked bright stars. Everything here runs once at start-up;
// the frame loop only draws the resulting canvases.

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}

/** Seeded 2D value noise with fractal octaves. */
function makeNoise(seed: number) {
  const P = new Uint8Array(512)
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const perm = Array.from({ length: 256 }, (_, i) => i).sort(() => rnd() - 0.5)
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255]
  const val = (x: number, y: number) => P[(P[x & 255] + y) & 511] / 255
  const fade = (t: number) => t * t * (3 - 2 * t)
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y)
    const xf = fade(x - xi), yf = fade(y - yi)
    const a = val(xi, yi), b = val(xi + 1, yi), c = val(xi, yi + 1), d = val(xi + 1, yi + 1)
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf
  }
  return (x: number, y: number, oct = 5) => {
    let sum = 0, amp = 0.5, f = 1, norm = 0
    for (let o = 0; o < oct; o++) {
      sum += noise(x * f, y * f) * amp
      norm += amp
      amp *= 0.5
      f *= 2.03
    }
    return sum / norm
  }
}

type RGB = [number, number, number]

// Palettes drawn from the references: JWST teal/magenta/gold, and violet-blue.
export const NEBULA_PALETTES: RGB[][] = [
  [[40, 170, 190], [220, 70, 150], [245, 190, 120]],
  [[120, 80, 230], [60, 120, 240], [230, 110, 200]],
  [[230, 60, 120], [140, 70, 210], [255, 170, 120]],
  [[50, 190, 170], [70, 90, 220], [200, 230, 160]],
]

/** Seeded random numbers, so the quick and detailed paints of a texture match. */
function seeded(seed: number) {
  let s = seed % 2147483647 || 1
  return (a: number, b: number) => a + ((s = (s * 16807) % 2147483647) / 2147483647) * (b - a)
}

/** Pixel size of the detailed textures, painted off the main thread. */
export const HI = { nebula: 1024, milkyWay: [2400, 900] as const }
/** Pixel size of the quick textures shown while the detailed ones are painted. */
export const LO = { nebula: 256, milkyWay: [720, 270] as const }

/**
 * A cloud of gas with filaments and dark dust lanes, faded to nothing at its edges.
 * Coordinates are normalised, so any size gives the same cloud; bigger sizes add
 * finer octaves for crisper filaments.
 */
export function nebulaPixels(palette: RGB[], seed: number, size: number) {
  const px = new Uint8ClampedArray(size * size * 4)
  const fbm = makeNoise(seed)
  const warp = makeNoise(seed + 99)
  const extra = size >= 768 ? 2 : 0
  const sc = 3.2 / size
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x * sc, ny = y * sc
      // Domain warp makes the gas swirl instead of looking like tiled noise.
      const wx = nx + warp(nx, ny, 3) * 1.6
      const wy = ny + warp(nx + 5, ny + 5, 3) * 1.6
      const d = fbm(wx, wy, 5 + extra)
      const ridge = 1 - Math.abs(fbm(wx * 1.7 + 3, wy * 1.7, 4 + extra) * 2 - 1)
      const dust = smooth(0.55, 0.75, fbm(nx * 2 + 11, ny * 2, 4 + extra))
      const dx = x / size - 0.5, dy = y / size - 0.5
      const fall = 1 - smooth(0.22, 0.5, Math.sqrt(dx * dx + dy * dy))
      const dens = smooth(0.38, 0.78, d) * fall
      const fil = Math.pow(ridge, 6) * fall
      const t = clamp01(d * 1.4 - 0.2)
      const [a, b, gold] = palette
      const k = (y * size + x) * 4
      px[k] = a[0] * (1 - t) + b[0] * t + gold[0] * fil * 0.6
      px[k + 1] = a[1] * (1 - t) + b[1] * t + gold[1] * fil * 0.6
      px[k + 2] = a[2] * (1 - t) + b[2] * t + gold[2] * fil * 0.6
      px[k + 3] = clamp01(dens * 0.55 + fil * 0.5) * (1 - dust * 0.75) * 255
    }
  }
  return px
}

/** Put nebula pixels on a canvas and scatter the young stars embedded in the gas. */
export function nebulaCanvas(px: Uint8ClampedArray, size: number, seed: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.putImageData(new ImageData(new Uint8ClampedArray(px), size, size), 0, 0)
  const r = seeded(seed)
  const u = size / 384
  for (let i = 0; i < 60; i++) {
    const x = size / 2 + r(-0.3, 0.3) * size, y = size / 2 + r(-0.3, 0.3) * size
    g.fillStyle = `rgba(245,240,255,${r(0.25, 0.9)})`
    g.beginPath()
    g.arc(x, y, r(0.35, 1.1) * u, 0, Math.PI * 2)
    g.fill()
  }
  return c
}

/** The Milky Way: a long dusty band, warm at its core, threaded with dark lanes. */
export function milkyWayPixels(W: number, H: number, seed = 7) {
  const px = new Uint8ClampedArray(W * H * 4)
  const fbm = makeNoise(seed)
  const extra = W >= 1600 ? 2 : 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H
      const nx = u * 6.4, ny = v * 2.43
      const band = Math.exp(-Math.pow((v - 0.5 + (fbm(nx * 0.4, 2) - 0.5) * 0.35) / 0.2, 2))
      const ends = smooth(0, 0.25, u) * smooth(0, 0.25, 1 - u)
      const cloud = smooth(0.35, 0.8, fbm(nx, ny, 5 + extra))
      const lane = smooth(0.5, 0.7, fbm(nx * 1.8 + 20, ny * 2.4, 4 + extra))
      const a = band * ends * (0.25 + cloud * 0.6) * (1 - lane * 0.85)
      const warm = smooth(0.3, 0.7, u) * smooth(0.3, 0.7, 1 - u)
      const k = (y * W + x) * 4
      px[k] = 150 + 70 * warm
      px[k + 1] = 130 + 30 * warm
      px[k + 2] = 190 - 60 * warm
      px[k + 3] = a * 120
    }
  }
  return px
}

/** Put Milky Way pixels on a canvas and dust it with tiny stars. */
export function milkyWayCanvas(px: Uint8ClampedArray, W: number, H: number) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  g.putImageData(new ImageData(new Uint8ClampedArray(px), W, H), 0, 0)
  const r = seeded(4242)
  const u = W / 900
  for (let i = 0; i < 2600; i++) {
    const x = r(0, W)
    const y = H / 2 + (r(0, 1) + r(0, 1) + r(0, 1) - 1.5) * H * 0.28
    g.fillStyle = `rgba(235,230,255,${r(0.1, 0.7)})`
    const d = r(0.5, 1.3) * u
    g.fillRect(x, y, d, d)
  }
  return c
}

/** A bright star with a soft halo and four diffraction spikes, as in telescope images. */
export function paintSpikedStar(rgb: string) {
  const S = 64
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  const m = S / 2
  const halo = g.createRadialGradient(m, m, 0, m, m, m * 0.5)
  halo.addColorStop(0, `rgba(${rgb},0.9)`)
  halo.addColorStop(0.15, `rgba(${rgb},0.35)`)
  halo.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = halo
  g.fillRect(0, 0, S, S)
  const spike = (dx: number, dy: number) => {
    const grad = g.createLinearGradient(m - dx * m, m - dy * m, m + dx * m, m + dy * m)
    grad.addColorStop(0, `rgba(${rgb},0)`)
    grad.addColorStop(0.5, `rgba(${rgb},0.85)`)
    grad.addColorStop(1, `rgba(${rgb},0)`)
    g.strokeStyle = grad
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(m - dx * m, m - dy * m)
    g.lineTo(m + dx * m, m + dy * m)
    g.stroke()
  }
  spike(1, 0)
  spike(0, 1)
  g.fillStyle = 'rgba(255,255,255,1)'
  g.beginPath()
  g.arc(m, m, 1.6, 0, Math.PI * 2)
  g.fill()
  return c
}

/** A thin patch of cloud, faintly moonlit, for the night-flight sky to fly over. */
export function cloudCanvas(seed: number, size = 256) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const img = g.createImageData(size, size)
  const fbm = makeNoise(seed)
  const sc = 4 / size
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x / size - 0.5, dy = y / size - 0.5
      const fall = 1 - smooth(0.2, 0.5, Math.sqrt(dx * dx + dy * dy))
      const d = smooth(0.42, 0.75, fbm(x * sc, y * sc, 5)) * fall
      const k = (y * size + x) * 4
      img.data[k] = 74 + d * 40
      img.data[k + 1] = 84 + d * 40
      img.data[k + 2] = 112 + d * 36
      img.data[k + 3] = d * 150
    }
  }
  g.putImageData(img, 0, 0)
  return c
}

/** A soft round glow, for city halos and the brightest lights. */
export function glowCanvas(rgb: string, size = 64) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const m = size / 2
  const grad = g.createRadialGradient(m, m, 0, m, m, m)
  grad.addColorStop(0, `rgba(${rgb},1)`)
  grad.addColorStop(0.25, `rgba(${rgb},0.35)`)
  grad.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  return c
}
