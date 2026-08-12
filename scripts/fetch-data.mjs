#!/usr/bin/env node
// Pulls fixtures from API-Football (api-sports.io) and writes static JSON
// into public/data/. Runs inside GitHub Actions on a schedule — the API
// key stays a repo secret and is never shipped to the browser.
//
// Env: API_FOOTBALL_KEY (required)
//
// IMPORTANT: the free plan does not reliably return results for a bare
// from/to date range across all competitions. Fixtures must be requested
// per league + season instead (same pattern as fetch-teams.mjs), then
// filtered locally to the date window we care about.

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const API_KEY = process.env.API_FOOTBALL_KEY
const API_BASE = 'https://v3.football.api-sports.io'
const OUT_DIR = path.resolve('public/data')
const SEASON = 2026

const DAYS_BACK = 10
const DAYS_FORWARD = 45

// Same curated league list as fetch-teams.mjs, kept in sync so the
// fixtures shown match the clubs available to follow.
const LEAGUES = [
  39, 140, 135, 78, 61, 94, 88, 203, 71, 128,
  262, 253, 307, 98, 292, 239, 2, 3, 848, 1
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

function mapFixture(raw) {
  return {
    id: raw.fixture.id,
    date: raw.fixture.date,
    status: mapStatus(raw.fixture.status.short),
    minute: raw.fixture.status.elapsed ?? undefined,
    venue: raw.fixture.venue?.name ?? undefined,
    competition: {
      id: raw.league.id,
      name: raw.league.name,
      logo: raw.league.logo,
      country: raw.league.country
    },
    home: { id: raw.teams.home.id, name: raw.teams.home.name, logo: raw.teams.home.logo },
    away: { id: raw.teams.away.id, name: raw.teams.away.name, logo: raw.teams.away.logo },
    homeGoals: raw.goals.home,
    awayGoals: raw.goals.away
  }
}

function mapStatus(short) {
  if (['1H', '2H', 'ET', 'P', 'LIVE'].includes(short)) return 'LIVE'
  if (short === 'HT') return 'HT'
  if (short === 'FT' || short === 'AET' || short === 'PEN') return 'FT'
  if (short === 'PST') return 'PST'
  if (['CANC', 'ABD', 'AWD', 'WO'].includes(short)) return 'CANC'
  return 'NS'
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const now = Date.now()
  const windowStart = now - DAYS_BACK * 86400000
  const windowEnd = now + DAYS_FORWARD * 86400000

  const allFixtureMap = new Map()

  for (const leagueId of LEAGUES) {
    const rows = await apiGet('/fixtures', { league: leagueId, season: SEASON })
    for (const raw of rows) {
      const mapped = mapFixture(raw)
      const t = new Date(mapped.date).getTime()
      if (t < windowStart || t > windowEnd) continue
      allFixtureMap.set(mapped.id, mapped)
    }
  }

  const all = [...allFixtureMap.values()]
  const finished = all.filter((f) => f.status === 'FT')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const upcoming = all.filter((f) => f.status === 'NS')
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const meta = {
    generatedAt: new Date().toISOString(),
    source: 'api-football.com',
    fixtureCount: finished.length + upcoming.length,
    windowDaysBack: DAYS_BACK,
    windowDaysForward: DAYS_FORWARD
  }

  await writeFile(path.join(OUT_DIR, 'upcoming.json'), JSON.stringify(upcoming, null, 2))
  await writeFile(path.join(OUT_DIR, 'finished.json'), JSON.stringify(finished, null, 2))
  await writeFile(path.join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2))

  console.log(`Wrote ${upcoming.length} upcoming and ${finished.length} finished fixtures.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
