import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react'
import { MedsamLogo } from '../ui/MedsamLogo'
import { SocialLinks } from './SocialLinks'
import { CONFERENCE, CONTACT, WORKSHOP, MAIN_CONFERENCE } from '../../lib/constants'

const QUICK_LINKS = [
  { to: '/about', label: 'About MEDSAM' },
  { to: '/conference', label: 'Main Conference' },
  { to: '/workshop', label: 'Pre-Conference Workshop' },
  { to: '/programme', label: 'Scientific Programme' },
  { to: '/speakers', label: 'Speakers' },
  { to: '/abstracts', label: 'Submit Abstract' },
  { to: '/posters', label: 'Posters & Innovations' },
  { to: '/submit-poster', label: 'Submit Poster / Innovation' },
  { to: '/our-sponsors', label: 'Our Sponsors' },
  { to: '/partners', label: 'Our Partners' },
  { to: '/social', label: 'Social Channels' },
]

const PARTICIPATE_LINKS = [
  { to: '/registration', label: 'Register' },
  { to: '/sponsors', label: 'Sponsors & Exhibitors' },
  { to: '/donations', label: 'Support / Donate' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy & Terms' },
]

export function Footer() {
  return (
    <footer className="no-print bg-navy-950 text-navy-100">
      <div className="h-1 w-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <MedsamLogo dark />
          <p className="mt-4 text-sm leading-relaxed text-navy-200">
            The {CONFERENCE.name} brings together students, faculty, researchers, clinicians and partners in
            health sciences — advancing medical science through research, innovation and collaboration.
          </p>
          <div className="mt-5">
            <SocialLinks size={17} />
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="mb-4 text-xs font-bold tracking-[0.2em] text-gold-400 uppercase">Explore</h3>
          <ul className="space-y-2.5 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-gold-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Participate */}
        <div>
          <h3 className="mb-4 text-xs font-bold tracking-[0.2em] text-gold-400 uppercase">Participate</h3>
          <ul className="space-y-2.5 text-sm">
            {PARTICIPATE_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-gold-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-gold-300">
              <ShieldCheck size={15} /> Secure & Verified
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-navy-200">
              Registration is subject to payment confirmation by the Secretariat.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-4 text-xs font-bold tracking-[0.2em] text-gold-400 uppercase">Contact</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <Mail size={16} className="mt-0.5 shrink-0 text-gold-400" />
              <a href={`mailto:${CONTACT.email}`} className="break-all transition-colors hover:text-gold-300">
                {CONTACT.email}
              </a>
            </li>
            {CONTACT.phones.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0 text-gold-400" />
                <a href={`tel:${p.replace(/\s/g, '')}`} className="transition-colors hover:text-gold-300">
                  {p}
                </a>
              </li>
            ))}
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gold-400" />
              <span>
                {CONTACT.institution}
                <br />
                {CONFERENCE.campus}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-center text-xs text-navy-300 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} {CONFERENCE.name} · {CONFERENCE.institution}
          </p>
          <p>
            {WORKSHOP.dateLabel} (Workshop) · {MAIN_CONFERENCE.dateLabel} (Main Conference)
          </p>
        </div>
      </div>
    </footer>
  )
}
