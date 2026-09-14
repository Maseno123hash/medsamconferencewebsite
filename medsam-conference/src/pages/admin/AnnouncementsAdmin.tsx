import { useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/FormControls'
import { useToast } from '../../components/ui/Toast'
import { useCrud } from '../../hooks/useCrud'
import type { Announcement } from '../../lib/types'
import { formatDateTime } from '../../lib/utils'

interface AnnForm {
  title: string
  body: string
  type: string
  starts_at: string
  ends_at: string
  is_active: boolean
}
const EMPTY: AnnForm = { title: '', body: '', type: 'notice', starts_at: '', ends_at: '', is_active: true }

const TYPES = [
  { id: 'notice', label: 'Notice' },
  { id: 'registration', label: 'Registration' },
  { id: 'abstract', label: 'Abstract deadline' },
  { id: 'speaker', label: 'Speaker announcement' },
  { id: 'programme', label: 'Programme update' },
  { id: 'urgent', label: 'Urgent' },
]

/** Announcements drive the strip at the top of every public page. */
export default function AnnouncementsAdmin() {
  const { notify } = useToast()
  const crud = useCrud<Announcement>('announcements')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState<AnnForm>(EMPTY)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setErr(null)
    setOpen(true)
  }

  function openEdit(a: Announcement) {
    setEditing(a)
    setForm({
      title: a.title,
      body: a.body,
      type: a.type,
      starts_at: a.starts_at ? a.starts_at.slice(0, 10) : '',
      ends_at: a.ends_at ? a.ends_at.slice(0, 10) : '',
      is_active: a.is_active,
    })
    setErr(null)
    setOpen(true)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.title.trim().length < 3) {
      setErr('Please enter a short announcement title.')
      return
    }
    if (form.body.trim().length < 10) {
      setErr('Please write the announcement text (min. 10 characters).')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        type: form.type,
        starts_at: form.starts_at ? new Date(`${form.starts_at}T00:00:00`).toISOString() : null,
        ends_at: form.ends_at ? new Date(`${form.ends_at}T23:59:59`).toISOString() : null,
        is_active: form.is_active,
      }
      if (editing) await crud.update(editing.id, payload)
      else await crud.insert(payload)
      notify('success', editing ? 'Announcement updated.' : 'Announcement published.')
      setOpen(false)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(a: Announcement) {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await crud.remove(a.id)
      notify('success', 'Announcement deleted.')
    } catch (e2) {
      notify('error', e2 instanceof Error ? e2.message : 'Delete failed.')
    }
  }

  if (crud.loading) return <Spinner label="Loading announcements…" />
  if (crud.error) return <ErrorState message={crud.error} onRetry={crud.reload} />

  const now = new Date().toISOString()
  const live = crud.rows.filter((a) => a.is_active && (!a.starts_at || a.starts_at <= now) && (!a.ends_at || a.ends_at >= now))

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">
            {live.length} live · the most recent live announcement appears in the strip on every public page.
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={15} /> New Announcement
        </Button>
      </header>

      {crud.rows.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={26} />}
          title="No announcements yet"
          message="Publish registration updates, abstract deadlines, speaker announcements and important notices here."
          action={<Button size="sm" onClick={openAdd}><Plus size={14} /> Publish Your First Announcement</Button>}
        />
      ) : (
        <div className="space-y-3">
          {crud.rows.map((a) => {
            const isActive = a.is_active && (!a.starts_at || a.starts_at <= now) && (!a.ends_at || a.ends_at >= now)
            return (
              <div key={a.id} className="card flex flex-wrap items-center gap-4 p-5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-gold-500/15 text-gold-700' : 'bg-slate-100 text-slate-400'}`}>
                  <Megaphone size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-navy-950">{a.title}</p>
                    <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-navy-800 uppercase">{a.type}</span>
                    <span className={`text-[11px] font-bold ${isActive ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isActive ? '● Live now' : '○ Not live'}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.body}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Created {formatDateTime(a.created_at)}
                    {a.starts_at ? ` · from ${formatDateTime(a.starts_at)}` : ''}
                    {a.ends_at ? ` · until ${formatDateTime(a.ends_at)}` : ''}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(a)} className="rounded-lg p-2 text-navy-700 hover:bg-navy-50" aria-label="Edit announcement"><Pencil size={15} /></button>
                  <button onClick={() => crud.update(a.id, { is_active: !a.is_active })} className="rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-navy-800 hover:bg-slate-50">
                    {a.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => remove(a)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Delete announcement"><Trash2 size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit announcement' : 'New announcement'}
        wide
        footer={
          <>
            <Button size="sm" variant="btn-outline-navy" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={(e) => onSubmit(e as unknown as FormEvent)} loading={busy}>
              {editing ? 'Save Changes' : 'Publish'}
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
          {err && <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{err}</p>}
          <Field label="Title" required className="sm:col-span-2" help="Short label shown before the text, e.g. 'Abstract deadline extended'.">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <Input type="date" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} />
            </Field>
            <Field label="End date">
              <Input type="date" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} />
            </Field>
          </div>
          <Field label="Announcement text" required className="sm:col-span-2" help="Kept concise — it displays in the strip on every page.">
            <Textarea rows={3} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          </Field>
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded accent-navy-900" />
              Active
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}
