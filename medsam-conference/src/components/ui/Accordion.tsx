import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Accordion({
  title,
  subtitle,
  defaultOpen = false,
  children,
  headerRight,
  className,
}: {
  title: ReactNode
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
  headerRight?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn('card overflow-hidden', open && 'border-gold-400/60', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:px-6"
      >
        <div className="min-w-0">
          <div className="font-bold text-navy-950">{title}</div>
          {subtitle && <div className="mt-0.5 text-sm text-slate-500">{subtitle}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {headerRight}
          <ChevronDown size={20} className={cn('text-navy-700 transition-transform duration-300', open && 'rotate-180')} />
        </div>
      </button>
      {open && <div className="border-t border-slate-100 px-5 py-5 sm:px-6">{children}</div>}
    </div>
  )
}
