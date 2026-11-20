import { motion } from 'motion/react'
import { essays } from '@/content'
import { SectionHeading } from './SectionHeading'

export function KnowledgeWork() {
  return (
    <section id="knowledge-work" className="mx-auto max-w-6xl px-4 py-28 sm:px-8">
      <SectionHeading title="What AI costs, and what it’s worth." />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {essays.map((e, i) => (
          <motion.a
            key={e.href}
            href={e.href}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ delay: i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="group flex flex-col rounded-3xl bg-night-2 p-6 ring-1 ring-line transition hover:ring-marigold/50 sm:p-8"
          >
            <h3 className="font-display text-3xl font-light leading-tight text-bone">{e.title}</h3>
            {e.subtitle && <p className="mt-2 text-sm text-ash">{e.subtitle}</p>}
            <p className="mt-5 text-[0.95rem] leading-relaxed text-bone/80">{e.blurb}</p>
            <span className="mt-auto pt-6 text-sm text-marigold">
              Read <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </span>
          </motion.a>
        ))}
      </div>
    </section>
  )
}
