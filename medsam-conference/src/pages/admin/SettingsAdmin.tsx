import { useEffect, useState } from 'react'
import { Save, Settings2, Info } from 'lucide-react'
import { Spinner, ErrorState } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/FormControls'
import { useToast } from '../../components/ui/Toast'
import { useConfig } from '../../hooks/useAdminAuth'
import { requireSupabase } from '../../lib/supabase'
import type { SiteConfig } from '../../lib/types'

/**
 * Site configuration — stored in the public.config table (key = 'site').
 * Controls: registration fees, early-bird deadline (configurable, NOT
 * hard-coded), workshop fee, social media links, contact details.
 */
export default function SettingsAdmin() {
  const { notify } = useToast()
  const { config, loading } = useConfig()
  const [form, setForm] = useState<SiteConfig | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !form) setForm({ ...config, socials: { ...config.socials }, contactPhones: [...config.contactPhones] })
  }, [loading, config, form])

  if (loading || !form) return <Spinner label="Loading settings…" />

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setBusy(true)
    setError(null)
    try {
      const client = requireSupabase()
      const payload = {
        currency: form.currency,
        studentStandard: Number(form.studentStandard) || 50,
        nonStudentStandard: Number(form.nonStudentStandard) || 90,
        earlyBirdStudent: Number(form.earlyBirdStudent) || 40,
        earlyBirdNonStudent: form.earlyBirdNonStudent === null ? null : Number(form.earlyBirdNonStudent),
        earlyBirdDeadline: form.earlyBirdDeadline,
        workshopFee: form.workshopFee === null ? null : Number(form.workshopFee),
        socials: form.socials,
        contactEmail: form.contactEmail,
        contactPhones: form.contactPhones,
      }
      const { error: e2 } = await client
        .from('config')
        .upsert({ key: 'site', value: payload, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      if (e2) throw new Error(e2.message)
      notify('success', 'Settings saved — the public site now reflects these values.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  const set = (k: keyof SiteConfig) => (e: { target: { value: string } }) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f))

  const setSocial = (k: keyof SiteConfig['socials']) => (e: { target: { value: string } }) =>
    setForm((f) => (f ? { ...f, socials: { ...f.socials, [k]: e.target.value } } : f))

  const setPhone = (i: number) => (e: { target: { value: string } }) =>
    setForm((f) => (f ? { ...f, contactPhones: f.contactPhones.map((p, idx) => (idx === i ? e.target.value : p)) } : f))

  const addPhone = () => setForm((f) => (f ? { ...f, contactPhones: [...f.contactPhones, ''] } : f))

  return (
    <form onSubmit={save}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black text-navy-950">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400"><Settings2 size={22} /></span>
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Fees, early-bird deadline, workshop fee, social links and contact details — all editable without code changes.
          </p>
        </div>
        <Button type="submit" loading={busy}>
          <Save size={16} /> Save Settings
        </Button>
      </header>

      {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fees */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-navy-950">Registration fees (main conference)</h2>
          <p className="mt-1 text-xs text-slate-500">Currency is shown to delegates exactly as configured.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Currency">
              <Input value={form.currency} onChange={set('currency')} placeholder="USD" />
            </Field>
            <Field label="Early-bird deadline" help="ISO date-time (UTC). The registration page applies early-bird automatically before this moment.">
              <Input type="datetime-local" value={form.earlyBirdDeadline ? form.earlyBirdDeadline.slice(0, 16) : ''} onChange={(e) => setForm((f) => (f ? { ...f, earlyBirdDeadline: e.target.value ? new Date(e.target.value).toISOString() : null } : f))} />
            </Field>
            <Field label="Early Bird — Students">
              <Input type="number" min={0} value={String(form.earlyBirdStudent)} onChange={set('earlyBirdStudent')} />
            </Field>
            <Field label="Early Bird — Non-students" help="Leave empty to NOT offer a non-student early-bird rate (default).">
              <Input
                type="number"
                min={0}
                value={form.earlyBirdNonStudent === null ? '' : String(form.earlyBirdNonStudent)}
                onChange={(e) => setForm((f) => (f ? { ...f, earlyBirdNonStudent: e.target.value === '' ? null : Number(e.target.value) } : f))}
                placeholder="Not offered"
              />
            </Field>
            <Field label="Standard — Students">
              <Input type="number" min={0} value={String(form.studentStandard)} onChange={set('studentStandard')} />
            </Field>
            <Field label="Faculty / Researchers / Lecturers / Non-Students / Others">
              <Input type="number" min={0} value={String(form.nonStudentStandard)} onChange={set('nonStudentStandard')} />
            </Field>
            <Field label="Workshop fee" help="Leave empty until the Secretariat confirms the workshop fee.">
              <Input
                type="number"
                min={0}
                value={form.workshopFee === null ? '' : String(form.workshopFee)}
                onChange={(e) => setForm((f) => (f ? { ...f, workshopFee: e.target.value === '' ? null : Number(e.target.value) } : f))}
                placeholder="To be confirmed"
              />
            </Field>
          </div>
        </div>

        {/* Socials */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-navy-950">Social media links</h2>
          <p className="mt-1 flex items-start gap-2 text-xs text-slate-500">
            <Info size={13} className="mt-0.5 shrink-0" />
            Leave empty until the official MEDSAM accounts are confirmed — empty links are hidden automatically
            (a “socials soon” placeholder is shown instead). Never invent account URLs.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Facebook"><Input value={form.socials.facebook} onChange={setSocial('facebook')} placeholder="https://facebook.com/…" /></Field>
            <Field label="Instagram"><Input value={form.socials.instagram} onChange={setSocial('instagram')} placeholder="https://instagram.com/…" /></Field>
            <Field label="X (Twitter)"><Input value={form.socials.x} onChange={setSocial('x')} placeholder="https://x.com/…" /></Field>
            <Field label="YouTube"><Input value={form.socials.youtube} onChange={setSocial('youtube')} placeholder="https://youtube.com/…" /></Field>
            <Field label="LinkedIn"><Input value={form.socials.linkedin} onChange={setSocial('linkedin')} placeholder="https://linkedin.com/…" /></Field>
            <Field label="Website"><Input value={form.socials.website} onChange={setSocial('website')} placeholder="https://medsam…" /></Field>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-navy-950">Contact details</h2>
          <p className="mt-1 text-xs text-slate-500">
            Used on the Contact page, footer and forms. Official details: {`${'medsamscientifcconferenceorga@gmail.com'}`}.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input type="email" value={form.contactEmail} onChange={set('contactEmail')} />
            </Field>
            <div>
              <span className="label">Phones</span>
              <div className="space-y-2.5">
                {form.contactPhones.map((p, i) => (
                  <Input key={i} value={p} onChange={setPhone(i)} placeholder="+254 …" />
                ))}
                <button type="button" onClick={addPhone} className="text-xs font-bold text-navy-800 hover:text-gold-700">
                  + Add another phone
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" loading={busy}>
          <Save size={16} /> Save Settings
        </Button>
      </div>
    </form>
  )
}
