import { useState, type FormEvent } from 'react'
import { Plus, Trash2, Upload, ImageIcon, Video, X } from 'lucide-react'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/FormControls'
import { FileUpload } from '../../components/ui/FileUpload'
import { useToast } from '../../components/ui/Toast'
import { useCrud, uploadToBucket, publicUrl } from '../../hooks/useCrud'
import type { GalleryItem } from '../../lib/types'
import { IMAGE_TYPES } from '../../lib/utils'

const CATEGORIES = [
  { id: 'pre_conference', label: 'Pre-Conference' },
  { id: 'main_conference', label: 'Main Conference' },
  { id: 'presentations', label: 'Scientific Presentations' },
  { id: 'innovation', label: 'Innovation' },
  { id: 'networking', label: 'Networking' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'other', label: 'Other' },
]

interface GalleryForm {
  title: string
  caption: string
  category: string
  media_type: 'image' | 'video'
  video_url: string
  sort_order: string
  is_published: boolean
}

const EMPTY_FORM: GalleryForm = { title: '', caption: '', category: 'main_conference', media_type: 'image', video_url: '', sort_order: '0', is_published: true }

/** CRUD for gallery media — images upload to the public `gallery` bucket. */
export default function GalleryAdmin() {
  const { notify } = useToast()
  const crud = useCrud<GalleryItem>('gallery_items')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState<GalleryForm>(EMPTY_FORM)
  const [image, setImage] = useState<File | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setImage(null)
    setErr(null)
    setOpen(true)
  }

  function openEdit(r: GalleryItem) {
    setEditing(r)
    setForm({
      title: r.title ?? '',
      caption: r.caption ?? '',
      category: r.category,
      media_type: r.media_type,
      video_url: r.video_url ?? '',
      sort_order: String(r.sort_order),
      is_published: r.is_published,
    })
    setImage(null)
    setErr(null)
    setOpen(true)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.media_type === 'image' && !image && !editing?.file_path) {
      setErr('Please upload an image (or edit an existing one).')
      return
    }
    if (form.media_type === 'video' && !form.video_url.trim()) {
      setErr('Please paste the video URL (e.g. a YouTube or Vimeo link).')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      let filePath = editing?.file_path ?? null
      if (image) filePath = await uploadToBucket('gallery', 'images', image)
      const payload = {
        title: form.title.trim() || null,
        caption: form.caption.trim() || null,
        category: form.category,
        media_type: form.media_type,
        file_path: form.media_type === 'image' ? filePath : null,
        video_url: form.media_type === 'video' ? form.video_url.trim() : null,
        sort_order: Number(form.sort_order) || 0,
        is_published: form.is_published,
      }
      if (editing) await crud.update(editing.id, payload)
      else await crud.insert(payload)
      notify('success', editing ? 'Gallery item updated.' : 'Gallery item added.')
      setOpen(false)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(r: GalleryItem) {
    if (!window.confirm('Delete this gallery item?')) return
    try {
      if (r.file_path) {
        await crud.remove(r.id)
        const { supabase } = await import('../../lib/supabase')
        if (supabase) await supabase.storage.from('gallery').remove([r.file_path])
        notify('success', 'Gallery item deleted.')
      } else {
        await crud.remove(r.id)
        notify('success', 'Gallery item deleted.')
      }
    } catch (e2) {
      notify('error', e2 instanceof Error ? e2.message : 'Delete failed.')
    }
  }

  if (crud.loading) return <Spinner label="Loading gallery…" />
  if (crud.error) return <ErrorState message={crud.error} onRetry={crud.reload} />

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Gallery</h1>
          <p className="mt-1 text-sm text-slate-500">{crud.rows.length} items · published items appear on the public Gallery page.</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={15} /> Add Media
        </Button>
      </header>

      {crud.rows.length === 0 ? (
        <EmptyState
          icon={<ImageIcon size={26} />}
          title="No gallery media yet"
          message="Upload conference photographs or add video links. Organise them by category for the public gallery."
          action={<Button size="sm" onClick={openAdd}><Plus size={14} /> Upload Your First Item</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {crud.rows.map((g) => (
            <div key={g.id} className="card overflow-hidden">
              <div className="relative h-40 bg-slate-100">
                {g.media_type === 'image' && g.file_path ? (
                  <img src={publicUrl('gallery', g.file_path)} alt={g.title ?? 'Gallery item'} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-navy-950">
                    <Video size={30} className="text-gold-400" />
                  </div>
                )}
                <span className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${g.is_published ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {g.is_published ? 'Live' : 'Hidden'}
                </span>
              </div>
              <div className="p-4">
                <p className="truncate text-sm font-bold text-navy-950">{g.title ?? (g.media_type === 'video' ? 'Video' : 'Image')}</p>
                <p className="mt-0.5 text-xs text-slate-500">{CATEGORIES.find((c) => c.id === g.category)?.label ?? g.category}</p>
                <div className="mt-3 flex gap-1.5">
                  <Button size="sm" variant="btn-outline-navy" className="flex-1" onClick={() => openEdit(g)}>Edit</Button>
                  <button onClick={() => crud.update(g.id, { is_published: !g.is_published })} className="rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-navy-800 hover:bg-slate-50">
                    {g.is_published ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => remove(g)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" aria-label="Delete item">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit gallery item' : 'Add gallery item'}
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
          <Field label="Title" className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Opening ceremony, 12 March 2027" />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={form.media_type} onChange={(e) => setForm((f) => ({ ...f, media_type: e.target.value as 'image' | 'video' }))}>
              <option value="image">Image (upload)</option>
              <option value="video">Video (URL embed)</option>
            </Select>
          </Field>
          {form.media_type === 'image' ? (
            <Field label={editing?.file_path ? 'Replace image' : 'Image'} required help="JPG/PNG/WEBP, max 5 MB." className="sm:col-span-2">
              <FileUpload label="" accept={IMAGE_TYPES.accept} maxSizeMB={IMAGE_TYPES.maxSizeMB} file={image} onFile={setImage} />
              {editing?.file_path && !image && (
                <p className="mt-2 text-xs text-slate-500">
                  <Upload size={11} className="mr-1 inline" />Current image will be kept unless replaced.
                </p>
              )}
            </Field>
          ) : (
            <Field label="Video URL" required help="YouTube / Vimeo link — opened in a new tab on the gallery." className="sm:col-span-2">
              <Input value={form.video_url} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/…" />
            </Field>
          )}
          <Field label="Caption" className="sm:col-span-2">
            <Input value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} />
          </Field>
          <Field label="Display order">
            <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} className="h-4 w-4 rounded accent-navy-900" />
              Published
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}
