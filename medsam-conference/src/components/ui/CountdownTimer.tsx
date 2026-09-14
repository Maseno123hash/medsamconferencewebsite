import { useCountdown } from '../../hooks/useCountdown'
import { CalendarCheck } from 'lucide-react'
import { cn } from '../../lib/utils'

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gold-500/40 bg-white/5 backdrop-blur-sm sm:h-20 sm:w-20">
        <span className="text-2xl font-black tabular-nums text-white sm:text-4xl">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="mt-2 text-[10px] font-bold tracking-[0.2em] text-gold-300 uppercase sm:text-xs">{label}</span>
    </div>
  )
}

/** A single live countdown card (days / hours / minutes / seconds). */
export function CountdownTimer({
  targetIso,
  title,
  subtitle,
  pastMessage,
  className,
}: {
  targetIso: string
  title: string
  subtitle?: string
  pastMessage: string
  className?: string
}) {
  const cd = useCountdown(targetIso)

  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8', className)}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white sm:text-xl">{title}</h3>
          {subtitle && <p className="mt-1 text-sm font-medium text-gold-300">{subtitle}</p>}
        </div>
        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-300 sm:flex">
          <CalendarCheck size={20} />
        </div>
      </div>
      {cd.past ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-6">
          <CalendarCheck size={22} className="shrink-0 text-emerald-300" />
          <p className="text-sm font-semibold text-emerald-200">{pastMessage}</p>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <Unit value={cd.days} label="Days" />
          <Unit value={cd.hours} label="Hours" />
          <Unit value={cd.minutes} label="Minutes" />
          <Unit value={cd.seconds} label="Seconds" />
        </div>
      )}
    </div>
  )
}
