import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { WorksWheel } from '@/components/ui/works-wheel'
import { FlightCaption, SkyToggle } from '@/components/Sky'
import { preloadPage } from '@/pages/lazy'
import { instagramProfile, links, mirorraLinks, profile, projects, type Project } from '@/content'

const ease = [0.16, 1, 0.3, 1] as const
const items = projects.map((p) => ({ title: p.title, image: p.image, href: p.more.href }))

function MoreLink({ project }: { project: Project }) {
  const cls =
    'inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-medium text-night transition hover:bg-marigold'
  const label = (
    <>
      {project.more.label} <span aria-hidden>→</span>
    </>
  )
  return project.more.href.startsWith('/') ? (
    <Link to={project.more.href} className={cls}>{label}</Link>
  ) : (
    <a href={project.more.href} target="_blank" rel="noreferrer" className={cls}>{label}</a>
  )
}

function Summary({ project, onClose }: { project: Project; onClose: () => void }) {
  useEffect(() => preloadPage(project.more.href), [project])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button aria-label="Close summary" onClick={onClose} className="absolute inset-0 bg-night/60 backdrop-blur-[2px]" />
      <motion.article
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.5, ease }}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-night-2/95 ring-1 ring-line backdrop-blur-xl"
      >
        {project.slug === 'blog' ? (
          <div className="grid grid-cols-6 gap-1">
            {instagramProfile.posts.map((post) => (
              <a key={post.id} href={`${links.instagram}${post.kind}/${post.id}/`} className="block overflow-hidden">
                <img src={`/media/instagram/${post.id}.jpg`} alt={post.alt} className="aspect-[4/5] w-full object-cover transition duration-500 hover:scale-105" />
              </a>
            ))}
          </div>
        ) : (
          <img src={project.image} alt="" className="h-44 w-full object-cover sm:h-52" />
        )}
        <div className="p-6 sm:p-8">
          <h2 id="summary-title" className="font-display text-4xl font-light">{project.title}</h2>
          <div className="mt-4 space-y-3 leading-relaxed text-bone/80">
            {project.summary.map((p) => <p key={p}>{p}</p>)}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <MoreLink project={project} />
            {project.slug === 'mirorra' && (
              <Link to={mirorraLinks.beta} className="rounded-full px-5 py-2.5 text-sm ring-1 ring-marigold/60 transition hover:bg-marigold hover:text-night">
                Join the beta
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-night/70 text-bone ring-1 ring-line backdrop-blur transition hover:bg-night"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </motion.article>
    </motion.div>
  )
}

export function Home() {
  const [open, setOpen] = useState<number | null>(null)

  // On larger screens the wheel is the whole page, with nothing underneath to scroll to.
  // Phones get a list instead, which scrolls like any page (see `.wheel-page` in index.css).
  useEffect(() => {
    document.documentElement.classList.add('wheel-page')
    return () => document.documentElement.classList.remove('wheel-page')
  }, [])

  return (
    <main className="relative min-h-[100svh] sm:h-[100svh]">
      {/* A soft pool of shadow behind the name, so it reads over the brightest nebulae. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_34%_16%_at_50%_50%,rgba(3,4,12,0.78),rgba(3,4,12,0.35)_55%,transparent)] sm:block" />
      {/* The wheel needs room to turn; on phones the work is a plain list (below). */}
      <div className="absolute inset-0 hidden sm:block">
        <WorksWheel
          items={items}
          label={profile.name}
          action="Open"
          onSelect={(_, i) => setOpen(i)}
          className="bg-transparent font-display font-light [text-shadow:0_0_28px_rgba(3,4,12,0.95),0_0_8px_rgba(3,4,12,0.8)]"
        />
      </div>

      {/* Sits above the wheel (z-20) so the name stays readable while the cards spin past. */}
      <div className="relative z-20 px-4 pt-6 sm:pointer-events-none sm:absolute sm:left-8 sm:top-7 sm:max-w-[17rem] sm:p-0">
        <h1 className="font-display text-3xl font-light leading-none text-bone [text-shadow:0_0_18px_rgba(3,4,12,0.9)] sm:text-2xl">{profile.name}</h1>
        <p className="mt-1.5 text-sm text-bone/80">{profile.title}</p>
        <p className="mt-3 text-sm leading-snug text-ash">
          I believe technology is the closest thing we have to <span className="text-bone">magic in this world.</span>
        </p>
        <SkyToggle className="pointer-events-auto mt-4 w-fit" />
        <FlightCaption className="mt-2" />
      </div>

      <ul className="relative z-10 mt-8 space-y-3 px-4 sm:hidden" aria-label="Work">
        {projects.map((p, i) => (
          <li key={p.slug}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="flex w-full items-center gap-4 rounded-2xl bg-night-2/70 p-2.5 pr-4 text-left ring-1 ring-line backdrop-blur-md transition active:bg-night-2"
            >
              <img src={p.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
              <span className="flex-1 font-display text-xl font-light leading-tight">{p.title}</span>
              <span aria-hidden className="text-ash">→</span>
            </button>
          </li>
        ))}
      </ul>

      {/* On phones it follows the list, with room left for the music player below. */}
      <nav className="relative mt-10 flex gap-5 px-4 pb-24 text-sm text-ash sm:absolute sm:bottom-7 sm:right-8 sm:mt-0 sm:p-0" aria-label="Contact">
        <a href={`mailto:${links.email}`} className="hover:text-bone">Email</a>
        <a href={links.linkedin} className="hover:text-bone">LinkedIn</a>
        <a href={links.github} className="hover:text-bone">GitHub</a>
      </nav>

      {/* Portaled to <body>: the wheel's 3D cards form their own layers and would paint over it otherwise. */}
      {createPortal(
        <AnimatePresence>
          {open !== null && <Summary project={projects[open]} onClose={() => setOpen(null)} />}
        </AnimatePresence>,
        document.body,
      )}
    </main>
  )
}
