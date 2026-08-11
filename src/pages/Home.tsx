import { useEffect, useMemo, useState } from 'react'
import { getUpcomingFixtures, getFinishedFixtures } from '../lib/api'
import { getFavorites, getGlobalPrefs } from '../lib/db'
import { syncReminders } from '../lib/notifications'
import type { Fixture, FavoriteTeam } from '../types'
import MatchCard from '../components/MatchCard'
import CountdownScoreboard from '../components/CountdownScoreboard'

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

export default function Home() {
  const [upcoming, setUpcoming] = useState<Fixture[]>([])
  const [finished, setFinished] = useState<Fixture[]>([])
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [u, f, favs, prefs] = await Promise.all([
          getUpcomingFixtures(),
          getFinishedFixtures(),
          getFavorites(),
          getGlobalPrefs()
        ])
        setUpcoming(u)
        setFinished(f)
        setFavorites(favs)
        syncReminders(u, prefs)
      } catch (e) {
        setError('Could not load match data. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.teamId)), [favorites])

  const followedUpcoming = useMemo(
    () => upcoming.filter((m) => favoriteIds.has(m.home.id) || favoriteIds.has(m.away.id)),
    [upcoming, favoriteIds]
  )

  const nextFollowedMatch = followedUpcoming[0]

  const today = new Date()
  const todayFixtures = upcoming.filter((m) => isSameDay(new Date(m.date), today))
  const restUpcoming = upcoming.filter((m) => !isSameDay(new Date(m.date), today)).slice(0, 8)
  const recentResults = finished.slice(0, 6)

  if (loading) {
    return (
      <div className="px-5 py-8 text-center text-white/40 text-sm">Loading fixtures…</div>
    )
  }

  if (error) {
    return <div className="px-5 py-8 text-center text-white/60 text-sm">{error}</div>
  }

  return (
    <div className="px-5 py-4 space-y-8">
      {nextFollowedMatch && <CountdownScoreboard fixture={nextFollowedMatch} />}

      {favorites.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center">
          <p className="text-sm text-white/60">
            You're not following any teams yet. Head to Favorites to follow a club or national team.
          </p>
        </div>
      )}

      <section>
        <h2 className="font-display text-sm font-semibold text-white/90 mb-3">Today</h2>
        {todayFixtures.length === 0 ? (
          <p className="text-sm text-white/40">No matches scheduled today.</p>
        ) : (
          <div className="space-y-2.5">
            {todayFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-sm font-semibold text-white/90 mb-3">Upcoming</h2>
        <div className="space-y-2.5">
          {restUpcoming.map((f) => <MatchCard key={f.id} fixture={f} />)}
        </div>
      </section>

      <section>
        <h2 className="font-display text-sm font-semibold text-white/90 mb-3">Recent results</h2>
        <div className="space-y-2.5">
          {recentResults.map((f) => <MatchCard key={f.id} fixture={f} />)}
        </div>
      </section>
    </div>
  )
}
