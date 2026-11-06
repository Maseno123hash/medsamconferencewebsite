import { Link } from 'react-router-dom'
import {
  Send,
  FileText,
  Handshake,
  Store,
  HeartHandshake,
  CalendarDays,
  MapPin,
  Users,
  ArrowRight,
  Microscope,
  Lightbulb,
  UserRound,
  Award,
  Building2,
  Briefcase,
  Network,
  FlaskConical,
  Presentation,
} from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { CountdownTimer } from '../components/ui/CountdownTimer'
import { SectionHeading } from '../components/ui/SectionHeading'
import { TrackCard } from '../components/public/TracksSection'
import { TRACKS, CONFERENCE } from '../lib/constants'
import heroImg from '../assets/images/conference/hero-conference.jpg'
import hallImg from '../assets/images/conference/main-hall.jpg'
import { useConfig } from '../hooks/useAdminAuth'
import { formatMoney } from '../lib/utils'

const DELEGATES = [
  { label: 'Students', Icon: UserRound },
  { label: 'Faculty', Icon: Presentation },
  { label: 'Researchers', Icon: Microscope },
  { label: 'Clinicians', Icon: FlaskConical },
  { label: 'Innovators', Icon: Lightbulb },
  { label: 'Professional Organisations', Icon: Building2 },
  { label: 'Industry Partners', Icon: Briefcase },
  { label: 'Development Partners', Icon: Handshake },
  { label: 'Healthcare Stakeholders', Icon: Network },
]

const COMPONENTS = [
  { title: 'Scientific Presentations', desc: 'Oral and poster presentations across six scientific tracks.' },
  { title: 'Keynote & Expert Sessions', desc: 'Insightful addresses from leading voices in medicine and research.' },
  { title: 'Panel Discussions', desc: 'Evidence-based dialogue on emerging health and medical challenges.' },
  { title: 'Innovation Showcase', desc: 'Health innovations and startup pitches solving real problems.' },
  { title: 'Exhibitions', desc: 'Sponsors, exhibitors and innovation displays on the South Wing floor.' },
  { title: 'Networking & Mentorship', desc: 'Structured student–faculty engagement and professional networking.' },
]
function formatEventDate(value: string): string {
  if (!value) return 'To be announced'

  const normalized = value.length === 16 ? `${value}:00` : value
  const timestamp = new Date(`${normalized}+03:00`)

  if (Number.isNaN(timestamp.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi',
  }).format(timestamp)
}

function formatEventRange(startAt: string, endAt: string): string {
  if (!startAt) return 'Date to be announced'

  if (!endAt) return formatEventDate(startAt)

  return `${formatEventDate(startAt)} – ${formatEventDate(endAt)}`
}
export default function Home() {
  const { config } = useConfig()

  return (
    <>
      <Seo
        title="Home"
        description={`${config.conference.title} — ${config.conference.theme || 'Advancing Medical Science through Research, Innovation and Collaboration'}. ${formatEventRange(config.conference.startAt, config.conference.endAt)}. ${config.conference.venue}. Pre-Conference Workshop: ${formatEventRange(config.workshop.startAt, config.workshop.endAt)}.`}
      />

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative overflow-hidden bg-navy-950">
        <img
          src={heroImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-navy-950/60" />

        <div className="container-x relative py-20 md:py-28 lg:py-32">
          <div className="max-w-3xl">
            <span className="eyebrow-light">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              Maseno University · {config.conference.startAt
  ? new Date(`${config.conference.startAt.length === 16 ? `${config.conference.startAt}:00` : config.conference.startAt}+03:00`).getFullYear()
  : 'Date to be announced'}
            </span>
            <h1 className="mt-5 text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Maseno University · {config.conference.startAt
  ? new Date(`${config.conference.startAt.length === 16 ? `${config.conference.startAt}:00` : config.conference.startAt}+03:00`).getFullYear()
  : 'Date to be announced'}
            </h1>
            <p className="mt-5 max-w-2xl border-l-4 border-gold-500 pl-4 text-lg leading-relaxed font-medium text-navy-100 sm:text-xl">
              “{config.conference.theme || 'Conference theme to be announced'}.”
            </p>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-white">
              <span className="flex items-center gap-2.5">
                <CalendarDays size={18} className="text-gold-400" />
                {formatEventRange(config.conference.startAt, config.conference.endAt)}
              </span>
              <span className="flex items-center gap-2.5">
                <MapPin size={18} className="text-gold-400" />
                {config.conference.venue || 'Venue to be announced'}
              </span>
              <span className="flex items-center gap-2.5">
                <Users size={18} className="text-gold-400" />
                {CONFERENCE.attendance}
              </span>
            </div>

            <div className="mt-10 flex flex-wrap gap-3.5">
              <Link to="/registration" className="btn btn-gold">
                <Send size={17} /> Register Now
              </Link>
              <Link to="/abstracts" className="btn btn-outline-light">
                <FileText size={17} /> Submit Abstract
              </Link>
              <Link to="/sponsors" className="btn btn-outline-light">
                <Handshake size={17} /> Become a Sponsor
              </Link>
              <Link to="/sponsors" className="btn btn-outline-light">
                <Store size={17} /> Exhibit With Us
              </Link>
              <Link to="/donations" className="btn btn-outline-light">
                <HeartHandshake size={17} /> Support / Donate
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── WHO WE BRING TOGETHER ───────────────────── */}
      <section className="section bg-white">
        <div className="container-x">
          <SectionHeading
            eyebrow="One Scientific Community"
            title="A platform for every stakeholder in health"
            subtitle="The conference brings together students, faculty, researchers, clinicians and partners to exchange ideas, present science and build the collaborations that will shape healthcare."
          />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {DELEGATES.map(({ label, Icon }) => (
              <div key={label} className="card card-hover flex items-center gap-3.5 px-5 py-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800">
                  <Icon size={21} />
                </div>
                <span className="text-sm font-bold text-navy-950">{label}</span>
              </div>
            ))}
            <div className="card flex items-center justify-center gap-2 border-dashed bg-navy-50/50 px-5 py-4 text-sm font-bold text-navy-700">
              And other healthcare stakeholders <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── COUNTDOWNS ───────────────────────── */}
      <section className="relative overflow-hidden bg-navy-900 py-16 md:py-20">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url(${hallImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-900/70 to-navy-950/90" aria-hidden="true" />
        <div className="container-x relative">
          <SectionHeading
            light
            eyebrow="Mark Your Calendar"
            title="Counting down to the event"
            subtitle="Two milestones, one conference. The Pre-Conference Workshop is your limelight into the main event."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <CountdownTimer
              event={config.workshop}
              title={config.workshop.title}
              subtitle={config.workshop.venue}
              pastMessage="The workshop has concluded. Thank you to everyone who participated!"
            />

            <CountdownTimer
               event={config.conference}
               title={config.conference.title}
               subtitle={config.conference.venue}
               pastMessage="The conference has concluded. Thank you to all our delegates!"
            />
          </div>
        </div>
      </section>

      {/* ───────────────────────── THEME & TRACKS ───────────────────────── */}
      <section className="section bg-slate-50">
        <div className="container-x">
          <SectionHeading
            eyebrow="The Theme"
           title={
            <>
              {config.conference.theme || 'Conference theme to be announced'}
            </>
          }
            subtitle="Six scientific tracks organise the conference — choose the one that matches your work when you submit an abstract."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((t) => (
              <TrackCard key={t.no} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── EVENT HIGHLIGHTS ───────────────────── */}
      <section className="section bg-white">
        <div className="container-x grid gap-8 lg:grid-cols-2">
          {/* Workshop card */}
          <div className="card card-hover overflow-hidden">
            <div className="relative h-52 overflow-hidden">
              <img src={hallImg} alt="Conference amphitheatre" className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 to-navy-950/20" />
              <span className="absolute top-4 left-4 rounded-full bg-gold-500 px-3.5 py-1.5 text-[11px] font-black tracking-wider text-navy-950 uppercase">
                Workshop
              </span>
              <h3 className="absolute bottom-4 left-5 text-2xl font-black text-white">{config.workshop.title}</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-navy-800">
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-gold-600" /> {formatEventRange(config.workshop.startAt, config.workshop.endAt)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={16} className="text-gold-600" />{config.workshop.venue || 'Venue to be announced'}                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                An academic and preparatory platform leading into the main conference — hands-on learning,
                scientific engagement, presentations, innovation and interaction.{config.workshop.theme || 'Further workshop details will be announced.'} .
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/workshop" className="btn btn-navy btn-sm">
                  Learn More <ArrowRight size={15} />
                </Link>
                <Link to="/registration" className="btn btn-outline-navy btn-sm">
                  Register
                </Link>
              </div>
            </div>
          </div>

          {/* Conference card */}
          <div className="card card-hover overflow-hidden">
            <div className="relative h-52 overflow-hidden">
              <img
                src={heroImg}
                alt="Main conference"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 to-navy-950/20" />
              <span className="absolute top-4 left-4 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-black tracking-wider text-navy-950 uppercase">
                Main Event
              </span>
              <h3 className="absolute bottom-4 left-5 text-2xl font-black text-white">
                {config.conference.title}
              </h3>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-navy-800">
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-gold-600" />{formatEventRange(config.conference.startAt, config.conference.endAt)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={16} className="text-gold-600" /> {config.conference.venue || 'Venue to be announced'}
                </span>
                <span className="flex items-center gap-2">
                  <Users size={16} className="text-gold-600" /> {CONFERENCE.attendance}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                A two-day academic, scientific and innovation platform: keynotes, oral and poster presentations,
                panels, an innovation showcase, exhibitions, awards and networking.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/conference" className="btn btn-navy btn-sm">
                  Explore the Conference <ArrowRight size={15} />
                </Link>
                <Link to="/registration" className="btn btn-outline-navy btn-sm">
                  Register — from {formatMoney(Math.min(config.earlyBirdStudent, config.studentStandard), config.currency)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Components strip */}
        <div className="container-x mt-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMPONENTS.map((c) => (
              <div key={c.title} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5">
                <Award size={20} className="mt-0.5 shrink-0 text-gold-600" />
                <div>
                  <h4 className="text-sm font-bold text-navy-950">{c.title}</h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── FINAL CTA ───────────────────────── */}
      <section className="relative overflow-hidden bg-navy-950 py-16 md:py-20">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" aria-hidden="true" />
        <div className="container-x flex flex-col items-center text-center">
          <span className="eyebrow-light">Join the MEDSAM Scientific Community</span>
          <h2 className="max-w-2xl text-3xl font-black text-white sm:text-4xl">
            Your place at Kenya's student-led medical science platform awaits
          </h2>
          <p className="mt-4 max-w-xl text-navy-200">
            Early-bird rates are available for students until the deadline set by the Secretariat. Register today —
            no account needed.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/registration" className="btn btn-gold">
              <Send size={17} /> Register Now
            </Link>
            <Link to="/abstracts" className="btn btn-outline-light">
              <FileText size={17} /> Submit Your Abstract
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
