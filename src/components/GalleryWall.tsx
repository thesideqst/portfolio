import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import * as d3 from 'd3'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { bookshelf, travel } from '@/content'
import { loadGeo } from '@/lib/geo'
import { photos, thumbSrc } from '@/photos'

// A gothic salon wall: Aliya's photos hung tight on dark damask among antique mirrors, a map,
// a pressed fern and a candle sconce, above an ebony credenza with her books on it. On desktop
// every piece sits at a fixed spot on a wall 100 units wide (1 unit = 1cqw); on phones the same
// pieces wrap, scaled up by --s.

type Moulding = 'ornate' | 'gilt' | 'ebony' | 'mahogany' | 'iron'
type Mat = 'ivory' | 'black'
type Piece = { x: number; y: number; w: number; h: number; frame?: Moulding; mat?: Mat } & (
  | { kind: 'photo'; id: string; focus?: string }
  | { kind: 'botanical' | 'map' | 'mirror' | 'arch' | 'sconce' | 'medallion' }
)

const pieces: Piece[] = [
  { kind: 'botanical', x: 2, y: 4, w: 11, h: 14, frame: 'ebony', mat: 'black' },
  { kind: 'photo', id: 'img-8672', x: 2, y: 20, w: 11, h: 15, frame: 'iron', mat: 'black' },
  { kind: 'photo', id: 'img-9334', x: 2, y: 37, w: 11, h: 13, frame: 'gilt' },
  { kind: 'photo', id: 'mood-1789776637747', x: 15, y: 2, w: 14, h: 19, frame: 'ornate', mat: 'ivory' },
  { kind: 'photo', id: 'img-7402', x: 31, y: 4, w: 11, h: 15, frame: 'ebony', mat: 'ivory' },
  { kind: 'photo', id: 'img-7636', x: 15, y: 23, w: 27, h: 20, frame: 'ornate' },
  { kind: 'photo', id: 'img-6313', x: 44, y: 2, w: 12, h: 12, frame: 'gilt' },
  { kind: 'map', x: 44, y: 16, w: 14, h: 10, frame: 'mahogany' },
  { kind: 'photo', id: 'img-8317', x: 44, y: 28, w: 10, h: 14, frame: 'iron', mat: 'black' },
  { kind: 'sconce', x: 55.3, y: 27, w: 3.6, h: 17 },
  { kind: 'mirror', x: 46, y: 44, w: 8, h: 8 },
  { kind: 'photo', id: 'mood-1790377592875', x: 60, y: 2, w: 21, h: 13, frame: 'mahogany', focus: 'center 64%' },
  { kind: 'photo', id: 'img-0029', x: 60, y: 17, w: 11, h: 15, frame: 'ebony', mat: 'ivory' },
  { kind: 'photo', id: 'mood-1789933540577', x: 60, y: 34, w: 11, h: 13, frame: 'gilt' },
  { kind: 'photo', id: 'img-8182', x: 73, y: 17, w: 9, h: 9, frame: 'ornate', focus: 'center 38%' },
  { kind: 'arch', x: 73, y: 28, w: 8, h: 14 },
  { kind: 'photo', id: 'img-7847', x: 73, y: 44, w: 9, h: 7.5, frame: 'iron', focus: 'center 58%' },
  { kind: 'photo', id: 'img-9427', x: 84, y: 2, w: 13, h: 18, frame: 'ebony', mat: 'black' },
  { kind: 'photo', id: 'img-7974', x: 84, y: 22, w: 13, h: 17, frame: 'ornate', mat: 'ivory' },
  { kind: 'photo', id: 'mood-1789933170499', x: 84, y: 41, w: 13, h: 10.5, frame: 'mahogany', focus: 'center 62%' },
  { kind: 'medallion', x: 88, y: 52.3, w: 5, h: 9.25 },
]

const gold = 'linear-gradient(135deg, #e6c676, #8c6623 38%, #d9b25a 62%, #6e4f17)'
const mouldings: Record<Moulding, { face: string; width: number; rim?: string }> = {
  // Carved gilt: a fine diagonal texture over the gold.
  ornate: { face: `repeating-linear-gradient(45deg, rgba(40,25,5,0.28) 0 0.1cqw, transparent 0.1cqw 0.28cqw), ${gold}`, width: 0.85, rim: '#3a2a10' },
  gilt: { face: gold, width: 0.35 },
  ebony: { face: 'linear-gradient(135deg, #2c2628, #0b090a 45%, #1d1819)', width: 0.6, rim: '#a8843a' },
  mahogany: { face: 'linear-gradient(135deg, #5a2219, #2a0d09 50%, #4a1a13)', width: 0.6, rim: '#120604' },
  iron: { face: 'linear-gradient(135deg, #4a4850, #141316 50%, #34323a)', width: 0.4 },
}
const mats: Record<Mat, string> = { ivory: '#e4d9c1', black: '#0f0d0f' }

const u = (n: number) => `calc(${n} * var(--s) * 1cqw)`
const hung = '0 0.7cqw 1.4cqw rgba(0,0,0,0.6), 0 0.15cqw 0.3cqw rgba(0,0,0,0.55)'

// A low-contrast damask repeat for the wallpaper.
const damask = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='120' viewBox='0 0 80 120'><g fill='none' stroke='#b48ca0' stroke-width='1.1' opacity='0.11'><path d='M40 8c10 14 22 18 22 34s-12 24-22 34c-10-10-22-18-22-34s12-20 22-34z'/><path d='M40 26c5 7 10 10 10 17s-5 12-10 16c-5-4-10-9-10-16s5-10 10-17z'/><path d='M40 76v14M33 98c4-5 10-5 14 0M40 90c-6 8-14 10-20 8M40 90c6 8 14 10 20 8'/><path d='M0 60c8-6 8-18 0-24M80 60c-8-6-8-18 0-24M0 0c6 4 6 10 0 14M80 0c-6 4-6 10 0 14M0 106c6 4 6 10 0 14M80 106c-6 4-6 10 0 14'/></g></svg>`,
)}")`

function Frame({ frame, mat, children }: { frame?: Moulding; mat?: Mat; children: ReactNode }) {
  if (!frame) return <>{children}</>
  const m = mouldings[frame]
  return (
    <span
      className="flex h-full w-full"
      style={{ padding: u(m.width), background: m.face, boxShadow: m.rim ? `inset 0 0 0 0.1cqw ${m.rim}, ${hung}` : hung }}
    >
      <span
        className="flex min-h-0 min-w-0 flex-1"
        style={{
          background: mat ? mats[mat] : '#000',
          padding: mat ? u(1.3) : 0,
          boxShadow: 'inset 0 0.1cqw 0.35cqw rgba(0,0,0,0.6)',
        }}
      >
        <span className="relative min-h-0 min-w-0 flex-1 overflow-hidden">{children}</span>
      </span>
    </span>
  )
}

function Botanical() {
  // A pressed fern on black paper, like a cyanotype negative.
  const fronds = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12
    return { x: 50 + Math.sin(t * 1.6) * 4, y: 88 - t * 72, len: 22 * (1 - t * 0.75), side: i % 2 ? 1 : -1, t }
  })
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full bg-[#141214]">
      <path d="M50 96 Q52 60 50 50 T54 12" fill="none" stroke="#cfc6ad" strokeWidth="0.8" />
      {fronds.map((f, i) => (
        <path
          key={i}
          d={`M${f.x} ${f.y} q${f.side * f.len * 0.5} ${-f.len * 0.35} ${f.side * f.len} ${-f.len * 0.2} q${-f.side * f.len * 0.55} ${f.len * 0.3} ${-f.side * f.len} ${f.len * 0.2}`}
          fill="#d8cfb6"
          opacity={0.85 - f.t * 0.3}
        />
      ))}
    </svg>
  )
}

function VintageMap() {
  const { paths, graticule } = useMemo(() => {
    const { countries } = loadGeo()
    const projection = d3.geoNaturalEarth1().fitExtent([[4, 6], [136, 94]], { type: 'Sphere' })
    const path = d3.geoPath(projection)
    return {
      paths: countries.map((c) => ({ id: c.id, d: path(c.feature) ?? '', been: c.id in travel.been })),
      graticule: path(d3.geoGraticule10()) ?? '',
    }
  }, [])
  return (
    <svg viewBox="0 0 140 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id="parchment" cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor="#d9c69c" />
          <stop offset="100%" stopColor="#8f7448" />
        </radialGradient>
      </defs>
      <rect width="140" height="100" fill="url(#parchment)" />
      <path d={graticule} fill="none" stroke="#5e4728" strokeWidth="0.15" opacity="0.55" />
      {paths.map((p) => (
        <path key={p.id} d={p.d} fill={p.been ? '#6b1e23' : '#b39a6b'} stroke="#4a3418" strokeWidth="0.12" />
      ))}
    </svg>
  )
}

const smoke = 'linear-gradient(125deg, #6a686e 0%, #2b2a2f 32%, #8a878e 44%, #36353a 52%, #1c1b1f 75%, #4a484e 100%)'

// Every so often a friend drifts into a mirror, lingers, and fades: full-length shadows in the
// spirit of a stop-motion fairy tale (spindly limbs, long necks, wasp waists, a crooked hat).
// Each is drawn in a 60 x 100 box with its feet at the bottom.
const ghosts: ReactNode[] = [
  // Evangeline: a swirling beehive, a tilted head, a hand to her heart, a trailing tattered gown.
  <>
    <path d="M24 8 C10 18 8 40 14 62 C16 46 18 28 26 14Z" opacity="0.4" />
    <path d="M23 17 C19 9 23 1 31 1.5 C38 2 41 8 37.5 15Z" />
    <path d="M37 6 c4 -2.5 6.5 2 3.2 4.2 c-1.6 1 -2.8 -0.4 -1.8 -1.4" fill="none" strokeWidth="0.9" strokeLinecap="round" />
    <ellipse cx="30.5" cy="19" rx="5.2" ry="6.2" transform="rotate(12 30.5 19)" />
    <path d="M29.5 24.5 C29.8 27 30 30 29.8 33 L31.6 33 C31.4 30 31.6 27 31.8 24.5Z" />
    <path d="M24 34 C27 32 34 32 37 34 C35.5 38 34 43 33.8 49 L27.6 49 C27.8 43 26 38 24 34Z" />
    <path d="M27.6 49 C24 60 18 76 13 95 C17 93 19 97 23 95 C26 98 29 95 32 97.5 C35 95 38 98 41 95.5 C45 97 50 96 56 98 C50 90 44 74 33.8 49Z" />
    <path d="M25 35 C21 40 22 45 27 44.5 M27 44.5 l1.6 -1.2 M27 44.5 l1.8 0.3" fill="none" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M36.5 35 C40 41 41 48 39.5 56 M39.5 56 l-1 3 M39.5 56 l0.4 3.2 M39.5 56 l1.5 2.6" fill="none" strokeWidth="1.2" strokeLinecap="round" />
  </>,
  // Bartholomew: hunched in profile, long nose, a bent top hat, knobbly knees and a cane.
  <>
    <path d="M26 2 C25 6 25 12 25.5 17 L36 17.5 C35.5 12 37 6 39.5 1.5Z" />
    <ellipse cx="31" cy="18" rx="9" ry="1.5" transform="rotate(-4 31 18)" />
    <path d="M27 19 C24 20 23.5 23 24 25 L18.5 27.2 C21 28.2 23 28.6 24.5 28.6 C25 31 27 32 30 31.6 C34 31 36 28 35.5 24 C35 21 33 19 30 19Z" />
    <rect x="29.3" y="31" width="1.8" height="3.2" />
    <path d="M26 34 C29 33 34 33 37 35 C38 42 37 50 35.5 57 L39 70 L34.5 63 L31 58 L27.5 62 C27 53 25.5 44 26 34Z" />
    <path d="M29 58 C28 70 31 78 28.5 95 M33 58 C35 68 33 80 35 95" fill="none" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M28.5 95 C25 95 20 96 18 94.5 C20 97.5 26 98 29.5 97.5Z M35 95 C38 95 42 96 44 95 C43 97.5 38 98 34.5 97.5Z" />
    <path d="M27 37 C22 44 20 50 19.5 56" fill="none" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M19.5 56 L18 97 M19.5 56 c-0.5 -3 2.5 -4 3.5 -2" fill="none" strokeWidth="1.1" strokeLinecap="round" />
    <path d="M36 37 C39 45 38 52 35 55" fill="none" strokeWidth="1.4" strokeLinecap="round" />
  </>,
  // Wren: a heavy bob with a bow at the side, puffed sleeves, clutching a little doll.
  <>
    <path d="M21 40 C20 30 26 25 31 25 C37 25 41 30 40.5 40 C40 46 38 48 36 48 L25 48 C23 48 21 46 21 40Z" />
    <path d="M38.5 29 l5 -3 l-0.8 5.5Z M38.5 29 l1 -5.5 l3.6 4Z" />
    <rect x="29.2" y="47.5" width="1.6" height="3.5" />
    <circle cx="25.5" cy="53" r="2.6" />
    <circle cx="34.5" cy="53" r="2.6" />
    <path d="M26 52 C25 60 22 66 20 73 C26 75 34 75 40 73 C38 66 35 60 34 52Z" />
    <path d="M27.5 74 C27 82 27.5 88 27 95 M32.5 74 C33 82 32.5 88 33 95" fill="none" strokeWidth="1.4" strokeLinecap="round" />
    <ellipse cx="26" cy="95.6" rx="2.3" ry="1.1" />
    <ellipse cx="34" cy="95.6" rx="2.3" ry="1.1" />
    <path d="M25.5 55 C22 60 21.5 64 24.5 66.5 M34.5 55 C38 61 38 66 37 71" fill="none" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="22.5" cy="64" r="2.2" />
    <path d="M21 66 L24 66 L25.3 72 L19.7 72Z M20.6 72 l-0.6 3 M24.4 72 l0.6 3" strokeWidth="0.8" strokeLinecap="round" />
  </>,
  // Mister Inkwell: all ears, elbows and a curling tail.
  <>
    <path d="M25 55 C23.5 51 22.5 46 23 42 C25.5 45 27.5 48.5 28.5 51.5Z M35 55 C36.5 51 37.5 46 37 42 C34.5 45 32.5 48.5 31.5 51.5Z" />
    <ellipse cx="30" cy="57.5" rx="6.2" ry="5.6" />
    <path d="M30 62.5 Q20.5 76 23.5 96.5 L36.5 96.5 Q39.5 76 30 62.5Z" />
    <path d="M36 95 Q49 94 47.5 81 Q46 72 51.5 70 Q55 70 54 74 Q53 76.5 50.8 75.2" fill="none" strokeWidth="1.6" strokeLinecap="round" />
  </>,
]

/** Who each friend was, carved on the tombstone that shows when you hover over them. */
const bios = [
  { name: 'Evangeline Ashcombe', dates: '1841 – 1889', epitaph: 'Kept the finest salon on Washington Square. Still waiting on her last guest.' },
  { name: 'Bartholomew Crane', dates: '1832 – 1901', epitaph: 'Cartographer and incurable flâneur. Mapped every street in Manhattan but the one home.' },
  { name: 'Wren Hollis', dates: '1879 – 1888', epitaph: 'Collector of ribbons, buttons and secrets. Hid something in this wall. Won’t say where.' },
  { name: 'Mister Inkwell', dates: '? – 1894', epitaph: 'Mouser of the Astor Library. Spent eight lives on mischief and kept one for this mirror.' },
]

// Whether any mirror has a visitor right now, shared so the medallion can sense it.
const presence = { count: 0, subs: new Set<() => void>() }
const sense = (delta: number) => {
  presence.count += delta
  presence.subs.forEach((f) => f())
}
const useSomethingNearby = () =>
  useSyncExternalStore(
    (cb) => {
      presence.subs.add(cb)
      return () => presence.subs.delete(cb)
    },
    () => presence.count > 0,
  )

/** A School of the Wolf medallion on a nail. Like Geralt's, it hums when something's nearby. */
function Medallion() {
  const humming = useSomethingNearby()
  const reduce = useReducedMotion()
  const [on, setOn] = useState(false)
  const id = useId()
  return (
    <span
      className="relative block h-full w-full cursor-help"
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onClick={() => setOn((v) => !v)}
    >
      <motion.svg
        viewBox="0 0 40 74"
        className="absolute inset-0 h-full w-full overflow-visible"
        style={{ transformOrigin: '50% 3%', filter: 'drop-shadow(0 0.4cqw 0.5cqw rgba(0,0,0,0.7))' }}
        animate={humming && !reduce ? { rotate: [0, -2.5, 2.5, -2, 2, 0], x: [0, -0.4, 0.4, -0.3, 0.3, 0] } : { rotate: 0, x: 0 }}
        transition={humming ? { duration: 0.35, repeat: Infinity, repeatDelay: 0.15 } : { duration: 0.4 }}
      >
        <defs>
          <radialGradient id={`${id}s`} cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#e9ecef" />
            <stop offset="0.5" stopColor="#9aa0a7" />
            <stop offset="1" stopColor="#4c5056" />
          </radialGradient>
        </defs>
        {/* Nail and chain. */}
        <circle cx="20" cy="2" r="1.6" fill="#2a2420" />
        <path d="M20 2 L20 34" stroke="#a7acb2" strokeWidth="1.3" strokeDasharray="1.6 1.1" />
        {/* The disc, and the wolf's head snarling out of it. */}
        <circle cx="20" cy="53" r="18" fill={`url(#${id}s)`} />
        <circle cx="20" cy="53" r="15.5" fill="none" stroke="#5c6168" strokeWidth="0.8" />
        <path d="M20 70 L13.5 61 L10 47 L14.5 50.5 L16 42 L20 47.5 L24 42 L25.5 50.5 L30 47 L26.5 61 Z" fill="#6b7077" stroke="#3d4146" strokeWidth="0.6" strokeLinejoin="round" />
        <path d="M14 53.5 l4 1.6 M26 53.5 l-4 1.6" stroke="#1a1c1f" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M16.5 61 L20 69 L23.5 61 Q20 63.5 16.5 61Z" fill="#2a2d31" />
        <path d="M17.5 62.2 l0.8 2.2 M22.5 62.2 l-0.8 2.2" stroke="#e9ecef" strokeWidth="0.6" strokeLinecap="round" />
        <path d="M11 45 Q13 39 19 37" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" fill="none" />
      </motion.svg>
      {on && (
        <span className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] right-0 z-30 block w-max max-w-[15rem] rounded-lg bg-[#0d0b0d]/95 px-3 py-2 text-left shadow-xl ring-1 ring-[#9aa0a7]/50">
          <span className="block text-sm italic leading-tight text-[#e6e8ea]" style={{ fontFamily: "'IM Fell English', serif" }}>
            {humming ? 'Medallion’s humming. Place of power, gotta be.' : 'Wind’s howling.'}
          </span>
          <span className="mt-0.5 block text-xs text-[#9aa0a7]">Geralt of Rivia</span>
        </span>
      )}
    </span>
  )
}

function useHaunting(offset: number, held: { current: boolean }) {
  const [who, setWho] = useState<number | null>(null)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const visit = (first: boolean) => {
      t = setTimeout(() => {
        setWho(Math.floor(Math.random() * ghosts.length))
        // Lingers while someone is reading the tombstone.
        const leave = () => {
          if (held.current) {
            t = setTimeout(leave, 600)
            return
          }
          setWho(null)
          visit(false)
        }
        t = setTimeout(leave, 4200)
      }, (first ? 2500 + offset : 9000 + Math.random() * 12000))
    }
    visit(true)
    return () => clearTimeout(t)
  }, [offset, held])
  // Let the medallion know while a visitor is here.
  useEffect(() => {
    if (who === null) return
    sense(1)
    return () => sense(-1)
  }, [who])
  return who
}

function Ghost({ who, box }: { who: number | null; box: string }) {
  const id = useId()
  const reduce = useReducedMotion()
  const [x, y, width, height] = box.split(' ').map(Number)
  return (
    <AnimatePresence>
      {who !== null && (
        <motion.g
          key={who}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.75, 0.9] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
        >
          <defs>
            {/* A soft pale rim so the shadow reads against dark glass. */}
            <filter id={`${id}f`} x="-40%" y="-20%" width="180%" height="140%">
              <feMorphology in="SourceAlpha" operator="dilate" radius="0.5" result="grown" />
              <feGaussianBlur in="grown" stdDeviation="1.3" result="halo" />
              <feFlood floodColor="#cbd8e6" floodOpacity="0.5" />
              <feComposite in2="halo" operator="in" result="rim" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" result="soft" />
              <feMerge>
                <feMergeNode in="rim" />
                <feMergeNode in="soft" />
              </feMerge>
            </filter>
          </defs>
          <svg viewBox="0 0 60 100" x={x} y={y} width={width} height={height} overflow="visible">
            <motion.g
              fill="#060508"
              stroke="#060508"
              filter={`url(#${id}f)`}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
              animate={reduce ? undefined : { rotate: [-1.6, 1.6, -1.6], y: [0, -0.8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {ghosts[who]}
            </motion.g>
          </svg>
        </motion.g>
      )}
    </AnimatePresence>
  )
}

function Tombstone({ who }: { who: number }) {
  const b = bios[who]
  return (
    <span className="pointer-events-none absolute bottom-[calc(100%+0.75rem)] left-1/2 z-30 block -translate-x-1/2">
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="block w-[12.5rem] rounded-b-md rounded-t-[6.25rem] px-5 pb-4 pt-9 text-center"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, #8d8a90, #5d5a60 55%, #3f3c42)',
          boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.15), inset 0 -6px 12px rgba(0,0,0,0.35), 0 14px 28px rgba(0,0,0,0.6)',
          color: '#1f1c21',
          textShadow: '0 1px 0 rgba(255,255,255,0.18)',
        }}
      >
        <span className="block text-[0.6rem] uppercase tracking-[0.3em]">Here lingers</span>
        <span className="mt-1.5 block font-display text-[1.05rem] leading-tight">{b.name}</span>
        <span className="mt-0.5 block text-[0.7rem] tracking-widest">{b.dates}</span>
        <span className="mx-auto my-2 block h-px w-10 bg-[#1f1c21]/40" />
        <span className="block text-[0.8rem] italic leading-snug" style={{ fontFamily: "'IM Fell English', serif" }}>{b.epitaph}</span>
      </motion.span>
    </span>
  )
}

/** A mirror that's sometimes visited. Hover (or tap) a visitor to read their tombstone. */
function Haunted({ offset, children }: { offset: number; children: (who: number | null) => ReactNode }) {
  const held = useRef(false)
  const [reading, setReading] = useState(false)
  const who = useHaunting(offset, held)
  const read = (on: boolean) => {
    held.current = on
    setReading(on)
  }
  return (
    <span
      className="relative block h-full w-full"
      style={{ cursor: who !== null ? 'help' : undefined }}
      onMouseEnter={() => read(true)}
      onMouseLeave={() => read(false)}
      onClick={() => read(!reading)}
    >
      {children(who)}
      <AnimatePresence>{reading && who !== null && <Tombstone key={who} who={who} />}</AnimatePresence>
    </span>
  )
}

function Mirror({ who }: { who: number | null }) {
  return (
    <span className="block h-full w-full rounded-full" style={{ padding: u(0.75), background: mouldings.ornate.face, boxShadow: hung }}>
      <span className="relative block h-full w-full overflow-hidden rounded-full" style={{ background: smoke, boxShadow: 'inset 0 0 0.8cqw rgba(0,0,0,0.6)' }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <Ghost who={who} box="20 6 60 94" />
        </svg>
      </span>
    </span>
  )
}

function GothicArch({ who }: { who: number | null }) {
  // A pointed-arch mirror in bronze with a gilt inner line.
  const id = useId()
  return (
    <svg viewBox="0 0 80 140" className="absolute inset-0 h-full w-full overflow-visible" style={{ filter: 'drop-shadow(0 0.5cqw 0.8cqw rgba(0,0,0,0.6))' }}>
      <defs>
        <linearGradient id="bronze" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6b5530" />
          <stop offset="0.45" stopColor="#2a2014" />
          <stop offset="0.7" stopColor="#5c4728" />
          <stop offset="1" stopColor="#1c150c" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6a686e" />
          <stop offset="0.35" stopColor="#2b2a2f" />
          <stop offset="0.46" stopColor="#85828a" />
          <stop offset="0.55" stopColor="#36353a" />
          <stop offset="1" stopColor="#1c1b1f" />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <path d="M7 133 V63 Q7 27 40 9 Q73 27 73 63 V133 Z" />
        </clipPath>
      </defs>
      <path d="M0 140 V62 Q0 20 40 0 Q80 20 80 62 V140 Z" fill="url(#bronze)" />
      <path d="M7 133 V63 Q7 27 40 9 Q73 27 73 63 V133 Z" fill="url(#glass)" />
      <g clipPath={`url(#${id}c)`}>
        <Ghost who={who} box="10 22 60 110" />
      </g>
      <path d="M7 133 V63 Q7 27 40 9 Q73 27 73 63 V133 Z" fill="none" stroke="#b8923f" strokeWidth="1.2" />
    </svg>
  )
}

function Flame({ size = 1 }: { size?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.span
      className="absolute bottom-full left-1/2 block -translate-x-1/2 rounded-[50%_50%_50%_50%/60%_60%_40%_40%]"
      style={{
        width: `${0.9 * size}cqw`,
        height: `${1.9 * size}cqw`,
        background: 'radial-gradient(ellipse at 50% 70%, #fff6d8 0%, #ffd27a 35%, #ff9a3c 70%, rgba(255,120,40,0) 100%)',
        filter: 'blur(0.05cqw)',
        transformOrigin: '50% 100%',
      }}
      animate={reduce ? undefined : { scaleY: [1, 1.12, 0.94, 1.06, 1], scaleX: [1, 0.94, 1.04, 0.97, 1], opacity: [0.95, 1, 0.88, 1, 0.95] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

function Sconce() {
  return (
    <span className="relative block h-full w-full">
      {/* Candlelight on the wallpaper; closest-side keeps it soft right to the edge. */}
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-[-20%] block aspect-square w-[900%] -translate-x-1/2" style={{ background: 'radial-gradient(circle closest-side, rgba(255,170,80,0.22), rgba(255,140,60,0.06) 55%, transparent)' }} />
      {/* Back plate. */}
      <span className="absolute left-1/2 top-[38%] block h-[46%] w-[70%] -translate-x-1/2 rounded-full" style={{ background: gold, boxShadow: hung }} />
      {/* Arm and drip cup. */}
      <span className="absolute left-1/2 top-[30%] block h-[3%] w-full -translate-x-1/2 rounded-full" style={{ background: gold }} />
      {/* Candle. */}
      <span className="absolute left-1/2 top-[6%] block h-[24%] w-[46%] -translate-x-1/2 rounded-t-[0.2cqw]" style={{ background: 'linear-gradient(90deg, #cfc4ad, #f3ead6 45%, #bfb39a)' }}>
        <Flame />
      </span>
    </span>
  )
}

/** The full title on the spine, shrunk (and wrapped onto a second line if needed) until it fits. */
function SpineTitle({ title, font, color }: { title: string; font: string; color: string }) {
  const box = useRef<HTMLSpanElement>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState(1.05)
  useLayoutEffect(() => {
    const el = ref.current
    const frame = box.current
    if (!el || !frame) return
    const overflows = () => el.scrollHeight > frame.clientHeight + 0.5 || el.scrollWidth > frame.clientWidth + 0.5
    // Largest size (in cqw) that fits. Scanned down rather than bisected, because wrapping
    // onto a second line makes "fits" non-monotonic.
    const fit = () => {
      let s = 1.05
      el.style.fontSize = `${s}cqw`
      while (s > 0.3 && overflows()) {
        s *= 0.97
        el.style.fontSize = `${s}cqw`
      }
      setSize(s)
    }
    fit()
    // Refit once the spine's font arrives, and if the shelf changes size.
    const fonts = document.fonts
    fonts?.addEventListener('loadingdone', fit)
    fonts?.load(`16px ${font}`, title).then(fit, () => {})
    const ro = new ResizeObserver(fit)
    ro.observe(frame)
    return () => {
      fonts?.removeEventListener('loadingdone', fit)
      ro.disconnect()
    }
  }, [title, font])
  return (
    // Vertical text sizes to its content, so it sits in a fixed box it must fit inside.
    <span ref={box} className="absolute inset-x-[10%] top-[11%] bottom-[11%] flex items-center justify-center overflow-hidden">
      <span
        ref={ref}
        className="block max-h-full max-w-full text-center leading-[1.05]"
        style={{ writingMode: 'vertical-rl', color, fontFamily: font, fontSize: `${size}cqw`, letterSpacing: '0.03em', textWrap: 'balance' }}
      >
        {title}
      </span>
    </span>
  )
}

function Bookshelf() {
  const [picked, setPicked] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const active = hovered ?? picked
  return (
    <div className="absolute bottom-full left-[7.5%] flex items-end gap-[0.18cqw]" onMouseLeave={() => setHovered(null)}>
      {bookshelf.map((b, i) => {
        const on = active === i
        const align = i < 3 ? 'left-0' : i > bookshelf.length - 4 ? 'right-0' : 'left-1/2 -translate-x-1/2'
        return (
          <button
            key={b.title}
            type="button"
            aria-label={`${b.title} by ${b.author}`}
            aria-pressed={picked === i}
            onMouseEnter={() => setHovered(i)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            onClick={() => setPicked((p) => (p === i ? null : i))}
            className="relative block origin-bottom rounded-t-[0.2cqw] transition-transform duration-300 ease-out focus:outline-none"
            style={{
              width: `${2.7 + (i % 3) * 0.25}cqw`,
              height: `${11 + ((i * 7) % 5) * 0.5}cqw`,
              background: `linear-gradient(90deg, rgba(0,0,0,0.38), transparent 18%, rgba(255,255,255,0.09) 45%, transparent 72%, rgba(0,0,0,0.38)), ${b.cloth}`,
              transform: on ? 'translateY(-2.2cqw) scale(1.28)' : 'none',
              zIndex: on ? 20 : 1,
              boxShadow: on ? '0 1cqw 1.6cqw rgba(0,0,0,0.7)' : 'inset -0.2cqw 0 0 rgba(0,0,0,0.25)',
            }}
          >
            {/* Foil bands top and bottom. */}
            <span className="absolute inset-x-0 top-[6%] block h-[0.18cqw]" style={{ background: b.foil, opacity: 0.8 }} />
            <span className="absolute inset-x-0 bottom-[6%] block h-[0.18cqw]" style={{ background: b.foil, opacity: 0.8 }} />
            <SpineTitle title={b.title} font={b.font} color={b.foil} />
            {on && (
              <span className={`pointer-events-none absolute bottom-[calc(100%+1.2cqw)] ${align} block w-max max-w-[15rem] rounded-lg bg-[#0d0b0d]/95 px-3 py-2 text-left shadow-xl ring-1 ring-[#b8923f]/50`}>
                <span className="block font-display text-sm leading-tight text-[#efe2c2]">{b.title}</span>
                <span className="mt-0.5 block text-xs text-[#b9a98a]">{b.author}</span>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** The rose under glass, and the note that came with it. */
function Rose() {
  const [on, setOn] = useState(false)
  return (
    <button
      type="button"
      aria-label="A red rose under a bell jar, with an unsigned note."
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      onClick={() => setOn((v) => !v)}
      className="absolute bottom-full left-[73%] block w-[7cqw] focus:outline-none"
      style={{ height: '12cqw' }}
    >
        <svg viewBox="0 0 40 70" className="absolute inset-0 h-full w-full transition-[filter] duration-500" style={{ filter: on ? "drop-shadow(0 0 0.8cqw rgba(200,40,60,0.55))" : undefined }}>
          <path d="M20 60 C19 50 21 42 20 34" stroke="#2f3a24" strokeWidth="1.2" fill="none" />
          <path d="M20 46 q-6 -3 -8 -8 q6 1 8 6" fill="#34422a" />
          <circle cx="20" cy="31" r="5.2" fill="#6b1420" />
          <path d="M15.5 30 q4.5 -6 9 0 q-4.5 3 -9 0z" fill="#8a1d2b" />
          <path d="M17.5 29.5 q2.5 -3 5 0" stroke="#3d0a12" strokeWidth="0.8" fill="none" />
          <path d="M6 62 V22 Q6 4 20 4 Q34 4 34 22 V62" fill="rgba(210,225,235,0.1)" stroke="rgba(230,240,245,0.45)" strokeWidth="0.8" />
          <path d="M10 22 Q10 10 17 7" stroke="rgba(255,255,255,0.55)" strokeWidth="1" fill="none" />
          <circle cx="20" cy="2.6" r="1.6" fill="rgba(230,240,245,0.5)" />
          <rect x="3" y="61" width="34" height="5" rx="1" fill="#2a1a12" />
          <rect x="3" y="61" width="34" height="1.2" fill="#4a3022" />
        </svg>
      {on && (
        <span
          className="pointer-events-none absolute bottom-[calc(100%+0.6rem)] right-0 z-30 block w-[16rem] -rotate-1 rounded-sm px-4 py-3 text-left shadow-xl"
          style={{ background: 'radial-gradient(ellipse at 30% 20%, #efe3c4, #d7c398 70%, #bfa877)', color: '#3a2414', fontFamily: "'IM Fell English', serif" }}
        >
          <span className="block text-[0.6rem] uppercase tracking-[0.3em] opacity-70">Found under the jar</span>
          <span className="mt-1.5 block text-[0.85rem] italic leading-snug">
            Left on this credenza one winter with an unsigned card: <em className="not-italic">for the one who stays</em>. Evangeline swore it was meant for her. It hasn’t lost a single petal since. They say it will the day true love finally walks through the door.
          </span>
        </span>
      )}
    </button>
  )
}

/** Yorick, keeping the books company. */
function Skull() {
  const [on, setOn] = useState(false)
  const id = useId()
  return (
    <button
      type="button"
      aria-label="A skull. Alas, poor Yorick! I knew him, Horatio."
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      onClick={() => setOn((v) => !v)}
      className="absolute bottom-full left-[58%] block w-[7.5cqw] origin-bottom transition-transform duration-300 hover:-rotate-3 focus:outline-none"
      style={{ height: '7cqw' }}
    >
      <svg viewBox="0 0 60 56" className="absolute inset-0 h-full w-full overflow-visible" style={{ filter: 'drop-shadow(0 0.4cqw 0.5cqw rgba(0,0,0,0.6))' }}>
        <defs>
          <radialGradient id={`${id}bone`} cx="38%" cy="28%" r="80%">
            <stop offset="0" stopColor="#efe4c8" />
            <stop offset="0.55" stopColor="#c9b88f" />
            <stop offset="1" stopColor="#7d6c4c" />
          </radialGradient>
        </defs>
        {/* Jaw, then cranium over it. */}
        <path d="M14 45 C15 52 21 55.5 30 55.5 C39 55.5 45 52 46 45 Z" fill="#a8966d" />
        <path d="M30 2 C13 2 4 13 4 26 C4 33 7 37 10 40 L11 45 C11 47.5 13 48.5 15 48.5 L45 48.5 C47 48.5 49 47.5 49 45 L50 40 C53 37 56 33 56 26 C56 13 47 2 30 2Z" fill={`url(#${id}bone)`} />
        <path d="M8 22 C10 13 17 7 26 5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none" />
        <path d="M41 9 l-3 6 l2 4 l-3 5" stroke="#6e5d40" strokeWidth="0.6" fill="none" opacity="0.7" />
        {/* Sockets, nose, cheekbones. */}
        <path d="M12 26 C12 21 17 19 22 20 C26 21 27 25 26 29 C25 33 20 34 16 33 C13 32 12 29 12 26Z" fill="#241812" />
        <path d="M48 26 C48 21 43 19 38 20 C34 21 33 25 34 29 C35 33 40 34 44 33 C47 32 48 29 48 26Z" fill="#241812" />
        <path d="M30 31 L27 38.5 C28 39.5 29 39.5 30 38.5 C31 39.5 32 39.5 33 38.5Z" fill="#2c1e16" />
        <path d="M9 34 C12 38 17 39 21 38 M51 34 C48 38 43 39 39 38" stroke="#8a7753" strokeWidth="0.8" fill="none" />
        {/* Teeth. */}
        <rect x="17" y="42" width="26" height="6" rx="1" fill="#e2d6b6" />
        {[20.5, 24, 27.5, 31, 34.5, 38, 41].map((x) => (
          <line key={x} x1={x} y1="42" x2={x} y2="48" stroke="#6e5d40" strokeWidth="0.55" />
        ))}
        <line x1="17" y1="45" x2="43" y2="45" stroke="#6e5d40" strokeWidth="0.5" />
      </svg>
      {on && (
        <span className="pointer-events-none absolute bottom-[calc(100%+0.6rem)] left-1/2 z-30 block w-max max-w-[15rem] -translate-x-1/2 rounded-lg bg-[#0d0b0d]/95 px-3 py-2 text-left shadow-xl ring-1 ring-[#b8923f]/50">
          <span className="block text-sm italic leading-tight text-[#efe2c2]" style={{ fontFamily: "'IM Fell English', serif" }}>Alas, poor Yorick! I knew him, Horatio.</span>
          <span className="mt-0.5 block text-xs text-[#b9a98a]">Hamlet, Act V</span>
        </span>
      )}
    </button>
  )
}

function Credenza() {
  return (
    // Its own container, so everything on it is sized as a share of the credenza's width.
    <div className="@container relative w-full" style={{ aspectRatio: '64 / 13' }}>
      {/* A brass candlestick. */}
      <div className="absolute bottom-full left-[3%] w-[3.2cqw]" style={{ height: '10cqw' }}>
        <span className="absolute bottom-0 left-0 block h-[10%] w-full rounded-[0.3cqw]" style={{ background: gold }} />
        <span className="absolute bottom-[8%] left-1/2 block h-[52%] w-[26%] -translate-x-1/2" style={{ background: gold }} />
        <span className="absolute bottom-[58%] left-1/2 block h-[6%] w-[70%] -translate-x-1/2 rounded-full" style={{ background: gold }} />
        <span className="absolute bottom-[63%] left-1/2 block h-[30%] w-[38%] -translate-x-1/2 rounded-t-[0.15cqw]" style={{ background: 'linear-gradient(90deg, #cfc4ad, #f3ead6 45%, #bfb39a)' }}>
          <Flame size={1.2} />
        </span>
      </div>
      <Bookshelf />
      <Skull />
      <Rose />
      {/* The credenza: ebony with pointed-arch panels and brass pulls. */}
      <div className="absolute inset-0 rounded-t-[0.4cqw] bg-[#130f10] shadow-[0_-0.3cqw_1cqw_rgba(0,0,0,0.5)]">
        <div className="absolute -inset-x-[0.8cqw] top-0 h-[1.5cqw] rounded-t-[0.4cqw]" style={{ background: 'linear-gradient(180deg, #3a2b26, #1b1413)' }} />
        <div className="absolute inset-x-[2.5%] bottom-0 top-[2.8cqw] grid grid-cols-3 gap-[1.6cqw]">
          {[0, 1, 2].map((i) => (
            <svg key={i} viewBox="0 0 100 60" preserveAspectRatio="none" className="h-full w-full">
              <rect width="100" height="60" fill="#1c1517" />
              <path d="M14 60 V28 Q14 10 50 4 Q86 10 86 28 V60" fill="#160f11" stroke="#3d2c25" strokeWidth="1.4" />
              <path d="M22 60 V30 Q22 16 50 11 Q78 16 78 30 V60" fill="none" stroke="#5a4130" strokeWidth="0.6" opacity="0.7" />
              <circle cx="50" cy="24" r="2.6" fill="#b8923f" />
            </svg>
          ))}
        </div>
      </div>
    </div>
  )
}

export function GalleryWall({ onOpen }: { onOpen: (index: number) => void }) {
  return (
    <div className="@container mt-12">
      <div
        className="relative overflow-hidden rounded-[2rem] ring-1 ring-black/60 [--s:2.25] md:[--s:1] md:h-[calc(64*1cqw)]"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 35%, rgba(120,60,70,0.18), transparent 75%), radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.6)), ${damask}, linear-gradient(180deg, #221a1f, #171215 70%, #0f0b0d)`,
          backgroundSize: 'auto, auto, 6cqw 9cqw, auto',
        }}
      >
        {/* Crown moulding. */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-[1.2cqw] md:h-[1.1cqw]" style={{ background: 'linear-gradient(180deg, #2f2427, #120d0f)', boxShadow: '0 0.3cqw 0.6cqw rgba(0,0,0,0.5)' }} />
        <div className="flex flex-wrap items-center justify-center gap-[5cqw] px-[4cqw] pb-[38cqw] pt-[8cqw] md:block md:p-0">
          {pieces.map((p, n) => {
            const box: CSSProperties = {
              ['--x' as string]: p.x,
              ['--y' as string]: p.y,
              width: u(p.w),
              height: u(p.h),
            }
            const place = 'relative shrink-0 md:absolute md:left-[calc(var(--x)*1cqw)] md:top-[calc(var(--y)*1cqw)]'
            const anim = {
              initial: { opacity: 0, y: 14 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, margin: '-5% 0px' },
              transition: { delay: (n % 5) * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
            }
            if (p.kind === 'photo') {
              const index = photos.findIndex((ph) => ph.id === p.id)
              const ph = photos[index]
              if (!ph) return null
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  {...anim}
                  onClick={() => onOpen(index)}
                  aria-label={`Open photo ${index + 1} of ${photos.length}`}
                  className={`${place} group block transition-transform duration-500 hover:-translate-y-[0.3cqw] focus:outline-none focus-visible:ring-4 focus-visible:ring-marigold`}
                  style={box}
                >
                  <Frame frame={p.frame} mat={p.mat}>
                    <img
                      src={thumbSrc(ph)}
                      alt={ph.alt ?? ''}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover brightness-[0.92] transition duration-500 group-hover:brightness-105"
                      style={{ objectPosition: p.focus ?? 'center' }}
                    />
                  </Frame>
                </motion.button>
              )
            }
            return (
              <motion.div key={`${p.kind}-${n}`} aria-hidden {...anim} className={`${place} ${p.kind === 'mirror' || p.kind === 'arch' || p.kind === 'medallion' ? 'z-20' : ''}`} style={box}>
                {p.kind === 'botanical' && <Frame frame={p.frame} mat={p.mat}><Botanical /></Frame>}
                {p.kind === 'map' && <Frame frame={p.frame} mat={p.mat}><VintageMap /></Frame>}
                {p.kind === 'mirror' && <Haunted offset={0}>{(who) => <Mirror who={who} />}</Haunted>}
                {p.kind === 'arch' && <Haunted offset={6000}>{(who) => <span className="relative block h-full w-full"><GothicArch who={who} /></span>}</Haunted>}
                {p.kind === 'sconce' && <Sconce />}
                {p.kind === 'medallion' && <Medallion />}
              </motion.div>
            )
          })}
        </div>
        <div className="absolute inset-x-[4%] bottom-0 z-30 md:inset-x-auto md:left-[18cqw] md:top-[calc(56*1cqw)] md:bottom-auto md:w-[64cqw]">
          <Credenza />
        </div>
      </div>
    </div>
  )
}
