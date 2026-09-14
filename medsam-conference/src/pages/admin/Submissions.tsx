import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, FileDown, LayoutGrid, Lightbulb, ExternalLink } from 'lucide-react'
import { Spinner, ErrorState, EmptyState, StatusBadge } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { requireSupabase } from '../../lib/supabase'
import { fetchStorageFile } from '../../lib/exports'
import { downloadZipOfFiles } from '../../lib/exports'
import type { PosterSubmission, InnovationSubmission } from '../../lib/types'
import { formatDateTime, cn } from '../../lib/utils'

type Tab = 'posters' | 'innovations'
type Item = (PosterSubmission & { kind: 'posters' }) | (InnovationSubmission & { kind: 'innovations' })

/**
 * Approve / reject poster and innovation submissions.
 * Approving makes the item visible on the public Posters & Innovations page
 * (storage read policies check the same status column).
 */
export default function Submissions() {
  const { notify } = useToast()
  const [tab, setTab] = useState<Tab>('posters')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [zipping, setZipping] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const client = requireSupabase()
      const [p, i] = await Promise.all([
        client.from('poster_submissions').select('*').order('created_at', { ascending: false }),
        client.from('innovation_submissions').select('*').order('created_at', { ascending: false }),
      ])
      if (p.error) throw new Error(p.error.message)
      if (i.error) throw new Error(i.error.message)
      setItems([
        ...((p.data as PosterSubmission[] | null) ?? []).map((x) => ({ ...x, kind: 'posters' as 'posters' })),
        ...((i.data as InnovationSubmission[] | null) ?? []).map((x) => ({ ...x, kind: 'innovations' as 'innovations' })),
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load submissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function urlFor(it: Item, path: string | null, kind: 'pdf' | 'image'): string | null {
    if (!path) return null
    const bucket = it.kind === 'posters' ? 'posters' : 'innovations'
    const key = it.kind === 'posters' ? (kind === 'pdf' ? 'poster_pdf_path' : 'poster_image_path') : kind === 'pdf' ? 'materials_path' : 'image_path'
    void it
    const p = (it as unknown as Record<string, string | null>)[key]
    return p ? requireSupabase().storage.from(bucket).getPublicUrl(p).data.publicUrl : null
  }

  async function setStatus(it: Item, status: 'approved' | 'rejected') {
    setBusyId(it.id)
    try {
      const client = requireSupabase()
      const table = it.kind === 'posters' ? 'poster_submissions' : 'innovation_submissions'
      const { error: e } = await client.from(table).update({ status, updated_at: new Date().toISOString() } as object).eq('id', it.id)
      if (e) throw new Error(e.message)
      await load()
      notify('success', status === 'approved' ? 'Submission approved — now visible on the public showcase.' : 'Submission rejected (kept private).')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setBusyId(null)
    }
  }

  async function downloadFile(it: Item, kind: 'pdf' | 'image') {
    const path = urlFor(it, null, kind)
    if (!path) {
      notify('error', 'No file attached for this submission.')
      return
    }
    const bucket = it.kind === 'posters' ? 'posters' : 'innovations'
    const key = it.kind === 'posters' ? (kind === 'pdf' ? 'poster_pdf_path' : 'poster_image_path') : kind === 'pdf' ? 'materials_path' : 'image_path'
    const p = (it as unknown as Record<string, string | null>)[key]
    if (!p) return
    const blob = await fetchStorageFile(requireSupabase(), bucket, p)
    if (!blob) {
      notify('error', 'File could not be retrieved.')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${it.kind}-${it.id.slice(0, 8)}`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  async function zipAll() {
    const visible = items.filter((i) => i.kind === tab)
    const entries = visible.map((i) => {
      const key = i.kind === 'posters' ? 'poster_pdf_path' : 'materials_path'
      return {
        name: `${i.kind}-${i.id.slice(0, 8)}-${(i.title ?? 'item').slice(0, 40)}.pdf`,
        bucket: (i.kind === 'posters' ? 'posters' : 'innovations') as 'posters' | 'innovations',
        path: (i as unknown as Record<string, string | null>)[key],
      }
    })
    setZipping(true)
    try {
      const n = await downloadZipOfFiles(requireSupabase(), `MEDSAM-${tab}.zip`, entries)
      notify('success', `ZIP created with ${n} files.`)
    } catch {
      notify('error', 'ZIP creation failed.')
    } finally {
      setZipping(false)
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  const visible = items.filter((i) => i.kind === tab)

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Posters &amp; Innovation Submissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Approve to publish on the public showcase · reject keeps the submission private.
          </p>
        </div>
        <Button size="sm" variant="btn-navy" onClick={zipAll} loading={zipping}>
          <FileDown size={14} /> ZIP all {tab} files
        </Button>
      </header>

      <div className="mb-5 flex gap-2">
        {(
          [
            { id: 'posters', label: 'Scientific Posters', Icon: LayoutGrid },
            { id: 'innovations', label: 'Innovations', Icon: Lightbulb },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={cn(
              'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all',
              tab === id ? 'bg-navy-900 text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:border-navy-400',
            )}
          >
            <Icon size={15} /> {label} ({items.filter((i) => i.kind === id).length})
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading submissions…" />
      ) : visible.length === 0 ? (
        <EmptyState title={`No ${tab} submissions yet`} message="Participant submissions will appear here for your review." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {visible.map((it) => {
            const img = urlFor(it, null, 'image')
            const pdf = (it.kind === 'posters' ? it.poster_pdf_path : it.materials_path) ?? null
            const pending = it.status === 'pending'
            return (
              <div key={it.id} className={cn('card overflow-hidden', pending && 'border-amber-300')}>
                <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-navy-900 to-navy-700">
                  {img ? (
                    <img src={img} alt={it.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <Lightbulb size={44} className="text-gold-400/50" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-navy-950" title={it.title}>{it.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {it.contact_name} · {it.contact_email}
                        {it.institution ? ` · ${it.institution}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={it.status} />
                  </div>
                  {it.team_members && <p className="mt-2 text-xs text-slate-500">Team: {it.team_members}</p>}
                  {it.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">{it.description}</p>}
                  <p className="mt-2 text-[11px] text-slate-400">Submitted {formatDateTime(it.created_at)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setStatus(it, 'approved')} loading={busyId === it.id} disabled={!pending}>
                      <CheckCircle2 size={14} /> {it.status === 'approved' ? 'Approved' : 'Approve'}
                    </Button>
                    <Button size="sm" variant="btn-danger" onClick={() => setStatus(it, 'rejected')} loading={busyId === it.id} disabled={!pending}>
                      <XCircle size={14} /> {it.status === 'rejected' ? 'Rejected' : 'Reject'}
                    </Button>
                    <Button size="sm" variant="btn-outline-navy" onClick={() => downloadFile(it, 'pdf')} disabled={!pdf}>
                      <FileDown size={14} /> PDF
                    </Button>
                    {img && (
                      <a href={img} target="_blank" rel="noopener noreferrer" className="btn btn-outline-navy btn-sm">
                        <ExternalLink size={14} /> Image
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
