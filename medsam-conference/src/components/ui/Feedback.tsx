import type { ReactNode } from 'react'
import { Loader2, Inbox, AlertTriangle, Construction } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Spinner({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-16 text-navy-700', className)} role="status">
      <Loader2 size={22} className="animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

export function EmptyState({
  title,
  message,
  icon,
  action,
  className,
}: {
  title: string
  message?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-100 text-navy-700">
        {icon ?? <Inbox size={26} />}
      </div>
      <h3 className="text-base font-bold text-navy-950">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/60 px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle size={26} />
      </div>
      <h3 className="text-base font-bold text-red-900">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline-navy btn-sm mt-5">
          Try again
        </button>
      )}
    </div>
  )
}

/** Shown where live DB content will appear once the Secretariat sets up content. */
export function ComingSoon({ label }: { label: string }) {
  return (
    <EmptyState
      icon={<Construction size={26} />}
      title={label}
      message="The Secretariat will publish this content soon. Check back shortly or follow the official MEDSAM channels for updates."
    />
  )
}

const badgeStyles: Record<string, string> = {
  // registration
  pending_payment: 'bg-amber-50 text-amber-800 border-amber-200',
  payment_submitted: 'bg-blue-50 text-blue-800 border-blue-200',
  payment_confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  registration_confirmed: 'bg-green-50 text-green-800 border-green-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  // abstracts / submissions
  submitted: 'bg-slate-100 text-slate-700 border-slate-200',
  under_review: 'bg-blue-50 text-blue-800 border-blue-200',
  accepted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  revision_required: 'bg-amber-50 text-amber-800 border-amber-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  oral: 'bg-violet-50 text-violet-800 border-violet-200',
  poster: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  // applications / donations
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  contacted: 'bg-blue-50 text-blue-800 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  declined: 'bg-slate-100 text-slate-600 border-slate-200',
}

const badgeLabels: Record<string, string> = {
  pending_payment: 'Pending Payment',
  payment_submitted: 'Payment Submitted',
  payment_confirmed: 'Payment Confirmed',
  registration_confirmed: 'Registration Confirmed',
  cancelled: 'Cancelled',
  submitted: 'Submitted',
  under_review: 'Under Review',
  accepted: 'Accepted',
  revision_required: 'Revision Required',
  rejected: 'Rejected',
  oral: 'Oral',
  poster: 'Poster',
  pending: 'Pending',
  contacted: 'Contacted',
  confirmed: 'Confirmed',
  declined: 'Declined',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        badgeStyles[status] ?? 'bg-slate-100 text-slate-700 border-slate-200',
      )}
    >
      {badgeLabels[status] ?? status}
    </span>
  )
}
