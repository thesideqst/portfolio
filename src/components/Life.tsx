import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { instagramProfile, links } from '@/content'
import { photos, photoSrc, type Photo } from '@/photos'
import { GalleryWall } from './GalleryWall'
import { SectionHeading } from './SectionHeading'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Reads 'YYYY-MM-DDTHH:mm' as wall-clock time, so it never shifts with the viewer's timezone. */
function parseTaken(taken: string) {
  const [y, mo, d, h, mi] = taken.split(/[-T:]/).map(Number)
  return { y, mo, d, h, mi }
}

/** The orange in-camera date imprint, e.g. '26 9 18. */
function dateStamp(taken: string) {
  const { y, mo, d } = parseTaken(taken)
  return `'${String(y).slice(2)} ${String(mo).padStart(2, ' ')} ${String(d).padStart(2, ' ')}`
}

function longDate(taken: string) {
  const { y, mo, d, h, mi } = parseTaken(taken)
  const hour = h % 12 || 12
  return `${MONTHS[mo - 1]} ${d}, ${y} · ${hour}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** A row of backlit sprocket holes, running along whichever edge it sits on. */
function Sprockets({ vertical, className }: { vertical?: boolean; className: string }) {
  const id = useId()
  return (
    <svg aria-hidden className={className}>
      <defs>
        <pattern id={id} width={vertical ? 12 : 22} height={vertical ? 22 : 12} patternUnits="userSpaceOnUse">
          <rect x={vertical ? 1 : 6} y={vertical ? 6 : 1} width={vertical ? 10 : 10} height={vertical ? 10 : 10} rx="2" fill="#f3ead6" opacity="0.85" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/** The photo as a frame of 35mm film on a light table: sprockets, edge printing, date imprint. */
function FilmFrame({ p, frame }: { p: Photo; frame: number }) {
  const portrait = p.h > p.w
  const edge = 'font-mono text-[9px] uppercase tracking-[0.2em] text-[#e0a24a]/85'
  return (
    <figure className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
      <div
        className="relative bg-[#0e0c0b] shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
        style={{ padding: portrait ? '10px 40px' : '40px 10px' }}
      >
        <Sprockets vertical={portrait} className={portrait ? 'absolute inset-y-0 left-[8px] h-full w-[12px]' : 'absolute inset-x-0 top-[8px] h-[12px] w-full'} />
        <Sprockets vertical={portrait} className={portrait ? 'absolute inset-y-0 right-[8px] h-full w-[12px]' : 'absolute inset-x-0 bottom-[8px] h-[12px] w-full'} />
        {/* Edge printing between the holes and the picture. */}
        <span className={`absolute ${edge} ${portrait ? 'left-[22px] top-[14px] [writing-mode:vertical-rl]' : 'left-[14px] top-[22px]'}`}>Safety film 400</span>
        <span className={`absolute ${edge} ${portrait ? 'bottom-[14px] right-[22px] [writing-mode:vertical-rl]' : 'bottom-[22px] right-[14px]'}`}>▸ {frame} &nbsp; {frame}A</span>
        <div className="relative">
          <img
            key={p.id}
            src={photoSrc(p)}
            alt={p.alt ?? ''}
            width={p.w}
            height={p.h}
            className="block w-auto object-contain"
            style={{ maxHeight: portrait ? 'calc(84vh - 80px)' : 'calc(84vh - 120px)', maxWidth: portrait ? 'calc(92vw - 80px)' : 'calc(92vw - 20px)' }}
          />
          {p.taken && (
            <span
              className="pointer-events-none absolute bottom-[3.5%] right-[4%] font-mono font-medium tracking-[0.12em] text-[#ff9b3d]"
              style={{ fontSize: 'clamp(11px, 1.7vh, 18px)', textShadow: '0 0 3px rgba(255,120,30,0.9), 0 0 8px rgba(255,110,20,0.45)' }}
            >
              {dateStamp(p.taken)}
            </span>
          )}
        </div>
      </div>
      {(p.place || p.taken) && (
        <figcaption className="text-center font-mono text-[0.72rem] tracking-[0.12em] text-bone/80">
          {p.place && <span className="uppercase">{p.place}</span>}
          {p.place && p.taken && <span className="mx-2 text-ash">·</span>}
          {p.taken && <span className="text-ash">{longDate(p.taken)}</span>}
        </figcaption>
      )}
    </figure>
  )
}

function Lightbox({ index, onClose, onStep }: { index: number; onClose: () => void; onStep: (d: number) => void }) {
  const p = photos[index]
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onStep(1)
      else if (e.key === 'ArrowLeft') onStep(-1)
    }
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose, onStep])

  // Warm the neighbours so arrowing through feels instant.
  useEffect(() => {
    for (const d of [1, -1]) new Image().src = photoSrc(photos[(index + d + photos.length) % photos.length])
  }, [index])

  const btn = 'absolute top-1/2 hidden -translate-y-1/2 rounded-full bg-night/70 px-4 py-3 text-bone ring-1 ring-line hover:ring-marigold/70 sm:block'

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-night/95 p-4 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 40) onStep(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <FilmFrame p={p} frame={index + 1} />
      <button type="button" aria-label="Previous photo" className={`${btn} left-4`} onClick={(e) => { e.stopPropagation(); onStep(-1) }}>←</button>
      <button type="button" aria-label="Next photo" className={`${btn} right-4`} onClick={(e) => { e.stopPropagation(); onStep(1) }}>→</button>
      <button type="button" aria-label="Close" className="absolute right-4 top-4 rounded-full bg-night/70 px-3 py-1.5 text-sm text-bone ring-1 ring-line hover:ring-marigold/70" onClick={onClose}>Close</button>
      <p className="absolute bottom-3 font-mono text-[0.65rem] tracking-widest text-ash/70">{index + 1} / {photos.length}</p>
    </motion.div>
  )
}

export function Photography() {
  const [open, setOpen] = useState<number | null>(null)
  const close = useCallback(() => setOpen(null), [])
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [])

  return (
    <section id="photography" className="mx-auto max-w-6xl px-4 py-28 sm:px-8">
      <SectionHeading title="Photography" />
      <GalleryWall onOpen={setOpen} />
      <AnimatePresence>{open !== null && <Lightbox index={open} onClose={close} onStep={step} />}</AnimatePresence>
    </section>
  )
}

export function Instagram() {
  return (
    <section id="instagram" className="mx-auto max-w-6xl px-4 pb-28 sm:px-8">
      <a
        href={links.instagram}
        className="group grid gap-8 rounded-3xl bg-night-2 p-6 ring-1 ring-line transition hover:ring-marigold/60 sm:p-10 md:grid-cols-[1fr_auto] md:items-center"
      >
        <div>
          <p className="font-display text-[clamp(2rem,5vw,3.5rem)] font-light leading-none">
            @{links.instagramHandle}
          </p>
          <p className="mt-5 max-w-md text-lg leading-snug text-bone/90">{instagramProfile.bio}</p>
          <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-widest text-ash">
            {instagramProfile.since} · {instagramProfile.place}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 md:w-80">
          {instagramProfile.posts.map((post) => (
            <img key={post.id} src={`/media/instagram/${post.id}.jpg`} alt={post.alt} loading="lazy" className="aspect-[4/5] w-full rounded-lg object-cover ring-1 ring-line transition group-hover:ring-marigold/40" />
          ))}
        </div>
      </a>
    </section>
  )
}
