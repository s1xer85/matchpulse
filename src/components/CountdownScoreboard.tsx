import { useEffect, useState } from 'react'
import type { Fixture } from '../types'

function timeParts(target: number) {
  const diff = Math.max(0, target - Date.now())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000)
  }
}

export default function CountdownScoreboard({ fixture }: { fixture: Fixture }) {
  const target = new Date(fixture.date).getTime()
  const [parts, setParts] = useState(timeParts(target))

  useEffect(() => {
    const id = window.setInterval(() => setParts(timeParts(target)), 1000)
    return () => window.clearInterval(id)
  }, [target])

  const cells: [string, number][] = [
    ['Days', parts.days],
    ['Hrs', parts.hours],
    ['Min', parts.minutes],
    ['Sec', parts.seconds]
  ]

  return (
    <div className="rounded-3xl bg-gradient-to-br from-navy-800 to-navy-900 border border-gold-600/20 shadow-glow p-5">
      <p className="text-[11px] uppercase tracking-widest text-gold-500/80 font-semibold mb-1">
        Next up
      </p>
      <div className="flex items-center gap-2 mb-4">
        <img src={fixture.home.logo} className="w-8 h-8 rounded-full bg-white/5" alt="" />
        <p className="font-display text-base font-semibold flex-1 text-center">
          {fixture.home.name} <span className="text-white/40 font-normal">vs</span> {fixture.away.name}
        </p>
        <img src={fixture.away.logo} className="w-8 h-8 rounded-full bg-white/5" alt="" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cells.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-navy-950/60 py-2.5 text-center">
            <p className="font-display text-xl font-bold tabular-nums text-gold-400">
              {String(value).padStart(2, '0')}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
