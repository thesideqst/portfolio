import { motion } from 'motion/react'
import { Link } from 'react-router'
import { education, links, resumeProjects, resumeSummary, roles, skills } from '@/content'
import { SectionHeading } from './SectionHeading'

const dot =
  'relative pl-4 before:absolute before:left-0 before:top-[0.7em] before:size-1 before:rounded-full before:bg-marigold'
const row = 'grid gap-x-8 gap-y-2 py-8 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr]'
const label = 'font-mono text-xs text-ash sm:pt-1.5'

export function Resume() {
  return (
    <section id="resume" className="mx-auto max-w-6xl px-4 py-28 sm:px-8">
      <SectionHeading title="Aliya Renee Khan" />
      <p className="mt-6 max-w-3xl text-[1.05rem] leading-relaxed text-bone/80">{resumeSummary}</p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="mt-12 rounded-3xl bg-night-2 p-6 ring-1 ring-line sm:p-10"
      >
        <ol className="divide-y divide-line">
          {roles.map((r) => (
            <li key={r.org} className={row}>
              <p className={label}>{r.years}</p>
              <div>
                <h3 className="font-display text-2xl font-light">
                  {r.org} <span className="font-sans text-base text-ash">· {r.title}</span>
                </h3>
                <p className="mt-1 text-xs text-ash">{r.place}</p>
                <ul className="mt-4 space-y-2.5 text-[0.95rem] leading-relaxed text-bone/80">
                  {r.points.map((p) => (
                    <li key={p.lead} className={dot}>
                      <span className="text-bone">{p.lead}</span>
                      {p.rest && <> {p.rest}</>}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}

          <li className={row}>
            <p className={label}>Projects</p>
            <ul className="space-y-2.5 text-[0.95rem] leading-relaxed text-bone/80">
              {resumeProjects.map((p) => (
                <li key={p.name} className={dot}>
                  Built{' '}
                  <Link to={p.href} className="text-bone underline decoration-marigold/60 underline-offset-4 hover:decoration-marigold">
                    {p.name}
                  </Link>
                  , {p.text} <span className="text-ash">({p.stack})</span>
                </li>
              ))}
            </ul>
          </li>

          <li className={row}>
            <p className={label}>Education</p>
            <div className="space-y-1.5 text-[0.95rem] text-bone/80">
              {education.map((e) => (
                <p key={e.school}>
                  <span className="text-bone">{e.school}</span> · {e.degree}
                  {e.when && <span className="text-ash"> · {e.when}</span>}
                </p>
              ))}
            </div>
          </li>

          <li className={row}>
            <p className={label}>Skills</p>
            <dl className="space-y-3 text-[0.95rem] leading-relaxed text-bone/80">
              {skills.map((s) => (
                <div key={s.group}>
                  <dt className="inline text-bone">{s.group}: </dt>
                  <dd className="inline">{s.items}</dd>
                </div>
              ))}
            </dl>
          </li>
        </ol>
        <a href={links.linkedin} className="mt-10 inline-flex items-center gap-2 text-sm text-marigold underline-offset-4 hover:underline">
          LinkedIn <span aria-hidden>↗</span>
        </a>
      </motion.div>
    </section>
  )
}
