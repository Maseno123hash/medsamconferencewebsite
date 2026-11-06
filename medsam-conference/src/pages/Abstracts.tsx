import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FileText, CheckCircle2, ShieldCheck, Info } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { Field, Input, Select, Textarea } from '../components/ui/FormControls'
import { Button } from '../components/ui/Button'
import { FileUpload } from '../components/ui/FileUpload'
import { ErrorState } from '../components/ui/Feedback'
import { useToast } from '../components/ui/Toast'
import { useConfig } from '../hooks/useAdminAuth'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import { uploadToBucket } from '../hooks/useCrud'
import { TRACKS } from '../lib/constants'
import {
  isValidEmail,
  isValidPhone,
  generateRef,
  PDF_TYPES,
  formatDateTime,
  formatMoney,
} from '../lib/utils'

interface FormState {
  author_name: string
  email: string
  phone: string
  institution: string
  department: string
  abstract_title: string
  authors: string
  track: string
  presentation_preference: 'oral' | 'poster' | 'either'
  abstract_text: string
  keywords: string
}

const INITIAL: FormState = {
  author_name: '',
  email: '',
  phone: '',
  institution: '',
  department: '',
  abstract_title: '',
  authors: '',
  track: '',
  presentation_preference: 'either',
  abstract_text: '',
  keywords: '',
}

/**
 * Abstract submission — no account required. Submissions are stored in
 * Supabase (private bucket for PDFs) and reviewed by the Secretariat.
 * Each submission receives a unique ID: MEDSAM-ABS-XXXXXX.
 */
export default function Abstracts() {
  const { notify } = useToast()
  const { config } = useConfig()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [pdf, setPdf] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'pdf', string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [fatal, setFatal] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<{ email: string; title: string } | null>(null)
  const [ackNew, setAckNew] = useState(false)
  const [done, setDone] = useState<{ submissionId: string; submittedAt: string } | null>(null)

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }

  function validate(): boolean {
    const er: typeof errors = {}
    if (form.author_name.trim().length < 3) er.author_name = 'Please enter the full name of the lead author.'
    if (!isValidEmail(form.email)) er.email = 'Please enter a valid email address.'
    if (form.phone && !isValidPhone(form.phone)) er.phone = 'Please enter a valid phone number.'
    if (form.institution.trim().length < 2) er.institution = 'Please enter your institution.'
    if (form.abstract_title.trim().length < 5) er.abstract_title = 'Please enter a meaningful abstract title.'
    if (!form.track) er.track = 'Please choose a scientific track.'
    if (form.abstract_text.trim().length < 100) er.abstract_text = 'Abstract text must be at least 100 characters.'
    if (form.abstract_text.length > 2500) er.abstract_text = 'Abstract text must not exceed 2,500 characters.'
    if (!pdf) er.pdf = 'Please upload your abstract PDF.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  const charCount = useMemo(() => form.abstract_text.length, [form.abstract_text])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setFatal('The conference database is not connected yet. Please try again after the site is fully configured, or email the organising team.')
      return
    }
    if (duplicate && !ackNew) {
      setErrors((er) => ({ ...er, pdf: 'Please confirm the duplicate notice below before submitting.' }))
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

      // Duplicate check: same email + same abstract title
      const { data: dup } = await client
        .from('abstract_submissions')
        .select('submission_id')
        .ilike('email', form.email.trim())
        .ilike('abstract_title', form.abstract_title.trim())
        .limit(1)
      if (dup && dup.length > 0 && !ackNew) {
        setDuplicate({ email: form.email.trim(), title: form.abstract_title.trim() })
        setSubmitting(false)
        notify('info', 'A similar abstract from this email already exists. Please confirm to submit anyway.')
        return
      }

      // Upload PDF first so we can store its path
      let pdfPath: string | null = null
      if (pdf) {
        pdfPath = await uploadToBucket('abstracts', 'submissions', pdf, 'application/pdf')
      }

      // Generate a unique submission ID (retry on collision)
      let submissionId = generateRef('MEDSAM-ABS')
      let inserted: { id: string } | null = null
      for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
        const { data, error: err } = await client
          .from('abstract_submissions')
          .insert({
            submission_id: submissionId,
            author_name: form.author_name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim() || null,
            institution: form.institution.trim(),
            department: form.department.trim() || null,
            abstract_title: form.abstract_title.trim(),
            authors: form.authors.trim() || null,
            track: form.track,
            presentation_preference: form.presentation_preference,
            abstract_text: form.abstract_text.trim(),
            keywords: form.keywords.trim() || null,
            pdf_path: pdfPath,
            status: 'submitted',
          })
          .select('id')
          .single()
        if (err && String(err.code) === '23505') {
          submissionId = generateRef('MEDSAM-ABS')
          continue
        }
        if (err) throw new Error(err.message)
        inserted = data as { id: string }
      }
      if (!inserted) throw new Error('Could not create a unique submission ID. Please try again.')

      setDone({ submissionId, submittedAt: new Date().toISOString() })
      notify('success', `Your abstract has been received and assigned submission ID ${submissionId}.`)
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
        <Seo title="Abstract Submitted" />
        <section className="section bg-slate-50">
          <div className="container-x max-w-2xl">
            <div className="card overflow-hidden">
              <div className="bg-emerald-600 px-7 py-6 text-white">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={30} />
                  <div>
                    <h1 className="text-xl font-black">Abstract Submitted Successfully</h1>
                    <p className="text-sm text-emerald-100">
                      Received {formatDateTime(done.submittedAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-7">
                <div className="rounded-xl border-2 border-dashed border-navy-300 bg-navy-50 p-5 text-center">
                  <p className="text-[11px] font-black tracking-[0.25em] text-navy-600 uppercase">Your Submission ID</p>
                  <p className="mt-1.5 font-mono text-2xl font-black text-navy-950">{done.submissionId}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Keep this ID safe — use it for all correspondence with the Secretariat.
                  </p>
                </div>
                <div className="mt-6 space-y-3 text-sm text-slate-700">
                  <p>
                    <strong className="text-navy-950">Title:</strong> {form.abstract_title}
                  </p>
                  <p>
                    <strong className="text-navy-950">Lead author:</strong> {form.author_name}
                  </p>
                  <p>
                    <strong className="text-navy-950">Track:</strong> {form.track}
                  </p>
                  <p>
                    <strong className="text-navy-950">Presentation preference:</strong>{' '}
                    {form.presentation_preference === 'either' ? 'Either (Oral / Poster)' : form.presentation_preference}
                  </p>
                </div>
                <div className="mt-6 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3.5 text-xs leading-relaxed text-amber-900">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <p>
                    Your abstract is now <strong>under the review of the Scientific Committee</strong>. Review
                    outcomes (Accepted / Oral / Poster / Revision Required) will be communicated to the email
                    address you provided. You will be notified by email.
                  </p>
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/registration" className="btn btn-gold">
                    Register for the Conference
                  </Link>
                  <button onClick={() => { setDone(null); setForm(INITIAL); setPdf(null); setAckNew(false); setDuplicate(null) }} className="btn btn-outline-navy">
                    Submit Another Abstract
                  </button>
                  <Link to="/" className="btn btn-outline-navy">
                    Back to Home
                  </Link>
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
        title="Submit Abstract"
        description="Submit your scientific abstract for the MEDSAM Scientific Conference & Symposium 2027. Choose your track, upload your PDF and receive a unique submission ID — no account required."
      />

      <section className="bg-navy-950 py-14 md:py-16">
        <div className="container-x">
          <span className="eyebrow-light">Call for Abstracts</span>
          <h1 className="h-display text-white">Submit Your Abstract</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            Share your research across six scientific tracks. Presentations may be oral or poster — indicate your
            preference, and the Scientific Committee makes the final assignment.
          </p>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_360px]">
          <form onSubmit={onSubmit} noValidate className="card p-6 sm:p-8">
            {fatal && (
              <div className="mb-6">
                <ErrorState message={fatal} />
              </div>
            )}

            <h2 className="text-lg font-bold text-navy-950">Author details</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Lead author full name" required error={errors.author_name}>
                <Input value={form.author_name} onChange={set('author_name')} invalid={!!errors.author_name} placeholder="e.g. Jane A. Otieno" autoComplete="name" />
              </Field>
              <Field label="Email address" required error={errors.email} help="Used to send review decisions and conference updates.">
                <Input type="email" value={form.email} onChange={set('email')} invalid={!!errors.email} placeholder="you@example.com" autoComplete="email" />
              </Field>
              <Field label="Phone number" error={errors.phone}>
                <Input type="tel" value={form.phone} onChange={set('phone')} invalid={!!errors.phone} placeholder="+254 7XX XXX XXX" autoComplete="tel" />
              </Field>
              <Field label="Institution" required error={errors.institution}>
                <Input value={form.institution} onChange={set('institution')} invalid={!!errors.institution} placeholder="e.g. Maseno University" />
              </Field>
              <Field label="Department">
                <Input value={form.department} onChange={set('department')} placeholder="e.g. Department of Medicine" />
              </Field>
            </div>

            <h2 className="mt-9 text-lg font-bold text-navy-950">Abstract details</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Abstract title" required error={errors.abstract_title} className="sm:col-span-2">
                <Input value={form.abstract_title} onChange={set('abstract_title')} invalid={!!errors.abstract_title} placeholder="A clear, descriptive title of your work" />
              </Field>
              <Field label="All authors" help="List all co-authors separated by commas, in order.">
                <Input value={form.authors} onChange={set('authors')} placeholder="Author 1, Author 2, …" />
              </Field>
              <Field label="Scientific track" required error={errors.track}>
                <Select value={form.track} onChange={set('track')} invalid={!!errors.track}>
                  <option value="">Select a track…</option>
                  {TRACKS.map((t) => (
                    <option key={t.no} value={t.title}>
                      {t.no} — {t.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Presentation preference" required>
                <Select value={form.presentation_preference} onChange={set('presentation_preference')}>
                  <option value="either">Either (leave to the committee)</option>
                  <option value="oral">Oral presentation</option>
                  <option value="poster">Poster presentation</option>
                </Select>
              </Field>
              <Field
                label="Abstract text"
                required
                error={errors.abstract_text}
                help={`${charCount} / 2,500 characters (min. 100).`}
                className="sm:col-span-2"
              >
                <Textarea rows={8} value={form.abstract_text} onChange={set('abstract_text')} invalid={!!errors.abstract_text} placeholder="Background, methods, results, conclusions…" />
              </Field>
              <Field label="Keywords" help="Comma-separated, 3–6 keywords.">
                <Input value={form.keywords} onChange={set('keywords')} placeholder="e.g. malaria, diagnostics, rural Kenya" />
              </Field>
              <Field label="Abstract PDF" required error={errors.pdf} help="Full abstract document (PDF, max 5 MB).">
                <FileUpload
                  label=""
                  accept={PDF_TYPES.accept}
                  maxSizeMB={PDF_TYPES.maxSizeMB}
                  file={pdf}
                  onFile={(f) => {
                    setPdf(f)
                    setErrors((er) => ({ ...er, pdf: undefined }))
                  }}
                />
              </Field>
            </div>

            {duplicate && (
              <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
                <p className="text-sm font-bold text-amber-900">Possible duplicate detected</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                  We already have an abstract titled “{duplicate.title}” from this email address. If this is a new
                  or revised abstract, please confirm below to submit it anyway.
                </p>
                <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-amber-900">
                  <input
                    type="checkbox"
                    checked={ackNew}
                    onChange={(e) => setAckNew(e.target.checked)}
                    className="h-4 w-4 rounded accent-amber-700"
                  />
                  I confirm this is a new / revised abstract and I want to submit it.
                </label>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button type="submit" loading={submitting}>
                <FileText size={17} />
                {submitting ? 'Submitting…' : 'Submit Abstract'}
              </Button>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600" />
                Your submission is private until reviewed by the Scientific Committee.
              </p>
            </div>
          </form>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Abstract fee and deadline */}
<div className="card border-l-4 border-gold-500 p-6">
  <h3 className="text-sm font-black tracking-[0.18em] text-navy-950 uppercase">
    Submission information
  </h3>

  <div className="mt-4 space-y-4">
    <div>
      <p className="text-xs font-semibold text-slate-500">
        Abstract submission fee
      </p>
      <p className="mt-1 text-lg font-black text-navy-950">
        {config.abstractFee === null
          ? 'To be announced'
          : formatMoney(config.abstractFee, config.abstractFeeCurrency)}
      </p>
    </div>

    <div>
      <p className="text-xs font-semibold text-slate-500">
        Submission deadline
      </p>
      <p className="mt-1 text-sm font-bold text-navy-950">
        {config.abstractSubmissionDeadline
          ? formatDateTime(config.abstractSubmissionDeadline)
          : 'To be announced'}
      </p>
    </div>
  </div>
</div>
            <div className="card p-6">
              <h3 className="text-sm font-black tracking-[0.18em] text-gold-700 uppercase">Good to know</h3>
              <ul className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600">
                <li>• No account is required — your submission ID is your reference.</li>
                <li>• One abstract per scientific track. You may submit more than one abstract.</li>
                <li>• Accepted authors must register for the conference to present.</li>
                <li>• Review outcomes are communicated by email.</li>
                <li>• The Scientific Committee makes the final decision on presentation type.</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-navy-950 p-6 text-white">
              <h3 className="text-sm font-black tracking-[0.18em] text-gold-300 uppercase">Scientific tracks</h3>
              <ol className="mt-4 space-y-2.5 text-sm text-navy-100">
                {TRACKS.map((t) => (
                  <li key={t.no} className="flex gap-2.5">
                    <span className="font-black text-gold-400">{t.no}</span>
                    {t.title}
                  </li>
                ))}
              </ol>
              <Link to="/programme" className="mt-5 inline-block text-sm font-bold text-gold-300 hover:underline">
                View the full programme →
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
