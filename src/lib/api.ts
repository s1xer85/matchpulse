// Reads the static JSON produced by scripts/fetch-data.mjs and committed
// by the "Refresh match data" GitHub Action. No API key ships to the browser.
import type { Fixture, DataMeta } from '../types'

// import.meta.env.BASE_URL respects vite's `base` config (the repo name path)
// so this works both in local dev and on GitHub Pages.
const DATA_BASE = `${import.meta.env.BASE_URL}data`

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${DATA_BASE}/${path}?t=${Date.now()}`)
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export async function getUpcomingFixtures(): Promise<Fixture[]> {
  return fetchJson<Fixture[]>('upcoming.json')
}

export async function getFinishedFixtures(): Promise<Fixture[]> {
  return fetchJson<Fixture[]>('finished.json')
}

export async function getMeta(): Promise<DataMeta> {
  return fetchJson<DataMeta>('meta.json')
}

export async function getFixtureById(id: number): Promise<Fixture | undefined> {
  const [upcoming, finished] = await Promise.all([getUpcomingFixtures(), getFinishedFixtures()])
  return [...upcoming, ...finished].find((f) => f.id === id)
}

export function fixturesForTeam(fixtures: Fixture[], teamId: number): Fixture[] {
  return fixtures.filter((f) => f.home.id === teamId || f.away.id === teamId)
}
