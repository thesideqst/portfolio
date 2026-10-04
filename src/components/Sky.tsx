import { useEffect, useState } from 'react'
import { Starfield } from '@/components/Starfield'
import { NightFlight } from '@/components/NightFlight'
import { setSkyMode, useFlightStatus, useSkyMode, type SkyMode } from '@/components/sky/mode'

/** The page background, fading between deep space and the night flight when the mode changes. */
export function Sky() {
  const mode = useSkyMode()
  const [shown, setShown] = useState(mode)
  const [settled, setSettled] = useState(true)

  useEffect(() => {
    if (mode === shown) {
      // The new sky mounts transparent, so it has something to fade in from.
      const t = setTimeout(() => setSettled(true), 30)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setSettled(false)
      setShown(mode)
    }, 500)
    return () => clearTimeout(t)
  }, [mode, shown])

  const hidden = mode !== shown || !settled
  return shown === 'flight' ? <NightFlight hidden={hidden} /> : <Starfield hidden={hidden} />
}

const OPTIONS: { mode: SkyMode; label: string; icon: React.ReactNode }[] = [
  {
    mode: 'stars',
    label: 'Stars',
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
        <path d="M6 0.5 7.1 4.9 11.5 6 7.1 7.1 6 11.5 4.9 7.1 0.5 6 4.9 4.9Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    mode: 'flight',
    label: 'Cities',
    icon: (
      <svg width="13" height="12" viewBox="0 0 13 12" aria-hidden>
        <path d="M12.2 5.2 8 5.1 4.9.6H3.6l1.9 4.5H2.4L1.3 3.6H.4l.6 2.4-.6 2.4h.9l1.1-1.5h3.1L3.6 11.4h1.3L8 6.9l4.2-.1a.8.8 0 0 0 0-1.6Z" fill="currentColor" />
      </svg>
    ),
  },
]

/** Switch between the two skies. */
export function SkyToggle({ className = '' }: { className?: string }) {
  const mode = useSkyMode()
  return (
    <div role="radiogroup" aria-label="Background" className={`flex gap-0.5 rounded-full bg-night-2/80 p-1 ring-1 ring-line backdrop-blur-md ${className}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.mode}
          role="radio"
          aria-checked={mode === o.mode}
          onClick={() => setSkyMode(o.mode)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition ${
            mode === o.mode ? 'bg-bone text-night' : 'text-ash hover:text-bone'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Where the night flight is, e.g. "Tokyo → Las Vegas · 6,240 km to go". Hidden under the stars. */
export function FlightCaption({ className = '' }: { className?: string }) {
  const mode = useSkyMode()
  const status = useFlightStatus()
  if (mode !== 'flight' || !status) return null
  return (
    <p className={`w-fit whitespace-nowrap rounded-full bg-night-2/80 px-3 py-1 font-mono text-[0.68rem] tracking-wide text-bone/75 ring-1 ring-line backdrop-blur-md ${className}`}>
      {status.from} → {status.to} · {status.km.toLocaleString()} km to go
    </p>
  )
}
