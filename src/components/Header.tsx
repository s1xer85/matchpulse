import { useLocation } from 'react-router-dom'

const TITLES: Record<string, string> = {
  '/': 'MatchPulse',
  '/favorites': 'Favorites',
  '/calendar': 'Calendar',
  '/notifications': 'Notifications',
  '/settings': 'Settings'
}

export default function Header() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? 'MatchPulse'
  return (
    <header className="sticky top-0 z-20 bg-navy-950/90 backdrop-blur border-b border-white/5 px-5 py-4 safe-top">
      <h1 className="font-display text-lg font-semibold tracking-tight text-white">
        {title === 'MatchPulse' ? (
          <span>
            Match<span className="text-gold-500">Pulse</span>
          </span>
        ) : (
          title
        )}
      </h1>
    </header>
  )
}
