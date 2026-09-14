import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { HeartHandshake, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Field, Input, Select, Textarea } from '../components/ui/FormControls'
import { Button } from '../components/ui/Button'
import { FileUpload } from '../components/ui/FileUpload'
import { PaymentDetails } from '../components/public/PaymentDetails'
import { useToast } from '../components/ui/Toast'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import { uploadToBucket } from '../hooks/useCrud'
import { isValidEmail, isValidPhone, PROOF_TYPES } from '../lib/utils'

interface FormState {
  name_or_org: string
  email: string
  phone: string
  amount: string
  payment_method: string
  transaction_ref: string
  message: string
  donor: 'individual' | 'organisation'
}

const INITIAL: FormState = {
  name_or_org: '',
  email: '',
  phone: '',
  amount: '',
  payment_method: 'mpesa',
  transaction_ref: '',
  message: '',
  donor: 'individual',
}

/**
 * Support / Donations — voluntary contributions towards the conference.
 * Stored in the `donations` table; optional proof goes to a private bucket.
 */
export default function Donations() {
  const { notify } = useToast()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [proof, setProof] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'proof', string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [fatal, setFatal] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }

  function validate(): boolean {
    const er: typeof errors = {}
    if (form.name_or_org.trim().length < 2) er.name_or_org = form.donor === 'individual' ? 'Please enter your name.' : 'Please enter the organisation name.'
    if (form.email && !isValidEmail(form.email)) er.email = 'Please enter a valid email address.'
    if (form.phone && !isValidPhone(form.phone)) er.phone = 'Please enter a valid phone number.'
    const amt = Number(form.amount)
    if (!form.amount || Number.isNaN(amt) || amt <= 0) er.amount = 'Please enter the amount you contributed (in KES).'
    if (!form.transaction_ref.trim()) er.transaction_ref = 'Please enter the transaction / reference number.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setFatal('The conference database is not connected yet. You can still donate via the channels below and email your receipt.')
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
      let proofPath: string | null = null
      if (proof) proofPath = await uploadToBucket('payment_proofs', 'donations', proof)
      const { error } = await client.from('donations').insert({
        name_or_org: form.name_or_org.trim(),
        email: form.email.trim().toLowerCase() || null,
        phone: form.phone.trim() || null,
        amount: Number(form.amount),
        payment_method: form.payment_method,
        transaction_ref: form.transaction_ref.trim(),
        message: form.message.trim() || null,
        proof_path: proofPath,
        status: 'submitted',
      })
      if (error) throw new Error(error.message)
      setDone(true)
      notify('success', 'Thank you for supporting the conference! Your contribution has been recorded.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setFatal(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <>
        <Seo title="Thank You" />
        <section className="section bg-slate-50">
          <div className="container-x max-w-2xl">
            <div className="card overflow-hidden">
              <div className="bg-navy-950 px-7 py-8 text-white">
                <div className="flex items-center gap-3">
                  <HeartHandshake size={32} className="text-gold-400" />
                  <div>
                    <h1 className="text-2xl font-black">Asante — Thank You!</h1>
                    <p className="text-sm text-navy-200">Your support keeps student science moving forward.</p>
                  </div>
                </div>
              </div>
              <div className="p-7">
                <p className="text-sm leading-relaxed text-slate-700">
                  Your contribution of <strong>KES {Number(form.amount).toLocaleString('en-KE')}</strong> has been
                  recorded for verification by the Secretariat. Donations are voluntary contributions towards the
                  running of the conference — nothing is expected in return, except our gratitude and the impact of
                  a well-run scientific platform.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/" className="btn btn-navy btn-sm">Back to Home</Link>
                  <Link to="/sponsors" className="btn btn-outline-navy btn-sm">Sponsorship Opportunities</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <Seo
        title="Support / Donate"
        description="Support the MEDSAM Scientific Conference & Symposium 2027. Voluntary contributions from individuals, organisations, institutions, industry and development partners are welcome."
      />

      <section className="bg-navy-950 py-16 md:py-20">
        <div className="container-x">
          <span className="eyebrow-light">Support the Conference</span>
          <h1 className="h-display text-white">Back student science</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            Support from individuals, organisations, institutions, industry partners and development partners is
            welcome. Every contribution — in any amount — helps bring 300+ delegates together to advance medical
            science.
          </p>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x grid gap-8 lg:grid-cols-2">
          {/* Channels */}
          <div>
            <SectionHeading
              center={false}
              eyebrow="Official Channels"
              title="How to contribute"
              subtitle="Donations and support are voluntary contributions towards the conference. Use either official channel below, then record your contribution with the form."
            />
            <div className="mt-8">
              <PaymentDetails />
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                Contributions are verified by the Secretariat before being acknowledged publicly.
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                Prefer in-kind support (venue, printing, catering, devices)? Email the organising team.
              </li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} noValidate className="card h-fit p-6 sm:p-8">
            <h2 className="text-lg font-bold text-navy-950">Record your contribution</h2>
            <p className="mt-1.5 text-sm text-slate-500">So we can acknowledge and thank you properly.</p>
            {fatal && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{fatal}</p>}
            <div className="mt-6 grid gap-5">
              <Field label="I am contributing as">
                <div className="grid grid-cols-2 gap-3">
                  {(['individual', 'organisation'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, donor: d }))}
                      aria-pressed={form.donor === d}
                      className={`rounded-lg border-2 px-4 py-2.5 text-sm font-bold capitalize transition-all ${
                        form.donor === d ? 'border-gold-500 bg-gold-50 text-navy-950' : 'border-slate-200 text-slate-500 hover:border-navy-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={form.donor === 'individual' ? 'Your name' : 'Organisation name'} required error={errors.name_or_org}>
                <Input value={form.name_or_org} onChange={set('name_or_org')} invalid={!!errors.name_or_org} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email" error={errors.email} help="Optional — for acknowledgement only.">
                  <Input type="email" value={form.email} onChange={set('email')} invalid={!!errors.email} placeholder="you@example.com" />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <Input type="tel" value={form.phone} onChange={set('phone')} invalid={!!errors.phone} placeholder="+254 7XX XXX XXX" />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Amount (KES)" required error={errors.amount}>
                  <Input type="number" min={1} value={form.amount} onChange={set('amount')} invalid={!!errors.amount} placeholder="e.g. 10000" />
                </Field>
                <Field label="Payment method" required>
                  <Select value={form.payment_method} onChange={set('payment_method')}>
                    <option value="mpesa">M-PESA (Till 9086003)</option>
                    <option value="bank_transfer">Bank transfer (KCB)</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
              </div>
              <Field label="Transaction / reference number" required error={errors.transaction_ref}>
                <Input value={form.transaction_ref} onChange={set('transaction_ref')} invalid={!!errors.transaction_ref} placeholder="M-PESA code or bank reference" />
              </Field>
              <Field label="Message (optional)">
                <Textarea rows={3} value={form.message} onChange={set('message')} placeholder="A word of encouragement for the students…" />
              </Field>
              <Field label="Proof of payment (optional)" error={errors.proof} help="PDF/JPG/PNG, max 5 MB — stored privately.">
                <FileUpload
                  label=""
                  accept={PROOF_TYPES.accept}
                  maxSizeMB={PROOF_TYPES.maxSizeMB}
                  file={proof}
                  onFile={(f) => { setProof(f); setErrors((er) => ({ ...er, proof: undefined })) }}
                />
              </Field>
            </div>
            <div className="mt-7">
              <Button type="submit" loading={submitting} className="w-full sm:w-auto">
                <HeartHandshake size={17} /> {submitting ? 'Recording…' : 'Record My Contribution'}
              </Button>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
              Donations/support are strictly voluntary. Your details are used only to acknowledge your contribution
              to this conference.
            </p>
          </form>
        </div>
      </section>
    </>
  )
}
