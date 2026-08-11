import { useEffect, useState } from 'react'
import { getGlobalPrefs, setGlobalPrefs } from '../lib/db'
import { requestPermission, offsetLabel } from '../lib/notifications'
import type { NotificationPrefs, ReminderOffset } from '../types'

const ALL_OFFSETS: ReminderOffset[] = ['1w', '1d', '2h', '30m', '15m', 'kickoff']

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    getGlobalPrefs().then(setPrefs)
    if ('Notification' in window) setPermission(Notification.permission)
  }, [])

  async function enableNotifications() {
    const result = await requestPermission()
    setPermission(result)
  }

  function toggleOffset(offset: ReminderOffset) {
    if (!prefs) return
    const has = prefs.offsets.includes(offset)
    const next = { ...prefs, offsets: has ? prefs.offsets.filter((o) => o !== offset) : [...prefs.offsets, offset] }
    setPrefs(next)
    setGlobalPrefs(next)
  }

  function toggleEvent(key: keyof NotificationPrefs['events']) {
    if (!prefs) return
    const next = { ...prefs, events: { ...prefs.events, [key]: !prefs.events[key] } }
    setPrefs(next)
    setGlobalPrefs(next)
  }

  if (!prefs) return null

  const eventLabels: [keyof NotificationPrefs['events'], string][] = [
    ['goals', 'Goals'],
    ['halfTime', 'Half-time'],
    ['fullTime', 'Full-time'],
    ['redCards', 'Red cards'],
    ['lineups', 'Lineups announced']
  ]

  return (
    <div className="px-5 py-4 space-y-6">
      {permission !== 'granted' && (
        <div className="rounded-2xl bg-navy-800 border border-gold-600/30 px-4 py-4 space-y-3">
          <p className="text-sm text-white/70">
            Turn on notifications to get match reminders on this device.
          </p>
          <button
            onClick={enableNotifications}
            className="w-full rounded-xl bg-gold-600 text-navy-950 font-semibold text-sm py-2.5"
          >
            Enable notifications
          </button>
        </div>
      )}

      <section>
        <h2 className="font-display text-sm font-semibold text-white/90 mb-3">Remind me</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_OFFSETS.map((offset) => (
            <button
              key={offset}
              onClick={() => toggleOffset(offset)}
              className={`rounded-full px-3.5 py-2 text-xs font-medium border ${
                prefs.offsets.includes(offset)
                  ? 'bg-gold-600/20 border-gold-500/50 text-gold-400'
                  : 'bg-navy-800 border-white/10 text-white/50'
              }`}
            >
              {offsetLabel(offset)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-sm font-semibold text-white/90 mb-3">Live events</h2>
        <div className="space-y-1">
          {eventLabels.map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/5">
              <span className="text-sm">{label}</span>
              <input
                type="checkbox"
                checked={prefs.events[key]}
                onChange={() => toggleEvent(key)}
                className="w-5 h-5 accent-gold-600"
              />
            </label>
          ))}
        </div>
      </section>

      <p className="text-xs text-white/30 px-1">
        Reminders are scheduled on this device and refresh each time you open the app.
        Keep MatchPulse installed and open it now and then so upcoming reminders stay current.
      </p>
    </div>
  )
}
