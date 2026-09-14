import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Handshake, Store, Building2, Download } from 'lucide-react'
import { Spinner, ErrorState, EmptyState, StatusBadge } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/FormControls'
import { FileUpload } from '../../components/ui/FileUpload'
import { useToast } from '../../components/ui/Toast'
import { useCrud, uploadToBucket, publicUrl } from '../../hooks/useCrud'
import { requireSupabase } from '../../lib/supabase'
import { downloadCsv, type CsvColumn } from '../../lib/exports'
import { SPONSOR_TIERS } from '../../lib/constants'
import type { Sponsor, SponsorApplication, ExhibitorApplication, AppStatus } from '../../lib/types'
import { formatDateTime, cn } from '../../lib/utils'

type Tab = 'sponsors' | 'sponsor-apps' | 'exhibitor-apps'
const PACKAGES = [...SPONSOR_TIERS.map((t) => t.name), 'Exhibitor', 'Other']
const APP_STATUSES: AppStatus[] = ['pending', 'contacted', 'confirmed', 'declined']

interface SponsorForm {
  organization: string
  pkg: string
  website: string
  sort_order: string
  is_published: boolean
}
const EMPTY_SPONSOR: SponsorForm = { organization: '', pkg: 'Bronze', website: '', sort_order: '0', is_published: true }

/**
 * Sponsors display entries + sponsor applications + exhibitor applications.
 */
export default function SponsorsAdmin() {
  const { notify } = useToast()
  const sponsorsCrud = useCrud<Sponsor>('sponsors')
  const [sponsorApps, setSponsorApps] = useState<SponsorApplication[]>([])
  const [exhibitorApps, setExhibitorApps] = useState<ExhibitorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('sponsors')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Sponsor | null>(null)
  const [form, setForm] = useState<SponsorForm>(EMPTY_SPONSOR)
  const [logo, setLogo] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  const loadApps = async () => {
    setLoading(true)
    setError(null)
    try {
      const client = requireSupabase()
      const [s, x] = await Promise.all([
        client.from('sponsor_applications').select('*').order('created_at', { ascending: false }),
        client.from('exhibitor_applications').select('*').order('created_at', { ascending: false }),
      ])
      if (s.error) throw new Error(s.error.message)
      if (x.error) throw new Error(x.error.message)
      setSponsorApps((s.data as SponsorApplication[] | null) ?? [])
      setExhibitorApps((x.data as ExhibitorApplication[] | null) ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load applications.')
    } finally {
      setLoading(false)
    }
  }

  const loadAppsRef = loadApps
  useEffect(() => {
    void loadApps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function setAppStatus(table: 'sponsor_applications' | 'exhibitor_applications', id: string, status: AppStatus) {
    try {
      const { error: e } = await requireSupabase().from(table).update({ status, updated_at: new Date().toISOString() } as object).eq('id', id)
      if (e) throw new Error(e.message)
      await loadAppsRef()
      notify('success', 'Application status updated.')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Update failed.')
    }
  }

  function exportSponsorsCsv() {
    downloadCsv('MEDSAM-sponsor-applications.csv', sponsorApps, [
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
    notify('success', 'Sponsor applications exported.')
  }

  function exportExhibitorsCsv() {
    downloadCsv('MEDSAM-exhibitor-applications.csv', exhibitorApps, [
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
    notify('success', 'Exhibitor applications exported.')
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_SPONSOR)
    setLogo(null)
    setOpen(true)
  }

  function openEdit(r: Sponsor) {
    setEditing(r)
    setForm({ organization: r.organization, pkg: r.pkg, website: r.website ?? '', sort_order: String(r.sort_order), is_published: r.is_published })
    setLogo(null)
    setOpen(true)
  }

  async function saveSponsor() {
    if (form.organization.trim().length < 2) return
    setBusy(true)
    try {
      let logoPath = editing?.logo_path ?? null
      if (logo) logoPath = await uploadToBucket('sponsor_logos', 'logos', logo)
      const payload = {
        organization: form.organization.trim(),
        pkg: form.pkg,
        logo_path: logoPath,
        website: form.website.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_published: form.is_published,
      }
      if (editing) await sponsorsCrud.update(editing.id, payload)
      else await sponsorsCrud.insert(payload)
      notify('success', editing ? 'Sponsor updated.' : 'Sponsor added.')
      setOpen(false)
    } catch (e) {
      notify('error', e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner label="Loading sponsors & applications…" />
  if (error) return <ErrorState message={error} onRetry={loadAppsRef} />

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy-950">Sponsors &amp; Exhibitors</h1>
        <p className="mt-1 text-sm text-slate-500">Manage the sponsor wall and review sponsorship / exhibition applications.</p>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            { id: 'sponsors', label: `Sponsor Wall (${sponsorsCrud.rows.length})`, Icon: Building2 },
            { id: 'sponsor-apps', label: `Sponsor Apps (${sponsorApps.length})`, Icon: Handshake },
            { id: 'exhibitor-apps', label: `Exhibitor Apps (${exhibitorApps.length})`, Icon: Store },
          ] as { id: Tab; label: string; Icon: typeof Building2 }[]
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
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'sponsors' && (
        <>
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={openAdd}><Plus size={14} /> Add Displayed Sponsor</Button>
          </div>
          {sponsorsCrud.loading ? (
            <Spinner label="Loading…" />
          ) : sponsorsCrud.rows.length === 0 ? (
            <EmptyState title="No displayed sponsors yet" message="Add official sponsors (with logos) once agreements are signed. They appear on the public Sponsors page." />
          ) : (
            <div className="card divide-y divide-slate-100">
              {sponsorsCrud.rows.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="h-12 w-24 flex items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                    {s.logo_path ? (
                      <img src={publicUrl('sponsor_logos', s.logo_path)} alt={s.organization} className="max-h-full max-w-full object-contain p-1.5" />
                    ) : (
                      <span className="truncate px-2 text-xs font-black text-navy-300">{s.organization}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy-950">{s.organization}</p>
                    <p className="text-xs text-slate-500">{s.pkg}{s.website ? ` · ${s.website}` : ''}</p>
                  </div>
                  <span className={`text-[11px] font-bold ${s.is_published ? 'text-emerald-700' : 'text-amber-700'}`}>{s.is_published ? 'Live' : 'Hidden'}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-navy-700 hover:bg-navy-50" aria-label="Edit sponsor"><Pencil size={15} /></button>
                    <button onClick={() => sponsorsCrud.update(s.id, { is_published: !s.is_published })} className="rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-navy-800 hover:bg-slate-50">
                      {s.is_published ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Delete ${s.organization}?`)) return
                        await sponsorsCrud.remove(s.id)
                        notify('success', 'Sponsor removed.')
                      }}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      aria-label="Delete sponsor"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'sponsor-apps' && (
        <>
          <div className="mb-4 flex justify-end">
            <Button size="sm" variant="btn-navy" onClick={exportSponsorsCsv}><DownloadIcon /> Export CSV</Button>
          </div>
          <AppTable
            empty="No sponsor applications yet."
            rows={sponsorApps.map((a) => ({
              id: a.id,
              org: a.organization,
              contact: a.contact_person,
              email: a.email,
              extra: a.preferred_package ?? '—',
              message: a.message,
              status: a.status,
              date: a.created_at,
            }))}
            onStatus={(id, st) => setAppStatus('sponsor_applications', id, st)}
          />
        </>
      )}

      {tab === 'exhibitor-apps' && (
        <>
          <div className="mb-4 flex justify-end">
            <Button size="sm" variant="btn-navy" onClick={exportExhibitorsCsv}><DownloadIcon /> Export CSV</Button>
          </div>
          <AppTable
            empty="No exhibitor applications yet."
            rows={exhibitorApps.map((a) => ({
              id: a.id,
              org: a.organisation,
              contact: a.contact_person,
              email: a.email,
              extra: a.products_services ?? '—',
              message: a.exhibition_requirements,
              status: a.status,
              date: a.created_at,
            }))}
            onStatus={(id, st) => setAppStatus('exhibitor_applications', id, st)}
          />
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit — ${editing.organization}` : 'Add displayed sponsor'}
        footer={
          <>
            <Button size="sm" variant="btn-outline-navy" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={saveSponsor} loading={busy}>{editing ? 'Save Changes' : 'Add Sponsor'}</Button>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Organisation name" required className="sm:col-span-2">
            <Input value={form.organization} onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))} />
          </Field>
          <Field label="Package">
            <Select value={form.pkg} onChange={(e) => setForm((f) => ({ ...f, pkg: e.target.value }))}>
              {PACKAGES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
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
          <Field label="Logo" help="PNG/JPG/WEBP, max 5 MB. Transparent background recommended." className="sm:col-span-2">
            <FileUpload label="" accept={['.png', '.jpg', '.jpeg', '.webp']} maxSizeMB={5} file={logo} onFile={setLogo} />
          </Field>
        </div>
      </Modal>
    </div>
  )
}

function DownloadIcon() {
  return <Download size={14} />
}

interface AppRow {
  id: string
  org: string
  contact: string
  email: string
  extra: string
  message: string | null
  status: AppStatus
  date: string
}

function AppTable({ empty, rows, onStatus }: { empty: string; rows: AppRow[]; onStatus: (id: string, s: AppStatus) => void }) {
  if (rows.length === 0) return <EmptyState title="Nothing here yet" message={empty} />
  return (
    <div className="card overflow-hidden">
      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black tracking-wider text-slate-500 uppercase">
              <th className="px-4 py-3">Organisation</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Detail</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Set status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <p className="font-bold text-navy-950">{r.org}</p>
                  {r.message && <p className="mt-0.5 max-w-[260px] truncate text-xs text-slate-500" title={r.message}>{r.message}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-700">{r.contact}</p>
                  <p className="text-xs text-slate-500">{r.email}</p>
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-xs text-slate-600" title={r.extra}>{r.extra}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">{formatDateTime(r.date)}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3">
                  <Select
                    value={r.status}
                    onChange={(e) => onStatus(r.id, e.target.value as AppStatus)}
                    className="w-36 py-1.5 text-xs"
                    aria-label="Change status"
                  >
                    {APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
