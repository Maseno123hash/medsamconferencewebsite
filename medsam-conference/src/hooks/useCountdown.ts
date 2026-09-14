import { useEffect, useMemo, useState } from 'react'

export interface CountdownState {
  days: number
  hours: number
  minutes: number
  seconds: number
  /** true when the target moment is in the past */
  past: boolean
  isOver: boolean
  targetLabel: string
}

/**
 * Live countdown to an ISO date. Updates every second; if the event
 * has started or finished it reports `past: true` instead of negatives.
 */
export function useCountdown(targetIso: string): CountdownState {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const diff = Math.max(0, target - now)
  const totalSeconds = Math.floor(diff / 1000)

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    past: now >= target,
    isOver: false,
    targetLabel: new Date(targetIso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }
}
