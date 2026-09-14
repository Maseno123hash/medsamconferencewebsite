import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gem, Handshake, ArrowRight, Building2 } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Spinner, ErrorState, EmptyState } from '../components/ui/Feedback'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import { SPONSOR_TIERS } from '../lib/constants'
import type { Sponsor } from '../lib/types'
import { cn } from '../lib/utils'

const TIER_STYLES: Record<string, { badge: string; ring: string; label: string }> = {
  diamond: { badge: 'bg-cyan-600 text-white', ring: 'border-cyan-300', label: 'Diamond' },
  platinum: { badge: 'bg-slate-500 text-white', ring: 'border-slate-300', label: 'Platinum' },
  gold: { badge: 'bg-gold-500 text-navy-950', ring: 'border-gold-400', label: 'Gold' },
  silver: { badge: 'bg-amber-700 text-white', ring: 'border-amber-300', label: 'Silver' },
  bronze: { badge: 'bg-orange-800 text-white', ring: 'border-orange-300', label: 'Bronze' },
}

/**
 * "Our Sponsors" — the public marketing page for sponsors who have
 * confirmed and provided their logos. Content is 100% admin-managed
 * (Admin → Sponsors & Exhibitors → Sponsor Wall): nothing is shown
 * until the Secretariat adds it.
 */
export default function OurSponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let mounted = true
    requireSupabase()
      .from('sponsors')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data, error: e }) => {
        if (!mounted) return
        if (e) setError(e.message)
        else setSponsors((data as Sponsor[] | null) ?? [])
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  function logoUrl(s: Sponsor): string | null {
    if (!s.logo_path || !isSupabaseConfigured) return null
    return requireSupabase().storage.from('sponsor_logos').getPublicUrl(s.logo_path).data.publicUrl
  }

  // Group by tier (known tiers first, anything else under Supporting Partners)
  type Group = { id: string; label: string; items: Sponsor[] }
  const groups: Group[] = SPONSOR_TIERS.map((t) => ({
    id: t.id,
    label: t.name,
    items: sponsors.filter((s) => s.pkg.toLowerCase() === t.name.toLowerCase()),
  })).filter((g) => g.items.length > 0)
  const other = sponsors.filter((s) => !SPONSOR_TIERS.some((t) => t.name.toLowerCase() === s.pkg.toLowerCase()))
  if (other.length > 0) groups.push({ id: 'other', label: 'Supporting Partners', items: other })

  return (
    <>
      <Seo
        title="Our Sponsors"
        description="Meet the organisations sponsoring the MEDSAM Scientific Conference & Symposium 2027 — and join them. Diamond, Platinum, Gold, Silver and Bronze sponsorship packages are available."
      />

      <section className="bg-navy-950 py-16 md:py-20">
        <div className="container-x">
          <span className="eyebrow-light">With Gratitude</span>
          <h1 className="h-display text-white">Our Sponsors</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            The {`MEDSAM Scientific Conference & Symposium`} is brought to life with the generous support of
            organisations that believe in student-led science. They are proudly showcased here.
          </p>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x">
          {loading ? (
            <Spinner label="Loading sponsors…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : sponsors.length === 0 ? (
            <EmptyState
              icon={<Building2 size={26} />}
              title="Sponsor logos are being finalised"
              message="Confirmed sponsors and their logos will be showcased here the moment the Secretariat publishes them. In the meantime, packages and the application form are open below."
              action={
                <Link to="/sponsors" className="btn btn-navy btn-sm">
                  Sponsorship Packages <ArrowRight size={14} />
                </Link>
              }
            />
          ) : (
            <div className="space-y-14">
              {groups.map((g) => (
                <div key={g.id}>
                  <div className="mb-6 flex items-center gap-3">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', TIER_STYLES[g.id]?.badge ?? 'bg-navy-900 text-white')}>
                      <Gem size={17} />
                    </span>
                    <h2 className="text-xl font-black text-navy-950 sm:text-2xl">{g.label} Sponsor{g.id === 'other' ? '' : 's'}</h2>
                    <div className="h-px flex-1 bg-slate-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                    {g.items.map((s) => {
                      const url = logoUrl(s)
                      return (
                        <div
                          key={s.id}
                          className={cn(
                            'card card-hover flex flex-col items-center justify-center gap-3 p-6',
                            TIER_STYLES[s.pkg.toLowerCase()]?.ring,
                          )}
                        >
                          <div className="flex h-28 w-full items-center justify-center">
                            {url ? (
                              <img src={url} alt={`${s.organization} logo`} className="max-h-28 w-auto max-w-full object-contain" loading="lazy" />
                            ) : (
                              <span className="px-4 text-center text-lg font-black text-navy-300">{s.organization}</span>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-navy-950">{s.organization}</p>
                            <span className={cn('mt-1.5 inline-block rounded-full px-3 py-0.5 text-[10px] font-black tracking-wider uppercase', TIER_STYLES[s.pkg.toLowerCase()]?.badge ?? 'bg-navy-100 text-navy-800')}>
                              {s.pkg}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 overflow-hidden rounded-2xl bg-navy-950">
            <div className="grid items-center gap-8 p-8 sm:p-10 md:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-2xl font-black text-white">Become one of them</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-200">
                  From <strong className="text-gold-300">KES 50,000 (Bronze)</strong> to{' '}
                  <strong className="text-gold-300">KES 500,000 (Diamond)</strong>, every tier puts your brand in
                  front of 300+ students, clinicians, researchers and decision-makers.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/sponsors" className="btn btn-gold">
                  <Handshake size={16} /> Sponsorship Packages
                </Link>
                <Link to="/contact" className="btn btn-outline-light btn-sm">
                  Talk to the Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
