import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import ScannerPage from './pages/ScannerPage'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import AboutPage from './pages/AboutPage'
import { healthCheck } from './services/api'
import type { ActivePage } from './types'

export default function App() {
  const [page, setPage] = useState<ActivePage>('scanner')
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

  useEffect(() => {
    const check = () =>
      healthCheck()
        .then(() => setBackendOnline(true))
        .catch(() => setBackendOnline(false))
    check()
    const timer = setInterval(check, 8000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#0e0f12]">
      <Navbar active={page} onNav={setPage} backendOnline={backendOnline} />

      <main className="flex-1">
        {page === 'scanner'   && <ScannerPage />}
        {page === 'dashboard' && <DashboardPage />}
        {page === 'history'   && <HistoryPage />}
        {page === 'about'     && <AboutPage />}
      </main>

      <footer className="border-t border-zinc-900 py-6 text-center text-xs sm:text-sm text-zinc-500">
        PhishGuard-Stack · PCET&apos;s Pimpri Chinchwad University, Pune · Machine-learning predictions are screening indicators
      </footer>
    </div>
  )
}
