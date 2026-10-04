import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { mirorraLinks, stylists } from '@/content'
import { SectionHeading } from './SectionHeading'

const ease = [0.16, 1, 0.3, 1] as const

export function Mirorra() {
  const [i, setI] = useState(0)
  const s = stylists[i]

  return (
    <section id="mirorra" className="relative overflow-hidden py-28">
      <motion.div
        aria-hidden
        animate={{ background: `radial-gradient(60% 50% at 30% 55%, ${s.hue}22, transparent 70%)` }}
        transition={{ duration: 1.2 }}
        className="pointer-events-none absolute inset-0"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-8">
        <SectionHeading title="A panel of AI stylists for your closet." />
        <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-bone/80">
          Upload a photo of any piece you own, and three AI critics, each with her own eye and vocabulary, will debate
          whether it works for <em>you</em>, without generic advice or empty flattery.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={mirorraLinks.beta} className="rounded-full bg-marigold px-5 py-2.5 text-sm font-medium text-night transition hover:bg-bone">
            Join the beta
          </a>
          <a href={mirorraLinks.support} className="rounded-full px-5 py-2.5 text-sm ring-1 ring-line transition hover:ring-bone/60">
            Support us
          </a>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-14">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-night-2 ring-1 ring-line">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={s.id}
                src={s.image}
                alt={`${s.name}, Mirorra stylist`}
                initial={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.8, ease }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 to-transparent p-6 pt-20">
              <p className="text-sm text-bone/70">{s.base}</p>
              <p className="font-display text-4xl font-light">{s.name}</p>
            </div>
          </div>

          <div>
            <div role="tablist" aria-label="Stylists" className="flex gap-2">
              {stylists.map((st, j) => (
                <button
                  key={st.id}
                  role="tab"
                  aria-selected={i === j}
                  aria-controls="stylist-panel"
                  onClick={() => setI(j)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') setI((j + 1) % stylists.length)
                    if (e.key === 'ArrowLeft') setI((j - 1 + stylists.length) % stylists.length)
                  }}
                  className="relative flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-sm"
                >
                  {i === j && (
                    <motion.span layoutId="stylist-pill" transition={{ duration: 0.5, ease }} className="absolute inset-0 rounded-full bg-bone" />
                  )}
                  <img src={st.image} alt="" className="relative size-8 rounded-full object-cover" />
                  <span className={`relative transition-colors ${i === j ? 'text-night' : 'text-ash hover:text-bone'}`}>{st.name}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={s.id}
                id="stylist-panel"
                role="tabpanel"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease }}
                className="mt-10"
              >
                <p className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-snug">{s.lens}</p>
                <p className="mt-5 leading-relaxed text-bone/75">{s.read}</p>

                <div className="mt-9 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-ash">Says</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {s.says.map((w) => (
                        <li key={w} className="rounded-full px-3 py-1 text-sm text-night" style={{ background: s.hue }}>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-ash">Would never say</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {s.never.map((w) => (
                        <li key={w} className="rounded-full px-3 py-1 text-sm text-ash line-through decoration-rose/70 ring-1 ring-line">
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <p className="mt-12 font-mono text-xs text-ash">React Native · Node.js · Claude API · multi-agent orchestration</p>
          </div>
        </div>
      </div>
    </section>
  )
}
