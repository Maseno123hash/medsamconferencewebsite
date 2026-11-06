import { useEffect, useState } from 'react'
import { Save, Settings2, Info } from 'lucide-react'
import { Spinner, ErrorState } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/FormControls'
import { useToast } from '../../components/ui/Toast'
import { useConfig } from '../../hooks/useAdminAuth'
import { requireSupabase } from '../../lib/supabase'
import type { SiteConfig, EventConfig } from '../../lib/types'

/**
 * Site configuration — stored in the public.config table (key = 'site').
 * Controls: registration fees, early-bird deadline (configurable, NOT
 * hard-coded), workshop fee, social media links, contact details.
 */
function EventFields({
  heading,
  value,
  onChange,
}: {
  heading: string
  value: EventConfig
  onChange: (updated: EventConfig) => void
}) {
  const update = (key: keyof EventConfig, fieldValue: string) => {
    onChange({ ...value, [key]: fieldValue })
  }

  return (
    <div className="card p-6">
      <h2 className="text-base font-bold text-navy-950">{heading}</h2>
      <p className="mt-1 text-xs text-slate-500">
        Manage event information and registration dates. Times use East Africa time (UTC+3).
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Event title">
          <Input value={value.title} onChange={(e) => update('title', e.target.value)} />
        </Field>

        <Field label="Scientific theme">
          <Input value={value.theme} onChange={(e) => update('theme', e.target.value)} />
        </Field>

        <Field label="Venue">
          <Input value={value.venue} onChange={(e) => update('venue', e.target.value)} />
        </Field>

        <Field label="Event status">
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            value={value.status}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="scheduled">Scheduled</option>
            <option value="postponed">Postponed</option>
            <option value="completed">Completed</option>
          </select>
        </Field>

        <Field label="Start date and time">
          <Input
            type="datetime-local"
            value={value.startAt}
            onChange={(e) => update('startAt', e.target.value)}
          />
        </Field>

        <Field label="End date and time">
          <Input
            type="datetime-local"
            value={value.endAt}
            onChange={(e) => update('endAt', e.target.value)}
          />
        </Field>

        <Field label="Registration opens">
          <Input
            type="datetime-local"
            value={value.registrationOpensAt}
            onChange={(e) => update('registrationOpensAt', e.target.value)}
          />
        </Field>

        <Field label="Registration closes">
          <Input
            type="datetime-local"
            value={value.registrationClosesAt}
            onChange={(e) => update('registrationClosesAt', e.target.value)}
          />
        </Field>
      </div>
    </div>
  )
}
export default function SettingsAdmin() {
  const { notify } = useToast()
  const { config, loading } = useConfig()
  const [form, setForm] = useState<SiteConfig | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

 useEffect(() => {
  if (!loading && !form) {
    setForm({
      ...config,
      socials: { ...config.socials },
      contactPhones: [...config.contactPhones],
      workshop: { ...config.workshop },
      conference: { ...config.conference },
    })
  }
}, [loading, config, form])

const setEvent = (eventName: 'workshop' | 'conference') =>
  (updated: EventConfig) =>
    setForm((f) => (f ? { ...f, [eventName]: updated } : f))
  if (loading || !form) return <Spinner label="Loading settings…" />

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setBusy(true)
    setError(null)
    try {
      const client = requireSupabase()
      const payload = {
        workshop: form.workshop,
        conference: form.conference,
        currency: form.currency,
        abstractFee: form.abstractFee,
        abstractFeeCurrency: form.abstractFeeCurrency,
        abstractSubmissionDeadline: form.abstractSubmissionDeadline,
        studentStandard: Number(form.studentStandard) || 50,
        nonStudentStandard: Number(form.nonStudentStandard) || 90,
        earlyBirdStudent: Number(form.earlyBirdStudent) || 40,
        earlyBirdNonStudent: form.earlyBirdNonStudent === null ? null : Number(form.earlyBirdNonStudent),
        earlyBirdDeadline: form.earlyBirdDeadline,
        workshopFee: form.workshopFee === null ? null : Number(form.workshopFee),
        socials: form.socials,
        contactEmail: form.contactEmail,
        contactPhones: form.contactPhones,
        organisationName: form.organisationName,
        teamName: form.teamName,
        institutionName: form.institutionName,
        campus: form.campus,
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
        <EventFields
  heading="Pre-Conference Workshop"
  value={form.workshop}
  onChange={setEvent('workshop')}
  
/>

<EventFields
  heading="Main Scientific Conference"
  value={form.conference}
  onChange={setEvent('conference')}
/>
        {/* Fees */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-navy-950">Registration fees (main conference)</h2>
          <p className="mt-1 text-xs text-slate-500">Currency is shown to delegates exactly as configured.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Currency">
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, currency: e.target.value } : f))
                }
              >
                <option value="USD">USD — US Dollar</option>
                <option value="KES">KES — Kenyan Shilling</option>
              </select>
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
{/* Abstract submission settings */}
<div className="card p-6">
  <h2 className="text-base font-bold text-navy-950">
    Abstract submission settings
  </h2>

  <p className="mt-1 text-xs text-slate-500">
    Manage the abstract submission deadline and fee displayed on the public
    Abstracts page. Leave the fee empty if submission is free or the fee is
    yet to be confirmed.
  </p>

  <div className="mt-5 grid gap-4 sm:grid-cols-2">
    <Field label="Abstract submission fee">
      <Input
        type="number"
        min={0}
        value={form.abstractFee === null ? '' : String(form.abstractFee)}
        onChange={(e) =>
          setForm((f) =>
            f
              ? {
                  ...f,
                  abstractFee:
                    e.target.value === '' ? null : Number(e.target.value),
                }
              : f,
          )
        }
        placeholder="To be confirmed"
      />
    </Field>

    <Field label="Abstract fee currency">
      <select
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        value={form.abstractFeeCurrency}
        onChange={(e) =>
          setForm((f) =>
            f ? { ...f, abstractFeeCurrency: e.target.value } : f,
          )
        }
      >
        <option value="KES">KES — Kenyan Shilling</option>
        <option value="USD">USD — US Dollar</option>
      </select>
    </Field>

    <Field label="Abstract submission deadline">
      <Input
        type="datetime-local"
        value={
          form.abstractSubmissionDeadline
            ? form.abstractSubmissionDeadline.slice(0, 16)
            : ''
        }
        onChange={(e) =>
          setForm((f) =>
            f
              ? {
                  ...f,
                  abstractSubmissionDeadline: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                }
              : f,
          )
        }
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

       {/* Contact and organisation details */}
      <div className="card p-6 lg:col-span-2">
  <h2 className="text-base font-bold text-navy-950">
    Organisation and contact details
  </h2>

  <p className="mt-1 text-xs text-slate-500">
    These details appear across the public website, including the header,
    footer and contact page.
  </p>

  <div className="mt-5 grid gap-4 sm:grid-cols-2">
    <Field label="Organisation name">
      <Input
        value={form.organisationName}
        onChange={set('organisationName')}
      />
    </Field>

    <Field label="Organising team name">
      <Input
        value={form.teamName}
        onChange={set('teamName')}
      />
    </Field>

    <Field label="Institution name">
      <Input
        value={form.institutionName}
        onChange={set('institutionName')}
      />
    </Field>

    <Field label="Campus">
      <Input
        value={form.campus}
        onChange={set('campus')}
      />
    </Field>

    <Field label="Official contact email">
      <Input
        type="email"
        value={form.contactEmail}
        onChange={set('contactEmail')}
      />
    </Field>

    <div>
      <span className="label">Contact phone numbers</span>

      <div className="mt-2 space-y-2.5">
        {form.contactPhones.map((phone, i) => (
          <Input
            key={i}
            value={phone}
            onChange={setPhone(i)}
            placeholder={i === 0 ? 'Primary phone' : 'Secondary phone'}
          />
        ))}

        <button
          type="button"
          onClick={addPhone}
          className="text-xs font-bold text-navy-800 hover:text-gold-700"
        >
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
