import { useEffect, useMemo, useState } from 'react'
import { getUpcomingFixtures } from '../lib/api'
import { getFavorites, addFavorite, removeFavorite } from '../lib/db'
import type { FavoriteTeam, Team } from '../types'

const DATA_BASE = `${import.meta.env.BASE_URL}data`

async function loadDirectory(): Promise<Team[]> {
  try {
    const res = await fetch(`${DATA_BASE}/teams.json?t=${Date.now()}`)
    if (!res.ok) throw new Error('no directory yet')
    return res.json()
  } catch {
    // Fallback: derive from current fixtures if the directory hasn't
    // been generated yet (e.g. update-teams.yml hasn't run).
    const fixtures = await getUpcomingFixtures()
    const map = new Map<number, Team>()
    for (const f of fixtures) {
      map.set(f.home.id, f.home)
      map.set(f.away.id, f.away)
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    getFavorites().then(setFavorites)
    loadDirectory().then(setAllTeams)
  }, [])

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.teamId)), [favorites])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allTeams
    return allTeams.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.country ?? '').toLowerCase().includes(q)
    )
  }, [allTeams, query])

  const grouped = useMemo(() => {
    const map = new Map<string, Team[]>()
    for (const team of filtered) {
      const key = team.country || 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(team)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  async function toggle(team: Team) {
    if (favoriteIds.has(team.id)) {
      setFavorites(await removeFavorite(team.id))
    } else {
      setFavorites(
        await addFavorite({ teamId: team.id, name: team.name, logo: team.logo, addedAt: new Date().toISOString() })
      )
    }
  }

  return (
    <div className="px-5 py-4 space-y-5">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search clubs, national teams, or countries"
        className="w-full rounded-xl bg-navy-800 border border-white/10 px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
      />

      {favorites.length > 0 && (
        <section>
          <h2 className="font-display text-sm font-semibold text-white/90 mb-3">
            Following ({favorites.length})
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {favorites.map((f) => (
              <button
                key={f.teamId}
                onClick={() => toggle({ id: f.teamId, name: f.name, logo: f.logo })}
                className="flex items-center gap-2.5 rounded-xl bg-navy-800 border border-gold-600/30 px-3 py-2.5 text-left"
              >
                <img src={f.logo} className="w-7 h-7 rounded-full bg-white/5" alt="" />
                <span className="text-sm font-medium truncate flex-1">{f.name}</span>
                <span className="text-gold-500">★</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {allTeams.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-8">Loading team directory…</p>
      ) : (
        grouped.map(([country, teams]) => (
          <section key={country}>
            <h2 className="font-display text-sm font-semibold text-white/90 mb-3">{country}</h2>
            <div className="space-y-1.5">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => toggle(team)}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5"
                >
                  <img src={team.logo} className="w-7 h-7 rounded-full bg-white/5" alt="" />
                  <span className="text-sm flex-1 text-left">{team.name}</span>
                  <span className={favoriteIds.has(team.id) ? 'text-gold-500' : 'text-white/20'}>★</span>
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
                                            }
