import { ShieldCheck } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { CONTACT } from '../lib/constants'

/**
 * Privacy & terms — what we collect (registration, abstract, poster,
 * sponsorship, support, contact), how it's stored (Supabase with RLS),
 * who can see it, and the communication-consent promise.
 */
export default function Privacy() {
  const sections: Array<{ title: string; body: React.ReactNode }> = [
    {
      title: '1. Who we are',
      body: (
        <p>
          We are the {CONTACT.team}, acting on behalf of MEDSAM — the Medical Students' Association of Maseno
          University ({CONTACT.institution}). This page explains how the website handles personal information.
        </p>
      ),
    },
    {
      title: '2. What we collect',
      body: (
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Registration:</strong> name, email, phone, country, institution, school/faculty, department, year of study, participant category, event selection, and payment details you choose to submit (method, amount, transaction reference, date, optional proof of payment).</li>
          <li><strong>Abstract submissions:</strong> author details, abstract title and text, track, presentation preference, keywords, and the uploaded PDF.</li>
          <li><strong>Poster / innovation submissions:</strong> title, description, team members, contact details, and uploaded files.</li>
          <li><strong>Sponsorship & exhibitor applications:</strong> organisation and contact details, preferred package, and your message.</li>
          <li><strong>Support / donations:</strong> name or organisation, optional contact details, amount, payment reference and optional proof.</li>
          <li><strong>Contact form:</strong> name, email, optional phone, subject and message.</li>
        </ul>
      ),
    },
    {
      title: '3. How we store and protect it',
      body: (
        <p>
          Data is stored in a professional cloud database (Supabase/PostgreSQL) with row-level security enabled.
          Payment proofs and abstract PDFs are stored in <em>private</em> storage buckets that only the Secretariat
          can access. Personal registration data is never shown publicly. We do not sell or rent personal data,
          and no third-party advertising trackers are embedded on this site.
        </p>
      ),
    },
    {
      title: '4. How we use your email — communication consent',
      body: (
        <p>
          Registration includes an explicit consent checkbox. With your consent, we may contact you about <em>this
          registration and this conference</em>: payment confirmation, programme announcements, abstract
          decisions, speaker announcements, registration reminders and post-conference communication. We do
          <strong> not</strong> subscribe you to unrelated marketing lists.
        </p>
      ),
    },
    {
      title: '5. What is made public',
      body: (
        <p>
          Publicly visible items are limited to: approved posters and innovations (only after Secretariat
          approval), published speakers and programme items, published gallery media, and sponsor names/logos that
          partners have agreed to display. Everything else — including unapproved submissions, payment proofs and
          registration lists — remains private.
        </p>
      ),
    },
    {
      title: '6. Payments',
      body: (
        <p>
          We do not process card payments on this website. Payments are made directly to the official M-PESA Till
          or KCB bank account, and you optionally submit your transaction details and proof. Registration remains
          subject to payment confirmation by the Secretariat.
        </p>
      ),
    },
    {
      title: '7. Your rights & corrections',
      body: (
        <p>
          You may request a copy of, or corrections to, the personal data we hold about you by contacting the
          organising team. If you registered by mistake, we can cancel your registration on request.
        </p>
      ),
    },
    {
      title: '8. Contact',
      body: (
        <p>
          Questions about this notice? Email <a className="font-bold text-navy-800 underline" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or
          call {CONTACT.phones.join(' or ')}.
        </p>
      ),
    },
  ]

  return (
    <>
      <Seo
        title="Privacy & Terms"
        description="Privacy notice and terms for the MEDSAM Scientific Conference & Symposium website: data collection, storage, consent and your rights."
      />
      <section className="bg-navy-950 py-14 md:py-16">
        <div className="container-x flex items-start gap-4">
          <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-400 sm:flex">
            <ShieldCheck size={28} />
          </div>
          <div>
            <span className="eyebrow-light">Legal</span>
            <h1 className="h-display text-white">Privacy &amp; Terms</h1>
            <p className="mt-3 text-navy-200">Last updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </section>
      <section className="section bg-slate-50">
        <div className="container-x max-w-3xl space-y-8">
          {sections.map((s) => (
            <div key={s.title} className="card p-6 sm:p-7">
              <h2 className="text-base font-bold text-navy-950">{s.title}</h2>
              <div className="mt-3 text-sm leading-relaxed text-slate-700">{s.body}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
