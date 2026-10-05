import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Sky } from '@/components/Sky'
import { MusicPlayer } from '@/components/MusicPlayer'
import { Home } from '@/pages/Home'
import { ProjectPage } from '@/pages/ProjectPage'

// Each project page loads its own code when it's opened, so the homepage doesn't
// carry the map data, d3 or the gallery wall.
const Resume = lazy(() => import('@/components/Resume').then((m) => ({ default: m.Resume })))
const AccountSignals = lazy(() => import('@/components/AccountSignals').then((m) => ({ default: m.AccountSignals })))
const Mirorra = lazy(() => import('@/components/Mirorra').then((m) => ({ default: m.Mirorra })))
const Photography = lazy(() =>
  import('@/components/Life').then((m) => ({
    default: () => (
      <>
        <m.Photography />
        <m.Instagram />
      </>
    ),
  })),
)
const Travel = lazy(() => import('@/components/Travel').then((m) => ({ default: m.Travel })))

export default function App() {
  return (
    <div>
      <Sky />
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<ProjectPage><Resume /></ProjectPage>} />
          <Route path="/account-signals" element={<ProjectPage><AccountSignals /></ProjectPage>} />
          <Route path="/mirorra" element={<ProjectPage><Mirorra /></ProjectPage>} />
          <Route path="/photography" element={<ProjectPage><Photography /></ProjectPage>} />
          <Route path="/fora" element={<ProjectPage><Travel /></ProjectPage>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {/* Lives outside the routes so the music keeps playing between pages. */}
      <MusicPlayer />
    </div>
  )
}
