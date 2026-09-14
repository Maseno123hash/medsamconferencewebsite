import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  Download,
  FileDown,
  FileArchive,
  Eye,
  FileText,
  MessageSquarePlus,
} from 'lucide-react'
import { Spinner, ErrorState, EmptyState, StatusBadge } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/FormControls'
import { useToast } from '../../components/ui/Toast'
import { requireSupabase } from '../../lib/supabase'
import { downloadCsv, downloadZipOfFiles, fetchStorageFile, type CsvColumn } from '../../lib/exports'
import { TRACKS } from '../../lib/constants'
import type { AbstractSubmission, AbstractStatus } from '../../lib/types'
import { formatDateTime, sanitizeFilename, cn } from '../../lib/utils'

const STATUSES: AbstractStatus[] = ['submitted', 'under_review', 'accepted', 'revision_required', 'rejected', 'oral', 'poster']

export default function Abstracts() {
  const { notify } = useToast()
  const [rows, setRows] = useState<AbstractSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [track, setTrack] = useState('all')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<AbstractSubmission | null>(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [zipping, setZipping] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: e } = await requireSupabase()
        .from('abstract_submissions')
        .select('*')
        .order('created_at', { ascending: false })
      if (e) throw new Error(e.message)
      setRows((data as AbstractSubmission[] | null) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load abstracts.')
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
      const n = q.trim().toLowerCase()
      out = out.filter(
        (r) =>
          r.abstract_title.toLowerCase().includes(n) ||
          r.author_name.toLowerCase().includes(n) ||
          (r.institution ?? '').toLowerCase().includes(n) ||
          r.submission_id.toLowerCase().includes(n) ||
          (r.email ?? '').toLowerCase().includes(n),
      )
    }
    if (track !== 'all') out = out.filter((r) => r.track === track)
    if (status !== 'all') out = out.filter((r) => r.status === status)
    return out
  }, [rows, q, track, status])

  function openRow(r: AbstractSubmission) {
    setSelected(r)
    setComment(r.reviewer_comments ?? '')
  }

  async function saveStatus(newStatus: AbstractStatus, withComment = false) {
    if (!selected) return
    setBusy(true)
    try {
      const client = requireSupabase()
      const patch: Partial<AbstractSubmission> = { status: newStatus, updated_at: new Date().toISOString() }
      if (withComment) patch.reviewer_comments = comment.trim() || null
      const { error: e } = await client.from('abstract_submissions').update(patch as object).eq('id', selected.id)
      if (e) throw new Error(e.message)
      await load()
      setSelected({ ...selected, ...patch })
      notify('success', `Status updated to "${newStatus.replace(/_/g, ' ')}".`)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setBusy(false)
    }
  }

  async function downloadPdf(r: AbstractSubmission) {
    if (!r.pdf_path) {
      notify('error', 'No PDF file is attached to this abstract.')
      return
    }
    const blob = await fetchStorageFile(requireSupabase(), 'abstracts', r.pdf_path)
    if (!blob) {
      notify('error', 'Could not retrieve the PDF from storage.')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${r.submission_id}_${sanitizeFilename(r.author_name)}_${sanitizeFilename(r.abstract_title)}.pdf`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  /** CRITICAL: one-click ZIP of every submitted abstract PDF. */
  async function downloadAllZip() {
    const withFiles = filtered.filter((r) => r.pdf_path)
    if (withFiles.length === 0) {
      notify('error', 'No abstract PDFs available to download.')
      return
    }
    setZipping(true)
    try {
      const entries = withFiles.map((r, i) => ({
        name: `ABS-${String(i + 1).padStart(3, '0')}_${sanitizeFilename(r.author_name)}_${sanitizeFilename(r.abstract_title)}.pdf`,
        bucket: 'abstracts' as const,
        path: r.pdf_path,
      }))
      const count = await downloadZipOfFiles(requireSupabase(), `MEDSAM-abstracts-${new Date().toISOString().slice(0, 10)}.zip`, entries)
      notify('success', `ZIP created with ${count} abstract PDFs.`)
    } catch {
      notify('error', 'ZIP creation failed. Please try again.')
    } finally {
      setZipping(false)
    }
  }

  function exportCsv() {
    const columns: CsvColumn<AbstractSubmission>[] = [
      { key: 'submission_id', label: 'Submission ID' },
      { key: 'abstract_title', label: 'Title' },
      { key: 'author_name', label: 'Lead Author' },
      { key: 'authors', label: 'Authors' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'institution', label: 'Institution' },
      { key: 'department', label: 'Department' },
      { key: 'track', label: 'Track' },
      { key: 'presentation_preference', label: 'Preference' },
      { key: 'keywords', label: 'Keywords' },
      { key: 'status', label: 'Status' },
      { key: 'reviewer_comments', label: 'Reviewer Comments' },
      { key: 'created_at', label: 'Submitted', value: (r) => formatDateTime(r.created_at) },
    ]
    downloadCsv(`MEDSAM-abstracts-${new Date().toISOString().slice(0, 10)}.csv`, filtered, columns)
    notify('success', `Exported ${filtered.length} abstracts to CSV.`)
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Abstract Submissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            {filtered.length} of {rows.length} submissions · review, comment and assign Oral / Poster.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="btn-gold" onClick={downloadAllZip} loading={zipping}>
            <FileArchive size={15} /> Download All Abstracts (ZIP)
          </Button>
          <Button size="sm" variant="btn-navy" onClick={exportCsv}>
            <Download size={14} /> CSV
          </Button>
        </div>
      </header>

      <div className="card no-print mb-5 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, author, institution, ID…" className="pl-10" />
        </div>
        <Select value={track} onChange={(e) => setTrack(e.target.value)} aria-label="Filter by track">
          <option value="all">All tracks</option>
          {TRACKS.map((t) => <option key={t.no} value={t.title}>{t.no} — {t.title}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
      </div>

      {loading ? (
        <Spinner label="Loading abstracts…" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<FileText size={26} />} title="No abstracts yet" message="Submissions will appear here with a unique MEDSAM-ABS-XXXXXX ID." />
      ) : (
        <div className="card overflow-hidden">
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black tracking-wider text-slate-500 uppercase">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Track</th>
                  <th className="px-4 py-3">Pref.</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-bold whitespace-nowrap text-navy-900">{r.submission_id}</td>
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="truncate font-semibold text-slate-900" title={r.abstract_title}>{r.abstract_title}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{r.author_name}</td>
                    <td className="max-w-[150px] truncate px-4 py-3 text-xs text-slate-600">{r.institution}</td>
                    <td className="max-w-[170px] truncate px-4 py-3 text-xs text-slate-600" title={r.track}>{r.track}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{r.presentation_preference}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openRow(r)} className="rounded-lg p-2 text-navy-700 hover:bg-navy-50" aria-label="Review abstract">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => downloadPdf(r)} className={cn('rounded-lg p-2', r.pdf_path ? 'text-navy-700 hover:bg-navy-50' : 'text-slate-300')} aria-label="Download PDF">
                          <FileDown size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.submission_id} — Review` : ''}
        wide
        footer={
          selected && (
            <>
              <Button size="sm" variant="btn-outline-navy" onClick={() => downloadPdf(selected)}>
                <FileDown size={14} /> Download PDF
              </Button>
              <Button size="sm" variant="btn-navy" onClick={() => saveStatus('accepted', true)} loading={busy}>
                Accept
              </Button>
              <Button size="sm" variant="btn-danger" onClick={() => saveStatus('rejected', true)} loading={busy}>
                Reject
              </Button>
              <Button size="sm" variant="btn-outline-navy" onClick={() => saveStatus('revision_required', true)} loading={busy}>
                Request Revision
              </Button>
              <Button size="sm" variant="btn-outline-navy" onClick={() => saveStatus('under_review')} loading={busy}>
                Under Review
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5 text-sm">
            <div>
              <h3 className="text-lg font-bold text-navy-950">{selected.abstract_title}</h3>
              <p className="mt-1 text-slate-600">
                {selected.author_name}
                {selected.authors ? ` · Authors: ${selected.authors}` : ''} · {selected.institution}
                {selected.department ? ` (${selected.department})` : ''}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-navy-100 px-3 py-1 text-xs font-bold text-navy-800">{selected.track}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  Preference: {selected.presentation_preference}
                </span>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-black tracking-wider text-slate-400 uppercase">Abstract text</p>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 leading-relaxed whitespace-pre-wrap text-slate-700 thin-scroll">
                {selected.abstract_text}
              </div>
            </div>

            {selected.keywords && (
              <div>
                <p className="mb-1.5 text-[11px] font-black tracking-wider text-slate-400 uppercase">Keywords</p>
                <p className="font-medium text-slate-700">{selected.keywords}</p>
              </div>
            )}

            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-slate-400 uppercase">
                <MessageSquarePlus size={13} /> Reviewer comments
              </p>
              <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Notes for the author (sent with the decision)…" />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-black tracking-wider text-slate-400 uppercase">Assign presentation format</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={selected.status === 'oral' ? 'btn-navy' : 'btn-outline-navy'} onClick={() => saveStatus('oral', true)} loading={busy}>
                  Assign Oral
                </Button>
                <Button size="sm" variant={selected.status === 'poster' ? 'btn-navy' : 'btn-outline-navy'} onClick={() => saveStatus('poster', true)} loading={busy}>
                  Assign Poster
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
