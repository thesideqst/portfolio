import { motion } from 'motion/react'

export function SectionHeading({ title }: { title: string }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="max-w-3xl font-display text-[clamp(2rem,5vw,3.75rem)] font-light leading-[1.02] tracking-tight">
        {title}
      </h2>
    </motion.header>
  )
}
