import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { currently, playlists, recentAlbums, type MediaItem } from '@/content'

const ease = [0.16, 1, 0.3, 1] as const
const STORAGE_KEY = 'now-listening:pick'

/** open.spotify.com/playlist/ID?si=… → spotify:playlist:ID */
function toUri(url: string) {
  const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track)\/([A-Za-z0-9]+)/)
  return m ? `spotify:${m[1]}:${m[2]}` : null
}

// Minimal typings for Spotify's iFrame API: https://developer.spotify.com/documentation/embeds/references/iframe-api
type Controller = {
  loadUri(uri: string): void
  play(): void
  togglePlay(): void
  destroy(): void
  addListener(event: 'playback_update', cb: (e: { data: { isPaused: boolean } }) => void): void
}
type SpotifyIFrameAPI = {
  createController(el: HTMLElement, opts: { uri: string; width: string; height: number }, cb: (c: Controller) => void): void
}
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void
  }
}

let apiPromise: Promise<SpotifyIFrameAPI> | null = null
function loadSpotifyApi() {
  apiPromise ??= new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve
    const s = document.createElement('script')
    s.src = 'https://open.spotify.com/embed/iframe-api/v1'
    s.async = true
    s.onerror = () => {
      apiPromise = null
      reject(new Error('Spotify embed failed to load'))
    }
    document.body.appendChild(s)
  })
  return apiPromise
}

function savedPick() {
  try {
    const i = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isInteger(i) && i >= 0 && i < playlists.length ? i : 0
  } catch {
    return 0
  }
}

function Bars({ on }: { on: boolean }) {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
      {[0.6, 1, 0.4, 0.8].map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-marigold"
          animate={on ? { height: ['30%', '100%', '45%', '85%', '30%'] } : { height: `${h * 60}%` }}
          transition={on ? { duration: 1.1 + i * 0.17, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        />
      ))}
    </span>
  )
}

type Tab = 'listening' | 'reading' | 'watching' | 'playing'

const TABS: { id: Tab; label: string }[] = [
  { id: 'listening', label: 'Listening' },
  { id: 'reading', label: 'Reading' },
  { id: 'watching', label: 'Watching' },
  { id: 'playing', label: 'Playing' },
]

/** What the collapsed pill cycles through: one line per thing currently on the go. */
const TICKER = [
  'Now listening',
  ...currently.reading.map((m) => `Reading · ${m.title}`),
  ...currently.watching.map((m) => `Watching · ${m.title}`),
  ...currently.playing.map((m) => `Playing · ${m.title}`),
]

/** The cover art or poster, or a small typographic cover when there's no image (or it fails to load). */
function Cover({ item, tall }: { item: MediaItem; tall?: boolean }) {
  const [broken, setBroken] = useState(false)
  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-end overflow-hidden rounded-md p-1.5 ring-1 ring-white/10 ${tall ? 'h-[4.5rem] w-12' : 'h-12 w-12'}`}
      style={{ background: `linear-gradient(160deg, ${item.hue}, #0b0a1f 130%)` }}
    >
      {item.image && !broken ? (
        <img src={item.image} alt="" loading="lazy" onError={() => setBroken(true)} className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="font-display text-[0.55rem] leading-[1.05] text-bone/90 [overflow-wrap:anywhere]">{item.title}</span>
      )}
    </span>
  )
}

function Row({ item, tall, href }: { item: MediaItem; tall?: boolean; href?: string }) {
  const body = (
    <>
      <Cover item={item} tall={tall} />
      <div className="min-w-0">
        <p className="font-display text-base leading-tight">{item.title}</p>
        {item.by && <p className="text-xs text-ash">{item.by}</p>}
        {item.status && <p className="text-xs text-ash">{item.status}</p>}
        {item.note && <p className="mt-0.5 text-xs leading-snug text-bone/75">{item.note}</p>}
      </div>
      {item.rating && (
        <span className="ml-auto grid size-8 shrink-0 place-items-center rounded-full font-display text-sm ring-1 ring-marigold/60 text-marigold" aria-label={`Rated ${item.rating}`}>
          {item.rating}
        </span>
      )}
      {href && <span aria-hidden className="ml-auto text-xs text-ash transition group-hover:text-bone">↗</span>}
    </>
  )
  return (
    <li>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="group flex items-center gap-3">
          {body}
        </a>
      ) : (
        <div className="flex items-center gap-3">{body}</div>
      )}
    </li>
  )
}

/**
 * Floating "What I'm into right now" panel: music (Spotify), plus what Aliya is
 * reading, watching, and playing. Playlists come from content.ts.
 * The panel stays mounted once opened, so collapsing it (or changing pages) never stops the music.
 */
export function MusicPlayer() {
  const [open, setOpen] = useState(false)
  // Spotify only loads for visitors who open the player.
  const [mounted, setMounted] = useState(false)
  const [pick, setPick] = useState(savedPick)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [tab, setTab] = useState<Tab>('listening')
  const [tick, setTick] = useState(0)
  const tabs = TABS.filter((t) => t.id === 'listening' || (t.id === 'watching' ? currently.watching.length + currently.watched.length : currently[t.id].length) > 0)
  const host = useRef<HTMLDivElement>(null)
  const controller = useRef<Controller | null>(null)
  const pickRef = useRef(pick)
  const current = playlists[pick]

  useEffect(() => {
    pickRef.current = pick
  }, [pick])

  useEffect(() => {
    const node = host.current
    if (!mounted || !node) return
    const uri = toUri(playlists[pickRef.current]?.spotifyUrl ?? '')
    if (!uri) return
    let cancelled = false
    const el = document.createElement('div')
    node.appendChild(el)
    loadSpotifyApi()
      .then((api) =>
        api.createController(el, { uri, width: '100%', height: 152 }, (c) => {
          if (cancelled) return c.destroy()
          controller.current = c
          c.addListener('playback_update', (e) => setPlaying(!e.data.isPaused))
          setReady(true)
        }),
      )
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      controller.current?.destroy()
      controller.current = null
      node.replaceChildren()
    }
  }, [mounted])

  // The collapsed pill slowly cycles through what's on the go.
  useEffect(() => {
    if (open || playing || TICKER.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setTick((t) => t + 1), 3200)
    return () => window.clearInterval(id)
  }, [open, playing])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function toggle() {
    setMounted(true)
    setOpen((o) => !o)
  }

  function choose(i: number) {
    if (i === pick) return
    setPick(i)
    try {
      localStorage.setItem(STORAGE_KEY, String(i))
    } catch {
      // Private mode etc.; the pick just won't be remembered.
    }
    const uri = toUri(playlists[i].spotifyUrl)
    if (uri && controller.current) {
      controller.current.loadUri(uri)
      controller.current.play()
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6">
      {mounted && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={open ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.35, ease }}
          inert={!open}
          aria-hidden={!open}
          className={`mb-3 w-[min(22rem,calc(100vw-2rem))] origin-bottom-left rounded-2xl bg-night-2/90 p-4 ring-1 ring-line backdrop-blur-md ${
            open ? '' : 'pointer-events-none absolute bottom-full left-0'
          }`}
        >
          <p className="text-sm font-medium text-bone">What I’m into right now</p>
          <div className="mt-3 flex gap-1 rounded-full bg-night/60 p-1" role="tablist" aria-label="Currently">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className="relative flex-1 rounded-full px-2 py-1 text-xs"
              >
                {tab === t.id && <motion.span layoutId="now-tab" transition={{ duration: 0.35, ease }} className="absolute inset-0 rounded-full bg-bone" />}
                <span className={`relative transition-colors ${tab === t.id ? 'text-night' : 'text-ash hover:text-bone'}`}>{t.label}</span>
              </button>
            ))}
          </div>

          {tab === 'reading' && (
            <ul className="mt-4 space-y-3" role="tabpanel">
              {currently.reading.map((m) => <Row key={m.title} item={m} tall />)}
            </ul>
          )}
          {tab === 'watching' && (
            <div className="mt-4" role="tabpanel">
              <ul className="space-y-3">
                {currently.watching.map((m) => <Row key={m.title} item={m} />)}
              </ul>
              {currently.watched.length > 0 && (
                <>
                  <p className="mt-5 text-sm text-ash">Most recently watched</p>
                  <ul className="mt-3 space-y-3">
                    {currently.watched.map((m) => <Row key={m.title} item={m} />)}
                  </ul>
                </>
              )}
            </div>
          )}
          {tab === 'playing' && (
            <ul className="mt-4 space-y-3" role="tabpanel">
              {currently.playing.map((m) => <Row key={m.title} item={m} />)}
            </ul>
          )}

          {/* Listening stays mounted while hidden, so switching tabs never stops the music. */}
          <div className={tab === 'listening' ? '' : 'hidden'} role="tabpanel">
          {playlists.length === 0 ? (
            <p className="mt-4 text-sm text-ash">Playlists coming soon.</p>
          ) : (
            <>
              {playlists.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Playlists">
                  {playlists.map((p, i) => (
                    <button
                      key={p.spotifyUrl}
                      role="radio"
                      aria-checked={i === pick}
                      onClick={() => choose(i)}
                      className={`rounded-full px-3 py-1 text-xs transition ${
                        i === pick ? 'bg-bone text-night' : 'text-ash ring-1 ring-line hover:text-bone'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {current?.note && <p className="mt-3 text-sm leading-snug text-bone/80">{current.note}</p>}
              <div ref={host} className="mt-3 min-h-[152px] overflow-hidden rounded-xl bg-night/60 [&_iframe]:block" />
              {failed && <p className="mt-2 text-xs text-ash">The Spotify player couldn’t load here.</p>}
              {current && (
                <a
                  href={current.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-ash transition hover:text-bone"
                >
                  Open in Spotify <span aria-hidden>↗</span>
                </a>
              )}
            </>
          )}
          {recentAlbums.length > 0 && (
            <>
              <p className="mt-5 text-sm text-ash">Albums on repeat</p>
              <ul className="mt-3 space-y-3">
                {recentAlbums.slice(0, 3).map((a) => <Row key={a.href} item={a} href={a.href} />)}
              </ul>
            </>
          )}
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          aria-expanded={open}
          className="flex items-center gap-2.5 rounded-full bg-night-2/80 py-2 pl-3 pr-4 text-sm ring-1 ring-line backdrop-blur-md transition hover:ring-marigold/50"
        >
          <Bars on={playing} />
          <span className="relative block h-5 w-[min(13rem,calc(100vw-9rem))] overflow-hidden text-left text-bone/90">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={open ? 'close' : playing && current ? `p-${current.name}` : TICKER[tick % TICKER.length]}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.45, ease }}
                className="absolute inset-0 truncate"
              >
                {open ? 'Close' : playing && current ? current.name : TICKER[tick % TICKER.length]}
              </motion.span>
            </AnimatePresence>
          </span>
        </button>
        {ready && !open && (
          <button
            onClick={() => controller.current?.togglePlay()}
            aria-label={playing ? 'Pause music' : 'Play music'}
            className="grid size-9 place-items-center rounded-full bg-night-2/80 text-bone ring-1 ring-line backdrop-blur-md transition hover:ring-marigold/50"
          >
            {playing ? (
              <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden><path d="M1.5 1v10M8.5 1v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            ) : (
              <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden><path d="M1 1.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L1.9.7a.6.6 0 0 0-.9.5Z" fill="currentColor" /></svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
