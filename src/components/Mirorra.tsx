import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { mirorraLinks, stylists } from '@/content'
import { sendForm } from '@/lib/formsubmit'
import { SectionHeading } from './SectionHeading'

const ease = [0.16, 1, 0.3, 1] as const

export function Mirorra() {
  const [i, setI] = useState(0)
  const s = stylists[i]

  // Arriving from "Join the beta" on the homepage: go straight to the form.
  useEffect(() => {
    if (window.location.hash === '#beta') document.getElementById('beta')?.scrollIntoView()
  }, [])

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
          <a href="#beta" className="rounded-full bg-marigold px-5 py-2.5 text-sm font-medium text-night transition hover:bg-bone">
            Join the beta
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

        <BetaForm />
      </div>
    </section>
  )
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

/** Beta signups, emailed to Aliya through FormSubmit. */
function BetaForm() {
  const [first, setFirst] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('_gotcha')) return
    const data = {
      name: f.get('name'),
      email: f.get('email'),
      city: f.get('city'),
      'stylist first': first || 'No preference',
      'style goals': f.get('goals'),
    }
    setStatus('sending')
    const ok = await sendForm(mirorraLinks.betaEmail, `Mirorra beta: ${data.name || data.email}`, data, data.email)
    setStatus(ok ? 'sent' : 'error')
  }

  const field = 'w-full rounded-xl bg-night-2 px-4 py-3 text-sm text-bone ring-1 ring-line placeholder:text-ash/60 focus:outline-none focus:ring-marigold/70'

  return (
    <div id="beta" className="mt-24 scroll-mt-24">
      {status === 'sent' ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-night-2 p-8 text-center ring-1 ring-line sm:p-12">
          <p className="font-display text-4xl font-light">You’re on the list.</p>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-bone/75">I’ll email you when the beta opens.</p>
        </motion.div>
      ) : (
        <form onSubmit={submit} className="rounded-3xl bg-night/75 p-6 ring-1 ring-line backdrop-blur-md sm:p-10">
          <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-light leading-tight">Join the beta</h2>
          <p className="mt-3 max-w-xl text-bone/75">Get an early invite to put your closet in front of the panel.</p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <input name="name" autoComplete="name" className={field} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" required autoComplete="email" className={field} />
            </Field>
            <Field label="City">
              <input name="city" autoComplete="address-level2" className={field} />
            </Field>
          </div>

          <fieldset className="mt-8">
            <legend className="text-sm font-medium text-bone">Which stylist do you want to hear from first?</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...stylists.map((st) => st.name), 'Surprise me'].map((name) => {
                const on = first === name
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFirst(on ? '' : name)}
                    className={`rounded-full px-3.5 py-1.5 text-sm transition ${on ? 'bg-bone text-night' : 'text-bone/80 ring-1 ring-line hover:ring-bone/50'}`}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Field label="What do you want help with?" className="mt-8">
            <textarea name="goals" rows={3} placeholder="Building a work wardrobe, finally wearing what’s in the back of the closet…" className={field} />
          </Field>
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="rounded-full bg-marigold px-6 py-3 text-sm font-medium text-night transition hover:bg-bone disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === 'sending' ? 'Sending…' : 'Join the beta'}
            </button>
            {status === 'error' && (
              <p className="text-sm text-rose">
                Something went wrong. Email me at <a className="underline" href={`mailto:${mirorraLinks.betaEmail}`}>{mirorraLinks.betaEmail}</a>.
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-bone">{label}</span>
      {children}
    </label>
  )
}
