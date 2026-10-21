import type { ActivePage } from '../types'

interface NavbarProps {
  active: ActivePage
  onNav: (page: ActivePage) => void
  backendOnline: boolean | null
}

export default function Navbar({ active, onNav, backendOnline }: NavbarProps) {
  const links: { id: ActivePage; label: string }[] = [
    { id: 'scanner',   label: 'Scanner' },
    { id: 'dashboard', label: 'Model Metrics' },
    { id: 'history',   label: 'History' },
    { id: 'about',     label: 'About' },
  ]

  return (
    <nav className="border-b border-zinc-800/80 bg-[#0e0f12]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Brand */}
        <button
          onClick={() => onNav('scanner')}
          className="flex items-center gap-2.5 group text-left transition-opacity hover:opacity-90"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center p-1 bg-zinc-800 border border-zinc-700/80 shadow-sm">
            <img src="/shield.svg" alt="PhishGuard" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-base text-zinc-100 tracking-tight flex items-center gap-1.5">
            <span>PhishGuard</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          </span>
        </button>

        {/* Nav links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {links.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onNav(id)}
              className={`nav-link ${active === id ? 'nav-link-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Backend status pill */}
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <span className={`w-2 h-2 rounded-full ${
            backendOnline === null ? 'bg-zinc-600 animate-pulse' :
            backendOnline ? 'bg-emerald-500' : 'bg-rose-500'
          }`} />
          <span className="hidden sm:inline text-xs text-zinc-400">
            {backendOnline === null ? 'Connecting' : backendOnline ? 'Engine Online' : 'Engine Offline'}
          </span>
        </div>
      </div>
    </nav>
  )
}
