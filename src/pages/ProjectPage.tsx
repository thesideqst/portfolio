import { Suspense, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Contact } from '@/components/Closing'
import { SkyToggle } from '@/components/Sky'
import { profile } from '@/content'

/** Shell for each project's in-depth page: a way back to the wheel, the content, and contact. */
export function ProjectPage({ children }: { children: ReactNode }) {
  useEffect(() => {
    // A link to a spot on the page (e.g. /mirorra#beta) scrolls there itself.
    if (!window.location.hash) window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 bg-gradient-to-b from-night via-night/80 to-transparent">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
          <Link to="/" aria-label="All work" className="group flex shrink-0 items-center gap-2 text-sm text-bone/85 hover:text-bone">
            <span aria-hidden className="text-lg transition-transform group-hover:-translate-x-1 sm:text-sm">←</span>
            <span className="hidden sm:inline">All work</span>
          </Link>
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link to="/" className="truncate whitespace-nowrap font-display text-lg font-light text-bone">{profile.name}</Link>
            <SkyToggle compact />
          </div>
        </div>
      </header>
      <main className="pt-10">
        {/* Holds the page open while its code loads, so the footer doesn't jump up. */}
        <Suspense fallback={<div className="min-h-[100svh]" />}>{children}</Suspense>
      </main>
      <Contact />
    </>
  )
}
