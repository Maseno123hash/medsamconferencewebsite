import { useEffect, useState } from 'react'
import { HeartHandshake, MessageSquare, Download, Mail, CheckCircle2, XCircle, FileDown } from 'lucide-react'
import { Spinner, ErrorState, EmptyState, StatusBadge } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { requireSupabase } from '../../lib/supabase'
import { downloadCsv, fetchStorageFile, type CsvColumn } from '../../lib/exports'
import type { Donation, ContactMessage } from '../../lib/types'
import { formatMoney, formatDateTime, cn } from '../../lib/utils'

type Tab = 'donations' | 'messages'

/** Donations/support records + contact message inbox. */
export default function SupportAdmin() {
  const { notify } = useToast()
  const [tab, setTab] = useState<Tab>('donations')
  const [donations, setDonations] = useState<Donation[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const client = requireSupabase()
      const [d, m] = await Promise.all([
        client.from('donations').select('*').order('created_at', { ascending: false }),
        client.from('contact_messages').select('*').order('created_at', { ascending: false }),
      ])
      if (d.error) throw new Error(d.error.message)
      if (m.error) throw new Error(m.error.message)
      setDonations((d.data as Donation[] | null) ?? [])
      setMessages((m.data as ContactMessage[] | null) ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function setDonationStatus(id: string, status: 'confirmed' | 'rejected') {
    try {
      const { error: e } = await requireSupabase().from('donations').update({ status, updated_at: new Date().toISOString() } as object).eq('id', id)
      if (e) throw new Error(e.message)
      await load()
      notify('success', 'Donation status updated.')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Update failed.')
    }
  }

  async function downloadProof(d: Donation) {
    if (!d.proof_path) return
    const blob = await fetchStorageFile(requireSupabase(), 'payment_proofs', d.proof_path)
    if (!blob) {
      notify('error', 'Proof could not be retrieved.')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donation-proof-${d.id.slice(0, 8)}`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  async function markRead(id: string, isRead: boolean) {
    try {
      const { error: e } = await requireSupabase().from('contact_messages').update({ is_read: isRead }).eq('id', id)
      if (e) throw new Error(e.message)
      await load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Update failed.')
    }
  }

  async function removeMessage(id: string) {
    if (!window.confirm('Delete this message?')) return
    try {
      const { error: e } = await requireSupabase().from('contact_messages').delete().eq('id', id)
      if (e) throw new Error(e.message)
      await load()
      notify('success', 'Message deleted.')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  function exportDonationsCsv() {
    downloadCsv('MEDSAM-donations-support.csv', donations, [
      { key: 'name_or_org', label: 'Name / Organisation' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'amount', label: 'Amount (KES)' },
      { key: 'payment_method', label: 'Method' },
      { key: 'transaction_ref', label: 'Transaction Ref' },
      { key: 'message', label: 'Message' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Date', value: (r) => formatDateTime(r.created_at) },
    ] satisfies CsvColumn<Donation>[])
    notify('success', 'Donations exported to CSV.')
  }

  function exportMessagesCsv() {
    downloadCsv('MEDSAM-contact-messages.csv', messages, [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'subject', label: 'Subject' },
      { key: 'message', label: 'Message' },
      { key: 'is_read', label: 'Read', value: (r) => (r.is_read ? 'Yes' : 'No') },
      { key: 'created_at', label: 'Date', value: (r) => formatDateTime(r.created_at) },
    ] satisfies CsvColumn<ContactMessage>[])
    notify('success', 'Messages exported to CSV.')
  }

  if (loading) return <Spinner label="Loading support data…" />
  if (error) return <ErrorState message={error} onRetry={load} />

  const totalKES = donations.reduce((s, d) => s + Number(d.amount), 0)
  const unread = messages.filter((m) => !m.is_read).length

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy-950">Support &amp; Messages</h1>
        <p className="mt-1 text-sm text-slate-500">
          Donations/support total: {formatMoney(totalKES, 'KES')} · {unread} unread message{unread === 1 ? '' : 's'}.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setTab('donations')}
          aria-pressed={tab === 'donations'}
          className={cn('flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all', tab === 'donations' ? 'bg-navy-900 text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:border-navy-400')}
        >
          <HeartHandshake size={15} /> Donations ({donations.length})
        </button>
        <button
          onClick={() => setTab('messages')}
          aria-pressed={tab === 'messages'}
          className={cn('flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all', tab === 'messages' ? 'bg-navy-900 text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:border-navy-400')}
        >
          <MessageSquare size={15} /> Messages ({messages.length})
        </button>
        <div className="ml-auto">
          <Button size="sm" variant="btn-navy" onClick={tab === 'donations' ? exportDonationsCsv : exportMessagesCsv}>
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      {tab === 'donations' &&
        (donations.length === 0 ? (
          <EmptyState title="No donations yet" message="Voluntary contributions recorded through the Support page will appear here for verification." />
        ) : (
          <div className="card overflow-hidden">
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black tracking-wider text-slate-500 uppercase">
                    <th className="px-4 py-3">Name / Org</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Transaction Ref</th>
                    <th className="px-4 py-3">Proof</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-bold text-navy-950">{d.name_or_org}</p>
                        {d.message && <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500" title={d.message}>{d.message}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="text-slate-700">{d.email ?? '—'}</p>
                        <p className="text-slate-500">{d.phone ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 font-black whitespace-nowrap text-navy-950">{formatMoney(d.amount, 'KES')}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{d.payment_method}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{d.transaction_ref ?? '—'}</td>
                      <td className="px-4 py-3">
                        {d.proof_path ? (
                          <button onClick={() => downloadProof(d)} className="text-navy-700 hover:text-gold-700" aria-label="Download proof">
                            <FileDown size={15} />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">{formatDateTime(d.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {d.status !== 'confirmed' && (
                            <button onClick={() => setDonationStatus(d.id, 'confirmed')} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50" aria-label="Confirm donation">
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          {d.status !== 'rejected' && (
                            <button onClick={() => setDonationStatus(d.id, 'rejected')} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Reject donation">
                              <XCircle size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {tab === 'messages' &&
        (messages.length === 0 ? (
          <EmptyState title="No messages yet" message="Messages sent through the public Contact form will appear here." />
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={cn('card p-5', !m.is_read && 'border-l-4 border-l-gold-500')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-navy-950">
                      {!m.is_read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gold-500 align-middle" />}
                      {m.subject ?? '(no subject)'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {m.name} · <a href={`mailto:${m.email}`} className="font-semibold text-navy-800 hover:text-gold-700">{m.email}</a>
                      {m.phone ? ` · ${m.phone}` : ''} · {formatDateTime(m.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject ?? 'MEDSAM Conference')}`} className="btn btn-outline-navy btn-sm">
                      <Mail size={13} /> Reply
                    </a>
                    <button onClick={() => markRead(m.id, !m.is_read)} className="btn btn-outline-navy btn-sm">
                      {m.is_read ? 'Mark unread' : 'Mark read'}
                    </button>
                    <button onClick={() => removeMessage(m.id)} className="btn btn-danger btn-sm">Delete</button>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{m.message}</p>
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}
