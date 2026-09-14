import { Link } from 'react-router-dom'
import { Facebook, Instagram, Youtube, Linkedin, Globe, X as XIcon, Megaphone, ArrowRight } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useConfig } from '../hooks/useAdminAuth'
import { cn } from '../lib/utils'

const PLATFORMS = [
  { key: 'facebook' as const, name: 'Facebook', Icon: Facebook, desc: 'Announcements, updates and event highlights' },
  { key: 'instagram' as const, name: 'Instagram', Icon: Instagram, desc: 'Photos, reels and behind-the-scenes moments' },
  { key: 'x' as const, name: 'X (Twitter)', Icon: XIcon, desc: 'Conference news and live updates' },
  { key: 'youtube' as const, name: 'YouTube', Icon: Youtube, desc: 'Keynotes, presentations and full session recordings' },
  { key: 'linkedin' as const, name: 'LinkedIn', Icon: Linkedin, desc: 'Professional updates and partnership news' },
  { key: 'website' as const, name: 'Website', Icon: Globe, desc: 'The official MEDSAM conference hub' },
]

/**
 * Official MEDSAM social channels. Links come from Admin → Settings
 * (stored in the database) — nothing is invented. Channels without a
 * configured URL are shown as "coming soon" rather than fake links.
 */
export default function Social() {
  const { config } = useConfig()
  const linkedCount = PLATFORMS.filter((p) => config.socials[p.key]).length

  return (
    <>
      <Seo
        title="Official Social Channels"
        description="Follow the MEDSAM Scientific Conference & Symposium on official social media channels — announcements, speaker updates, programme changes and post-event highlights."
      />

      <section className="bg-navy-950 py-16 md:py-20">
        <div className="container-x">
          <span className="eyebrow-light">Stay Connected</span>
          <h1 className="h-display text-white">Official Social Channels</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            Everything about the {`MEDSAM Scientific Conference & Symposium`} — speaker announcements, programme
            updates, registration reminders and post-event highlights — is shared on our official channels.
          </p>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x">
          <SectionHeading
            eyebrow="Where to Find Us"
            title={linkedCount > 0 ? 'Follow along' : 'Channels launching soon'}
            subtitle={
              linkedCount > 0
                ? 'Pick your favourite platform — all channels are official MEDSAM conference channels.'
                : 'The Secretariat is confirming the official conference accounts. Until then, the announcement bar on this website is the fastest place for updates.'
            }
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map(({ key, name, Icon, desc }) => {
              const url = config.socials[key]
              const Card = url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="card card-hover group flex h-full flex-col p-7 text-left">
                  <IconSize Icon={Icon} />
                  <h2 className="mt-4 text-lg font-bold text-navy-950 group-hover:text-gold-700">{name}</h2>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{desc}</p>
                  <span className="mt-4 flex items-center gap-1 text-sm font-bold text-navy-800 group-hover:text-gold-700">
                    Visit channel <ArrowRight size={14} />
                  </span>
                </a>
              ) : (
                <div className={cn('card flex h-full flex-col p-7 opacity-80')}>
                  <IconSize Icon={Icon} muted />
                  <h2 className="mt-4 text-lg font-bold text-navy-950">{name}</h2>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{desc}</p>
                  <span className="mt-4 inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Coming soon
                  </span>
                </div>
              )
              return <div key={key} className="h-full">{Card}</div>
            })}
          </div>

          <div className="mx-auto mt-14 flex max-w-3xl flex-col items-center gap-5 rounded-2xl bg-navy-950 p-8 text-center">
            <Megaphone size={26} className="text-gold-400" />
            <h2 className="text-xl font-black text-white">Never miss an update</h2>
            <p className="max-w-xl text-sm leading-relaxed text-navy-200">
              Programme changes, abstract decisions and urgent notices also appear in the announcement bar at the
              top of every page on this website — even if you're not on social media.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/registration" className="btn btn-gold btn-sm">Register Now</Link>
              <Link to="/contact" className="btn btn-outline-light btn-sm">Contact the Team</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function IconSize({ Icon, muted = false }: { Icon: typeof Facebook; muted?: boolean }) {
  return (
    <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', muted ? 'bg-slate-100 text-slate-400' : 'bg-navy-900 text-gold-400')}>
      <Icon size={26} />
    </div>
  )
}
