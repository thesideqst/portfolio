import { forwardRef, useRef, type ReactNode } from 'react'
import { AnimatedBeam } from '@/components/ui/animated-beam'
import { links } from '@/content'
// Refreshed from the live app before every build by scripts/fetch-latest-episode.mjs.
import episode from '@/latest-episode.json'
import { SectionHeading } from './SectionHeading'
import { WaveformPlayer } from './WaveformPlayer'

const aired = new Date(episode.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

const Node = forwardRef<HTMLDivElement, { label: string; sub?: string; accent?: boolean; children?: ReactNode }>(
  ({ label, sub, accent }, ref) => (
    <div
      ref={ref}
      className={`relative z-10 rounded-xl px-3.5 py-2.5 text-center ring-1 ${
        accent ? 'bg-marigold text-night ring-marigold' : 'bg-night-2 ring-line'
      }`}
    >
      <p className="text-sm font-medium leading-tight">{label}</p>
      {sub && <p className={`mt-0.5 font-mono text-[0.65rem] ${accent ? 'text-night/70' : 'text-ash'}`}>{sub}</p>}
    </div>
  ),
)

function Pipeline() {
  const box = useRef<HTMLDivElement>(null)
  const filings = useRef<HTMLDivElement>(null)
  const calls = useRef<HTMLDivElement>(null)
  const ratings = useRef<HTMLDivElement>(null)
  const lake = useRef<HTMLDivElement>(null)
  const sql = useRef<HTMLDivElement>(null)
  const claude = useRef<HTMLDivElement>(null)
  const voice = useRef<HTMLDivElement>(null)

  const beam = { containerRef: box, pathColor: '#ede6da', pathOpacity: 0.12, gradientStartColor: '#e8a33d', gradientStopColor: '#d9707e', duration: 4 }

  return (
    <div ref={box} className="relative flex flex-col items-center gap-10 rounded-2xl bg-night/60 p-6 ring-1 ring-line md:flex-row md:justify-between md:gap-6 md:p-10">
      <div className="flex gap-2 md:flex-col md:gap-5">
        <Node ref={filings} label="SEC filings" sub="10-Q, 8-K" />
        <Node ref={calls} label="Earnings calls" sub="transcripts" />
        <Node ref={ratings} label="Analyst ratings" sub="overnight" />
      </div>
      <Node ref={lake} label="Databricks" sub="ingest + retrieve" />
      <Node ref={sql} label="SQL" sub="every financial delta" />
      <Node ref={claude} label="Claude" sub="writes the story" />
      <Node ref={voice} label="10-minute podcast" sub="every day" accent />

      <AnimatedBeam {...beam} fromRef={filings} toRef={lake} curvature={-30} />
      <AnimatedBeam {...beam} fromRef={calls} toRef={lake} />
      <AnimatedBeam {...beam} fromRef={ratings} toRef={lake} curvature={30} />
      <AnimatedBeam {...beam} fromRef={lake} toRef={sql} delay={0.6} />
      <AnimatedBeam {...beam} fromRef={sql} toRef={claude} delay={1.2} />
      <AnimatedBeam {...beam} fromRef={claude} toRef={voice} delay={1.8} />
    </div>
  )
}

export function AccountSignals() {
  return (
    <section id="account-signals" className="mx-auto max-w-6xl px-4 py-28 sm:px-8">
      <SectionHeading title="Ten minutes of account intel, delivered by ear." />

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.15fr] md:items-start">
        <div className="space-y-5 text-[1.05rem] leading-relaxed text-bone/80">
          <p>
            Enterprise sellers face a deluge of filings, earnings calls, and analyst notes that almost nobody has time
            to read, so I built a pipeline that reads them instead and narrates the highlights as a 10-minute daily
            podcast.
          </p>
          <p>
            It ingests 700K+ signals in Databricks and computes financial deltas deterministically using SQL,{' '}
            <span className="text-bone">then uses LLMs to weave key facts into a digestible narrative.</span>
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href={links.accountSignalsApp} className="inline-flex items-center gap-2 text-marigold underline-offset-4 hover:underline">
              Open the live app <span aria-hidden>↗</span>
            </a>
            <a href={links.accountSignals} className="inline-flex items-center gap-2 text-marigold underline-offset-4 hover:underline">
              Code on GitHub <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
        <WaveformPlayer
          src={episode.audio}
          title={episode.title}
          meta={`${episode.account} · ${aired}`}
          transcript={episode.script}
        />
      </div>

      <div className="mt-10">
        <Pipeline />
      </div>
    </section>
  )
}
