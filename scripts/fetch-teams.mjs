#!/usr/bin/env node
// Builds a searchable club/country directory from football-data.org.
// Env: FOOTBALL_DATA_ORG_TOKEN (required)

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const TOKEN = process.env.FOOTBALL_DATA_ORG_TOKEN
const API_BASE = 'https://api.football-data.org/v4'
const OUT_DIR = path.resolve('public/data')

const COMPETITIONS = ['PL', 'PD', 'BL1', 'SA', 'FL1', 'DED', 'PPL', 'ELC', 'BSA', 'CL', 'EC', 'WC']

if (!TOKEN) {
  console.error('Missing FOOTBALL_DATA_ORG_TOKEN environment variable.')
  process.exit(1)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, { headers: { 'X-Auth-Token': TOKEN } })
  if (!res.ok) {
    const body = await res.text()
    console.error(`football-data.org ${endpoint} failed: ${res.status} — ${body}`)
    return []
  }
  const json = await res.json()
  return json.teams ?? []
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const teamMap = new Map()

  for (let i = 0; i < COMPETITIONS.length; i++) {
    const code = COMPETITIONS[i]
    const rows = await apiGet(`/competitions/${code}/teams`)
    for (const t of rows) {
      if (!t?.id || teamMap.has(t.id)) continue
      teamMap.set(t.id, {
        id: t.id,
        name: t.name,
        logo: t.crest,
        country: t.area?.name ?? code,
        isNational: t.name === t.area?.name
      })
    }
    if (i < COMPETITIONS.length - 1) await sleep(6500)
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
