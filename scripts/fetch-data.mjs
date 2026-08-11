#!/usr/bin/env node
// Pulls fixtures from API-Football (api-sports.io) and writes static JSON
// into public/data/. Runs inside GitHub Actions on a schedule — the API
// key stays a repo secret and is never shipped to the browser.
//
// Env: API_FOOTBALL_KEY (required)
//
// Free tier is 100 requests/day. This script is written to use ~1-3
// requests per run (one call per date range needed), well under the
// ~20/refresh x 4/day budget described in the README.

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const API_KEY = process.env.API_FOOTBALL_KEY
const API_BASE = 'https://v3.football.api-sports.io'
const OUT_DIR = path.resolve('public/data')

if (!API_KEY) {
  console.error('Missing API_FOOTBALL_KEY environment variable.')
  process.exit(1)
}

async function apiGet(endpoint, params) {
  const url = new URL(`${API_BASE}${endpoint}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, { headers: { 'x-apisports-key': API_KEY } })
  if (!res.ok) throw new Error(`API-Football ${endpoint} failed: ${res.status}`)
  const json = await res.json()
  return json.response ?? []
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
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

  const today = new Date()
  const past = new Date(today); past.setDate(past.getDate() - 3)
  const future = new Date(today); future.setDate(future.getDate() + 14)

  // All countries/competitions including friendlies, per the app's data plan.
  const [pastRaw, futureRaw] = await Promise.all([
    apiGet('/fixtures', { from: isoDate(past), to: isoDate(today) }),
    apiGet('/fixtures', { from: isoDate(today), to: isoDate(future) })
  ])

  const finished = pastRaw.map(mapFixture).filter((f) => f.status === 'FT')
  const upcoming = futureRaw.map(mapFixture).filter((f) => f.status === 'NS')
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const meta = {
    generatedAt: new Date().toISOString(),
    source: 'api-football.com',
    fixtureCount: finished.length + upcoming.length
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
