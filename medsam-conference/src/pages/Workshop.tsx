import { Link } from 'react-router-dom'
import {
  CalendarDays,
  MapPin,
  Clock,
  Target,
  FlaskConical,
  Presentation,
  Lightbulb,
  UsersRound,
  ClipboardList,
  Ticket,
  Mail,
  Phone,
  Send,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { SectionHeading } from '../components/ui/SectionHeading'
import { CountdownTimer } from '../components/ui/CountdownTimer'
import { WORKSHOP, CONTACT, CONFERENCE } from '../lib/constants'
import hallImg from '../assets/images/conference/main-hall.jpg'
import { useConfig } from '../hooks/useAdminAuth'
import { formatMoney } from '../lib/utils'

const OBJECTIVES = [
  'Prepare delegates for the main conference through structured academic and scientific sessions.',
  'Provide hands-on learning on research methods, scientific writing and presentation skills.',
  'Create early opportunities for scientific engagement, poster practice and innovation exposure.',
  'Foster interaction among students, faculty and external partners ahead of the main event.',
]

const ACTIVITIES = [
  { Icon: Presentation, title: 'Scientific Presentations', desc: 'Short, focused presentations and lightning talks by students and invited presenters.' },
  { Icon: FlaskConical, title: 'Hands-on Research Sessions', desc: 'Practical skills in study design, data handling and scientific writing.' },
  { Icon: Lightbulb, title: 'Innovation & Idea Exchange', desc: 'An early showcase of health innovations and student ideas.' },
  { Icon: UsersRound, title: 'Mentorship & Interaction', desc: 'Guided interactions with faculty, researchers and professional organisations.' },
]

const PARTICIPATION = [
  'Open to MEDSAM members, other Maseno University students and invited participants.',
  'Registration is a single form — no account required.',
  `Held from ${WORKSHOP.timeLabel.replace(' to ', ' – ')}.`,
  'Certificates and full programme details are shared after registration.',
]

export default function Workshop() {
  const { config } = useConfig()
  const workshopFee = config.workshopFee

  return (
    <>
      <Seo
        title="Pre-Conference Workshop"
        description="MEDSAM Pre-Conference Workshop — 7 November 2026, 8:00 AM to 5:00 PM, Amphitheatre (South Wing), Maseno University. A limelight into the main event: learning, presentations, innovation and interaction."
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950">
        <img src={hallImg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 to-navy-950" />
        <div className="container-x relative py-20 md:py-24">
          <span className="eyebrow-light">
            {CONFERENCE.themeTagline}
          </span>
          <h1 className="h-display max-w-3xl text-white">{WORKSHOP.name}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy-100">
            An academic and preparatory platform leading into the main conference — a day of learning, scientific
            engagement, presentations, innovation and interaction.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-white">
            <span className="flex items-center gap-2.5">
              <CalendarDays size={18} className="text-gold-400" /> {WORKSHOP.dateLabel}
            </span>
            <span className="flex items-center gap-2.5">
              <Clock size={18} className="text-gold-400" /> {WORKSHOP.timeLabel}
            </span>
            <span className="flex items-center gap-2.5">
              <MapPin size={18} className="text-gold-400" /> {WORKSHOP.venue}
            </span>
          </div>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link to="/registration" className="btn btn-gold">
              <Send size={16} /> Register for the Workshop
            </Link>
            <a href="#workshop-objectives" className="btn btn-outline-light">
              See Objectives <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section className="bg-navy-900 py-14">
        <div className="container-x max-w-3xl">
          <CountdownTimer
            targetIso={WORKSHOP.dateIso}
            title="Until the Pre-Conference Workshop"
            subtitle={`${WORKSHOP.dateLabel} · ${WORKSHOP.timeLabel}`}
            pastMessage="The workshop has begun or already took place — thank you to everyone who joined!"
          />
        </div>
      </section>

      {/* Overview + objectives */}
      <section id="workshop-objectives" className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Event Overview</span>
            <h2 className="h-display">A limelight into the main event</h2>
            <p className="mt-5 leading-relaxed text-slate-600">
              The MEDSAM Pre-Conference Workshop is designed as an academic and preparatory platform leading into
              the main conference. Delegates will experience a full day of structured scientific sessions,
              practical skills, early presentations and meaningful interaction with faculty and partners.
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              The workshop gives students and early-career researchers a low-pressure environment to present,
              receive feedback and build the confidence they will carry into the main conference in March 2027.
            </p>
            <div className="card mt-8 flex items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm font-bold text-navy-950">Workshop fee</p>
                <p className="mt-1 text-xs text-slate-500">
                  {workshopFee
                    ? `Payable through the official MEDSAM payment channels.`
                    : 'Fee to be confirmed by the Secretariat. Register now to reserve your place.'}
                </p>
              </div>
              <span className="text-2xl font-black text-navy-950">
                {workshopFee ? formatMoney(workshopFee, config.currency) : 'TBA'}
              </span>
            </div>
          </div>

          <div>
            <span className="eyebrow">Objectives</span>
            <h2 className="text-2xl font-black text-navy-950 sm:text-3xl">What the workshop aims to deliver</h2>
            <ul className="mt-7 space-y-4">
              {OBJECTIVES.map((o, i) => (
                <li key={i} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-xs font-black text-gold-400">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed font-medium text-slate-700">{o}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="section bg-slate-50">
        <div className="container-x">
          <SectionHeading eyebrow="Programme Highlights" title="Workshop activities" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {ACTIVITIES.map(({ Icon, title, desc }) => (
              <div key={title} className="card card-hover flex items-start gap-5 p-6">
                <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 p-3.5 text-gold-700">
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy-950">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Participation + contact */}
      <section className="section bg-white">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div className="card p-7">
            <div className="mb-5 flex items-center gap-3">
              <Ticket size={22} className="text-gold-600" />
              <h2 className="text-xl font-black text-navy-950">Participation</h2>
            </div>
            <ul className="space-y-3.5">
              {PARTICIPATION.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  {p}
                </li>
              ))}
            </ul>
            <Link to="/registration" className="btn btn-navy mt-7 w-full">
              <Send size={16} /> Register Now
            </Link>
          </div>
          <div className="card p-7">
            <div className="mb-5 flex items-center gap-3">
              <ClipboardList size={22} className="text-gold-600" />
              <h2 className="text-xl font-black text-navy-950">Questions about the workshop?</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              The organising team is happy to help with eligibility, participation and anything else you need to
              know before the workshop day.
            </p>
            <div className="mt-6 space-y-4">
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 rounded-xl border border-slate-200 px-5 py-4 transition-colors hover:border-gold-400">
                <Mail size={19} className="shrink-0 text-gold-600" />
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Email</p>
                  <p className="break-all text-sm font-semibold text-navy-950">{CONTACT.email}</p>
                </div>
              </a>
              {CONTACT.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="flex items-center gap-3 rounded-xl border border-slate-200 px-5 py-4 transition-colors hover:border-gold-400">
                  <Phone size={19} className="shrink-0 text-gold-600" />
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Phone</p>
                    <p className="text-sm font-semibold text-navy-950">{p}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
