import { useState } from 'react'
import {
  FileSpreadsheet,
  FileText,
  FileArchive,
  FolderDown,
  Database,
  Handshake,
  Store,
  HeartHandshake,
  MessageSquare,
  Images,
  Lightbulb,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { requireSupabase } from '../../lib/supabase'
import { downloadCsv, buildPdfReport, downloadZipOfFiles, type CsvColumn } from '../../lib/exports'
import { CATEGORIES } from '../../lib/constants'
import type {
  Registration,
  Payment,
  AbstractSubmission,
  PosterSubmission,
  InnovationSubmission,
  SponsorApplication,
  ExhibitorApplication,
  Donation,
  ContactMessage,
} from '../../lib/types'
import { formatDateTime, formatMoney } from '../../lib/utils'

interface Entry {
  id: string
  title: string
  description: string
  Icon: typeof Database
  tone: string
  action: () => Promise<void> | void
  busyKey: string
}

/**
 * Central "Downloads" area — every export in one place:
 * registrations (CSV/PDF), payments (CSV), abstracts (CSV/ZIP),
 * poster & innovation files (ZIP), sponsor/exhibitor/donation/message CSVs.
 */
export default function Downloads() {
  const { notify } = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function guard() {
    if (!requireSupabase) return
  }

  async function withBusy(key: string, fn: () => Promise<void>) {
    setBusy(key)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed. Please try again.')
      notify('error', 'Export failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  /* ---------- individual exports ---------- */

  async function regsCsv() {
    const { data, error: e } = await requireSupabase().from('registrations').select('*').order('created_at', { ascending: false })
    if (e) throw new Error(e.message)
    const rows = (data as Registration[] | null) ?? []
    downloadCsv('MEDSAM-registrations.csv', rows, [
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
      { key: 'status', label: 'Status' },
      { key: 'communication_consent', label: 'Email Consent', value: (r) => (r.communication_consent ? 'Yes' : 'No') },
      { key: 'created_at', label: 'Date Registered', value: (r) => formatDateTime(r.created_at) },
    ] satisfies CsvColumn<Registration>[])
    notify('success', `Exported ${rows.length} registrations to CSV.`)
  }

  async function regsPdf() {
    const { data, error: e } = await requireSupabase().from('registrations').select('*').order('created_at', { ascending: false })
    if (e) throw new Error(e.message)
    const rows = (data as Registration[] | null) ?? []
    const total = rows.reduce((s, r) => s + Number(r.amount), 0)
    await buildPdfReport({
      filename: `MEDSAM-registrations-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      brandLine: 'MEDSAM Scientific Conference & Symposium · Maseno University',
      title: 'Registration Report',
      subtitle: `Full registration database — ${rows.length} records`,
      metaLines: [`Generated: ${new Date().toLocaleString('en-GB')}`, 'Confidential — for Secretariat use only.'],
      summaryLines: [
        `Total registrations: ${rows.length}`,
        `Total expected amount: ${formatMoney(total)}`,
        `Confirmed: ${rows.filter((r) => r.status === 'payment_confirmed' || r.status === 'registration_confirmed').length}`,
        `Pending: ${rows.filter((r) => r.status === 'pending_payment' || r.status === 'payment_submitted').length}`,
      ],
      sections: [
        {
          title: 'All registration records',
          head: ['Ref', 'Name', 'Email', 'Phone', 'Institution', 'Category', 'Event', 'Rate', 'Amount', 'Status', 'Date'],
          body: rows.map((r) => [r.ref_code, r.full_name, r.email, r.phone, r.institution ?? '—', r.category, r.event_selection, r.tier === 'early_bird' ? 'Early' : 'Std', formatMoney(r.amount), r.status, formatDateTime(r.created_at)]),
        },
      ],
      orientation: 'landscape',
    })
    notify('success', 'Registration PDF report downloaded.')
  }

  async function paymentsCsv() {
    const [{ data: regs, error: re }, { data: pays, error: pe }] = await Promise.all([
      requireSupabase().from('registrations').select('id, ref_code, full_name'),
      requireSupabase().from('payments').select('*').order('created_at', { ascending: false }),
    ])
    if (re) throw new Error(re.message)
    if (pe) throw new Error(pe.message)
    const refById = new Map(((regs as { id: string; ref_code: string; full_name: string }[] | null) ?? []).map((r) => [r.id, r]))
    const rows = ((pays as Payment[] | null) ?? []).map((p) => ({ ...p, reg: refById.get(p.registration_id) }))
    downloadCsv('MEDSAM-payment-records.csv', rows, [
      { key: 'registration_id', label: 'Registration ID', value: (r) => r.reg?.ref_code ?? r.registration_id },
      { key: 'full_name', label: 'Delegate', value: (r) => r.reg?.full_name ?? '' },
      { key: 'method', label: 'Method' },
      { key: 'amount', label: 'Amount (USD)' },
      { key: 'transaction_ref', label: 'Transaction Reference' },
      { key: 'paid_on', label: 'Date of Payment' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Submitted', value: (r) => formatDateTime(r.created_at) },
    ] satisfies CsvColumn<(typeof rows)[number]>[])
    notify('success', `Exported ${rows.length} payment records to CSV.`)
  }

  async function abstractsCsv() {
    const { data, error: e } = await requireSupabase().from('abstract_submissions').select('*').order('created_at', { ascending: false })
    if (e) throw new Error(e.message)
    const rows = (data as AbstractSubmission[] | null) ?? []
    downloadCsv('MEDSAM-abstracts.csv', rows, [
      { key: 'submission_id', label: 'Submission ID' },
      { key: 'abstract_title', label: 'Title' },
      { key: 'author_name', label: 'Lead Author' },
      { key: 'authors', label: 'Authors' },
      { key: 'email', label: 'Email' },
      { key: 'institution', label: 'Institution' },
      { key: 'track', label: 'Track' },
      { key: 'presentation_preference', label: 'Preference' },
      { key: 'status', label: 'Status' },
      { key: 'reviewer_comments', label: 'Reviewer Comments' },
      { key: 'created_at', label: 'Submitted', value: (r) => formatDateTime(r.created_at) },
    ] satisfies CsvColumn<AbstractSubmission>[])
    notify('success', `Exported ${rows.length} abstracts to CSV.`)
  }

  async function abstractsZip() {
    const { data, error: e } = await requireSupabase().from('abstract_submissions').select('submission_id, author_name, abstract_title, pdf_path').not('pdf_path', 'is', null)
    if (e) throw new Error(e.message)
    const rows = (data as Array<{ submission_id: string; author_name: string; abstract_title: string; pdf_path: string }> | null) ?? []
    if (rows.length === 0) throw new Error('No abstract PDFs available yet.')
    const n = await downloadZipOfFiles(
      requireSupabase(),
      `MEDSAM-all-abstracts-${new Date().toISOString().slice(0, 10)}.zip`,
      rows.map((r, i) => ({
        name: `ABS-${String(i + 1).padStart(3, '0')}_${r.author_name}_${r.abstract_title}.pdf`,
        bucket: 'abstracts',
        path: r.pdf_path,
      })),
    )
    notify('success', `ZIP created with ${n} abstract PDFs.`)
  }

  async function postersZip() {
    const { data, error: e } = await requireSupabase().from('poster_submissions').select('id, title, poster_pdf_path, poster_image_path')
    if (e) throw new Error(e.message)
    const rows = (data as PosterSubmission[] | null) ?? []
    const entries: Array<{ name: string; bucket: string; path: string | null }> = []
    for (const r of rows) {
      entries.push({ name: `poster-${r.id.slice(0, 8)}-${r.title.slice(0, 40)}.pdf`, bucket: 'posters', path: r.poster_pdf_path })
      entries.push({ name: `poster-image-${r.id.slice(0, 8)}-${r.title.slice(0, 40)}.jpg`, bucket: 'posters', path: r.poster_image_path })
    }
    const n = await downloadZipOfFiles(requireSupabase(), 'MEDSAM-posters.zip', entries)
    notify('success', `ZIP created with ${n} poster files.`)
  }

  async function innovationsZip() {
    const { data, error: e } = await requireSupabase().from('innovation_submissions').select('id, title, materials_path, image_path')
    if (e) throw new Error(e.message)
    const rows = (data as InnovationSubmission[] | null) ?? []
    const entries: Array<{ name: string; bucket: string; path: string | null }> = []
    for (const r of rows) {
      entries.push({ name: `innovation-${r.id.slice(0, 8)}-${r.title.slice(0, 40)}.pdf`, bucket: 'innovations', path: r.materials_path })
      entries.push({ name: `innovation-image-${r.id.slice(0, 8)}-${r.title.slice(0, 40)}.jpg`, bucket: 'innovations', path: r.image_path })
    }
    const n = await downloadZipOfFiles(requireSupabase(), 'MEDSAM-innovations.zip', entries)
    notify('success', `ZIP created with ${n} innovation files.`)
  }

  async function sponsorsCsv() {
    const { data, error: e } = await requireSupabase().from('sponsor_applications').select('*').order('created_at', { ascending: false })
    if (e) throw new Error(e.message)
    const rows = (data as SponsorApplication[] | null) ?? []
    downloadCsv('MEDSAM-sponsor-applications.csv', rows, [
      { key: 'organization', label: 'Organisation' },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'organisation_type', label: 'Type' },
      { key: 'preferred_package', label: 'Preferred Package' },
      { key: 'message', label: 'Message' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Date', value: (r) => formatDateTime(r.created_at) },
    ] satisfies CsvColumn<SponsorApplication>[])
    notify('success', `Exported ${rows.length} sponsor applications.`)
  }

  async function exhibitorsCsv() {
    const { data, error: e } = await requireSupabase().from('exhibitor_applications').select('*').order('created_at', { ascending: false })
    if (e) throw new Error(e.message)
    const rows = (data as ExhibitorApplication[] | null) ?? []
    downloadCsv('MEDSAM-exhibitor-applications.csv', rows, [
      { key: 'organisation', label: 'Organisation' },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'organisation_type', label: 'Type' },
      { key: 'products_services', label: 'Products/Services' },
      { key: 'exhibition_requirements', label: 'Requirements' },
      { key: 'preferred_package', label: 'Preferred Package' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Date', value: (r) => formatDateTime(r.created_at) },
    ] satisfies CsvColumn<ExhibitorApplication>[])
    notify('success', `Exported ${rows.length} exhibitor applications.`)
  }

  async function donationsCsv() {
    const { data, error: e } = await requireSupabase().from('donations').select('*').order('created_at', { ascending: false })
    if (e) throw new Error(e.message)
    const rows = (data as Donation[] | null) ?? []
    downloadCsv('MEDSAM-donations-support.csv', rows, [
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
    notify('success', `Exported ${rows.length} donation records.`)
  }

  async function messagesCsv() {
    const { data, error: e } = await requireSupabase().from('contact_messages').select('*').order('created_at', { ascending: false })
    if (e) throw new Error(e.message)
    const rows = (data as ContactMessage[] | null) ?? []
    downloadCsv('MEDSAM-contact-messages.csv', rows, [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'subject', label: 'Subject' },
      { key: 'message', label: 'Message' },
      { key: 'is_read', label: 'Read', value: (r) => (r.is_read ? 'Yes' : 'No') },
      { key: 'created_at', label: 'Date', value: (r) => formatDateTime(r.created_at) },
    ] satisfies CsvColumn<ContactMessage>[])
    notify('success', `Exported ${rows.length} messages.`)
  }

  guard()

  const entries: Entry[] = [
    { id: 'regs-csv', title: 'Registrations → CSV', description: `Excel-compatible export of all ${CATEGORIES.length > 0 ? 'registration records' : ''}.`, Icon: FileSpreadsheet, tone: 'bg-emerald-600', action: () => withBusy('regs-csv', regsCsv), busyKey: 'regs-csv' },
    { id: 'regs-pdf', title: 'Registrations → PDF', description: 'Branded PDF report with summary totals and the full record table.', Icon: FileText, tone: 'bg-navy-900', action: () => withBusy('regs-pdf', regsPdf), busyKey: 'regs-pdf' },
    { id: 'pay-csv', title: 'Payment records → CSV', description: 'Every payment submission with method, reference and status.', Icon: FileSpreadsheet, tone: 'bg-emerald-600', action: () => withBusy('pay-csv', paymentsCsv), busyKey: 'pay-csv' },
    { id: 'abs-csv', title: 'Abstract list → CSV', description: 'All abstract submissions with status and reviewer comments.', Icon: FileSpreadsheet, tone: 'bg-emerald-600', action: () => withBusy('abs-csv', abstractsCsv), busyKey: 'abs-csv' },
    { id: 'abs-zip', title: 'All abstracts → ZIP', description: 'One ZIP of every submitted abstract PDF (safe filenames).', Icon: FileArchive, tone: 'bg-violet-600', action: () => withBusy('abs-zip', abstractsZip), busyKey: 'abs-zip' },
    { id: 'poster-zip', title: 'Poster files → ZIP', description: 'All poster PDFs and images submitted by participants.', Icon: Images, tone: 'bg-cyan-600', action: () => withBusy('poster-zip', postersZip), busyKey: 'poster-zip' },
    { id: 'innov-zip', title: 'Innovation files → ZIP', description: 'All innovation pitch materials and images.', Icon: Lightbulb, tone: 'bg-amber-500', action: () => withBusy('innov-zip', innovationsZip), busyKey: 'innov-zip' },
    { id: 'sp-csv', title: 'Sponsor applications → CSV', description: 'All sponsorship applications with status.', Icon: Handshake, tone: 'bg-violet-600', action: () => withBusy('sp-csv', sponsorsCsv), busyKey: 'sp-csv' },
    { id: 'ex-csv', title: 'Exhibitor applications → CSV', description: 'All exhibition applications with requirements.', Icon: Store, tone: 'bg-fuchsia-600', action: () => withBusy('ex-csv', exhibitorsCsv), busyKey: 'ex-csv' },
    { id: 'don-csv', title: 'Donations / support → CSV', description: 'All voluntary contributions with references.', Icon: HeartHandshake, tone: 'bg-rose-600', action: () => withBusy('don-csv', donationsCsv), busyKey: 'don-csv' },
    { id: 'msg-csv', title: 'Contact messages → CSV', description: 'All messages received through the contact form.', Icon: MessageSquare, tone: 'bg-slate-600', action: () => withBusy('msg-csv', messagesCsv), busyKey: 'msg-csv' },
  ]

  return (
    <div>
      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-black text-navy-950">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400"><FolderDown size={22} /></span>
          Downloads
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Quick access to every export the Secretariat needs — generated live from the database.
        </p>
      </header>

      {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((e) => (
          <div key={e.id} className="card card-hover flex flex-col p-5">
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${e.tone}`}>
                <e.Icon size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-navy-950">{e.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{e.description}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button size="sm" variant="btn-navy" className="w-full" loading={busy === e.busyKey} onClick={e.action}>
                <FolderDown size={14} /> {busy === e.busyKey ? 'Preparing…' : 'Download'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-xl border border-navy-100 bg-navy-50 px-5 py-4 text-xs leading-relaxed text-navy-900">
        <strong>Note:</strong> ZIP downloads stream files from Supabase Storage and can take a few seconds when
        there are many submissions. All CSV files open directly in Excel (UTF-8).
      </p>
    </div>
  )
}
