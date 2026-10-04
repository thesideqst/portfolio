import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'

const BARS = 72

function fallbackPeaks() {
  // Deterministic placeholder shape until the real audio is decoded.
  return Array.from({ length: BARS }, (_, i) => 0.3 + 0.55 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)))
}

async function decodePeaks(src: string): Promise<number[] | null> {
  try {
    const res = await fetch(src)
    if (!res.ok) return null
    const ctx = new AudioContext()
    const buf = await ctx.decodeAudioData(await res.arrayBuffer())
    ctx.close()
    const data = buf.getChannelData(0)
    const block = Math.floor(data.length / BARS)
    const peaks = Array.from({ length: BARS }, (_, i) => {
      let sum = 0
      for (let j = 0; j < block; j++) sum += Math.abs(data[i * block + j])
      return sum / block
    })
    const max = Math.max(...peaks) || 1
    return peaks.map((p) => 0.12 + 0.88 * (p / max))
  } catch {
    return null
  }
}

function fmt(t: number) {
  if (!isFinite(t)) return '0:00'
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
}

export function WaveformPlayer({ src, transcript }: { src: string; transcript: string }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [peaks, setPeaks] = useState<number[]>(fallbackPeaks)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [missing, setMissing] = useState(false)
  const words = useMemo(() => transcript.split(/\s+/), [transcript])

  useEffect(() => {
    decodePeaks(src).then((p) => (p ? setPeaks(p) : setMissing(true)))
  }, [src])

  const progress = duration ? time / duration : 0
  // Narration pace is steady, so word position tracks elapsed time closely enough.
  const wordIndex = Math.floor(progress * words.length)

  const toggle = () => {
    const a = audio.current
    if (!a || missing) return
    if (a.paused) a.play()
    else a.pause()
  }
  const seek = (fraction: number) => {
    const a = audio.current
    if (!a || !duration) return
    a.currentTime = fraction * duration
    if (a.paused) a.play()
  }

  return (
    <div className="rounded-2xl bg-night-2 p-5 ring-1 ring-line sm:p-7">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setMissing(true)}
      />

      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          disabled={missing}
          aria-label={playing ? 'Pause briefing' : 'Play briefing'}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-marigold text-night transition hover:scale-105 disabled:opacity-40"
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><rect x="3" y="2" width="4" height="14" rx="1" fill="currentColor" /><rect x="11" y="2" width="4" height="14" rx="1" fill="currentColor" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M4 2.5v13l11-6.5z" fill="currentColor" /></svg>
          )}
        </button>
        <div className="min-w-0">
          <p className="font-display text-xl leading-tight">NVDA · fiscal Q2 2027</p>
          <p className="font-mono text-xs text-ash">
            {missing ? 'Audio excerpt not added yet' : `${fmt(time)} / ${fmt(duration)} · excerpt from an 8-minute episode`}
          </p>
        </div>
      </div>

      <div
        className="mt-6 flex h-20 cursor-pointer items-center gap-[3px]"
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(time)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') seek(Math.min(1, progress + 0.05))
          if (e.key === 'ArrowLeft') seek(Math.max(0, progress - 0.05))
          if (e.key === ' ') { e.preventDefault(); toggle() }
        }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          seek((e.clientX - r.left) / r.width)
        }}
      >
        {peaks.map((p, i) => {
          const played = i / BARS < progress
          return (
            <motion.span
              key={i}
              initial={{ scaleY: 0.1 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.008, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full rounded-full transition-colors duration-200 ${played ? 'bg-marigold' : 'bg-line'}`}
              style={{ height: `${p * 100}%` }}
            />
          )
        })}
      </div>

      <p className="mt-6 text-[0.95rem] leading-relaxed text-ash">
        {words.map((w, i) => (
          <span
            key={i}
            onClick={() => seek(i / words.length)}
            className={`cursor-pointer transition-colors duration-300 ${
              time > 0 && i < wordIndex ? 'text-bone/70' : ''
            } ${time > 0 && i === wordIndex ? 'text-marigold' : ''}`}
          >
            {w}{' '}
          </span>
        ))}
      </p>
    </div>
  )
}
