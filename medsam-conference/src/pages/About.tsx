import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Award,
  HeartHandshake,
  Users2,
  Building2,
  Microscope,
  CalendarDays,
  Link2,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { SectionHeading } from '../components/ui/SectionHeading'
import labImg from '../assets/images/conference/innovation-lab.jpg'

/**
 * MEDSAM's core objectives and focus areas (from the conference proposal).
 * If the proposal lists a shorter official set of objectives, edit this
 * array — cards update automatically.
 */
const FOCUS = [
  { Icon: GraduationCap, title: 'Academic Development', desc: 'Raising the academic standard and performance of health sciences students.' },
  { Icon: Award, title: 'Academic Excellence', desc: 'Recognising and rewarding outstanding scholarship across the association.' },
  { Icon: HeartHandshake, title: 'Community Service', desc: 'Active participation in community service and outreach programmes.' },
  { Icon: Users2, title: 'Welfare of Members', desc: 'Championing the welfare, voice and rights of our members.' },
  { Icon: Building2, title: 'Stakeholder Collaboration', desc: 'Working with institutions, professionals and partners for shared goals.' },
  { Icon: Microscope, title: 'Future Healthcare Professionals', desc: 'Developing the next generation of competent, ethical health workers.' },
]

const DEGREES = ['Medicine & Surgery', 'Medical Laboratory Sciences', 'Biochemistry', 'Nursing', 'Pharmacy']

export default function About() {
  return (
    <>
      <Seo
        title="About MEDSAM"
        description="MEDSAM — the Medical Students' Association of Maseno University — represents health sciences students and champions academic excellence, research and community service since 2012."
      />

      {/* Page hero */}
      <section className="bg-navy-950 py-16 md:py-20">
        <div className="container-x">
          <span className="eyebrow-light">About Us</span>
          <h1 className="h-display text-white">Who is MEDSAM?</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            <strong className="text-gold-300">MEDSAM</strong> — the <strong>Medical Students' Association of Maseno
            University</strong> — is the umbrella body representing students of the health sciences at Maseno
            University.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black text-navy-950 sm:text-3xl">One association. Five disciplines.</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              MEDSAM unites students taking the following programmes, giving them a single scientific and
              professional voice:
            </p>
            <ul className="mt-6 space-y-3">
              {DEGREES.map((d) => (
                <li key={d} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <BadgeCheck size={20} className="shrink-0 text-gold-600" />
                  <span className="font-bold text-navy-950">{d}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-navy-900 p-5 text-white">
                <Link2 size={20} className="text-gold-400" />
                <p className="mt-2.5 text-sm font-bold">Affiliate of SOMU</p>
                <p className="mt-1 text-xs leading-relaxed text-navy-200">
                  An affiliate association of the Students' Organisation of Maseno University.
                </p>
              </div>
              <div className="rounded-xl bg-navy-900 p-5 text-white">
                <BadgeCheck size={20} className="text-gold-400" />
                <p className="mt-2.5 text-sm font-bold">Full & Compliant Member of MSAKE</p>
                <p className="mt-1 text-xs leading-relaxed text-navy-200">
                  A full and compliant member of the Medical Students' Association of Kenya.
                </p>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-gold-300 bg-gold-50 px-5 py-4">
              <CalendarDays size={22} className="shrink-0 text-gold-700" />
              <p className="text-sm font-semibold text-navy-950">
                Established in 2012 — a decade of leadership in health sciences student life at Maseno University.
              </p>
            </div>
          </div>
          <div className="relative">
            <img
              src={labImg}
              alt="MEDSAM members collaborating in research"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[var(--shadow-soft)]"
              loading="lazy"
            />
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-navy-950 px-6 py-5 text-white shadow-xl sm:block">
              <p className="text-3xl font-black text-gold-400">2012</p>
              <p className="text-xs font-bold tracking-wider text-navy-200 uppercase">Championing excellence since</p>
            </div>
          </div>
        </div>
      </section>

      {/* Focus / objectives */}
      <section className="section bg-slate-50">
        <div className="container-x">
          <SectionHeading
            eyebrow="What We Champion"
            title="MEDSAM's core objectives & focus"
            subtitle="Since 2012, MEDSAM has championed the following across the health sciences community at Maseno University."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FOCUS.map(({ Icon, title, desc }) => (
              <div key={title} className="card card-hover p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700">
                  <Icon size={23} />
                </div>
                <h3 className="text-base font-bold text-navy-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-950 py-14">
        <div className="container-x flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-2xl font-black text-white">Help us build the platform</h2>
            <p className="mt-1.5 text-navy-200">Explore the conference, join the workshop, or back us as a sponsor.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/conference" className="btn btn-gold btn-sm">
              Explore the Conference <ArrowRight size={15} />
            </Link>
            <Link to="/sponsors" className="btn btn-outline-light btn-sm">
              Sponsorship Opportunities
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
