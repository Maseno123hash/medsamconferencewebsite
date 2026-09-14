import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, BadgeCheck, Link2, ArrowRight, Handshake } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { Spinner, ErrorState, EmptyState } from '../components/ui/Feedback'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { Partner } from '../lib/types'

/**
 * Institutional affiliations — facts from the MEDSAM proposal (not invented):
 * MEDSAM is an affiliate of SOMU and a full & compliant member of MSAKE.
 */
const AFFILIATIONS = [
  {
    name: "Students' Organisation of Maseno University (SOMU)",
    detail: 'MEDSAM is an affiliate association of SOMU — working together for the welfare, voice and academic development of Maseno University students.',
    Icon: Building2,
  },
  {
    name: "Medical Students' Association of Kenya (MSAKE)",
    detail: 'MEDSAM is a full and compliant member of MSAKE, the national professional body for medical students in Kenya.',
    Icon: BadgeCheck,
  },
]

/**
 * "Our Partners" — institutional affiliations (proposal facts) plus
 * partner logos/names managed by the Secretariat (Admin → Partners).
 * If migration 0002 hasn't been run yet the page degrades gracefully.
 */
export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let mounted = true
    requireSupabase()
      .from('partners')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data, error: e }) => {
        if (!mounted) return
        if (e) setError(e.message)
        else setPartners((data as Partner[] | null) ?? [])
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  function logoUrl(p: Partner): string | null {
    if (!p.logo_path || !isSupabaseConfigured) return null
    return requireSupabase().storage.from('partner_logos').getPublicUrl(p.logo_path).data.publicUrl
  }

  return (
    <>
      <Seo
        title="Our Partners"
        description="Partners and institutional affiliations of the MEDSAM Scientific Conference & Symposium — including SOMU and MSAKE — plus the organisations working with us."
      />

      <section className="bg-navy-950 py-16 md:py-20">
        <div className="container-x">
          <span className="eyebrow-light">Together With</span>
          <h1 className="h-display text-white">Our Partners</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            Behind every edition of the conference are institutions and organisations that champion student
            science. We are proud to work alongside them.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          {/* Institutional affiliations (proposal facts) */}
          <div className="grid gap-6 md:grid-cols-2">
            {AFFILIATIONS.map(({ name, detail, Icon }) => (
              <div key={name} className="card card-hover flex items-start gap-5 p-7">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
                  <Icon size={26} />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-[0.25em] text-gold-600 uppercase">Institutional affiliation</span>
                  <h2 className="mt-1 text-lg font-bold text-navy-950">{name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Admin-managed partner logos */}
          <div className="mt-16">
            <div className="mb-8 flex items-center gap-3">
              <h2 className="text-2xl font-black text-navy-950">Partner organisations</h2>
              <div className="h-px flex-1 bg-slate-300" />
            </div>
            {loading ? (
              <Spinner label="Loading partners…" />
            ) : error ? (
              <EmptyState
                icon={<Building2 size={26} />}
                title="Partner logos coming soon"
                message="The Secretariat is finalising partner confirmations. Logos published from the admin dashboard will appear here."
                action={
                  <Link to="/contact" className="btn btn-navy btn-sm">
                    Propose a Partnership <ArrowRight size={14} />
                  </Link>
                }
              />
            ) : partners.length === 0 ? (
              <EmptyState
                icon={<Building2 size={26} />}
                title="More partners are on the way"
                message="Confirmed partner organisations and their logos will be showcased here shortly."
                action={
                  <Link to="/contact" className="btn btn-navy btn-sm">
                    Propose a Partnership <ArrowRight size={14} />
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {partners.map((p) => {
                  const url = logoUrl(p)
                  return (
                    <div key={p.id} className="card card-hover flex flex-col items-center justify-center gap-3 p-6">
                      <div className="flex h-28 w-full items-center justify-center">
                        {url ? (
                          <img src={url} alt={`${p.name} logo`} className="max-h-28 w-auto max-w-full object-contain" loading="lazy" />
                        ) : (
                          <span className="px-4 text-center text-lg font-black text-navy-300">{p.name}</span>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-navy-950">{p.name}</p>
                        {p.role && <p className="mt-1 text-[11px] font-bold tracking-wider text-gold-700 uppercase">{p.role}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border border-navy-100 bg-navy-50/60 p-8 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="text-xl font-black text-navy-950">Interested in partnering with us?</h2>
              <p className="mt-1.5 max-w-xl text-sm text-slate-600">
                Institutions, professional bodies, industry and development partners — reach out and let's build
                something the community is proud of.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to="/sponsors" className="btn btn-navy btn-sm">
                <Handshake size={14} /> Sponsorship &amp; Exhibition
              </Link>
              <Link to="/contact" className="btn btn-outline-navy btn-sm">
                <Link2 size={14} /> Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
