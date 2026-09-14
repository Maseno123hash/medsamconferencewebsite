import { useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/FormControls'
import { useToast } from '../../components/ui/Toast'
import { useCrud } from '../../hooks/useCrud'
import { PROGRAMME_PLACEHOLDERS } from '../../lib/constants'
import type { ProgrammeItem } from '../../lib/types'

const CATEGORIES = ['opening', 'keynote', 'session', 'oral', 'poster', 'innovation', 'panel', 'break', 'awards', 'closing', 'other']
const DAYS = ['Day 1 — Friday, 12 March 2027', 'Day 2 — Saturday, 13 March 2027']

interface ProgForm {
  day: string
  time: string
  title: string
  description: string
  category: string
  location: string
  sort_order: string
  is_published: boolean
}

const EMPTY_FORM: ProgForm = {
  day: DAYS[0],
  time: '',
  title: '',
  description: '',
  category: 'session',
  location: 'Amphitheatre, South Wing',
  sort_order: '0',
  is_published: true,
}

/** CRUD for the data-driven conference programme. */
export default function ProgrammeAdmin() {
  const { notify } = useToast()
  const crud = useCrud<ProgrammeItem>('programme_items')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProgrammeItem | null>(null)
  const [form, setForm] = useState<ProgForm>(EMPTY_FORM)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErr(null)
    setOpen(true)
  }

  function openEdit(r: ProgrammeItem) {
    setEditing(r)
    setForm({
      day: r.day,
      time: r.time ?? '',
      title: r.title,
      description: r.description ?? '',
      category: r.category,
      location: r.location ?? '',
      sort_order: String(r.sort_order),
      is_published: r.is_published,
    })
    setErr(null)
    setOpen(true)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.title.trim().length < 2) {
      setErr('Please enter the session title.')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const payload = {
        day: form.day,
        time: form.time.trim() || null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        location: form.location.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_published: form.is_published,
      }
      if (editing) await crud.update(editing.id, payload)
      else await crud.insert(payload)
      notify('success', editing ? 'Programme item updated.' : 'Programme item added.')
      setOpen(false)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function seedPlaceholders() {
    try {
      for (const p of PROGRAMME_PLACEHOLDERS) {
        await crud.insert({
          day: p.day,
          time: p.time,
          title: p.title,
          description: p.description,
          category: p.category,
          location: p.location ?? null,
          sort_order: 0,
          is_published: true,
        })
      }
      notify('success', 'Placeholder programme inserted — edit each item as details are confirmed.')
    } catch (e2) {
      notify('error', e2 instanceof Error ? e2.message : 'Seeding failed.')
    }
  }

  async function remove(r: ProgrammeItem) {
    if (!window.confirm(`Delete "${r.title}"?`)) return
    try {
      await crud.remove(r.id)
      notify('success', 'Item deleted.')
    } catch (e2) {
      notify('error', e2 instanceof Error ? e2.message : 'Delete failed.')
    }
  }

  if (crud.loading) return <Spinner label="Loading programme…" />
  if (crud.error) return <ErrorState message={crud.error} onRetry={crud.reload} />

  const days = crud.rows.reduce<Record<string, ProgrammeItem[]>>((acc, r) => {
    ;(acc[r.day] = acc[r.day] ?? []).push(r)
    return acc
  }, {})

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Conference Programme</h1>
          <p className="mt-1 text-sm text-slate-500">
            {crud.rows.length} items · publish as details are confirmed. The public page updates automatically.
          </p>
        </div>
        <div className="flex gap-2">
          {crud.rows.length === 0 && (
            <Button size="sm" variant="btn-outline-navy" onClick={seedPlaceholders}>
              Insert Tentative Placeholder Programme
            </Button>
          )}
          <Button size="sm" onClick={openAdd}>
            <Plus size={15} /> Add Item
          </Button>
        </div>
      </header>

      {crud.rows.length === 0 ? (
        <EmptyState
          title="The programme is empty"
          message="Add sessions one by one, or insert the tentative placeholder programme (clearly marked as tentative) and edit it as confirmations arrive."
          action={<Button size="sm" onClick={seedPlaceholders}>Insert Tentative Placeholders</Button>}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(days).map(([day, items]) => (
            <div key={day}>
              <h2 className="mb-3 text-lg font-black text-navy-950">{day}</h2>
              <div className="card divide-y divide-slate-100">
                {items.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className="w-24 text-sm font-black text-navy-900">{r.time ?? 'TBC'}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-navy-950">{r.title}</p>
                      {r.description && <p className="mt-0.5 truncate text-xs text-slate-500">{r.description}</p>}
                    </div>
                    <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-navy-800 uppercase">{r.category}</span>
                    <span className={`text-[11px] font-bold ${r.is_published ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {r.is_published ? 'Published' : 'Hidden'}
                    </span>
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(r)} className="rounded-lg p-2 text-navy-700 hover:bg-navy-50" aria-label="Edit item">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => crud.update(r.id, { is_published: !r.is_published })} className="rounded-lg p-2 text-navy-700 hover:bg-navy-50" aria-label="Toggle publish">
                        {r.is_published ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => remove(r)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Delete item">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit programme item' : 'Add programme item'}
        wide
        footer={
          <>
            <Button size="sm" variant="btn-outline-navy" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={(e) => onSubmit(e as unknown as FormEvent)} loading={busy}>
              {editing ? 'Save Changes' : 'Add Item'}
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
          {err && <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{err}</p>}
          <Field label="Day" required>
            <Input value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))} list="medsam-days" />
            <datalist id="medsam-days">
              {DAYS.map((d) => <option key={d} value={d} />)}
            </datalist>
          </Field>
          <Field label="Time">
            <Input value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} placeholder="e.g. 10:00 AM" />
          </Field>
          <Field label="Title" required className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </Field>
          <Field label="Description / notes" className="sm:col-span-2">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Display order">
            <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                className="h-4 w-4 rounded accent-navy-900"
              />
              Published
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}
