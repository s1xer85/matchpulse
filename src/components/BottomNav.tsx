import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/favorites', label: 'Favorites', icon: '★' },
  { to: '/calendar', label: 'Calendar', icon: '▤' },
  { to: '/notifications', label: 'Alerts', icon: '◔' },
  { to: '/settings', label: 'Settings', icon: '⚙' }
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-navy-900/95 backdrop-blur border-t border-white/5 safe-bottom">
      <ul className="flex justify-between px-2">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                  isActive ? 'text-gold-500' : 'text-white/50'
                }`
              }
            >
              <span className="text-lg leading-none" aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
