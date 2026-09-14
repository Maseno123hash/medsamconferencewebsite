import { Smartphone, Landmark, ShieldCheck, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { PAYMENT } from '../../lib/constants'
import { cn } from '../../lib/utils'

function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-navy-950/60 px-4 py-3">
      <div>
        <p className="text-[10px] font-bold tracking-[0.18em] text-navy-300 uppercase">{label}</p>
        <p className="font-mono text-base font-bold text-gold-300 sm:text-lg">{value}</p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        }}
        className="rounded-md p-2 text-navy-200 transition-colors hover:bg-white/10 hover:text-gold-300"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check size={17} className="text-emerald-400" /> : <Copy size={17} />}
      </button>
    </div>
  )
}

/**
 * Official MEDSAM payment channels (M-PESA Till + KCB bank account).
 * The website never verifies payments automatically — delegates submit
 * proof and the Secretariat confirms. Reused on Registration, Donations
 * and Sponsors pages.
 */
export function PaymentDetails({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-navy-100 bg-navy-900 text-white shadow-[var(--shadow-soft)]', className)}>
      <div className="flex items-center justify-between border-b border-white/10 bg-navy-950/60 px-5 py-4">
        <h3 className="text-sm font-bold tracking-[0.16em] text-gold-300 uppercase">MEDSAM Payment Channels</h3>
        <ShieldCheck size={18} className="text-gold-400" />
      </div>
      <div className={cn('grid gap-5 p-5 sm:p-6', !compact && 'md:grid-cols-2')}>
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Smartphone size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">M-PESA</p>
              <p className="text-xs text-navy-200">Paybill to Till Number</p>
            </div>
          </div>
          <CopyChip label="Till Number" value={PAYMENT.mpesaTill} />
          <p className="mt-3 text-xs leading-relaxed text-navy-200">
            Use your full name as the account name and keep the M-PESA confirmation message as your
            transaction reference.
          </p>
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/15 text-gold-400">
              <Landmark size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">Bank Transfer</p>
              <p className="text-xs text-navy-200">
                {PAYMENT.bankName} · {PAYMENT.bankBranch}
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            <CopyChip label="Account Name" value={PAYMENT.bankAccountName} />
            <CopyChip label="Account Number" value={PAYMENT.bankAccountNumber} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-navy-200">
            Attach a copy of the bank transfer slip or screenshot with your registration or support form.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 bg-gold-500/10 px-5 py-3.5">
        <p className="text-xs font-semibold text-gold-200">{PAYMENT.note}</p>
      </div>
    </div>
  )
}
