import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  Download,
  FileDown,
  Printer,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileCheck2,
  X,
} from 'lucide-react'
import { Spinner, ErrorState, EmptyState, StatusBadge } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/FormControls'
import { useToast } from '../../components/ui/Toast'
import { requireSupabase } from '../../lib/supabase'
import { downloadCsv, buildPdfReport, fetchStorageFile, type CsvColumn } from '../../lib/exports'
import { CATEGORIES } from '../../lib/constants'
import type { Registration, Payment } from '../../lib/types'
import { formatMoney, formatDateTime, cn } from '../../lib/utils'

type SortKey = 'created_at' | 'full_name' | 'amount' | 'status'

interface Row extends Registration {
  payment?: Payment
}

const STATUSES = ['pending_payment', 'payment_submitted', 'payment_confirmed', 'registration_confirmed', 'cancelled'] as const

export default function Registrations() {
  const { notify } = useToast()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [event, setEvent] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<Row | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const client = requireSupabase()
      const [regs, pays] = await Promise.all([
        client.from('registrations').select('*').order('created_at', { ascending: false }),
        client.from('payments').select('*'),
      ])
      if (regs.error) throw new Error(regs.error.message)
      if (pays.error) throw new Error(pays.error.message)
      const paymentByReg = new Map<string, Payment>()
      for (const p of (pays.data as Payment[] | null) ?? []) paymentByReg.set(p.registration_id, p)
      setRows(((regs.data as Registration[] | null) ?? []).map((r) => ({ ...r, payment: paymentByReg.get(r.id) })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load registrations.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    let out = rows
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      out = out.filter(
        (r) =>
          r.full_name.toLowerCase().includes(needle) ||
          r.email.toLowerCase().includes(needle) ||
          r.ref_code.toLowerCase().includes(needle) ||
          (r.institution ?? '').toLowerCase().includes(needle) ||
          (r.phone ?? '').includes(needle),
      )
    }
    if (status !== 'all') out = out.filter((r) => r.status === status)
    if (category !== 'all') out = out.filter((r) => r.category === category)
    if (event !== 'all') out = out.filter((r) => r.event_selection === event)
    out = [...out].sort((a, b) => {
      const av = (a[sortKey] ?? '') as string | number
      const bv = (b[sortKey] ?? '') as string | number
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return out
  }, [rows, q, status, category, event, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  async function patchStatus(id: string, patch: { status?: string; payStatus?: string }) {
    setBusy(true)
    try {
      const client = requireSupabase()
      const r = rows.find((x) => x.id === id)
      if (patch.status) await client.from('registrations').update({ status: patch.status, updated_at: new Date().toISOString() }).eq('id', id)
      if (patch.payStatus && r?.payment) await client.from('payments').update({ status: patch.payStatus, updated_at: new Date().toISOString() }).eq('id', r.payment.id)
      await load()
      notify('success', 'Record updated.')
    } catch (e) {
      notify('error', e instanceof Error ? e.message : 'Update failed.')
    } finally {
      setBusy(false)
    }
  }

  function exportCsv() {
    const columns: CsvColumn<Row>[] = [
      { key: 'ref_code', label: 'Registration ID' },
      { key: 'full_name', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'country', label: 'Country' },
      { key: 'institution', label: 'Institution' },
      { key: 'school_faculty', label: 'School/Faculty' },
      { key: 'department', label: 'Department' },
      { key: 'year_of_study', label: 'Year of Study' },
      { key: 'category', label: 'Category' },
      { key: 'event_selection', label: 'Event' },
      { key: 'tier', label: 'Rate' },
      { key: 'amount', label: 'Amount (USD)' },
      { key: 'status', label: 'Registration Status' },
      { key: 'payment_method', label: 'Payment Method', value: (r) => r.payment?.method ?? '' },
      { key: 'transaction_ref', label: 'Payment Reference', value: (r) => r.payment?.transaction_ref ?? '' },
      { key: 'paid_on', label: 'Date of Payment', value: (r) => r.payment?.paid_on ?? '' },
      { key: 'payment_status', label: 'Payment Status', value: (r) => r.payment?.status ?? '' },
      { key: 'communication_consent', label: 'Email Consent', value: (r) => (r.communication_consent ? 'Yes' : 'No') },
      { key: 'created_at', label: 'Date Registered', value: (r) => formatDateTime(r.created_at) },
    ]
    downloadCsv(`MEDSAM-registrations-${new Date().toISOString().slice(0, 10)}.csv`, filtered, columns)
    notify('success', `Exported ${filtered.length} registrations to CSV.`)
  }

  function exportPaymentsCsv() {
    interface PayRow extends Payment { reg_ref: string; reg_name: string }
    const data: PayRow[] = rows
      .filter((r) => r.payment)
      .map((r) => ({ ...r.payment!, reg_ref: r.ref_code, reg_name: r.full_name }))
    const columns: CsvColumn<PayRow>[] = [
      { key: 'reg_ref', label: 'Registration ID' },
      { key: 'reg_name', label: 'Delegate' },
      { key: 'method', label: 'Method' },
      { key: 'amount', label: 'Amount (USD)' },
      { key: 'transaction_ref', label: 'Transaction Reference' },
      { key: 'paid_on', label: 'Date of Payment' },
      { key: 'status', label: 'Status' },
    ]
    downloadCsv(`MEDSAM-payments-${new Date().toISOString().slice(0, 10)}.csv`, data, columns)
    notify('success', `Exported ${data.length} payment records to CSV.`)
  }

  async function exportPdf() {
    setBusy(true)
    try {
      const total = filtered.reduce((s, r) => s + Number(r.amount), 0)
      const confirmed = filtered.filter((r) => r.status === 'payment_confirmed' || r.status === 'registration_confirmed').reduce((s, r) => s + Number(r.amount), 0)
      await buildPdfReport({
        filename: `MEDSAM-registrations-report-${new Date().toISOString().slice(0, 10)}.pdf`,
        brandLine: 'MEDSAM Scientific Conference & Symposium · Maseno University',
        title: 'Registration Report',
        subtitle: `Generated ${new Date().toLocaleString('en-GB')} — ${filtered.length} records`,
        metaLines: [
          `Filters: status=${status} · category=${category} · event=${event} · search="${q || '—'}"`,
          'Registration is subject to payment confirmation by the Secretariat.',
        ],
        summaryLines: [
          `Total registrations: ${filtered.length}`,
          `Total expected amount: ${formatMoney(total)}`,
          `Confirmed amount: ${formatMoney(confirmed)}`,
          `Pending: ${filtered.filter((r) => r.status === 'pending_payment' || r.status === 'payment_submitted').length}`,
        ],
        sections: [
          {
            title: 'Registration records',
            head: ['Ref', 'Name', 'Email', 'Phone', 'Category', 'Event', 'Rate', 'Amount', 'Payment', 'Ref/Status', 'Reg. Status', 'Date'],
            body: filtered.map((r) => [
              r.ref_code,
              r.full_name,
              r.email,
              r.phone,
              r.category,
              r.event_selection,
              r.tier === 'early_bird' ? 'Early' : 'Std',
              formatMoney(r.amount),
              r.payment?.method ?? '—',
              r.payment ? `${r.payment.transaction_ref ?? '—'} (${r.payment.status})` : '—',
              r.status,
              formatDateTime(r.created_at),
            ]),
          },
        ],
        orientation: 'landscape',
      })
      notify('success', 'PDF report downloaded.')
    } catch {
      notify('error', 'Could not generate the PDF report.')
    } finally {
      setBusy(false)
    }
  }

  async function downloadProof(row: Row) {
    if (!row.payment?.proof_path) return
    const blob = await fetchStorageFile(requireSupabase(), 'payment_proofs', row.payment.proof_path)
    if (!blob) {
      notify('error', 'Proof file could not be retrieved.')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proof-${row.ref_code}`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Registrations</h1>
          <p className="mt-1 text-sm text-slate-500">
            {filtered.length} of {rows.length} records · total {formatMoney(filtered.reduce((s, r) => s + Number(r.amount), 0))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="btn-navy" onClick={exportCsv}>
            <Download size={14} /> CSV
          </Button>
          <Button size="sm" variant="btn-navy" onClick={exportPaymentsCsv}>
            <FileDown size={14} /> Payments CSV
          </Button>
          <Button size="sm" variant="btn-navy" onClick={exportPdf} loading={busy}>
            <FileCheck2 size={14} /> PDF Report
          </Button>
          <Button size="sm" variant="btn-outline-navy" onClick={() => window.print()}>
            <Printer size={14} /> Print
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="card no-print mb-5 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, ref, phone, institution…" className="pl-10" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={event} onChange={(e) => setEvent(e.target.value)} aria-label="Filter by event">
          <option value="all">All events</option>
          <option value="workshop">Workshop</option>
          <option value="conference">Conference</option>
          <option value="both">Both</option>
        </Select>
      </div>

      {loading ? (
        <Spinner label="Loading registrations…" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No registrations match" message="Try clearing the filters, or wait for delegates to register." />
      ) : (
        <div className="card overflow-hidden">
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black tracking-wider text-slate-500 uppercase">
                  {[
                    { label: 'Ref', key: null },
                    { label: 'Name', key: 'full_name' as SortKey },
                    { label: 'Contact', key: null },
                    { label: 'Institution', key: null },
                    { label: 'Category', key: null },
                    { label: 'Event', key: null },
                    { label: 'Amount', key: 'amount' as SortKey },
                    { label: 'Payment', key: null },
                    { label: 'Status', key: 'status' as SortKey },
                    { label: 'Registered', key: 'created_at' as SortKey },
                    { label: '', key: null },
                  ].map((c, i) => (
                    <th key={i} className="px-4 py-3 whitespace-nowrap">
                      {c.key ? (
                        <button onClick={() => toggleSort(c.key!)} className={cn('flex items-center gap-1 uppercase hover:text-navy-900', sortKey === c.key && 'text-navy-900')}>
                          {c.label}
                          {sortKey === c.key && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-bold whitespace-nowrap text-navy-900">{r.ref_code}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{r.full_name}</p>
                      <p className="text-xs text-slate-500">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-600">{r.phone}</td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-xs text-slate-600">{r.institution ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{r.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {r.event_selection === 'both' ? 'Both' : r.event_selection === 'workshop' ? 'Workshop' : 'Conference'}
                    </td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap text-slate-900">{formatMoney(r.amount)}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {r.payment ? (
                        <span className={cn('font-semibold', r.payment.status === 'confirmed' ? 'text-emerald-700' : 'text-amber-700')}>
                          {r.payment.method} · {r.payment.status}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(r)}
                        className="rounded-lg p-2 text-navy-700 transition-colors hover:bg-navy-50"
                        aria-label={`View ${r.full_name}`}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Registration ${selected.ref_code}` : ''}
        wide
        footer={
          selected && (
            <>
              {selected.status !== 'payment_confirmed' && selected.status !== 'registration_confirmed' && selected.payment && (
                <Button
                  size="sm"
                  onClick={() => patchStatus(selected.id, { status: 'payment_confirmed', payStatus: 'confirmed' })}
                  loading={busy}
                >
                  <CheckCircle2 size={14} /> Confirm Payment
                </Button>
              )}
              {selected.status !== 'registration_confirmed' && (
                <Button size="sm" variant="btn-navy" onClick={() => patchStatus(selected.id, { status: 'registration_confirmed' })} loading={busy}>
                  <CheckCircle2 size={14} /> Confirm Registration
                </Button>
              )}
              {selected.status !== 'cancelled' ? (
                <Button size="sm" variant="btn-danger" onClick={() => patchStatus(selected.id, { status: 'cancelled' })} loading={busy}>
                  <XCircle size={14} /> Cancel
                </Button>
              ) : (
                <Button size="sm" variant="btn-outline-navy" onClick={() => patchStatus(selected.id, { status: 'pending_payment' })} loading={busy}>
                  <RotateCcw size={14} /> Reopen
                </Button>
              )}
              <Button size="sm" variant="btn-outline-navy" onClick={() => setSelected(null)}>
                <X size={14} /> Close
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            {[
              ['Full name', selected.full_name],
              ['Email', selected.email],
              ['Phone', selected.phone],
              ['Country', selected.country ?? '—'],
              ['Institution', selected.institution ?? '—'],
              ['School / Faculty', selected.school_faculty ?? '—'],
              ['Department', selected.department ?? '—'],
              ['Year of study', selected.year_of_study ?? '—'],
              ['Category', selected.category],
              ['Event(s)', selected.event_selection === 'both' ? 'Workshop + Conference' : selected.event_selection],
              ['Rate', selected.tier === 'early_bird' ? 'Early Bird' : 'Standard'],
              ['Amount', formatMoney(selected.amount)],
              ['Status', selected.status.replace(/_/g, ' ')],
              ['Email consent', selected.communication_consent ? 'Yes' : 'No'],
              ['Registered', formatDateTime(selected.created_at)],
            ].map(([k, v]) => (
              <div key={k as string}>
                <p className="text-[11px] font-black tracking-wider text-slate-400 uppercase">{k}</p>
                <p className="mt-0.5 font-semibold break-words text-slate-900">{v}</p>
              </div>
            ))}
            <div className="sm:col-span-2 mt-2 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-black tracking-wider text-slate-400 uppercase">Payment details</p>
              {selected.payment ? (
                <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {[
                    ['Method', selected.payment.method],
                    ['Amount', formatMoney(selected.payment.amount)],
                    ['Transaction ref', selected.payment.transaction_ref ?? '—'],
                    ['Paid on', selected.payment.paid_on ?? '—'],
                    ['Payment status', selected.payment.status],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{k}</p>
                      <p className="text-sm font-semibold text-slate-800">{v}</p>
                    </div>
                  ))}
                  {selected.payment.proof_path && (
                    <div className="sm:col-span-2">
                      <Button size="sm" variant="btn-outline-navy" onClick={() => downloadProof(selected)}>
                        <FileDown size={14} /> Download proof of payment
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No payment submitted yet.</p>
              )}
            </div>
            {selected.notes && (
              <div className="sm:col-span-2">
                <p className="text-[11px] font-black tracking-wider text-slate-400 uppercase">Notes</p>
                <p className="mt-1 text-sm text-slate-700">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

