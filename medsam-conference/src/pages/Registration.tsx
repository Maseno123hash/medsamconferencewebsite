import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Send, ShieldCheck, Info, CheckCircle2, Wallet } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { Field, Input, Select, Checkbox } from '../components/ui/FormControls'
import { Button } from '../components/ui/Button'
import { FileUpload } from '../components/ui/FileUpload'
import { ErrorState } from '../components/ui/Feedback'
import { PaymentDetails } from '../components/public/PaymentDetails'
import { useToast } from '../components/ui/Toast'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import { uploadToBucket } from '../hooks/useCrud'
import { useConfig } from '../hooks/useAdminAuth'
import { CATEGORIES, STUDENT_CATEGORIES, EVENTS } from '../lib/constants'
import {
  isValidEmail,
  isValidPhone,
  generateRef,
  formatMoney,
  formatDate,
  PROOF_TYPES,
  cn,
} from '../lib/utils'
import type { EventSelection, Registration } from '../lib/types'

const COUNTRIES = [
  'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia', 'South Sudan', 'Somalia', 'Burundi', 'Mozambique',
  'South Africa', 'Nigeria', 'Ghana', 'Zambia', 'Zimbabwe', 'Botswana', 'Malawi', 'Lesotho', 'Eswatini',
  'Sudan', 'Egypt', 'Jordan', 'Lebanon', 'India', 'Pakistan', 'China', 'United Kingdom', 'United States of America',
  'Canada', 'Australia', 'Germany', 'France', 'Netherlands', 'Italy', 'Spain', 'Other',
]

interface FormState {
  full_name: string
  email: string
  phone: string
  country: string
  institution: string
  school_faculty: string
  department: string
  year_of_study: string
  category: string
  event_selection: EventSelection
  method: string
  transaction_ref: string
  paid_on: string
  consent: boolean
}

const INITIAL: FormState = {
  full_name: '',
  email: '',
  phone: '',
  country: 'Kenya',
  institution: '',
  school_faculty: '',
  department: '',
  year_of_study: '',
  category: '',
  event_selection: 'conference',
  method: 'mpesa',
  transaction_ref: '',
  paid_on: '',
  consent: false,
}

interface FeeLine {
  label: string
  amount: number
}
function getEventTimestamp(value: string): number {
  if (!value) return NaN
  const normalized = value.length === 16 ? `${value}:00` : value
  return new Date(`${normalized}+03:00`).getTime()
}

function getEventAvailability(event: ReturnType<typeof useConfig>['config']['workshop']) {
  const now = Date.now()
  const opens = event.registrationOpensAt
    ? getEventTimestamp(event.registrationOpensAt)
    : NaN
  const closes = event.registrationClosesAt
    ? getEventTimestamp(event.registrationClosesAt)
    : NaN

  if (event.status !== 'scheduled') return 'closed'
  if (Number.isFinite(opens) && now < opens) return 'not_open'
  if (Number.isFinite(closes) && now > closes) return 'closed'

  return 'open'
}

function displayEventDate(value: string): string {
  if (!value) return 'To be announced'
  const timestamp = getEventTimestamp(value)
  if (!Number.isFinite(timestamp)) return value

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi',
  }).format(timestamp)
}
/** Fee calculation — early-bird rules come from the admin-managed config. */
function computeFees(form: FormState, config: ReturnType<typeof useConfig>['config']): { lines: FeeLine[]; total: number; tier: 'early_bird' | 'standard' } {
  const isStudent = STUDENT_CATEGORIES.includes(form.category as (typeof STUDENT_CATEGORIES)[number])
  const deadline = config.earlyBirdDeadline ? new Date(config.earlyBirdDeadline).getTime() : 0
  const earlyBirdActive = deadline > Date.now()
  const conferenceFee = (() => {
    if (isStudent) {
      return earlyBirdActive ? config.earlyBirdStudent : config.studentStandard
    }
    if (config.earlyBirdNonStudent !== null && earlyBirdActive) return config.earlyBirdNonStudent
    return config.nonStudentStandard
  })()
  const isEarly =
    (isStudent && earlyBirdActive) || (config.earlyBirdNonStudent !== null && earlyBirdActive && !isStudent)

  const lines: FeeLine[] = []
  if (form.event_selection === 'workshop' || form.event_selection === 'both') {
    const wf = config.workshopFee ?? 0
    lines.push({
  label: form.event_selection === 'both'
    ? config.workshop.title
    : config.workshop.title,
  amount: wf,
})
  }
  if (form.event_selection === 'conference' || form.event_selection === 'both') {
    lines.push({
      label: `${isEarly ? 'Early Bird' : 'Standard'} — ${form.event_selection === 'both' ? 'Main Conference' : 'Main Conference & Symposium'}`,
      amount: conferenceFee,
    })
  }
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0), tier: isEarly ? 'early_bird' : 'standard' }
}

/**
 * Real registration system (Supabase). Delegates do NOT create accounts:
 * one form → registration record + optional payment submission + proof
 * upload. A unique reference (MEDSAM-2027-XXXXXX) is generated server-side
 * collision-safe and shown on the confirmation screen.
 */
export default function Registration() {
  const { notify } = useToast()
  const navigate = useNavigate()
  const { config } = useConfig()
  const workshopAvailability = getEventAvailability(config.workshop)
  const conferenceAvailability = getEventAvailability(config.conference)

  const bothAvailable =
    workshopAvailability === 'open' &&
    conferenceAvailability === 'open'
  const [form, setForm] = useState<FormState>(INITIAL)
  const [proof, setProof] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'proof', string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [fatal, setFatal] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<{ email: string; existing: Registration } | null>(null)
  const [ackNew, setAckNew] = useState(false)
  const [done, setDone] = useState<{ registration: Registration; paid: boolean } | null>(null)

  const fees = useMemo(() => computeFees(form, config), [form, config])
  const paymentRequired = fees.total > 0
  const isStudent = STUDENT_CATEGORIES.includes(form.category as (typeof STUDENT_CATEGORIES)[number])
  const earlyBirdActive = config.earlyBirdDeadline ? new Date(config.earlyBirdDeadline).getTime() > Date.now() : false

  const set = (k: keyof FormState) => (e: { target: { value: string; checked?: boolean } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }

  function validate(): boolean {
    const er: typeof errors = {}
    if (form.full_name.trim().length < 3) er.full_name = 'Please enter your full name.'
    if (!isValidEmail(form.email)) er.email = 'Please enter a valid email address.'
    if (!isValidPhone(form.phone)) er.phone = 'Please enter a valid phone number.'
    if (!form.country) er.country = 'Please select your country.'
    if (form.institution.trim().length < 2) er.institution = 'Please enter your institution.'
    if (!form.category) er.category = 'Please select your participant category.'
    if (!form.event_selection) er.event_selection = 'Please select the event(s) you are registering for.'
    if (paymentRequired) {
      if (!form.method) er.method = 'Please select a payment method.'
      if (!form.transaction_ref.trim()) er.transaction_ref = 'Please enter the transaction / reference number.'
      if (!form.paid_on) er.paid_on = 'Please enter the date of payment.'
    }
    if (!form.consent) er.consent = 'Please confirm the communication consent so we can send you essential conference updates.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const selectedEventAvailable =
      form.event_selection === 'workshop'
        ? workshopAvailability === 'open'
        : form.event_selection === 'conference'
          ? conferenceAvailability === 'open'
          : bothAvailable

    if (!selectedEventAvailable) {
      setFatal('Registration for your selected event is currently unavailable. Please check the event deadlines.')
      return
    }
    if (!isSupabaseConfigured) {
      setFatal('The conference database is not connected yet. Please try again after the site is fully configured.')
      return
    }
    if (duplicate && !ackNew) {
      notify('info', 'Please review the duplicate notice below.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
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

      // Duplicate protection: same email with overlapping events (not cancelled)
      const { data: existing } = await client
        .from('registrations')
        .select('*')
        .ilike('email', form.email.trim())
        .neq('status', 'cancelled')
        .limit(5)
      const overlap = (existing as Registration[] | null)?.find((r) => {
        if (r.event_selection === 'both' || form.event_selection === 'both') return true
        return r.event_selection === form.event_selection
      })
      if (overlap && !ackNew) {
        setDuplicate({ email: form.email.trim(), existing: overlap })
        setSubmitting(false)
        notify('info', 'A registration with this email already exists. Please confirm to register again.')
        return
      }

      // Upload payment proof (private bucket) if provided
      let proofPath: string | null = null
      if (proof) {
        proofPath = await uploadToBucket('payment_proofs', 'registrations', proof)
      }

      // Insert registration with a collision-safe unique ref code
      let refCode = generateRef(`MEDSAM-${new Date().getFullYear() === 2027 ? '2027' : '2027'}`)
      let registration: Registration | null = null
      for (let attempt = 0; attempt < 5 && !registration; attempt++) {
        const { data, error: err } = await client
          .from('registrations')
          .insert({
            ref_code: refCode,
            full_name: form.full_name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            country: form.country,
            institution: form.institution.trim() || null,
            school_faculty: form.school_faculty.trim() || null,
            department: form.department.trim() || null,
            year_of_study: form.year_of_study.trim() || null,
            category: form.category,
            event_selection: form.event_selection,
            tier: fees.tier,
            amount: fees.total,
            status: 'pending_payment',
            communication_consent: form.consent,
          })
          .select('*')
          .single()
        if (err && String(err.code) === '23505') {
          refCode = generateRef('MEDSAM-2027')
          continue
        }
        if (err) throw new Error(err.message)
        registration = data as Registration
      }
      if (!registration) throw new Error('Could not create a unique registration number. Please try again.')

      // Payment record
      let paid = false
      if (paymentRequired) {
        const { error: payErr } = await client.from('payments').insert({
          registration_id: registration.id,
          method: form.method,
          amount: fees.total,
          transaction_ref: form.transaction_ref.trim(),
          paid_on: form.paid_on,
          proof_path: proofPath,
          status: 'submitted',
        })
        if (payErr) throw new Error(`Registration saved, but the payment record failed: ${payErr.message}`)
        await client.from('registrations').update({ status: 'payment_submitted' }).eq('id', registration.id)
        registration = { ...registration, status: 'payment_submitted' }
        paid = true
      }

      setDone({ registration, paid })
      notify('success', `Registration submitted successfully. Your reference is ${registration.ref_code}.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setFatal(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------- Success screen ---------------- */
  if (done) {
    const r = done.registration
    return (
      <>
        <Seo title="Registration Confirmed" />
        <section className="section bg-slate-50">
          <div className="container-x max-w-2xl">
            <div className="card overflow-hidden print-area">
              <div className="bg-navy-950 px-7 py-6 text-white">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={30} className="text-gold-400" />
                  <div>
                    <h1 className="text-xl font-black">Registration Submitted Successfully</h1>
                    <p className="text-sm text-navy-200">
                      {done.paid
                        ? 'Your payment details have been recorded and are awaiting confirmation by the Secretariat.'
                        : 'No payment is required for your selected event(s).'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-7">
                <div className="rounded-xl border-2 border-dashed border-navy-300 bg-navy-50 p-5 text-center">
                  <p className="text-[11px] font-black tracking-[0.25em] text-navy-600 uppercase">Your Registration Number</p>
                  <p className="mt-1.5 font-mono text-2xl font-black text-navy-950">{r.ref_code}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Keep this number safe — you'll need it (with your email) to view or print your confirmation later.
                  </p>
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div><dt className="text-xs font-bold tracking-wider text-slate-500 uppercase">Name</dt><dd className="mt-0.5 font-semibold text-navy-950">{r.full_name}</dd></div>
                  <div><dt className="text-xs font-bold tracking-wider text-slate-500 uppercase">Email</dt><dd className="mt-0.5 font-semibold text-navy-950">{r.email}</dd></div>
                  <div><dt className="text-xs font-bold tracking-wider text-slate-500 uppercase">Category</dt><dd className="mt-0.5 font-semibold text-navy-950">{r.category}</dd></div>
                  <div>
                    <dt className="text-xs font-bold tracking-wider text-slate-500 uppercase">Event(s)</dt>
                    <dd className="mt-0.5 font-semibold text-navy-950">
                      {r.event_selection === 'both' ? 'Workshop + Main Conference' : r.event_selection === 'workshop' ? 'Pre-Conference Workshop' : 'Main Conference'}
                    </dd>
                  </div>
                  <div><dt className="text-xs font-bold tracking-wider text-slate-500 uppercase">Amount</dt><dd className="mt-0.5 font-semibold text-navy-950">{formatMoney(r.amount, config.currency)}</dd></div>
                  {done.paid && (
                    <div>
                      <dt className="text-xs font-bold tracking-wider text-slate-500 uppercase">Payment Ref</dt>
                      <dd className="mt-0.5 font-semibold text-navy-950">{form.transaction_ref}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-6 rounded-xl bg-amber-50 px-4 py-3.5 text-xs leading-relaxed text-amber-900">
                  <strong>Status: {r.status === 'payment_submitted' ? 'Payment Submitted' : 'Pending Payment'}.</strong>{' '}
                  Registration is subject to payment confirmation by the Secretariat. You will receive a
                  confirmation email once your payment has been verified.
                </div>
                <div className="no-print mt-7 flex flex-wrap gap-3">
                  <Button onClick={() => window.print()}>
                    <Info size={16} /> Print / Save as PDF
                  </Button>
                  <button
                    className="btn btn-outline-navy"
                    onClick={() => navigate(`/confirmation?ref=${encodeURIComponent(r.ref_code)}&email=${encodeURIComponent(r.email)}`)}
                  >
                    Open Confirmation Page
                  </button>
                  <Link to="/" className="btn btn-outline-navy">Back to Home</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  /* ---------------- Form ---------------- */
  return (
    <>
     <Seo
        title="Registration"
        description={`Register for the MEDSAM Scientific Conference & Symposium 2027 or the Pre-Conference Workshop. Students ${formatMoney(config.studentStandard, config.currency)} (early bird ${formatMoney(config.earlyBirdStudent, config.currency)}), non-students ${formatMoney(config.nonStudentStandard, config.currency)}. No account required.`}
      /> 

      <section className="bg-navy-950 py-14 md:py-16">
        <div className="container-x">
          <span className="eyebrow-light">Register</span>
          <h1 className="h-display text-white">Delegate Registration</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            One simple form — no account needed. You'll receive a unique registration number immediately, and your
            registration is finalised once the Secretariat confirms payment.
          </p>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_380px]">
          <form onSubmit={onSubmit} noValidate className="card space-y-9 p-6 sm:p-8">
            {fatal && <div className="rounded-xl border border-red-200 bg-red-50"><ErrorState message={fatal} /></div>}

            {/* 1. Personal */}
            <div>
              <h2 className="flex items-center gap-2.5 text-lg font-bold text-navy-950">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-900 text-xs font-black text-gold-400">1</span>
                Personal information
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Full name" required error={errors.full_name} className="sm:col-span-2">
                  <Input value={form.full_name} onChange={set('full_name')} invalid={!!errors.full_name} placeholder="Your full name as it appears on ID" autoComplete="name" />
                </Field>
                <Field label="Email address" required error={errors.email}>
                  <Input type="email" value={form.email} onChange={set('email')} invalid={!!errors.email} placeholder="you@example.com" autoComplete="email" />
                </Field>
                <Field label="Phone number" required error={errors.phone}>
                  <Input type="tel" value={form.phone} onChange={set('phone')} invalid={!!errors.phone} placeholder="+254 7XX XXX XXX" autoComplete="tel" />
                </Field>
                <Field label="Country" required error={errors.country}>
                  <Select value={form.country} onChange={set('country')} invalid={!!errors.country}>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>
                <Field label="Institution" required error={errors.institution}>
                  <Input value={form.institution} onChange={set('institution')} invalid={!!errors.institution} placeholder="University / organisation" />
                </Field>
                <Field label="School / Faculty">
                  <Input value={form.school_faculty} onChange={set('school_faculty')} placeholder="e.g. School of Medicine" />
                </Field>
                <Field label="Department">
                  <Input value={form.department} onChange={set('department')} placeholder="e.g. Department of Nursing" />
                </Field>
                <Field label="Year of study" help="Where applicable (students).">
                  <Input value={form.year_of_study} onChange={set('year_of_study')} placeholder="e.g. Year 3" />
                </Field>
              </div>
            </div>

            {/* 2. Category & event */}
            <div>
              <h2 className="flex items-center gap-2.5 text-lg font-bold text-navy-950">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-900 text-xs font-black text-gold-400">2</span>
                Participant category &amp; event
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
  {[
    { name: 'Workshop', event: config.workshop, availability: workshopAvailability },
    { name: 'Main Conference', event: config.conference, availability: conferenceAvailability },
  ].map(({ name, event: ev, availability }) => (
    <div key={name} className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-bold text-navy-950">{ev.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{ev.theme || 'Theme to be announced'}</p>
      <p className="mt-2 text-sm text-slate-700">
        <strong>Date:</strong> {displayEventDate(ev.startAt)}
      </p>
      <p className="text-sm text-slate-700">
        <strong>Venue:</strong> {ev.venue || 'To be announced'}
      </p>
      <p className="mt-2 text-xs text-slate-600">
        Registration opens: {displayEventDate(ev.registrationOpensAt)}
      </p>
      <p className="text-xs text-slate-600">
        Registration deadline: {displayEventDate(ev.registrationClosesAt)}
      </p>
      <p className={`mt-3 text-xs font-bold ${
        availability === 'open' ? 'text-emerald-700' :
        availability === 'not_open' ? 'text-amber-700' : 'text-red-700'
      }`}>
        {availability === 'open' ? 'Registration open' :
          availability === 'not_open' ? 'Registration not yet open' :
          ev.status === 'postponed' ? 'Event postponed' :
          ev.status === 'completed' ? 'Event completed' : 'Registration closed'}
      </p>
    </div>
  ))}
</div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="I am a…" required error={errors.category}>
                  <Select value={form.category} onChange={set('category')} invalid={!!errors.category}>
                    <option value="">Select your category…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>
                <Field label="Registering for" required error={errors.event_selection}>
                  <Select value={form.event_selection} onChange={(e) => setForm((f) => ({ ...f, event_selection: e.target.value as EventSelection }))}>
                    {EVENTS.map((ev) => {
  const available =
    ev.id === 'workshop'
      ? workshopAvailability === 'open'
      : ev.id === 'conference'
        ? conferenceAvailability === 'open'
        : bothAvailable

  const eventLabel =
    ev.id === 'workshop'
      ? `${config.workshop.title} (${displayEventDate(config.workshop.startAt)})`
      : ev.id === 'conference'
        ? `${config.conference.title} (${displayEventDate(config.conference.startAt)})`
        : `Both Events (${displayEventDate(config.workshop.startAt)} & ${displayEventDate(config.conference.startAt)})`

  return (
    <option key={ev.id} value={ev.id} disabled={!available}>
      {eventLabel}{available ? '' : ' (Unavailable)'}
    </option>
  )
})}
                  </Select>
                </Field>
              </div>

              {/* Fee summary */}
              <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50/60 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-navy-950">
                  <Wallet size={16} className="text-gold-600" /> Your fee summary
                </div>
                {form.category ? (
                  <>
                    <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                      {fees.lines.map((l) => (
                        <li key={l.label} className="flex justify-between gap-4">
                          <span>{l.label}</span>
                          <span className="font-semibold">{l.amount === 0 ? 'Fee TBA (0 today)' : formatMoney(l.amount, config.currency)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between border-t border-navy-200 pt-3">
                      <span className="text-sm font-black text-navy-950 uppercase">Total</span>
                      <span className="text-xl font-black text-navy-950">{formatMoney(fees.total, config.currency)}</span>
                    </div>
                    {fees.tier === 'early_bird' && earlyBirdActive && (
                      <p className="mt-2 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800">
                        🎉 Early-bird rate applied — {isStudent ? 'student' : 'non-student'} rate before{' '}
                        {formatDate(config.earlyBirdDeadline)}.
                      </p>
                    )}
                    {config.workshopFee === null && (form.event_selection === 'workshop' || form.event_selection === 'both') && (
                      <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">
                        The workshop fee has not been confirmed by the Secretariat yet. You'll be charged only the
                        confirmed amount at this time.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Select your participant category to see your exact fee.{' '}
                    {earlyBirdActive
                      ? `Early-bird (${formatMoney(config.earlyBirdStudent, config.currency)} for students) is active until ${formatDate(config.earlyBirdDeadline)}.`
                      : 'Early-bird period has ended — standard rates apply.'}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Payment */}
            <div>
              <h2 className="flex items-center gap-2.5 text-lg font-bold text-navy-950">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-900 text-xs font-black text-gold-400">3</span>
                {paymentRequired ? 'Payment details' : 'Payment (not required)'}
              </h2>
              {paymentRequired ? (
                <>
                  <p className="mt-2 text-sm text-slate-500">
                    Pay through the official channels in the sidebar, then submit your details below. The website
                    does <strong>not</strong> verify payments automatically — the Secretariat confirms each payment.
                  </p>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <Field label="Payment method" required error={errors.method}>
                      <Select value={form.method} onChange={set('method')} invalid={!!errors.method}>
                        <option value="mpesa">M-PESA (Till {`9086003`})</option>
                        <option value="bank_transfer">Bank transfer (KCB)</option>
                        <option value="cash">Cash (on venue, if permitted)</option>
                        <option value="other">Other</option>
                      </Select>
                    </Field>
                    <Field label="Amount paid" required help={`Expected: ${formatMoney(fees.total, config.currency)}`}>
                      <Input value={formatMoney(fees.total, config.currency)} readOnly className="bg-slate-50 font-bold" />
                    </Field>
                    <Field label="Transaction / reference number" required error={errors.transaction_ref} help="M-PESA code or bank transfer reference.">
                      <Input value={form.transaction_ref} onChange={set('transaction_ref')} invalid={!!errors.transaction_ref} placeholder="e.g. SEV3XK9Q2L" />
                    </Field>
                    <Field label="Date of payment" required error={errors.paid_on}>
                      <Input type="date" value={form.paid_on} onChange={set('paid_on')} invalid={!!errors.paid_on} max={new Date().toISOString().slice(0, 10)} />
                    </Field>
                    <Field label="Proof of payment (optional)" error={errors.proof} help="Screenshot or slip — PDF/JPG/PNG, max 5 MB. Stored privately." className="sm:col-span-2">
                      <FileUpload
                        label=""
                        accept={PROOF_TYPES.accept}
                        maxSizeMB={PROOF_TYPES.maxSizeMB}
                        file={proof}
                        onFile={(f) => { setProof(f); setErrors((er) => ({ ...er, proof: undefined })) }}
                      />
                    </Field>
                  </div>
                </>
              ) : (
                <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3.5 text-sm font-medium text-emerald-800">
                  Your selected event(s) carry no confirmed fee at this time — no payment details are needed.
                </p>
              )}
            </div>

            {/* Duplicate notice */}
            {duplicate && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
                <p className="text-sm font-bold text-amber-900">A registration already exists for this email</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                  We found registration <strong className="font-mono">{duplicate.existing.ref_code}</strong> (
                  {duplicate.existing.event_selection === 'both' ? 'Workshop + Main Conference' : duplicate.existing.event_selection}
                  , {formatDate(duplicate.existing.created_at, false)}) for this email address.
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm font-semibold text-amber-900">
                  <input type="checkbox" checked={ackNew} onChange={(e) => setAckNew(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-amber-700" />
                  <span>I need a new registration (e.g. for a different event or as a replacement). Submit anyway.</span>
                </label>
              </div>
            )}

            {/* Consent */}
            <div>
              <Checkbox
                id="consent"
                checked={form.consent}
                onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                label={
                  <>
                    <strong className="text-navy-950">Communication consent.</strong> I agree that the MEDSAM
                    Scientific Conference organising team may contact me at the email address above about{' '}
                    <em>this registration</em> — payment confirmation, programme updates, abstract decisions,
                    speaker announcements and post-conference communication. I will not be added to unrelated
                    marketing lists. <span className="text-red-500">*</span>
                  </>
                }
                className={cn(errors.consent && 'border-red-300 bg-red-50/50')}
              />
              {errors.consent && <p className="error-text">{errors.consent}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6">
              <Button type="submit" loading={submitting}>
                <Send size={17} /> {submitting ? 'Submitting…' : 'Complete Registration'}
              </Button>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600" />
                Your details are stored securely and only used for this conference.
              </p>
            </div>
          </form>

          {/* Sidebar: fees + payment channels */}
          <aside className="space-y-6">
            <div className="card divide-y divide-slate-100">
              <div className="p-5">
                <h3 className="text-sm font-black tracking-[0.18em] text-gold-700 uppercase">Main conference fees</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold text-slate-700">Early Bird — Students</dt>
                    <dd className="font-black text-gold-700">{formatMoney(config.earlyBirdStudent, config.currency)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold text-slate-700">Standard — Students</dt>
                    <dd className="font-black text-navy-950">{formatMoney(config.studentStandard, config.currency)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold text-slate-700">Faculty / Researchers / Lecturers / Non-Students / Others</dt>
                    <dd className="font-black text-navy-950">{formatMoney(config.nonStudentStandard, config.currency)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  Early-bird deadline:{' '}
                  <strong>{config.earlyBirdDeadline ? formatDate(config.earlyBirdDeadline) : 'to be announced'}</strong>.
                  Non-student early-bird{' '}
                  {config.earlyBirdNonStudent !== null
                    ? `is ${formatMoney(config.earlyBirdNonStudent, config.currency)}`
                    : 'is not offered'}.
                </p>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-black tracking-[0.18em] text-gold-700 uppercase">Workshop fee</h3>
                <p className="mt-2 text-sm font-bold text-navy-950">
                  {config.workshopFee !== null ? formatMoney(config.workshopFee, config.currency) : 'To be confirmed by the Secretariat'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {config.workshopFee !== null
                    ? 'Payable through the official channels below.'
                    : 'Register now to reserve your place; fees will be communicated by email.'}
                </p>
              </div>
            </div>

            <PaymentDetails compact />
          </aside>
        </div>
      </section>
    </>
  )
}
