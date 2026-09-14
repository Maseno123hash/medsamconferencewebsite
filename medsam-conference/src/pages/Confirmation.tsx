import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Search, Printer, FileDown, ShieldCheck, Mail } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { Field, Input } from '../components/ui/FormControls'
import { Button } from '../components/ui/Button'
import { ErrorState, Spinner } from '../components/ui/Feedback'
import { PaymentDetails } from '../components/public/PaymentDetails'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import { useConfig } from '../hooks/useAdminAuth'
import { buildPdfReport } from '../lib/exports'
import { formatMoney, formatDate, isValidEmail } from '../lib/utils'
import type { Registration } from '../lib/types'

interface ConfirmedRecord {
  ref_code: string
  full_name: string
  email: string
  category: string
  event_selection: string
  tier: string
  amount: number
  status: string
  payment_method: string | null
  payment_ref: string | null
  payment_status: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pending Payment',
  payment_submitted: 'Payment Submitted',
  payment_confirmed: 'Payment Confirmed',
  registration_confirmed: 'Registration Confirmed',
  cancelled: 'Cancelled',
}

/**
 * Registration confirmation lookup — no account required. The record is
 * fetched via a restricted Postgres function that only matches on
 * reference code + email, so the pair acts as a lightweight secret.
 */
export default function Confirmation() {
  const [params, setParams] = useSearchParams()
  const { ref: pathRef } = useParams()
  const { config } = useConfig()
  const [ref, setRef] = useState(params.get('ref') ?? pathRef ?? '')
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState<ConfirmedRecord | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)

  async function lookup(e?: FormEvent) {
    e?.preventDefault()
    if (!isSupabaseConfigured) {
      setError('The conference database is not connected yet. Please try again later.')
      return
    }
    if (!ref.trim() || !isValidEmail(email)) {
      setError('Please enter both your registration number and the email used to register.')
      return
    }
    setLoading(true)
    setError(null)
    setRecord(null)
    try {
      const client = requireSupabase()
      const { data, error: rpcErr } = await client.rpc('get_registration_public', {
        p_ref_code: ref.trim().toUpperCase(),
        p_email: email.trim().toLowerCase(),
      })
      if (rpcErr) throw new Error(rpcErr.message)
      const rows = (data as ConfirmedRecord[] | null) ?? []
      if (rows.length === 0) {
        setError('No registration found for that number and email combination. Please check for typos — or contact the Secretariat.')
      } else {
        setRecord(rows[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const r = params.get('ref') ?? pathRef
    const em = params.get('email')
    if (r && em && !record && !loading) void lookup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  async function downloadPdf() {
    if (!record) return
    setPdfBusy(true)
    try {
      await buildPdfReport({
        filename: `MEDSAM-2027-${record.ref_code}-confirmation.pdf`,
        brandLine: 'MEDSAM Scientific Conference & Symposium · Maseno University',
        title: 'Registration Confirmation',
        subtitle: `Reference: ${record.ref_code}`,
        metaLines: [
          `Generated: ${new Date().toLocaleString('en-GB')}`,
          `Registration date: ${formatDate(record.created_at)}`,
        ],
        summaryLines: [
          `Name: ${record.full_name}`,
          `Email: ${record.email}`,
          `Category: ${record.category}`,
          `Event: ${record.event_selection === 'both' ? 'Pre-Conference Workshop + Main Conference' : record.event_selection === 'workshop' ? 'Pre-Conference Workshop (7 Nov 2026)' : 'Main Conference (12–13 Mar 2027)'}`,
          `Rate: ${record.tier === 'early_bird' ? 'Early Bird' : 'Standard'}`,
          `Amount: ${formatMoney(record.amount, config.currency)}`,
          record.payment_ref ? `Payment ref: ${record.payment_ref} (${record.payment_method})` : 'Payment: not yet submitted',
          `Status: ${STATUS_LABEL[record.status] ?? record.status}`,
        ],
        sections: [
          {
            title: 'Payment channels (if payment still required)',
            head: ['Channel', 'Details'],
            body: [
              ['M-PESA', 'Till Number 9086003'],
              ['Bank', 'KCB, Luanda Branch — A/C 1143673336, Maseno University Sch. of Medicine Students Association'],
            ],
          },
        ],
        orientation: 'portrait',
      })
    } catch {
      setError('Could not generate the PDF. Please use Print → Save as PDF instead.')
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <>
      <Seo title="Registration Confirmation" />
      <section className="bg-navy-950 py-14 md:py-16">
        <div className="container-x">
          <span className="eyebrow-light">Your Record</span>
          <h1 className="h-display text-white">Registration Confirmation</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            Enter the registration number shown after you registered, together with the email you used — no
            account needed.
          </p>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x max-w-3xl">
          <form onSubmit={lookup} className="card no-print p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-[1fr_1fr_auto]">
              <Field label="Registration number" required>
                <Input value={ref} onChange={(e) => { setRef(e.target.value); setParams({ ref: e.target.value, email }, { replace: true }) }} placeholder="MEDSAM-2027-XXXXXX" className="font-mono" />
              </Field>
              <Field label="Email address" required>
                <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setParams({ ref, email: e.target.value }, { replace: true }) }} placeholder="you@example.com" />
              </Field>
              <div className="flex items-end">
                <Button type="submit" loading={loading} className="w-full sm:w-auto">
                  <Search size={16} /> Find
                </Button>
              </div>
            </div>
            {error && <div className="mt-5"><ErrorState title="No record found" message={error} /></div>}
          </form>

          {loading && <Spinner label="Looking up your registration…" className="no-print" />}

          {record && (
            <div className="card mt-8 overflow-hidden print-area">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-navy-950 px-7 py-6 text-white">
                <div>
                  <p className="text-[10px] font-black tracking-[0.3em] text-gold-300 uppercase">MEDSAM Scientific Conference &amp; Symposium</p>
                  <h2 className="mt-1 text-xl font-black">Registration Confirmation</h2>
                </div>
                <div className="rounded-xl border border-gold-500/40 bg-white/5 px-5 py-3 text-center">
                  <p className="text-[10px] font-black tracking-[0.2em] text-navy-200 uppercase">Registration No.</p>
                  <p className="font-mono text-lg font-black text-gold-300">{record.ref_code}</p>
                </div>
              </div>
              <div className="grid gap-x-8 gap-y-5 p-7 sm:grid-cols-2">
                {[
                  ['Full name', record.full_name],
                  ['Email', record.email],
                  ['Category', record.category],
                  [
                    'Event(s)',
                    record.event_selection === 'both'
                      ? 'Pre-Conference Workshop + Main Conference'
                      : record.event_selection === 'workshop'
                        ? 'Pre-Conference Workshop (7 Nov 2026)'
                        : 'Main Conference (12–13 Mar 2027)',
                  ],
                  ['Rate', record.tier === 'early_bird' ? 'Early Bird' : 'Standard'],
                  ['Amount', formatMoney(record.amount, config.currency)],
                  ['Payment method', record.payment_method ?? '—'],
                  ['Payment reference', record.payment_ref ?? '—'],
                  ['Registered on', formatDate(record.created_at)],
                  ['Status', STATUS_LABEL[record.status] ?? record.status],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <p className="text-[11px] font-black tracking-[0.18em] text-slate-400 uppercase">{k}</p>
                    <p className="mt-0.5 text-sm font-bold text-navy-950">{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-3 border-t border-slate-100 bg-amber-50 px-7 py-4">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-700" />
                <p className="text-xs leading-relaxed text-amber-900">
                  <strong>
                    {record.status === 'registration_confirmed'
                      ? 'Your registration is confirmed. We look forward to welcoming you at the conference!'
                      : record.status === 'payment_confirmed'
                        ? 'Your payment has been confirmed. Your registration is being finalised.'
                        : record.status === 'payment_submitted'
                          ? 'Your payment is awaiting verification. Registration is subject to payment confirmation by the Secretariat.'
                          : 'Payment is still pending. Complete payment through the official channels below to secure your place.'}
                  </strong>{' '}
                  Official updates are sent to the email above.
                </p>
              </div>
              <div className="no-print flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50 px-7 py-5">
                <Button onClick={() => window.print()}>
                  <Printer size={16} /> Print
                </Button>
                <Button variant="btn-navy" onClick={downloadPdf} loading={pdfBusy}>
                  <FileDown size={16} /> Download PDF
                </Button>
                <Link to="/" className="btn btn-outline-navy">
                  Back to Home
                </Link>
              </div>
            </div>
          )}

          {record && (record.status === 'pending_payment' || record.status === 'payment_submitted') && (
            <div className="no-print mt-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-navy-950">
                <Mail size={18} className="text-gold-600" /> Complete your payment
              </h3>
              <PaymentDetails compact />
              <p className="mt-3 text-xs text-slate-500">
                After paying, email your receipt to the Secretariat quoting your registration number{' '}
                <strong className="font-mono">{record.ref_code}</strong>.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
