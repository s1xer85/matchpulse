import { useEffect, useMemo, useState } from 'react'
import { getUpcomingFixtures } from '../lib/api'
import { getFavorites } from '../lib/db'
import type { Fixture, FavoriteTeam } from '../types'
import MatchCard from '../components/MatchCard'

function toIcs(fixtures: Fixture[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MatchPulse//EN'
  ]
  for (const f of fixtures) {
    const start = new Date(f.date)
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    lines.push(
      'BEGIN:VEVENT',
      `UID:matchpulse-${f.id}@matchpulse`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${f.home.name} vs ${f.away.name}`,
      `DESCRIPTION:${f.competition.name}`,
      `LOCATION:${f.venue ?? ''}`,
      'END:VEVENT'
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

function downloadIcs(fixtures: Fixture[]) {
  const blob = new Blob([toIcs(fixtures)], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'matchpulse-fixtures.ics'
  a.click()
  URL.revokeObjectURL(url)
}

export default function Calendar() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([])

  useEffect(() => {
    getUpcomingFixtures().then(setFixtures)
    getFavorites().then(setFavorites)
  }, [])

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.teamId)), [favorites])
  const relevant = fixtures.filter((f) => favoriteIds.has(f.home.id) || favoriteIds.has(f.away.id))

  const grouped = useMemo(() => {
    const map = new Map<string, Fixture[]>()
    for (const f of relevant) {
      const key = new Date(f.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return [...map.entries()]
  }, [relevant])

  return (
    <div className="px-5 py-4 space-y-6">
      <button
        onClick={() => downloadIcs(relevant)}
        disabled={relevant.length === 0}
        className="w-full rounded-xl bg-gold-600 disabled:bg-white/10 disabled:text-white/30 text-navy-950 font-semibold text-sm py-3"
      >
        Export to calendar (.ics)
      </button>

      {relevant.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-8">
          Follow a team to see their fixtures here.
        </p>
      ) : (
        grouped.map(([day, dayFixtures]) => (
          <section key={day}>
            <h2 className="font-display text-sm font-semibold text-white/90 mb-3">{day}</h2>
            <div className="space-y-2.5">
              {dayFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
