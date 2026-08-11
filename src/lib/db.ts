// Thin wrapper over IndexedDB (via idb-keyval) for on-device-only storage.
// Nothing here ever leaves the device — no accounts, no server sync (v1).
import { get, set, del, keys } from 'idb-keyval'
import type { FavoriteTeam, NotificationPrefs } from '../types'

const FAVORITES_KEY = 'matchpulse:favorites'
const PREFS_PREFIX = 'matchpulse:prefs:' // per-team notification prefs
const GLOBAL_PREFS_KEY = 'matchpulse:prefs:global'

export async function getFavorites(): Promise<FavoriteTeam[]> {
  return (await get(FAVORITES_KEY)) ?? []
}

export async function addFavorite(team: FavoriteTeam): Promise<FavoriteTeam[]> {
  const current = await getFavorites()
  if (current.some((t) => t.teamId === team.teamId)) return current
  const next = [...current, team]
  await set(FAVORITES_KEY, next)
  return next
}

export async function removeFavorite(teamId: number): Promise<FavoriteTeam[]> {
  const current = await getFavorites()
  const next = current.filter((t) => t.teamId !== teamId)
  await set(FAVORITES_KEY, next)
  await del(`${PREFS_PREFIX}${teamId}`)
  return next
}

export async function isFavorite(teamId: number): Promise<boolean> {
  const current = await getFavorites()
  return current.some((t) => t.teamId === teamId)
}

const DEFAULT_PREFS: NotificationPrefs = {
  offsets: ['1d', '2h', '15m'],
  events: { goals: true, halfTime: false, fullTime: true, redCards: true, lineups: false }
}

export async function getGlobalPrefs(): Promise<NotificationPrefs> {
  return (await get(GLOBAL_PREFS_KEY)) ?? DEFAULT_PREFS
}

export async function setGlobalPrefs(prefs: NotificationPrefs): Promise<void> {
  await set(GLOBAL_PREFS_KEY, prefs)
}

export async function clearAllData(): Promise<void> {
  const allKeys = await keys()
  await Promise.all(
    allKeys
      .filter((k) => typeof k === 'string' && k.startsWith('matchpulse:'))
      .map((k) => del(k))
  )
}
