import { useState, type FormEvent } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle2, Building2, Clock } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { Field, Input, Textarea } from '../components/ui/FormControls'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import { CONTACT, CONFERENCE } from '../lib/constants'
import { isValidEmail, isValidPhone } from '../lib/utils'
import { SocialLinks } from '../components/layout/SocialLinks'

interface FormState {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

const INITIAL: FormState = { name: '', email: '', phone: '', subject: '', message: '' }

/**
 * Contact — displays the official organising team details (exactly as
 * supplied) and stores messages in `contact_messages` for admin review.
 */
export default function Contact() {
  const { notify } = useToast()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [fatal, setFatal] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }

  function validate(): boolean {
    const er: typeof errors = {}
    if (form.name.trim().length < 2) er.name = 'Please enter your name.'
    if (!isValidEmail(form.email)) er.email = 'Please enter a valid email address.'
    if (form.phone && !isValidPhone(form.phone)) er.phone = 'Please enter a valid phone number.'
    if (form.subject.trim().length < 3) er.subject = 'Please add a short subject.'
    if (form.message.trim().length < 10) er.message = 'Please write a message (min. 10 characters).'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setFatal('The contact form database is not connected yet. Please use the email or phone numbers shown instead.')
      return
    }
    if (!validate()) {
      notify('error', 'Please fix the highlighted fields before sending.')
      return
    }
    setSubmitting(true)
    setFatal(null)
    try {
      const { error } = await requireSupabase().from('contact_messages').insert({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        subject: form.subject.trim(),
        message: form.message.trim(),
        is_read: false,
      })
      if (error) throw new Error(error.message)
      setDone(true)
      notify('success', 'Message sent. The organising team will get back to you shortly.')
    } catch (err) {
      setFatal(err instanceof Error ? err.message : 'Message could not be sent. Please try again or email us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Seo
        title="Contact"
        description="Contact the MEDSAM Scientific Conference & Symposium Organizing Team at Maseno University School of Medicine. Email, phone and contact form."
      />

      <section className="bg-navy-950 py-14 md:py-16">
        <div className="container-x">
          <span className="eyebrow-light">Get In Touch</span>
          <h1 className="h-display text-white">Contact the Organising Team</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            Questions about registration, abstracts, sponsorship or anything else? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x grid gap-10 lg:grid-cols-[380px_1fr]">
          {/* Details */}
          <div className="space-y-5">
            <div className="card p-6">
              <h2 className="flex items-center gap-2.5 text-base font-bold text-navy-950">
                <Building2 size={19} className="text-gold-600" /> Organising Team
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{CONTACT.team}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{CONTACT.institution}</p>
            </div>
            <a href={`mailto:${CONTACT.email}`} className="card card-hover flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
                <Mail size={21} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black tracking-[0.18em] text-slate-400 uppercase">Email</p>
                <p className="truncate text-sm font-bold text-navy-950 hover:text-gold-700">{CONTACT.email}</p>
              </div>
            </a>
            {CONTACT.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="card card-hover flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
                  <Phone size={21} />
                </div>
                <div>
                  <p className="text-[11px] font-black tracking-[0.18em] text-slate-400 uppercase">Phone</p>
                  <p className="text-sm font-bold text-navy-950">{p}</p>
                </div>
              </a>
            ))}
            <div className="card flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
                <MapPin size={21} />
              </div>
              <div>
                <p className="text-[11px] font-black tracking-[0.18em] text-slate-400 uppercase">Venue</p>
                <p className="text-sm font-bold text-navy-950">{CONFERENCE.venue}</p>
                <p className="text-xs text-slate-500">{CONFERENCE.campus}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
                <Clock size={21} />
              </div>
              <div>
                <p className="text-[11px] font-black tracking-[0.18em] text-slate-400 uppercase">Office Hours</p>
                <p className="text-sm font-bold text-navy-950">Mon – Fri, 9:00 AM – 4:30 PM</p>
                <p className="text-xs text-slate-500">via the organising committee</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-navy-950 px-6 py-5">
              <span className="text-sm font-bold text-white">Follow us</span>
              <SocialLinks size={18} />
            </div>
          </div>

          {/* Form */}
          <div>
            {done ? (
              <div className="card overflow-hidden">
                <div className="bg-emerald-600 px-7 py-6 text-white">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={30} />
                    <h2 className="text-xl font-black">Message Sent</h2>
                  </div>
                </div>
                <div className="p-7">
                  <p className="text-sm leading-relaxed text-slate-700">
                    Thank you, <strong>{form.name}</strong>. Your message has been received and will be reviewed
                    by the organising team. For urgent matters, please call{' '}
                    <a className="font-bold text-navy-800 underline" href={`tel:${CONTACT.phones[0].replace(/\s/g, '')}`}>{CONTACT.phones[0]}</a>.
                  </p>
                  <button
                    onClick={() => { setDone(false); setForm(INITIAL) }}
                    className="btn btn-outline-navy btn-sm mt-6"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="card p-6 sm:p-8">
                <h2 className="text-lg font-bold text-navy-950">Send us a message</h2>
                <p className="mt-1.5 text-sm text-slate-500">We usually respond within 48 hours on weekdays.</p>
                {fatal && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{fatal}</p>}
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" required error={errors.name}>
                    <Input value={form.name} onChange={set('name')} invalid={!!errors.name} autoComplete="name" />
                  </Field>
                  <Field label="Email" required error={errors.email}>
                    <Input type="email" value={form.email} onChange={set('email')} invalid={!!errors.email} autoComplete="email" />
                  </Field>
                  <Field label="Phone" error={errors.phone}>
                    <Input type="tel" value={form.phone} onChange={set('phone')} invalid={!!errors.phone} placeholder="+254 7XX XXX XXX" />
                  </Field>
                  <Field label="Subject" required error={errors.subject}>
                    <Input value={form.subject} onChange={set('subject')} invalid={!!errors.subject} placeholder="e.g. Registration question" />
                  </Field>
                  <Field label="Message" required error={errors.message} className="sm:col-span-2">
                    <Textarea rows={6} value={form.message} onChange={set('message')} invalid={!!errors.message} />
                  </Field>
                </div>
                <div className="mt-7">
                  <Button type="submit" loading={submitting}>
                    <Send size={16} /> {submitting ? 'Sending…' : 'Send Message'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
