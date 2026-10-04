import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { media } from '@/content'
import { SectionHeading } from './SectionHeading'

/** Shows the clips that exist in /public/media, with placeholder frames for any not yet added. */
export function Experiments() {
  const [clips, setClips] = useState<typeof media.runway>([])

  useEffect(() => {
    Promise.all(
      media.runway.map((c) => fetch(c.src, { method: 'HEAD' }).then((r) => (r.ok && r.headers.get('content-type')?.startsWith('video') ? c : null)).catch(() => null)),
    ).then((found) => setClips(found.filter((c): c is (typeof media.runway)[number] => c !== null)))
  }, [])

  return (
    <section id="experiments" className="mx-auto max-w-6xl px-4 py-28 sm:px-8">
      <SectionHeading title="Cinema, minus the studio budget." />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {media.runway.slice(clips.length).map((c) => (
          <div key={c.src} className="grid aspect-video place-items-center rounded-2xl border border-dashed border-line bg-night-2/60">
            <span className="font-mono text-[0.7rem] tracking-widest text-ash/70">CLIP COMING SOON</span>
          </div>
        ))}
        {clips.map((c, i) => (
          <motion.figure
            key={c.src}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ delay: i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="group"
          >
            <div className="overflow-hidden rounded-2xl ring-1 ring-line">
              <video
                src={c.src}
                muted
                loop
                playsInline
                preload="metadata"
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => e.currentTarget.pause()}
                onFocus={(e) => e.currentTarget.play()}
                controls
                className="aspect-video w-full object-cover transition duration-700 group-hover:scale-[1.02]"
              />
            </div>
            <figcaption className="mt-3 flex justify-between gap-4 text-sm">
              <span>{c.title}</span>
              <span className="text-ash">{c.note}</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  )
}
