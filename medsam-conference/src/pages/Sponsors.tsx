import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Gem, Check, CheckCircle2, Store, Handshake, ArrowRight } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Accordion } from '../components/ui/Accordion'
import { Field, Input, Select, Textarea } from '../components/ui/FormControls'
import { Button } from '../components/ui/Button'
import { PaymentDetails } from '../components/public/PaymentDetails'
import { useToast } from '../components/ui/Toast'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import { SPONSOR_TIERS, PAYMENT } from '../lib/constants'
import { isValidEmail, isValidPhone, formatKes, cn } from '../lib/utils'
import type { Sponsor } from '../lib/types'

type Tab = 'packages' | 'sponsor' | 'exhibitor'

interface AppForm {
  organisation: string
  contact_person: string
  email: string
  phone: string
  organisation_type: string
  details: string // products/services OR message-ish extra
  message: string
  preferred_package: string
}

const INITIAL_APP: AppForm = {
  organisation: '',
  contact_person: '',
  email: '',
  phone: '',
  organisation_type: '',
  details: '',
  message: '',
  preferred_package: '',
}

const ORG_TYPES = [
  'Medical device / technology company',
  'Pharmaceutical / laboratory company',
  'Hospital / health facility',
  'University / research institution',
  'Professional association',
  'Development partner / NGO',
  'Financial services',
  'Media / communications',
  'Other',
]

/**
 * Sponsors & Exhibitors — public tier catalogue plus real application
 * forms (sponsor_applications / exhibitor_applications in Supabase).
 * Displayed sponsors come from the `sponsors` table (admin-managed).
 */
export default function Sponsors() {
  const { notify } = useToast()
  const [tab, setTab] = useState<Tab>('packages')
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [form, setForm] = useState<AppForm>(INITIAL_APP)
  const [errors, setErrors] = useState<Partial<Record<keyof AppForm, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let mounted = true
    requireSupabase()
      .from('sponsors')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (mounted) setSponsors((data as Sponsor[] | null) ?? [])
      })
    return () => {
      mounted = false
    }
  }, [])

  const set = (k: keyof AppForm) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }

  function resetForm() {
    setForm(INITIAL_APP)
    setErrors({})
    setDone(null)
    setFatal(null)
    setTab('packages')
  }

  function validate(): boolean {
    const er: typeof errors = {}
    if (form.organisation.trim().length < 2) er.organisation = 'Please enter the organisation name.'
    if (form.contact_person.trim().length < 3) er.contact_person = 'Please enter the contact person.'
    if (!isValidEmail(form.email)) er.email = 'Please enter a valid email address.'
    if (form.phone && !isValidPhone(form.phone)) er.phone = 'Please enter a valid phone number.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setFatal('The conference database is not connected yet. Please email the organising team instead.')
      return
    }
    if (!validate()) {
      notify('error', 'Please fix the highlighted fields before submitting.')
      return
    }
    setSubmitting(true)
    setFatal(null)
    try {
      const client = requireSupabase()
      if (tab === 'sponsor') {
        const { error } = await client.from('sponsor_applications').insert({
          organization: form.organisation.trim(),
          contact_person: form.contact_person.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          organisation_type: form.organisation_type || null,
          preferred_package: form.preferred_package || null,
          message: form.message.trim() || null,
          status: 'pending',
        })
        if (error) throw new Error(error.message)
        setDone('Your sponsorship application has been received. The Secretariat will contact you shortly.')
      } else {
        const { error } = await client.from('exhibitor_applications').insert({
          organisation: form.organisation.trim(),
          contact_person: form.contact_person.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          organisation_type: form.organisation_type || null,
          products_services: form.details.trim() || null,
          exhibition_requirements: form.message.trim() || null,
          preferred_package: form.preferred_package || null,
          message: null,
          status: 'pending',
        })
        if (error) throw new Error(error.message)
        setDone('Your exhibitor application has been received. The Secretariat will contact you with booth details.')
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setFatal(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function logoUrl(s: Sponsor): string | null {
    if (!s.logo_path || !isSupabaseConfigured) return null
    return requireSupabase().storage.from('sponsor_logos').getPublicUrl(s.logo_path).data.publicUrl
  }

  return (
    <>
      <Seo
        title="Sponsors & Exhibitors"
        description="Sponsorship packages (Diamond, Platinum, Gold, Silver, Bronze) and exhibition opportunities for the MEDSAM Scientific Conference & Symposium 2027 — 300+ delegates at Maseno University."
      />

      <section className="bg-navy-950 py-16 md:py-20">
        <div className="container-x">
          <span className="eyebrow-light">Partner With Us</span>
          <h1 className="h-display text-white">Sponsors &amp; Exhibitors</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            Put your organisation in front of 300+ students, clinicians, researchers and decision-makers in the
            health sciences. Choose a sponsorship tier or book an exhibition space.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setTab('sponsor')} className="btn btn-gold">
              <Handshake size={17} /> Become a Sponsor
            </button>
            <button onClick={() => setTab('exhibitor')} className="btn btn-outline-light">
              <Store size={17} /> Become an Exhibitor
            </button>
          </div>
        </div>
      </section>

      {/* Approved sponsor wall */}
      {sponsors.length > 0 && (
        <section className="border-b border-slate-200 bg-white py-12">
          <div className="container-x">
            <h2 className="text-center text-xs font-black tracking-[0.25em] text-slate-400 uppercase">
              Our sponsors
            </h2>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {sponsors.map((s) => {
                const url = logoUrl(s)
                return (
                  <div key={s.id} className="flex flex-col items-center gap-2 opacity-90" title={`${s.organization} — ${s.pkg}`}>
                    {url ? (
                      <img src={url} alt={s.organization} className="h-14 w-auto max-w-[180px] object-contain" loading="lazy" />
                    ) : (
                      <span className="text-xl font-black text-navy-300">{s.organization}</span>
                    )}
                    <span className="text-[10px] font-black tracking-[0.2em] text-gold-600 uppercase">{s.pkg}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section bg-slate-50">
        <div className="container-x">
          {/* Tabs */}
          <div className="mb-10 flex flex-wrap justify-center gap-2" role="tablist">
            {(
              [
                { id: 'packages', label: 'Sponsorship Packages' },
                { id: 'sponsor', label: 'Become a Sponsor' },
                { id: 'exhibitor', label: 'Become an Exhibitor' },
              ] as { id: Tab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'rounded-full px-6 py-2.5 text-sm font-bold transition-all',
                  tab === t.id ? 'bg-navy-900 text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:border-navy-400',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'packages' && (
            <div className="mx-auto max-w-4xl">
              <SectionHeading
                eyebrow="Sponsorship Tiers"
                title="Choose your level of partnership"
                subtitle="Every tier includes branding, website visibility and post-conference recognition. Deeper tiers add speaking opportunities, complimentary registrations and premium exhibition space."
              />
              <div className="mt-12 space-y-4">
                {SPONSOR_TIERS.map((tier, i) => (
                  <Accordion
                    key={tier.id}
                    defaultOpen={i === 0}
                    title={
                      <span className="flex items-center gap-2.5">
                        <Gem size={18} className={cn(i === 0 ? 'text-cyan-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-gold-500' : i === 3 ? 'text-amber-700' : 'text-orange-800')} />
                        {tier.name}
                        <span className="text-xs font-bold text-slate-400 uppercase">· {tier.tagline}</span>
                      </span>
                    }
                    headerRight={<span className="text-lg font-black text-navy-950">{formatKes(tier.priceKes)}</span>}
                  >
                    <ul className="grid gap-2.5 sm:grid-cols-2">
                      {tier.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => setTab('sponsor')} className="btn btn-navy btn-sm mt-6">
                      Apply for {tier.name} <ArrowRight size={14} />
                    </button>
                  </Accordion>
                ))}
              </div>
              <div className="mt-12">
                <PaymentDetails />
                <p className="mt-4 text-center text-xs text-slate-500">
                  Sponsorship and exhibition payments are made to the official MEDSAM channels above, quoting your
                  organisation name. A confirmation letter is issued by the Secretariat.
                </p>
              </div>
            </div>
          )}

          {tab === 'sponsor' && (
            <ApplicationForm
              heading="Sponsorship application"
              intro="Tell us about your organisation and preferred tier. The Secretariat responds to every application."
              form={form}
              set={set}
              errors={errors}
              submitting={submitting}
              fatal={fatal}
              done={done}
              onSubmit={onSubmit}
              detailsLabel="Anything else we should know?"
              detailsPlaceholder="Goals, budget range, branding assets…"
              onReset={resetForm}
            />
          )}

          {tab === 'exhibitor' && (
            <ApplicationForm
              heading="Exhibitor application"
              intro="Book your place at the exhibition floor. Include your products/services and any special requirements (power, space, branding)."
              form={form}
              set={set}
              errors={errors}
              submitting={submitting}
              fatal={fatal}
              done={done}
              onSubmit={onSubmit}
              detailsLabel="Products / services you will display"
              detailsPlaceholder="e.g. diagnostic equipment, lab supplies, health apps…"
              exhibitor
              onReset={resetForm}
            />
          )}
        </div>
      </section>
    </>
  )
}

function ApplicationForm(props: {
  heading: string
  intro: string
  form: AppForm
  set: (k: keyof AppForm) => (e: { target: { value: string } }) => void
  errors: Partial<Record<keyof AppForm, string>>
  submitting: boolean
  fatal: string | null
  done: string | null
  onSubmit: (e: FormEvent) => void
  detailsLabel: string
  detailsPlaceholder: string
  exhibitor?: boolean
  onReset: () => void
}) {
  const { form, set, errors, submitting, fatal, done, onSubmit, heading, intro, detailsLabel, detailsPlaceholder, exhibitor, onReset } = props
  if (done) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card overflow-hidden">
          <div className="bg-emerald-600 px-7 py-6 text-white">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={30} />
              <h2 className="text-xl font-black">Application Received</h2>
            </div>
          </div>
          <div className="p-7">
            <p className="text-sm leading-relaxed text-slate-700">{done}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={onReset} className="btn btn-navy btn-sm">Submit Another Application</button>
              <Link to="/" className="btn btn-outline-navy btn-sm">Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={onSubmit} noValidate className="card p-6 sm:p-8">
        <h2 className="text-lg font-bold text-navy-950">{heading}</h2>
        <p className="mt-1.5 text-sm text-slate-500">{intro}</p>
        {fatal && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{fatal}</p>}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label={exhibitor ? 'Organisation / company name' : 'Organisation name'} required error={errors.organisation} className="sm:col-span-2">
            <Input value={form.organisation} onChange={set('organisation')} invalid={!!errors.organisation} placeholder="Full legal or trading name" />
          </Field>
          <Field label="Contact person" required error={errors.contact_person}>
            <Input value={form.contact_person} onChange={set('contact_person')} invalid={!!errors.contact_person} />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input type="email" value={form.email} onChange={set('email')} invalid={!!errors.email} placeholder="partnerships@company.com" />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input type="tel" value={form.phone} onChange={set('phone')} invalid={!!errors.phone} placeholder="+254 7XX XXX XXX" />
          </Field>
          <Field label="Organisation type">
            <Select value={form.organisation_type} onChange={set('organisation_type')}>
              <option value="">Select…</option>
              {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Preferred package">
            <Select value={form.preferred_package} onChange={set('preferred_package')}>
              <option value="">Select a tier…</option>
              {SPONSOR_TIERS.map((t) => <option key={t.id} value={t.name}>{t.name} — {formatKes(t.priceKes)}</option>)}
              <option value="Custom">Custom / not sure yet</option>
            </Select>
          </Field>
          <Field label={detailsLabel} className="sm:col-span-2">
            <Textarea rows={4} value={form.details} onChange={set('details')} placeholder={detailsPlaceholder} />
          </Field>
          <Field label="Message" className="sm:col-span-2">
            <Textarea rows={4} value={form.message} onChange={set('message')} placeholder="Anything else the organising team should know…" />
          </Field>
        </div>
        <div className="mt-7">
          <Button type="submit" loading={submitting} className="w-full sm:w-auto">
            {submitting ? 'Submitting…' : exhibitor ? 'Submit Exhibitor Application' : 'Submit Sponsorship Application'}
          </Button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Application details are stored privately in the conference database and reviewed by the Secretariat.
          Payment, once agreed, goes through the official {PAYMENT.bankName} account or M-PESA Till {PAYMENT.mpesaTill}.
        </p>
      </form>
    </div>
  )
}
