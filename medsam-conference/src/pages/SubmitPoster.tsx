import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, Lightbulb, CheckCircle2, ShieldCheck, Info } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { Field, Input, Select, Textarea } from '../components/ui/FormControls'
import { Button } from '../components/ui/Button'
import { FileUpload } from '../components/ui/FileUpload'
import { ErrorState } from '../components/ui/Feedback'
import { useToast } from '../components/ui/Toast'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import { uploadToBucket } from '../hooks/useCrud'
import { TRACKS } from '../lib/constants'
import { isValidEmail, isValidPhone, PDF_TYPES, IMAGE_TYPES, cn } from '../lib/utils'

type Kind = 'poster' | 'innovation'

interface FormState {
  title: string
  description: string
  team_members: string
  contact_name: string
  contact_email: string
  contact_phone: string
  institution: string
  track: string
}

const INITIAL: FormState = {
  title: '',
  description: '',
  team_members: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  institution: '',
  track: '',
}

/**
 * Poster & innovation submissions. Files go to PRIVATE Supabase buckets;
 * items are published on the public Posters page only after admin approval.
 */
export default function SubmitPoster() {
  const { notify } = useToast()
  const [kind, setKind] = useState<Kind>('poster')
  const [form, setForm] = useState<FormState>(INITIAL)
  const [primaryFile, setPrimaryFile] = useState<File | null>(null)   // poster PDF / innovation materials
  const [imageFile, setImageFile] = useState<File | null>(null)       // poster image
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'primary' | 'image', string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [fatal, setFatal] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }

  function validate(): boolean {
    const er: typeof errors = {}
    if (form.title.trim().length < 3) er.title = 'Please enter a title.'
    if (form.description.trim().length < 30) er.description = 'Please describe your work (min. 30 characters).'
    if (form.contact_name.trim().length < 3) er.contact_name = 'Please enter the lead contact name.'
    if (!isValidEmail(form.contact_email)) er.contact_email = 'Please enter a valid email address.'
    if (form.contact_phone && !isValidPhone(form.contact_phone)) er.contact_phone = 'Please enter a valid phone number.'
    if (kind === 'poster' && !primaryFile) er.primary = 'Please upload your poster PDF.'
    if (kind === 'innovation' && !primaryFile) er.primary = 'Please upload your pitch / materials PDF.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setFatal('The conference database is not connected yet. Please try again after the site is fully configured.')
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
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        team_members: form.team_members.trim() || null,
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim().toLowerCase(),
        contact_phone: form.contact_phone.trim() || null,
        institution: form.institution.trim() || null,
        track: form.track.trim() || null,
        status: 'pending',
      }
      if (kind === 'poster') {
        payload.poster_pdf_path = primaryFile ? await uploadToBucket('posters', 'pdf', primaryFile, 'application/pdf') : null
        payload.poster_image_path = imageFile ? await uploadToBucket('posters', 'images', imageFile) : null
        await client.from('poster_submissions').insert(payload)
      } else {
        payload.materials_path = primaryFile ? await uploadToBucket('innovations', 'materials', primaryFile, 'application/pdf') : null
        payload.image_path = imageFile ? await uploadToBucket('innovations', 'images', imageFile) : null
        await client.from('innovation_submissions').insert(payload)
      }
      setDone(true)
      notify('success', 'Your submission has been received and is awaiting Secretariat review.')
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
        <Seo title="Submission Received" />
        <section className="section bg-slate-50">
          <div className="container-x max-w-2xl">
            <div className="card overflow-hidden">
              <div className="bg-navy-950 px-7 py-6 text-white">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={30} className="text-gold-400" />
                  <div>
                    <h1 className="text-xl font-black">Submission Received</h1>
                    <p className="text-sm text-navy-200">Thank you for sharing your work with the conference.</p>
                  </div>
                </div>
              </div>
              <div className="p-7">
                <p className="text-sm leading-relaxed text-slate-700">
                  Your <strong>{kind === 'poster' ? 'poster' : 'innovation'}</strong> submission is now{' '}
                  <strong>pending review</strong>. The Secretariat will review all submissions and only approved
                  items are published on the public{' '}
                  <Link to="/posters" className="font-bold text-navy-800 underline">Posters &amp; Innovations</Link>{' '}
                  page. You will be contacted by email with the outcome.
                </p>
                <div className="mt-5 flex items-start gap-3 rounded-xl bg-navy-50 px-4 py-3.5 text-xs leading-relaxed text-navy-900">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                  Your files are stored privately and are only made public if and when your submission is approved.
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/posters" className="btn btn-navy btn-sm">View the Showcase</Link>
                  <button
                    onClick={() => { setDone(false); setForm(INITIAL); setPrimaryFile(null); setImageFile(null); setErrors({}) }}
                    className="btn btn-outline-navy btn-sm"
                  >
                    Submit Another
                  </button>
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
        title="Submit Poster or Innovation"
        description="Submit a scientific poster or health innovation for the MEDSAM Scientific Conference & Symposium 2027. Reviewed by the Secretariat before publication."
      />

      <section className="bg-navy-950 py-14 md:py-16">
        <div className="container-x">
          <span className="eyebrow-light">Showcase Your Work</span>
          <h1 className="h-display text-white">Submit a Poster / Innovation</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            Share your research poster or health innovation with 300+ delegates. Every submission is reviewed by
            the Secretariat before it is published.
          </p>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x max-w-3xl">
          <form onSubmit={onSubmit} noValidate className="card p-6 sm:p-8">
            {fatal && <div className="mb-6"><ErrorState message={fatal} /></div>}

            {/* Kind selector */}
            <div className="mb-7 grid grid-cols-2 gap-3">
              {(
                [
                  { id: 'poster', label: 'Scientific Poster', Icon: LayoutGrid, desc: 'Poster PDF + optional image' },
                  { id: 'innovation', label: 'Innovation / Pitch', Icon: Lightbulb, desc: 'Pitch materials PDF + optional image' },
                ] as const
              ).map(({ id, label, Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setKind(id); setPrimaryFile(null); setImageFile(null); setErrors({}) }}
                  aria-pressed={kind === id}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-xl border-2 p-5 text-left transition-all',
                    kind === id ? 'border-gold-500 bg-gold-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-navy-300',
                  )}
                >
                  <Icon size={22} className={kind === id ? 'text-gold-700' : 'text-slate-400'} />
                  <span className="text-sm font-bold text-navy-950">{label}</span>
                  <span className="text-xs text-slate-500">{desc}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Title" required error={errors.title} className="sm:col-span-2">
                <Input value={form.title} onChange={set('title')} invalid={!!errors.title} placeholder={kind === 'poster' ? 'Poster title' : 'Innovation name'} />
              </Field>
              <Field label="Description" required error={errors.description} help="What is it, why does it matter, and what is the outcome?" className="sm:col-span-2">
                <Textarea rows={5} value={form.description} onChange={set('description')} invalid={!!errors.description} />
              </Field>
              <Field label="Team members" help="Comma-separated names.">
                <Input value={form.team_members} onChange={set('team_members')} placeholder="Member 1, Member 2, …" />
              </Field>
              <Field label="Institution">
                <Input value={form.institution} onChange={set('institution')} placeholder="e.g. Maseno University" />
              </Field>
              <Field label="Scientific track">
                <Select value={form.track} onChange={set('track')}>
                  <option value="">Select a track (optional)…</option>
                  {TRACKS.map((t) => <option key={t.no} value={t.title}>{t.no} — {t.title}</option>)}
                </Select>
              </Field>
              <Field label="Lead contact name" required error={errors.contact_name}>
                <Input value={form.contact_name} onChange={set('contact_name')} invalid={!!errors.contact_name} />
              </Field>
              <Field label="Contact email" required error={errors.contact_email}>
                <Input type="email" value={form.contact_email} onChange={set('contact_email')} invalid={!!errors.contact_email} placeholder="you@example.com" />
              </Field>
              <Field label="Contact phone" error={errors.contact_phone}>
                <Input type="tel" value={form.contact_phone} onChange={set('contact_phone')} invalid={!!errors.contact_phone} placeholder="+254 7XX XXX XXX" />
              </Field>
              <Field
                label={kind === 'poster' ? 'Poster PDF' : 'Pitch / materials PDF'}
                required
                error={errors.primary}
                help="PDF, max 5 MB."
                className="sm:col-span-2"
              >
                <FileUpload
                  label=""
                  accept={PDF_TYPES.accept}
                  maxSizeMB={PDF_TYPES.maxSizeMB}
                  file={primaryFile}
                  onFile={(f) => { setPrimaryFile(f); setErrors((er) => ({ ...er, primary: undefined })) }}
                />
              </Field>
              <Field
                label={kind === 'poster' ? 'Poster image (for the gallery preview)' : 'Image (for the gallery preview)'}
                error={errors.image}
                help="JPG/PNG/WEBP, max 5 MB. Optional but recommended."
                className="sm:col-span-2"
              >
                <FileUpload
                  label=""
                  accept={IMAGE_TYPES.accept}
                  maxSizeMB={IMAGE_TYPES.maxSizeMB}
                  file={imageFile}
                  onFile={(f) => { setImageFile(f); setErrors((er) => ({ ...er, image: undefined })) }}
                />
              </Field>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-navy-50 px-4 py-3.5 text-xs leading-relaxed text-navy-900">
              <Info size={16} className="mt-0.5 shrink-0" />
              Submissions are stored privately and reviewed by the Secretariat. Only approved items are published
              on the public showcase. Please ensure all team members consent to the work being displayed.
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button type="submit" loading={submitting}>
                <CheckCircle2 size={17} /> {submitting ? 'Submitting…' : 'Submit for Review'}
              </Button>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600" /> Private until approved
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
