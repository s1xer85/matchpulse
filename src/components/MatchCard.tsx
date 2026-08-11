import { Link } from 'react-router-dom'
import type { Fixture } from '../types'

function localTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function localDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function MatchCard({ fixture }: { fixture: Fixture }) {
  const isLive = fixture.status === 'LIVE' || fixture.status === 'HT'
  const isFinished = fixture.status === 'FT'

  return (
    <Link
      to={`/match/${fixture.id}`}
      className="block rounded-2xl bg-navy-800 border border-white/5 px-4 py-3.5 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-medium text-white/50 truncate">
          {fixture.competition.name}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-gold-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
            {fixture.status === 'HT' ? 'HT' : `${fixture.minute ?? ''}'`}
          </span>
        ) : (
          <span className="text-[11px] text-white/40">
            {isFinished ? 'FT' : `${localDate(fixture.date)} · ${localTime(fixture.date)}`}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <img src={fixture.home.logo} alt="" className="w-6 h-6 rounded-full object-contain bg-white/5" />
          <span className="text-sm font-medium truncate">{fixture.home.name}</span>
        </div>
        <span className="font-display text-sm font-semibold tabular-nums text-white/90 px-2">
          {isLive || isFinished ? `${fixture.homeGoals ?? 0} – ${fixture.awayGoals ?? 0}` : 'vs'}
        </span>
        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium truncate text-right">{fixture.away.name}</span>
          <img src={fixture.away.logo} alt="" className="w-6 h-6 rounded-full object-contain bg-white/5" />
        </div>
      </div>
    </Link>
  )
}
