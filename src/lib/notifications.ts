// v1 uses the browser Notification API, scheduled client-side with setTimeout
// and re-synced every time the app is opened. This is NOT true push (the
// phone must have the PWA open or backgrounded, not fully closed/killed) —
// see the README "Planned" section for the true-push upgrade path.
import type { Fixture, ReminderOffset, NotificationPrefs } from '../types'

const OFFSET_MS: Record<ReminderOffset, number> = {
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  kickoff: 0
}

const OFFSET_LABEL: Record<ReminderOffset, string> = {
  '1w': '1 week before',
  '1d': '1 day before',
  '2h': '2 hours before',
  '30m': '30 minutes before',
  '15m': '15 minutes before',
  kickoff: 'At kickoff'
}

export function offsetLabel(offset: ReminderOffset): string {
  return OFFSET_LABEL[offset]
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'default') {
    return Notification.requestPermission()
  }
  return Notification.permission
}

const scheduled = new Set<string>()

function scheduleOne(key: string, fireAt: number, title: string, body: string) {
  if (scheduled.has(key)) return
  const delay = fireAt - Date.now()
  if (delay <= 0 || delay > 2_147_000_000) return // setTimeout max ~24.8 days
  scheduled.add(key)
  window.setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: `${import.meta.env.BASE_URL}icons/icon-192.png` })
    }
    scheduled.delete(key)
  }, delay)
}

/** Call on app load and whenever fixtures/prefs change to (re)schedule reminders. */
export function syncReminders(fixtures: Fixture[], prefs: NotificationPrefs) {
  if (Notification.permission !== 'granted') return
  const kickoffTimes = new Set<number>()
  for (const fixture of fixtures) {
    const kickoff = new Date(fixture.date).getTime()
    if (kickoffTimes.has(kickoff)) continue
    for (const offset of prefs.offsets) {
      const fireAt = kickoff - OFFSET_MS[offset]
      const key = `${fixture.id}:${offset}`
      scheduleOne(
        key,
        fireAt,
        `${fixture.home.name} vs ${fixture.away.name}`,
        `${offsetLabel(offset)} — ${fixture.competition.name}`
      )
    }
  }
}
