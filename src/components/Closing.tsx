import { motion } from 'motion/react'
import { links } from '@/content'
import { SectionHeading } from './SectionHeading'

export function Background() {
  return (
    <section id="background" className="mx-auto max-w-6xl px-4 py-28 sm:px-8">
      <SectionHeading title="Frameworks can be well-built, but people are messy." />
      <div className="mt-12 grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="space-y-5 text-[1.05rem] leading-relaxed text-bone/80"
        >
          <p>
            Once upon a time, surprisingly many years ago, a naive young woman made her way to Dehradun, India with one
            goal: define a standard policy for ethical production that could help consumers understand if their
            clothing was produced in a sweatshop.
          </p>
          <p>
            Every idea I had about ethics dissolved when I asked the women knitting scarves what made their conditions
            “ethical,” and they laughed and wondered why I would ask something so ridiculous. I walked out of India with
            a much more nuanced understanding of how to implement a policy or program.
          </p>
          <p className="text-bone">That’s what’s intriguing about humanity.</p>
        </motion.div>
        <motion.blockquote
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.15 }}
          className="self-start border-l-2 border-marigold pl-6 font-display text-[clamp(1.35rem,2.4vw,1.75rem)] font-light leading-snug"
        >
          What will AI mean to the people who deploy it, the people impacted by it, and for humanity as a whole?
        </motion.blockquote>
      </div>
    </section>
  )
}

export function Contact() {
  return (
    <footer id="contact" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-28 sm:px-8">
        <p className="max-w-xl text-[1.05rem] text-bone/80">If you made it all the way down here, thank you, and I’d love to hear from you.</p>
        <a
          href={`mailto:${links.email}`}
          className="group mt-6 block font-display text-[clamp(1.5rem,5.4vw,4.25rem)] font-light leading-none tracking-tight [overflow-wrap:anywhere]"
        >
          <span className="bg-[linear-gradient(var(--color-marigold),var(--color-marigold))] bg-[length:0%_2px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-[length:100%_2px]">
            {links.email}
          </span>
        </a>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 text-sm text-ash">
          <div className="flex gap-6">
            <a href={links.linkedin} className="hover:text-bone">LinkedIn</a>
            <a href={links.github} className="hover:text-bone">GitHub</a>
            <a href={links.instagram} className="hover:text-bone">Instagram</a>
          </div>
          <p>© 2026 Aliya Renee Khan</p>
        </div>
      </div>
    </footer>
  )
}
