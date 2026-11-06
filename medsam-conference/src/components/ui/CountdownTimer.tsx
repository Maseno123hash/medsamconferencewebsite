import { useEffect, useState } from 'react'
import { CalendarCheck, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { EventConfig } from '../../lib/types'

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gold-500/40 bg-white/5 backdrop-blur-sm sm:h-20 sm:w-20">
        <span className="text-2xl font-black tabular-nums text-white sm:text-4xl">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="mt-2 text-[10px] font-bold tracking-[0.2em] text-gold-300 uppercase sm:text-xs">
        {label}
      </span>
    </div>
  )
}

// Interpret datetime-local values explicitly as East Africa Time (UTC+3).
function getNairobiTimestamp(value: string): number {
  if (!value) return NaN

  const normalized = value.length === 16 ? `${value}:00` : value

  return new Date(`${normalized}+03:00`).getTime()
}

export function CountdownTimer({
  event,
  title,
  subtitle,
  pastMessage,
  className,
}: {
  event: EventConfig
  title: string
  subtitle?: string
  pastMessage: string
  className?: string
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const start = getNairobiTimestamp(event.startAt)
  const end = getNairobiTimestamp(event.endAt)
  const validStart = Number.isFinite(start)
  const validEnd = Number.isFinite(end)

  const isPostponed = event.status === 'postponed'
  const isCompleted = event.status === 'completed'
  const isOngoing =
    event.status === 'scheduled' &&
    validStart &&
    now >= start &&
    (!validEnd || now <= end)

  const isPast =
    event.status === 'scheduled' &&
    validStart &&
    validEnd &&
    now > end

  const target = start
  const remaining = Math.max(0, target - now)
  const totalSeconds = Math.floor(remaining / 1000)

  let message = ''

  if (isPostponed) {
    message = 'This event has been postponed. Please check back for the revised date.'
  } else if (isCompleted || isPast) {
    message = pastMessage
  } else if (isOngoing) {
    message = 'This event is currently underway!'
  }

  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8', className)}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white sm:text-xl">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm font-medium text-gold-300">{subtitle}</p>
          )}
        </div>
        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-300 sm:flex">
          <CalendarCheck size={20} />
        </div>
      </div>

      {message ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-6">
          <CalendarCheck size={22} className="shrink-0 text-emerald-300" />
          <p className="text-sm font-semibold text-emerald-200">{message}</p>
        </div>
      ) : !validStart ? (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-6">
          <Clock size={22} className="text-gold-300" />
          <p className="text-sm font-semibold text-white">
            Event date will be announced soon.
          </p>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <Unit value={Math.floor(totalSeconds / 86400)} label="Days" />
          <Unit value={Math.floor((totalSeconds % 86400) / 3600)} label="Hours" />
          <Unit value={Math.floor((totalSeconds % 3600) / 60)} label="Minutes" />
          <Unit value={totalSeconds % 60} label="Seconds" />
        </div>
      )}
    </div>
  )
}