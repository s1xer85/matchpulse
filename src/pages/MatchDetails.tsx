import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getFixtureById } from '../lib/api'
import type { Fixture } from '../types'

export default function MatchDetails() {
  const { id } = useParams()
  const [fixture, setFixture] = useState<Fixture | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    getFixtureById(Number(id)).then((f) => setFixture(f ?? null))
  }, [id])

  if (fixture === undefined) {
    return <div className="px-5 py-8 text-center text-white/40 text-sm">Loading…</div>
  }

  if (fixture === null) {
    return (
      <div className="px-5 py-8 text-center space-y-3">
        <p className="text-sm text-white/60">Match not found.</p>
        <Link to="/" className="text-gold-500 text-sm">Back to home</Link>
      </div>
    )
  }

  const kickoff = new Date(fixture.date)

  return (
    <div className="px-5 py-4 space-y-6">
      <div className="rounded-2xl bg-navy-800 border border-white/5 p-5 text-center space-y-4">
        <p className="text-xs text-white/40">{fixture.competition.name}</p>
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 text-center">
            <img src={fixture.home.logo} className="w-12 h-12 mx-auto rounded-full bg-white/5 mb-2" alt="" />
            <p className="text-sm font-medium">{fixture.home.name}</p>
          </div>
          <p className="font-display text-2xl font-bold text-gold-400 tabular-nums">
            {fixture.status === 'NS'
              ? kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : `${fixture.homeGoals ?? 0} – ${fixture.awayGoals ?? 0}`}
          </p>
          <div className="flex-1 text-center">
            <img src={fixture.away.logo} className="w-12 h-12 mx-auto rounded-full bg-white/5 mb-2" alt="" />
            <p className="text-sm font-medium">{fixture.away.name}</p>
          </div>
        </div>
        <p className="text-xs text-white/40">
          {kickoff.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          {fixture.venue ? ` · ${fixture.venue}` : ''}
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center">
        <p className="text-sm text-white/50">
          Head-to-head, form, league position, and lineups are coming in a future update.
        </p>
      </div>
    </div>
  )
}
