import { Navigate, Route, Routes } from 'react-router'
import { Sky } from '@/components/Sky'
import { MusicPlayer } from '@/components/MusicPlayer'
import { Home } from '@/pages/Home'
import { ProjectPage } from '@/pages/ProjectPage'
import { Resume } from '@/components/Resume'
import { AccountSignals } from '@/components/AccountSignals'
import { Mirorra } from '@/components/Mirorra'
import { Photography, Instagram } from '@/components/Life'
import { Travel } from '@/components/Travel'

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
          <Route path="/photography" element={<ProjectPage><Photography /><Instagram /></ProjectPage>} />
          <Route path="/fora" element={<ProjectPage><Travel /></ProjectPage>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {/* Lives outside the routes so the music keeps playing between pages. */}
      <MusicPlayer />
    </div>
  )
}
