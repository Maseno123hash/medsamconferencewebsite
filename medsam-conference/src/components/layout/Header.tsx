import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, CalendarDays, ChevronDown, Send, Mail } from 'lucide-react'
import { MedsamLogo } from '../ui/MedsamLogo'
import { SocialLinks } from './SocialLinks'

import { cn } from '../../lib/utils'
import { useConfig } from '../../hooks/useAdminAuth'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About MEDSAM' },
  { to: '/conference', label: 'Conference' },
  { to: '/workshop', label: 'Workshop' },
  { to: '/programme', label: 'Programme' },
  { to: '/speakers', label: 'Speakers' },
  { to: '/posters', label: 'Posters' },
  { to: '/sponsors', label: 'Sponsors' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
]

const PARTICIPATE = [
  { to: '/abstracts', label: 'Submit an Abstract', desc: 'Share your scientific work' },
  { to: '/submit-poster', label: 'Submit Poster / Innovation', desc: 'Showcase your project' },
  { to: '/donations', label: 'Support / Donate', desc: 'Back the conference' },
  { to: '/our-sponsors', label: 'Our Sponsors', desc: 'Organisations backing the conference' },
  { to: '/partners', label: 'Our Partners', desc: 'Institutional & partner organisations' },
  { to: '/social', label: 'Follow Us — Socials', desc: 'Official MEDSAM channels' },
]
function formatEventDate(value: string): string {
  if (!value) return 'Date TBA'

  const normalized = value.length === 16 ? `${value}:00` : value
  const date = new Date(`${normalized}+03:00`)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Nairobi',
  }).format(date)
}

function formatEventRange(startAt: string, endAt: string): string {
  if (!startAt) return 'Date TBA'
  if (!endAt) return formatEventDate(startAt)

  return `${formatEventDate(startAt)} – ${formatEventDate(endAt)}`
}
export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [participateOpen, setParticipateOpen] = useState(false)
  const location = useLocation()
  const { config } = useConfig()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setParticipateOpen(false)
  }, [location.pathname])

  return (
    <header className="no-print sticky top-0 z-50">
      {/* Top info bar */}
      <div className="bg-navy-950 text-white">
        <div className="container-x flex h-9 items-center justify-between text-[11px] font-medium sm:text-xs">
          <a
  href={`mailto:${config.contactEmail}`}
  className="flex items-center gap-1.5 text-navy-100 transition-colors hover:text-gold-300"
>
  <Mail size={13} className="text-gold-400" />
  <span className="hidden sm:inline">{config.contactEmail}</span>
  <span className="sm:hidden">Email us</span>
</a>
          <div className="flex items-center gap-4">
           <span className="hidden items-center gap-1.5 text-navy-100 md:flex">
              <CalendarDays size={13} className="text-gold-400" />
              {formatEventRange(config.conference.startAt, config.conference.endAt)}
              {' · '}
              {config.conference.venue || 'Venue TBA'}
            </span> 
            <SocialLinks size={13} />
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className={cn('border-b border-white/10 transition-all duration-300', scrolled ? 'bg-navy-900/95 shadow-lg backdrop-blur-md' : 'bg-navy-900')}>
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Link to="/" aria-label="MEDSAM Scientific Conference — Home" className="shrink-0">
            <MedsamLogo dark />
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main navigation">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors',
                    isActive ? 'text-gold-300' : 'text-navy-100 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}

            {/* Participate dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setParticipateOpen(true)}
              onMouseLeave={() => setParticipateOpen(false)}
            >
              <button
                className={cn(
                  'flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors',
                  participateOpen ? 'text-gold-300' : 'text-navy-100 hover:bg-white/5 hover:text-white',
                )}
                aria-expanded={participateOpen}
                onClick={() => setParticipateOpen((o) => !o)}
              >
                Participate <ChevronDown size={14} className={cn('transition-transform', participateOpen && 'rotate-180')} />
              </button>
              {participateOpen && (
                <div className="absolute right-0 top-full w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  {PARTICIPATE.map((p) => (
                    <Link
                      key={p.to}
                      to={p.to}
                      className="block rounded-lg px-3.5 py-2.5 transition-colors hover:bg-navy-50"
                    >
                      <span className="block text-sm font-bold text-navy-950">{p.label}</span>
                      <span className="block text-xs text-slate-500">{p.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/registration" className="btn btn-gold btn-sm hidden sm:inline-flex">
              <Send size={15} /> Register Now
            </Link>
            <button
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 xl:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="max-h-[calc(100vh-6.5rem)] overflow-y-auto border-b border-white/10 bg-navy-950/98 backdrop-blur-md xl:hidden">
          <nav className="container-x flex flex-col gap-1 py-4" aria-label="Mobile navigation">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
                    isActive ? 'bg-gold-500/15 text-gold-300' : 'text-navy-100 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="my-2 border-t border-white/10" />
            <p className="px-4 pt-1 pb-2 text-[10px] font-bold tracking-[0.2em] text-navy-300 uppercase">Participate</p>
            {PARTICIPATE.map((p) => (
              <Link key={p.to} to={p.to} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-navy-100 hover:bg-white/5 hover:text-white">
                {p.label}
              </Link>
            ))}
            <Link to="/registration" className="btn btn-gold mt-3">
              <Send size={16} /> Register Now
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
