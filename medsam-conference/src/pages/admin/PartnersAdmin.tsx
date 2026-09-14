import { useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, Building2, Upload } from 'lucide-react'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/FormControls'
import { FileUpload } from '../../components/ui/FileUpload'
import { useToast } from '../../components/ui/Toast'
import { useCrud, uploadToBucket, publicUrl } from '../../hooks/useCrud'
import type { Partner } from '../../lib/types'

const ROLES = [
  'Institutional Partner',
  'Media Partner',
  'Community Partner',
  'Development Partner',
  'Technology Partner',
  'Other',
]

interface PartnerForm {
  name: string
  role: string
  website: string
  sort_order: string
  is_published: boolean
}
const EMPTY_FORM: PartnerForm = { name: '', role: ROLES[0], website: '', sort_order: '0', is_published: true }

/**
 * Partners — add/edit partner organisations with logos uploaded directly
 * from the admin's device. Published partners appear on the public
 * /partners page.
 */
export default function PartnersAdmin() {
  const { notify } = useToast()
  const crud = useCrud<Partner>('partners')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [form, setForm] = useState<PartnerForm>(EMPTY_FORM)
  const [logo, setLogo] = useState<File | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setLogo(null)
    setErr(null)
    setOpen(true)
  }

  function openEdit(p: Partner) {
    setEditing(p)
    setForm({ name: p.name, role: p.role ?? ROLES[5], website: p.website ?? '', sort_order: String(p.sort_order), is_published: p.is_published })
    setLogo(null)
    setErr(null)
    setOpen(true)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.name.trim().length < 2) {
      setErr('Please enter the partner name.')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      let logoPath = editing?.logo_path ?? null
      if (logo) logoPath = await uploadToBucket('partner_logos', 'logos', logo)
      const payload = {
        name: form.name.trim(),
        role: form.role || null,
        logo_path: logoPath,
        website: form.website.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_published: form.is_published,
      }
      if (editing) await crud.update(editing.id, payload)
      else await crud.insert(payload)
      notify('success', editing ? 'Partner updated.' : 'Partner added.')
      setOpen(false)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Save failed. (Did you run migration 0002_partners.sql?)')
    } finally {
      setBusy(false)
    }
  }

  async function remove(p: Partner) {
    if (!window.confirm(`Delete partner "${p.name}"?`)) return
    try {
      await crud.remove(p.id)
      notify('success', 'Partner deleted.')
    } catch (e2) {
      notify('error', e2 instanceof Error ? e2.message : 'Delete failed.')
    }
  }

  if (crud.loading) return <Spinner label="Loading partners…" />
  if (crud.error) return <ErrorState message={`${crud.error} — If the table doesn't exist yet, run supabase/migrations/0002_partners.sql in the Supabase SQL Editor.`} onRetry={crud.reload} />

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black text-navy-950">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400"><Building2 size={22} /></span>
            Partners
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {crud.rows.length} partners · upload logos from your device — published partners appear on the public /partners page.
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={15} /> Add Partner
        </Button>
      </header>

      {crud.rows.length === 0 ? (
        <EmptyState
          icon={<Building2 size={26} />}
          title="No partners yet"
          message="Add partner organisations and upload their logos (PNG/JPG/WEBP, max 5 MB). Institutional affiliations (SOMU, MSAKE) already appear on the public page automatically."
          action={<Button size="sm" onClick={openAdd}><Plus size={14} /> Add Your First Partner</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {crud.rows.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  {p.logo_path ? (
                    <img src={publicUrl('partner_logos', p.logo_path)} alt={p.name} className="max-h-full max-w-full object-contain p-2" />
                  ) : (
                    <span className="px-2 text-center text-xs font-black text-navy-300">{p.name}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-navy-950">{p.name}</h3>
                  {p.role && <p className="mt-0.5 text-[11px] font-bold tracking-wider text-gold-700 uppercase">{p.role}</p>}
                  {p.website && <p className="mt-0.5 truncate text-xs text-slate-500">{p.website}</p>}
                  <p className={`mt-1.5 text-[11px] font-bold ${p.is_published ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {p.is_published ? '● Live on website' : '○ Hidden'} · order {p.sort_order}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="btn-outline-navy" onClick={() => openEdit(p)}><Pencil size={13} /> Edit</Button>
                <Button size="sm" variant="btn-outline-navy" onClick={() => crud.update(p.id, { is_published: !p.is_published })}>
                  {p.is_published ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm" variant="btn-danger" onClick={() => remove(p)}><Trash2 size={13} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit — ${editing.name}` : 'Add partner'}
        footer={
          <>
            <Button size="sm" variant="btn-outline-navy" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={(e) => onSubmit(e as unknown as FormEvent)} loading={busy}>
              {editing ? 'Save Changes' : 'Add Partner'}
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
          {err && <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{err}</p>}
          <Field label="Partner name" required className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Kenya Medical Association" />
          </Field>
          <Field label="Role / relationship">
            <select className="input cursor-pointer" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Website">
            <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://…" />
          </Field>
          <Field label="Display order">
            <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} className="h-4 w-4 rounded accent-navy-900" />
              Published on website
            </label>
          </div>
          <Field label="Logo" help="PNG/JPG/WEBP, max 5 MB — uploaded directly from your device. Transparent PNG looks best." className="sm:col-span-2">
            <FileUpload
              label=""
              accept={['.png', '.jpg', '.jpeg', '.webp']}
              maxSizeMB={5}
              file={logo}
              onFile={setLogo}
            />
            {!logo && editing?.logo_path && (
              <p className="mt-2 text-xs text-slate-500">
                <Upload size={11} className="mr-1 inline" />Current logo will be kept unless you upload a new one.
              </p>
            )}
          </Field>
        </form>
      </Modal>
    </div>
  )
}
