#!/usr/bin/env node
// Builds a searchable club/country directory independent of the fixtures
// window, so users can follow any team even if it doesn't have a match
// in the next 45 days. Runs once a day (separate from the 4x/day fixtures
// refresh) to stay well within the free-tier 100 requests/day cap.
//
// Env: API_FOOTBALL_KEY (required)

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const API_KEY = process.env.API_FOOTBALL_KEY
const API_BASE = 'https://v3.football.api-sports.io'
const OUT_DIR = path.resolve('public/data')
const SEASON = 2026

// Curated set of major leagues/competitions + national teams (World Cup).
// One API request per entry (~20 requests/day total for this script).
const LEAGUES = [
  { id: 39, name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 135, name: 'Serie A' },
  { id: 78, name: 'Bundesliga' },
  { id: 61, name: 'Ligue 1' },
  { id: 94, name: 'Primeira Liga' },
  { id: 88, name: 'Eredivisie' },
  { id: 203, name: 'Süper Lig' },
  { id: 71, name: 'Brasileirão Série A' },
  { id: 128, name: 'Liga Profesional Argentina' },
  { id: 262, name: 'Liga MX' },
  { id: 253, name: 'Major League Soccer' },
  { id: 307, name: 'Saudi Pro League' },
  { id: 98, name: 'J1 League' },
  { id: 292, name: 'K League 1' },
  { id: 239, name: 'Categoría Primera A' },
  { id: 2, name: 'UEFA Champions League' },
  { id: 3, name: 'UEFA Europa League' },
  { id: 848, name: 'UEFA Europa Conference League' },
  { id: 1, name: 'World Cup' }
]

if (!API_KEY) {
  console.error('Missing API_FOOTBALL_KEY environment variable.')
  process.exit(1)
}

async function apiGet(endpoint, params) {
  const url = new URL(`${API_BASE}${endpoint}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, { headers: { 'x-apisports-key': API_KEY } })
  if (!res.ok) {
    console.error(`API-Football ${endpoint} (league ${params.league}) failed: ${res.status}`)
    return []
  }
  const json = await res.json()
  if (json.errors && Object.keys(json.errors).length > 0) {
    console.error(`API-Football errors for league ${params.league}:`, JSON.stringify(json.errors))
  }
  return json.response ?? []
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const teamMap = new Map() // dedupe by team id across competitions

  for (const league of LEAGUES) {
    const rows = await apiGet('/teams', { league: league.id, season: SEASON })
    for (const row of rows) {
      const t = row.team
      if (!t?.id || teamMap.has(t.id)) continue
      teamMap.set(t.id, {
        id: t.id,
        name: t.name,
        logo: t.logo,
        country: t.country ?? league.name,
        isNational: t.national === true
      })
    }
  }

  const teams = [...teamMap.values()].sort((a, b) => a.name.localeCompare(b.name))
  const countries = [...new Set(teams.map((t) => t.country))].sort()

  await writeFile(path.join(OUT_DIR, 'teams.json'), JSON.stringify(teams, null, 2))
  await writeFile(
    path.join(OUT_DIR, 'teams-meta.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), teamCount: teams.length, countries }, null, 2)
  )

  console.log(`Wrote ${teams.length} teams across ${countries.length} countries.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
