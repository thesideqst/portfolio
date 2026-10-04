import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import RotatingEarth, { type Tier } from '@/components/ui/wireframe-dotted-globe'
import { loadGeo } from '@/lib/geo'
import { travel } from '@/content'

const ease = [0.16, 1, 0.3, 1] as const

type Picked = { key: string; name: string; tier: Tier | null; lng: number; lat: number; countryId?: string }

const tiers: Record<string, Tier> = Object.fromEntries([
  ...Object.keys(travel.been).map((id) => [id, 'been' as Tier]),
  ...Object.keys(travel.client).map((id) => [id, 'client' as Tier]),
])
const pinTier = (country: string): Tier | null =>
  Object.values(travel.client).includes(country) ? 'client' : Object.values(travel.been).includes(country) || travel.pins.some((p) => p.country === country) ? 'been' : null

const usCities = travel.pins.filter((p) => p.country === 'United States')

/** /fora: pick a place on the globe, then ask Aliya to plan the trip. */
export function Travel() {
  const [picked, setPicked] = useState<Picked | null>(null)
  const [focus, setFocus] = useState<{ lng: number; lat: number } | null>(null)
  const [trip, setTrip] = useState<string[]>([])
  const formRef = useRef<HTMLElement>(null)

  const { countries, byId } = loadGeo()
  const options = useMemo(
    () => [...new Set([...countries.map((c) => c.name), ...travel.pins.filter((p) => p.country !== 'United States').map((p) => p.name)])].sort(),
    [countries],
  )

  const pickCountry = (id: string) => {
    const c = byId.get(id)
    if (!c) return
    setPicked({ key: `c:${id}`, name: c.name, tier: tiers[id] ?? null, lng: c.center[0], lat: c.center[1], countryId: id })
    setFocus({ lng: c.center[0], lat: c.center[1] })
  }
  const pickPin = (id: string) => {
    const p = travel.pins.find((x) => x.id === id)
    if (!p) return
    const countryId = countries.find((c) => c.name === p.country)?.id
    setPicked({ key: `p:${id}`, name: p.name === p.country ? p.name : `${p.name}, ${p.country}`, tier: pinTier(p.country), lng: p.lng, lat: p.lat, countryId })
    setFocus({ lng: p.lng, lat: p.lat })
  }
  const pickByName = (name: string) => {
    const c = countries.find((x) => x.name.toLowerCase() === name.trim().toLowerCase())
    if (c) return pickCountry(c.id)
    const p = travel.pins.find((x) => x.name.toLowerCase() === name.trim().toLowerCase())
    if (p) pickPin(p.id)
  }

  const addToTrip = (name: string) => setTrip((t) => (t.includes(name) ? t : [...t, name]))
  const goToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-28 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
          <h1 className="max-w-3xl font-display text-[clamp(2.25rem,6vw,4.5rem)] font-light leading-[1.02] tracking-tight">
            Where do you want to go?
          </h1>
          <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-bone/80">
            Spin the globe, pick a place, and tell me about the trip you have in mind so we can plan it together.
          </p>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-center md:gap-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease, delay: 0.15 }}
            className="mx-auto w-full max-w-[620px]"
          >
            <RotatingEarth
              tiers={tiers}
              pins={travel.pins}
              selectedCountry={picked?.countryId ?? null}
              focus={focus}
              onPickCountry={pickCountry}
              onPickPin={pickPin}
            />
          </motion.div>

          <div className="rounded-3xl bg-night/75 p-6 ring-1 ring-line backdrop-blur-md sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              {picked ? (
                <motion.div key={picked.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}>
                  <button onClick={() => setPicked(null)} className="text-sm text-ash hover:text-bone">← All destinations</button>
                  <p className="mt-5 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-light leading-tight">{picked.name}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {picked.tier === 'client' && <Badge tone="gold">I’ve planned client trips here</Badge>}
                    {picked.tier && <Badge tone="bone">I’ve been here</Badge>}
                    {!picked.tier && <Badge tone="ash">Not yet, but I’d love to plan it</Badge>}
                  </div>
                  {picked.countryId === '840' && (
                    <div className="mt-6">
                      <p className="text-sm text-ash">Places I know</p>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {usCities.map((p) => (
                          <li key={p.id}>
                            <button onClick={() => pickPin(p.id)} className="rounded-full px-2.5 py-1 text-xs text-bone/80 ring-1 ring-line transition hover:text-bone hover:ring-bone/50">
                              {p.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      addToTrip(picked.name)
                      goToForm()
                    }}
                    className="mt-8 w-full rounded-full bg-marigold px-5 py-3 text-sm font-medium text-night transition hover:bg-bone"
                  >
                    Plan a trip to {picked.name === 'United States' ? 'the US' : picked.name.split(',')[0]}
                  </button>
                  <button
                    onClick={() => {
                      addToTrip(picked.name)
                      setPicked(null)
                    }}
                    className="mt-2 w-full rounded-full px-5 py-3 text-sm text-bone/85 ring-1 ring-line transition hover:ring-bone/60"
                  >
                    {trip.includes(picked.name) ? 'Added to your trip' : 'Add it and keep looking'}
                  </button>
                </motion.div>
              ) : (
                <motion.div key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}>
                  <p className="text-sm text-bone/85">Tap a country to start.</p>
                  <ul className="mt-6 space-y-4 text-sm">
                    <Legend swatch="bg-marigold">Places I’ve planned client trips</Legend>
                    <Legend swatch="bg-bone">Places I’ve been myself</Legend>
                    <Legend swatch="bg-ash/50">Everywhere else: terra incognita, but ask me</Legend>
                    <Legend swatch="ring-2 ring-inset ring-marigold">Cities I know well</Legend>
                  </ul>
                  <form
                    className="mt-8"
                    onSubmit={(e) => {
                      e.preventDefault()
                      pickByName(new FormData(e.currentTarget).get('q') as string)
                    }}
                  >
                    <label htmlFor="dest-search" className="text-sm text-ash">Or search</label>
                    <input
                      id="dest-search"
                      name="q"
                      list="destinations"
                      placeholder="Portugal, Japan, Miami…"
                      onChange={(e) => options.includes(e.target.value) && pickByName(e.target.value)}
                      className="mt-2 w-full rounded-full bg-night-2 px-4 py-2.5 text-sm text-bone ring-1 ring-line placeholder:text-ash/70 focus:outline-none focus:ring-marigold/70"
                    />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {trip.length > 0 && (
              <div className="mt-8 border-t border-line pt-5">
                <p className="text-sm text-ash">Your trip</p>
                <TripChips trip={trip} onRemove={(n) => setTrip((t) => t.filter((x) => x !== n))} />
                <button onClick={goToForm} className="mt-4 text-sm text-marigold hover:text-bone">Continue to request →</button>
              </div>
            )}
          </div>
        </div>
        <datalist id="destinations">
          {options.map((o) => <option key={o} value={o} />)}
        </datalist>
      </section>

      <Trust />

      <section ref={formRef} id="request" className="mx-auto max-w-3xl scroll-mt-24 px-4 pb-28 sm:px-8">
        <TripRequestForm trip={trip} setTrip={setTrip} />
      </section>
    </>
  )
}

function Trust() {
  const steps = [
    ['Tell me where and when', 'Pick a place (or several), rough dates, and the kind of trip you want, and know that “not sure yet” is a perfectly good answer.'],
    ['We talk it through', 'I’ll follow up with the questions that shape a trip: pace, budget, must-dos, deal-breakers.'],
    ['I plan it', 'You get an itinerary built around you, and I stay your point of contact from takeoff to touchdown.'],
  ]
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <div className="grid gap-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <p className="text-[1.05rem] leading-relaxed text-bone/80">
            I’ve been to more than 25 countries, many of them alone, so I’ve already met most of what can go wrong on a
            trip (the train strike, the sold-out ferry, the restaurant that only exists on Instagram) and I’ll plan
            around it before you leave home. An AI will hand you the same top-ten list it gives everyone else, while I’d
            rather point you down the side street where the best meal of your trip is waiting, because that kind of
            serendipity is half the reason to go.
          </p>
        </div>
        <ol className="space-y-6">
          {steps.map(([title, body], i) => (
            <li key={title} className="grid grid-cols-[auto_1fr] gap-4">
              <span className="font-mono text-sm text-marigold">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="font-medium text-bone">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ash">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

function TripRequestForm({ trip, setTrip }: { trip: string[]; setTrip: (f: (t: string[]) => string[]) => void }) {
  const [styles, setStyles] = useState<string[]>([])
  const [unsure, setUnsure] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [extra, setExtra] = useState('')

  const addExtra = () => {
    const v = extra.trim()
    if (v) setTrip((t) => (t.includes(v) ? t : [...t, v]))
    setExtra('')
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('_gotcha')) return
    const data = {
      destinations: unsure ? `Not sure yet${trip.length ? ` (thinking about ${trip.join(', ')})` : ''}` : trip.join(', '),
      when: f.get('when'),
      flexible: f.get('flexible') ? 'Yes' : 'No',
      travelers: `${f.get('adults')} adults, ${f.get('kids')} kids`,
      budget: f.get('budget'),
      style: styles.join(', '),
      notes: f.get('notes'),
      name: f.get('name'),
      email: f.get('email'),
      phone: f.get('phone'),
    }

    setStatus('sending')
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${travel.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...data,
          _subject: `Trip request: ${data.destinations || 'somewhere new'}`,
          _replyto: data.email,
          _template: 'table',
          _captcha: 'false',
        }),
      })
      const json = res.ok ? await res.json().catch(() => null) : null
      setStatus(json?.success === 'true' || json?.success === true ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-night-2 p-8 text-center ring-1 ring-line sm:p-12">
        <p className="font-display text-4xl font-light">Consider it sent.</p>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-bone/75">
          I have your request and will reach out soon to start planning.
        </p>
      </motion.div>
    )
  }

  const field = 'w-full rounded-xl bg-night-2 px-4 py-3 text-sm text-bone ring-1 ring-line placeholder:text-ash/60 focus:outline-none focus:ring-marigold/70'

  return (
    <form onSubmit={submit} className="rounded-3xl bg-night/75 p-6 ring-1 ring-line backdrop-blur-md sm:p-10">
      <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-light leading-tight">Plan a trip with me</h2>

      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-bone">Where to?</legend>
        {trip.length > 0 ? (
          <TripChips trip={trip} onRemove={(n) => setTrip((t) => t.filter((x) => x !== n))} />
        ) : (
          <p className="mt-2 text-sm text-ash">Pick places on the globe above, or type them here.</p>
        )}
        <div className="mt-3 flex gap-2">
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addExtra()
              }
            }}
            list="destinations"
            aria-label="Add a destination"
            placeholder="Add a country, city, or region"
            className={field}
          />
          <button type="button" onClick={addExtra} className="shrink-0 rounded-xl px-4 text-sm ring-1 ring-line hover:ring-bone/60">Add</button>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-bone/85">
          <input type="checkbox" checked={unsure} onChange={(e) => setUnsure(e.target.checked)} className="accent-marigold" />
          Not sure yet, help me choose
        </label>
      </fieldset>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="When?">
          <input name="when" placeholder="Late May, about 10 days" className={field} />
          <label className="mt-2 flex items-center gap-2 text-sm text-ash">
            <input type="checkbox" name="flexible" className="accent-marigold" /> My dates are flexible
          </label>
        </Field>
        <Field label="Budget per person (excluding flights)">
          <select name="budget" defaultValue="" className={field}>
            <option value="" disabled>Pick a range</option>
            {travel.budgets.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Adults">
          <input name="adults" type="number" min={1} defaultValue={2} className={field} />
        </Field>
        <Field label="Kids">
          <input name="kids" type="number" min={0} defaultValue={0} className={field} />
        </Field>
      </div>

      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-bone">What kind of trip?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {travel.tripStyles.map((s) => {
            const on = styles.includes(s)
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => setStyles((x) => (on ? x.filter((y) => y !== s) : [...x, s]))}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${on ? 'bg-bone text-night' : 'text-bone/80 ring-1 ring-line hover:ring-bone/50'}`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </fieldset>

      <Field label="Anything else?" className="mt-8">
        <textarea name="notes" rows={4} placeholder="The occasion, places you loved before, must-dos, deal-breakers…" className={field} />
      </Field>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Name">
          <input name="name" required autoComplete="name" className={field} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={field} />
        </Field>
        <Field label="Phone (optional)">
          <input name="phone" type="tel" autoComplete="tel" className={field} />
        </Field>
      </div>
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === 'sending' || (!trip.length && !unsure)}
          className="rounded-full bg-marigold px-6 py-3 text-sm font-medium text-night transition hover:bg-bone disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'sending' ? 'Sending…' : 'Send trip request'}
        </button>
        {!trip.length && !unsure && <p className="text-sm text-ash">Add a destination, or tick “not sure yet”.</p>}
        {status === 'error' && (
          <p className="text-sm text-rose">
            Something went wrong. Email me at <a className="underline" href={`mailto:${travel.email}`}>{travel.email}</a>.
          </p>
        )}
      </div>
    </form>
  )
}

function TripChips({ trip, onRemove }: { trip: string[]; onRemove: (name: string) => void }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      <AnimatePresence initial={false}>
        {trip.map((n) => (
          <motion.li key={n} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <span className="flex items-center gap-1.5 rounded-full bg-marigold/15 py-1 pl-3 pr-1 text-sm text-bone ring-1 ring-marigold/40">
              {n}
              <button type="button" aria-label={`Remove ${n}`} onClick={() => onRemove(n)} className="grid size-5 place-items-center rounded-full text-bone/70 hover:bg-bone/15 hover:text-bone">
                ×
              </button>
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
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

function Badge({ tone, children }: { tone: 'gold' | 'bone' | 'ash'; children: ReactNode }) {
  const cls = { gold: 'bg-marigold text-night', bone: 'bg-bone/90 text-night', ash: 'text-ash ring-1 ring-line' }[tone]
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${cls}`}>{children}</span>
}

function Legend({ swatch, children }: { swatch: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-bone/85">
      <span className={`mt-1 size-3 shrink-0 rounded-full ${swatch}`} />
      <span>{children}</span>
    </li>
  )
}

