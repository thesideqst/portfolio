import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Contact } from '@/components/Closing'
import { SkyToggle } from '@/components/Sky'
import { profile } from '@/content'

/** Shell for each project's in-depth page: a way back to the wheel, the content, and contact. */
export function ProjectPage({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 bg-gradient-to-b from-night via-night/80 to-transparent">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
          <Link to="/" className="group flex items-center gap-2 text-sm text-bone/85 hover:text-bone">
            <span aria-hidden className="transition-transform group-hover:-translate-x-1">←</span> All work
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="font-display text-lg font-light text-bone">{profile.name}</Link>
            <SkyToggle />
          </div>
        </div>
      </header>
      <main className="pt-10">{children}</main>
      <Contact />
    </>
  )
}
