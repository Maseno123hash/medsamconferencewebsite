import { Link } from 'react-router-dom'
import {
  CalendarDays,
  MapPin,
  Users,
  FileText as FileTextIcon,
  Microscope,
  BookOpenCheck,
  Lightbulb,
  MessagesSquare,
  UserCheck,
  Handshake,
  Network,
  UserRoundCheck,
  Building2,
  Presentation,
  Mic,
  PanelTop,
  LayoutGrid,
  Store,
  UsersRound,
  Award,
  ArrowRight,
  Target,
  Send,
} from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { SectionHeading } from '../components/ui/SectionHeading'
import { TracksGrid } from '../components/public/TracksSection'
import { CountdownTimer } from '../components/ui/CountdownTimer'
import { AWARDS, CONFERENCE } from '../lib/constants'
import { useConfig } from '../hooks/useAdminAuth'
import { formatMoney, formatDate } from '../lib/utils'
import hallImg from '../assets/images/conference/main-hall.jpg'

const OBJECTIVE =
  'To establish a high-quality academic and innovation platform that promotes scientific exchange, student scholarship, research dissemination, professional networking and collaborative problem-solving in health and medical sciences.'

const SPECIFIC_OBJECTIVES = [
  'Provide students and researchers with a platform to present and discuss scientific work.',
  'Promote evidence-based dialogue on emerging health and medical challenges.',
  'Create opportunities for mentorship and interaction between students, lecturers, researchers and external stakeholders.',
  'Develop a sustainable conference model that can be improved and implemented in subsequent annual editions.',
  'Strengthen institutional, academic and professional networks within and beyond the university.',
  'Showcase health-related innovations and encourage problem-solving through interdisciplinary collaboration.',
]

const PILLARS = [
  { Icon: Microscope, title: 'Scientific Communication', desc: 'Present, defend and refine research in a supportive academic environment.' },
  { Icon: BookOpenCheck, title: 'Research Dissemination', desc: 'Share findings with peers, mentors and the wider community.' },
  { Icon: Lightbulb, title: 'Innovation', desc: 'Translate ideas into health solutions through showcases and pitches.' },
  { Icon: MessagesSquare, title: 'Evidence-Based Dialogue', desc: 'Ground discussions in data on emerging health and medical challenges.' },
  { Icon: UserCheck, title: 'Mentorship', desc: 'Structured guidance from faculty and senior professionals.' },
  { Icon: Handshake, title: 'Professional Networking', desc: 'Connections that outlast the conference itself.' },
  { Icon: Network, title: 'Interdisciplinary Collaboration', desc: 'Where clinical, laboratory and community sciences intersect.' },
  { Icon: UserRoundCheck, title: 'Student–Faculty Engagement', desc: 'Closing the gap between the classroom and real practice.' },
  { Icon: Building2, title: 'Institutional Partnerships', desc: 'Stronger ties between the university, industry and development partners.' },
]

const COMPONENT_ICONS = [
  { Icon: Presentation, title: 'Scientific Presentations' },
  { Icon: Mic, title: 'Keynote & Expert Sessions' },
  { Icon: PanelTop, title: 'Panel Discussions' },
  { Icon: Mic, title: 'Oral Presentations' },
  { Icon: LayoutGrid, title: 'Poster Presentations' },
  { Icon: Lightbulb, title: 'Innovation Showcase' },
  { Icon: Store, title: 'Exhibitions' },
  { Icon: UsersRound, title: 'Networking' },
  { Icon: UserCheck, title: 'Mentorship' },
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
export default function Conference() {
  const { config } = useConfig()

  return (
    <>
      <Seo
        title={config.conference.title}
        description={`${config.conference.title} — ${config.conference.theme || 'Conference theme to be announced'}. ${formatEventRange(config.conference.startAt, config.conference.endAt)}. ${config.conference.venue || 'Venue to be announced'}.`}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950">
        <img src={hallImg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-950/70 to-navy-950" />
        <div className="container-x relative py-20 md:py-24">
          <span className="eyebrow-light">The Main Event</span>
          <h1 className="h-display max-w-3xl text-white">{config.conference.title}</h1>
                    <p className="mt-4 max-w-2xl text-lg font-medium text-gold-300">
            {config.conference.theme || 'Conference theme to be announced'}
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy-100">
            An academic, scientific and innovation platform where {CONFERENCE.attendance.toLowerCase()} will
            exchange ideas, present research and build partnerships.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-white">
            <span className="flex items-center gap-2.5">
              <CalendarDays size={18} className="text-gold-400" /> {formatEventRange(config.conference.startAt, config.conference.endAt)}
            </span>
            <span className="flex items-center gap-2.5">
              <MapPin size={18} className="text-gold-400" /> {config.conference.venue || 'Venue to be announced'}
            </span>
            <span className="flex items-center gap-2.5">
              <Users size={18} className="text-gold-400" /> {CONFERENCE.attendance}
            </span>
          </div>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link to="/registration" className="btn btn-gold">
              <Send size={16} /> Register — from {formatMoney(Math.min(config.earlyBirdStudent, config.studentStandard), config.currency)}
            </Link>
            <Link to="/programme" className="btn btn-outline-light">
              View Programme <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="section bg-white">
        <div className="container-x">
          <SectionHeading eyebrow="Why We Convene" title="Conference objectives" />
          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border-l-4 border-gold-500 bg-navy-950 p-7 text-white sm:p-9">
            <Target size={22} className="mb-4 text-gold-400" />
            <p className="text-[11px] font-black tracking-[0.25em] text-gold-300 uppercase">Overall Objective</p>
            <p className="mt-2.5 text-lg leading-relaxed font-medium text-navy-50">“{OBJECTIVE}”</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {SPECIFIC_OBJECTIVES.map((obj, i) => (
              <div key={i} className="card card-hover flex items-start gap-4 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-sm font-black text-gold-400">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed font-medium text-slate-700">{obj}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="section bg-slate-50">
        <div className="container-x">
          <SectionHeading
            eyebrow="What the Conference Promotes"
            title="Nine pillars of the conference experience"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map(({ Icon, title, desc }) => (
              <div key={title} className="card card-hover p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
                  <Icon size={21} />
                </div>
                <h3 className="text-base font-bold text-navy-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Components */}
      <section className="section bg-white">
        <div className="container-x">
          <SectionHeading
            eyebrow="Key Components"
            title={`What happens during ${config.conference.title}`}
            subtitle="From the opening ceremony to the awards, every session is designed for scientific exchange and connection."
          />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {COMPONENT_ICONS.map(({ Icon, title }) => (
              <div key={title} className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all hover:border-gold-400 hover:shadow-[var(--shadow-card)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-800 transition-colors group-hover:bg-gold-500 group-hover:text-navy-950">
                  <Icon size={26} />
                </div>
                <span className="text-sm font-bold text-navy-950">{title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="section bg-slate-50">
        <div className="container-x">
          <SectionHeading
            eyebrow="Scientific Tracks"
            title="Six tracks. One community."
            subtitle="Abstracts are reviewed per track. Find yours and submit by the deadline announced by the Secretariat."
          />
          <div className="mt-12">
            <TracksGrid />
          </div>
          <div className="mt-10 text-center">
            <Link to="/abstracts" className="btn btn-navy">
              <FileTextIcon size={16} /> Submit an Abstract
            </Link>
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="section bg-navy-950">
        <div className="container-x">
          <SectionHeading light eyebrow="Recognition" title="Conference awards" subtitle="Outstanding contributions are recognised at the closing ceremony." />
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {AWARDS.map((a, i) => (
              <div key={a.name} className="rounded-2xl border border-gold-500/30 bg-white/5 p-7 text-center backdrop-blur-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
                  <Award size={26} />
                </div>
                <p className="text-[10px] font-black tracking-[0.3em] text-gold-300 uppercase">
                  {i === 0 ? 'Oral' : i === 1 ? 'Poster' : 'Innovation'}
                </p>
                <h3 className="mt-1.5 text-lg font-bold text-white">{a.name}</h3>
                <p className="mt-2 text-sm text-navy-200">{a.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countdown + fees */}
      <section className="section bg-white">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div>
            <CountdownTimer
            event={config.conference}
            title={config.conference.title}
            subtitle={config.conference.venue}
            pastMessage="The conference has concluded. Thank you to all our delegates!"
          />
          </div>
          <div className="card p-7">
            <h3 className="text-lg font-bold text-navy-950">Registration fees</h3>
            <p className="mt-1.5 text-sm text-slate-500">
              Main conference standard fees. Early-bird deadline:{' '}
              {config.earlyBirdDeadline ? formatDate(config.earlyBirdDeadline) : 'to be announced'}.
            </p>
            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-gold-50 px-5 py-4">
                <div>
                  <dt className="text-sm font-bold text-navy-950">Early Bird — Students</dt>
                  <dd className="text-xs text-slate-500">
                    Before {config.earlyBirdDeadline ? formatDate(config.earlyBirdDeadline) : 'the announced deadline'}
                  </dd>
                </div>
                <span className="text-xl font-black text-gold-700">{formatMoney(config.earlyBirdStudent, config.currency)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-5 py-4">
                <div>
                  <dt className="text-sm font-bold text-navy-950">Standard — Students</dt>
                  <dd className="text-xs text-slate-500">Undergraduate & postgraduate health sciences students</dd>
                </div>
                <span className="text-xl font-black text-navy-950">{formatMoney(config.studentStandard, config.currency)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-5 py-4">
                <div>
                  <dt className="text-sm font-bold text-navy-950">Faculty / Researchers / Lecturers / Non-Students / Others</dt>
                  <dd className="text-xs text-slate-500">All other participant categories</dd>
                </div>
                <span className="text-xl font-black text-navy-950">{formatMoney(config.nonStudentStandard, config.currency)}</span>
              </div>
            </dl>
            <Link to="/registration" className="btn btn-gold mt-7 w-full">
              <Send size={16} /> Register Now
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
