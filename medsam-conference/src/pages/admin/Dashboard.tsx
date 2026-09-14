import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  CheckCircle2,
  Clock,
  GraduationCap,
  Briefcase,
  FileText,
  ClipboardCheck,
  Inbox,
  Handshake,
  Store,
  HeartHandshake,
  MessageSquare,
  ArrowRight,
  Wallet,
} from 'lucide-react'
import { Spinner, ErrorState } from '../../components/ui/Feedback'
import { StatusBadge } from '../../components/ui/Feedback'
import { requireSupabase, isSupabaseConfigured } from '../../lib/supabase'
import type { Registration, AbstractSubmission, ContactMessage } from '../../lib/types'
import { formatMoney, formatDateTime } from '../../lib/utils'

interface Stats {
  totalRegs: number
  confirmed: number
  pendingPayments: number
  students: number
  nonStudents: number
  totalCollected: number
  abstracts: number
  abstractsApproved: number
  abstractsPending: number
  sponsors: number
  exhibitors: number
  donations: number
  donationsAmount: number
  messages: number
  recent: Registration[]
}

const EMPTY: Stats = {
  totalRegs: 0, confirmed: 0, pendingPayments: 0, students: 0, nonStudents: 0, totalCollected: 0,
  abstracts: 0, abstractsApproved: 0, abstractsPending: 0, sponsors: 0, exhibitors: 0,
  donations: 0, donationsAmount: 0, messages: 0, recent: [],
}

function count(client: ReturnType<typeof requireSupabase>, table: string, filter?: (q: any) => any) {
  let q = client.from(table).select('*', { count: 'exact', head: true })
  if (filter) q = filter(q)
  return q.then(({ count }: { count: number | null }) => count ?? 0)
}

/** Admin overview — all key figures in one screen, all from live DB counts. */
export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let mounted = true
    const client = requireSupabase()
    Promise.all([
      count(client, 'registrations'),
      count(client, 'registrations', (q) => q.in('status', ['payment_confirmed', 'registration_confirmed'])),
      count(client, 'registrations', (q) => q.in('status', ['pending_payment', 'payment_submitted'])),
      count(client, 'registrations', (q) => q.eq('category', 'Student')),
      count(client, 'payments', (q) => q.eq('status', 'confirmed')),
      count(client, 'abstract_submissions'),
      count(client, 'abstract_submissions', (q) => q.in('status', ['accepted', 'oral', 'poster'])),
      count(client, 'abstract_submissions', (q) => q.in('status', ['submitted', 'under_review'])),
      count(client, 'sponsor_applications'),
      count(client, 'exhibitor_applications'),
      count(client, 'donations'),
      count(client, 'contact_messages'),
      client.from('registrations').select('*').order('created_at', { ascending: false }).limit(6),
      client.from('donations').select('amount').eq('status', 'confirmed'),
    ])
      .then(([
        totalRegs, confirmed, pendingPayments, students, _confirmedPayments,
        abstracts, abstractsApproved, abstractsPending, sponsors, exhibitors,
        donations, messages, recentRes, donationsAmounts,
      ]) => {
        if (!mounted) return
        const regs = (recentRes.data as Registration[] | null) ?? []
        setStats({
          totalRegs,
          confirmed,
          pendingPayments,
          students,
          nonStudents: Math.max(0, totalRegs - students),
          totalCollected: (donationsAmounts.data as { amount: number }[] | null)?.reduce((s, d) => s + Number(d.amount), 0) ?? 0,
          abstracts,
          abstractsApproved,
          abstractsPending,
          sponsors,
          exhibitors,
          donations,
          donationsAmount: (donationsAmounts.data as { amount: number }[] | null)?.reduce((s, d) => s + Number(d.amount), 0) ?? 0,
          messages,
          recent: regs,
        })
      })
      .catch((e) => mounted && setError(e.message))
    return () => {
      mounted = false
    }
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <ErrorState
        title="Database not connected"
        message="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to this deployment's environment, run the SQL migration, and reload. See README for full setup."
      />
    )
  }
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!stats) return <Spinner label="Loading dashboard…" />

  const cards = [
    { label: 'Total registrations', value: stats.totalRegs, Icon: Users, to: '/admin/registrations', tone: 'bg-navy-900 text-gold-400' },
    { label: 'Confirmed registrations', value: stats.confirmed, Icon: CheckCircle2, to: '/admin/registrations', tone: 'bg-emerald-600 text-white' },
    { label: 'Pending payments', value: stats.pendingPayments, Icon: Clock, to: '/admin/registrations', tone: 'bg-amber-500 text-navy-950' },
    { label: 'Students', value: stats.students, Icon: GraduationCap, to: '/admin/registrations', tone: 'bg-cyan-600 text-white' },
    { label: 'Faculty / non-students', value: stats.nonStudents, Icon: Briefcase, to: '/admin/registrations', tone: 'bg-indigo-600 text-white' },
    { label: 'Abstract submissions', value: stats.abstracts, Icon: FileText, to: '/admin/abstracts', tone: 'bg-navy-900 text-gold-400' },
    { label: 'Abstracts approved', value: stats.abstractsApproved, Icon: ClipboardCheck, to: '/admin/abstracts', tone: 'bg-emerald-600 text-white' },
    { label: 'Pending abstract reviews', value: stats.abstractsPending, Icon: Inbox, to: '/admin/abstracts', tone: 'bg-amber-500 text-navy-950' },
    { label: 'Sponsor applications', value: stats.sponsors, Icon: Handshake, to: '/admin/sponsors', tone: 'bg-violet-600 text-white' },
    { label: 'Exhibitor applications', value: stats.exhibitors, Icon: Store, to: '/admin/sponsors', tone: 'bg-fuchsia-600 text-white' },
    { label: 'Donations / support', value: stats.donations, sub: stats.donationsAmount > 0 ? formatMoney(stats.donationsAmount, 'KES') : undefined, Icon: HeartHandshake, to: '/admin/support', tone: 'bg-rose-600 text-white' },
    { label: 'Contact messages', value: stats.messages, Icon: MessageSquare, to: '/admin/support', tone: 'bg-slate-600 text-white' },
  ]

  return (
    <div>
      <header className="mb-7">
        <h1 className="text-2xl font-black text-navy-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live overview of the conference — updated in real time from the database.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {cards.map(({ label, value, sub, Icon, to, tone }) => (
          <Link key={label} to={to} className="card card-hover group p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">{label}</p>
                <p className="mt-2 text-3xl font-black text-navy-950">{value.toLocaleString('en-KE')}</p>
                {sub && <p className="mt-0.5 text-xs font-bold text-slate-500">{sub}</p>}
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={19} />
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs font-bold text-navy-700 opacity-0 transition-opacity group-hover:opacity-100">
              Manage <ArrowRight size={12} />
            </p>
          </Link>
        ))}
      </div>

      {/* Recent registrations */}
      <div className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-navy-950">Latest registrations</h2>
          <Link to="/admin/registrations" className="flex items-center gap-1 text-sm font-bold text-navy-800 hover:text-gold-700">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            <Wallet size={26} className="mx-auto mb-3 text-slate-300" />
            No registrations yet. They'll appear here the moment delegates register.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black tracking-wider text-slate-400 uppercase">
                  <th className="px-6 py-3">Ref</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-navy-900">{r.ref_code}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{r.full_name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{r.category}</td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {r.event_selection === 'both' ? 'Both' : r.event_selection === 'workshop' ? 'Workshop' : 'Conference'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{formatMoney(r.amount)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{formatDateTime(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
