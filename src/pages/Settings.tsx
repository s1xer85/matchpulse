import { useEffect, useState } from 'react'
import { getMeta } from '../lib/api'
import { clearAllData } from '../lib/db'
import type { DataMeta } from '../types'

export default function Settings() {
  const [meta, setMeta] = useState<DataMeta | null>(null)

  useEffect(() => {
    getMeta().then(setMeta).catch(() => setMeta(null))
  }, [])

  async function handleReset() {
    if (!confirm('Remove all favorites and notification preferences from this device?')) return
    await clearAllData()
    window.location.reload()
  }

  return (
    <div className="px-5 py-4 space-y-6">
      <section className="rounded-2xl bg-navy-800 border border-white/5 p-4 space-y-2">
        <h2 className="font-display text-sm font-semibold text-white/90">Data</h2>
        <p className="text-xs text-white/50">
          Favorites and notification settings live only on this device — nothing is sent to a
          server. Match data comes from a public fixtures feed, refreshed a few times a day.
        </p>
        {meta && (
          <p className="text-xs text-white/30">
            Last refreshed {new Date(meta.generatedAt).toLocaleString()} · {meta.fixtureCount} fixtures
          </p>
        )}
      </section>

      <button
        onClick={handleReset}
        className="w-full rounded-xl border border-red-500/30 text-red-400 text-sm font-medium py-3"
      >
        Reset all data on this device
      </button>

      <section className="text-center pt-4">
        <p className="font-display text-sm text-white/40">
          Match<span className="text-gold-500">Pulse</span>
        </p>
        <p className="text-xs text-white/25 mt-1">Never miss a match.</p>
      </section>
    </div>
  )
}
