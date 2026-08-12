#!/usr/bin/env node
// Pulls fixtures from football-data.org and writes static JSON into
// public/data/. Runs inside GitHub Actions on a schedule — the token
// stays a repo secret and is never shipped to the browser.
//
// Env: FOOTBALL_DATA_ORG_TOKEN (required)
//
// Free tier covers 12 major competitions and the CURRENT season (unlike
// API-Football's free tier, which is locked to old test seasons). Rate
// limit is 10 requests/minute, so calls are spaced out below.

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const TOKEN = process.env.FOOTBALL_DATA_ORG_TOKEN
const API_BASE = 'https://api.football-data.org/v4'
const OUT_DIR = path.resolve('public/data')

const DAYS_BACK = 10
const DAYS_FORWARD = 45

// The 12 competitions available on the football-data.org free tier.
const COMPETITIONS = [
  'PL',  // Premier League (England)
  'PD',  // La Liga (Spain)
  'BL1', // Bundesliga (Germany)
  'SA',  // Serie A (Italy)
  'FL1', // Ligue 1 (France)
  'DED', // Eredivisie (Netherlands)
  'PPL', // Primeira Liga (Portugal)
  'ELC', // Championship (England)
  'BSA', // Brasileirão Série A (Brazil)
  'CL',  // UEFA Champions League
  'EC',  // European Championship
  'WC'   // World Cup
]

if (!TOKEN) {
  console.error('Missing FOOTBALL_DATA_ORG_TOKEN environment variable.')
  process.exit(1)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

async function apiGet(endpoint, params) {
  const url = new URL(`${API_BASE}${endpoint}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, { headers: { 'X-Auth-Token': TOKEN } })
  if (!res.ok) {
    const body = await res.text()
    console.error(`football-data.org ${endpoint} failed: ${res.status} — ${body}`)
    return []
  }
  const json = await res.json()
  return json.matches ?? []
}

function mapStatus(status) {
  if (status === 'IN_PLAY') return 'LIVE'
  if (status === 'PAUSED') return 'HT'
  if (status === 'FINISHED' || status === 'AWARDED') return 'FT'
  if (status === 'POSTPONED' || status === 'SUSPENDED') return 'PST'
  if (status === 'CANCELLED') return 'CANC'
  return 'NS' // SCHEDULED, TIMED
}

function mapFixture(raw) {
  return {
    id: raw.id,
    date: raw.utcDate,
    status: mapStatus(raw.status),
    minute: raw.minute ?? undefined,
    venue: raw.venue ?? undefined,
    competition: {
      id: raw.competition.id,
      name: raw.competition.name,
      logo: raw.competition.emblem,
      country: raw.area?.name ?? raw.competition.name
    },
    home: { id: raw.homeTeam.id, name: raw.homeTeam.name, logo: raw.homeTeam.crest },
    away: { id: raw.awayTeam.id, name: raw.awayTeam.name, logo: raw.awayTeam.crest },
    homeGoals: raw.score?.fullTime?.home ?? null,
    awayGoals: raw.score?.fullTime?.away ?? null
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const today = new Date()
  const from = new Date(today); from.setDate(from.getDate() - DAYS_BACK)
  const to = new Date(today); to.setDate(to.getDate() + DAYS_FORWARD)

  const allFixtureMap = new Map()

  for (let i = 0; i < COMPETITIONS.length; i++) {
    const code = COMPETITIONS[i]
    const rows = await apiGet(`/competitions/${code}/matches`, {
      dateFrom: isoDate(from),
      dateTo: isoDate(to)
    })
    for (const raw of rows) {
      const mapped = mapFixture(raw)
      allFixtureMap.set(mapped.id, mapped)
    }
    // Stay comfortably under the 10 requests/minute free-tier limit.
    if (i < COMPETITIONS.length - 1) await sleep(6500)
  }

  const all = [...allFixtureMap.values()]
  const finished = all.filter((f) => f.status === 'FT')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const upcoming = all.filter((f) => f.status === 'NS')
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const meta = {
    generatedAt: new Date().toISOString(),
    source: 'football-data.org',
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
