import { useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, Upload, ImageIcon } from 'lucide-react'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/FormControls'
import { FileUpload } from '../../components/ui/FileUpload'
import { useToast } from '../../components/ui/Toast'
import { useCrud, uploadToBucket, publicUrl } from '../../hooks/useCrud'
import type { Speaker } from '../../lib/types'
import { IMAGE_TYPES } from '../../lib/utils'

interface SpeakerForm {
  name: string
  title: string
  institution: string
  topic: string
  biography: string
  sort_order: string
  is_published: boolean
}

const EMPTY_FORM: SpeakerForm = { name: '', title: '', institution: '', topic: '', biography: '', sort_order: '0', is_published: true }

type Row = Omit<Speaker, 'photo_path'> & { photo_path: string | null }

/** CRUD for speakers — the public Speakers page renders these rows. */
export default function SpeakersAdmin() {
  const { notify } = useToast()
  const crud = useCrud<Row>('speakers')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form, setForm] = useState<SpeakerForm>(EMPTY_FORM)
  const [photo, setPhoto] = useState<File | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setPhoto(null)
    setErr(null)
    setOpen(true)
  }

  function openEdit(r: Row) {
    setEditing(r)
    setForm({
      name: r.name,
      title: r.title ?? '',
      institution: r.institution ?? '',
      topic: r.topic ?? '',
      biography: r.biography ?? '',
      sort_order: String(r.sort_order),
      is_published: r.is_published,
    })
    setPhoto(null)
    setErr(null)
    setOpen(true)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.name.trim().length < 2) {
      setErr('Please enter the speaker name.')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      let photoPath = editing?.photo_path ?? null
      if (photo) photoPath = await uploadToBucket('speaker_photos', 'speakers', photo)
      const payload = {
        name: form.name.trim(),
        title: form.title.trim() || null,
        institution: form.institution.trim() || null,
        topic: form.topic.trim() || null,
        biography: form.biography.trim() || null,
        photo_path: photoPath,
        sort_order: Number(form.sort_order) || 0,
        is_published: form.is_published,
      }
      if (editing) await crud.update(editing.id, payload)
      else await crud.insert(payload)
      notify('success', editing ? 'Speaker updated.' : 'Speaker added.')
      setOpen(false)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(r: Row) {
    if (!window.confirm(`Delete speaker "${r.name}"? This cannot be undone.`)) return
    try {
      await crud.remove(r.id)
      notify('success', 'Speaker deleted.')
    } catch (e2) {
      notify('error', e2 instanceof Error ? e2.message : 'Delete failed.')
    }
  }

  if (crud.loading) return <Spinner label="Loading speakers…" />
  if (crud.error) return <ErrorState message={crud.error} onRetry={crud.reload} />

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Speakers</h1>
          <p className="mt-1 text-sm text-slate-500">
            {crud.rows.length} speakers · published speakers appear on the public Speakers page.
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={15} /> Add Speaker
        </Button>
      </header>

      {crud.rows.length === 0 ? (
        <EmptyState
          icon={<ImageIcon size={26} />}
          title="No speakers yet"
          message="Add keynote and session speakers here as they are confirmed. Use unpublished rows for speakers you'd like to keep hidden until the announcement date."
          action={<Button size="sm" onClick={openAdd}><Plus size={14} /> Add Your First Speaker</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {crud.rows.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-navy-100">
                  {s.photo_path ? (
                    <img src={publicUrl('speaker_photos', s.photo_path)} alt={s.name} className="h-full w-full object-cover object-top" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-navy-300">
                      <ImageIcon size={22} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-navy-950">{s.name}</h3>
                  {s.title && <p className="truncate text-xs font-semibold text-gold-700">{s.title}</p>}
                  {s.institution && <p className="truncate text-xs text-slate-500">{s.institution}</p>}
                  <p className={`mt-1 text-[11px] font-bold ${s.is_published ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {s.is_published ? '● Published' : '○ Hidden'} · order {s.sort_order}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="btn-outline-navy" onClick={() => openEdit(s)}>
                  <Pencil size={13} /> Edit
                </Button>
                <Button size="sm" variant="btn-outline-navy" onClick={() => crud.update(s.id, { is_published: !s.is_published })}>
                  {s.is_published ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm" variant="btn-danger" onClick={() => remove(s)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit — ${editing.name}` : 'Add speaker'}
        wide
        footer={
          <>
            <Button size="sm" variant="btn-outline-navy" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={(e) => onSubmit(e as unknown as FormEvent)} loading={busy}>
              {editing ? 'Save Changes' : 'Add Speaker'}
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
          {err && <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{err}</p>}
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Professional title">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Professor & Consultant Physician" />
          </Field>
          <Field label="Institution">
            <Input value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} />
          </Field>
          <Field label="Topic / session">
            <Input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} placeholder="e.g. Keynote: The Future of Diagnostics in Kenya" />
          </Field>
          <Field label="Biography" className="sm:col-span-2">
            <Textarea rows={4} value={form.biography} onChange={(e) => setForm((f) => ({ ...f, biography: e.target.value }))} />
          </Field>
          <Field label="Display order" help="Lower numbers appear first.">
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
              Published (visible on website)
            </label>
          </div>
          <Field label="Photograph" help="JPG/PNG/WEBP, max 5 MB. Square or portrait works best." className="sm:col-span-2">
            <FileUpload
              label=""
              accept={IMAGE_TYPES.accept}
              maxSizeMB={IMAGE_TYPES.maxSizeMB}
              file={photo}
              onFile={setPhoto}
            />
            {!photo && editing?.photo_path && (
              <p className="mt-2 text-xs text-slate-500">
                <Upload size={11} className="mr-1 inline" />Current photo will be kept unless you upload a new one.
              </p>
            )}
          </Field>
        </form>
      </Modal>
    </div>
  )
}
