import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Microscope, MapPin, Presentation, UserRound, Send } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Spinner, ErrorState, ComingSoon } from '../components/ui/Feedback'
import { supabase, isSupabaseConfigured, requireSupabase } from '../lib/supabase'
import type { Speaker } from '../lib/types'

/**
 * Speakers are managed by the Secretariat (Admin → Speakers) and stored in
 * the database — nothing on this page is invented. Until speakers are
 * published, a clear announcement is shown instead.
 */
export default function Speakers() {
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let mounted = true
    supabase
      .from('speakers')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error: e }) => {
        if (!mounted) return
        if (e) setError(e.message)
        else setSpeakers((data as Speaker[] | null) ?? [])
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  function photoFor(s: Speaker): string | null {
    if (!s.photo_path || !isSupabaseConfigured) return null
    return requireSupabase().storage.from('speaker_photos').getPublicUrl(s.photo_path).data.publicUrl
  }

  return (
    <>
      <Seo
        title="Speakers"
        description="Keynote and session speakers for the MEDSAM Scientific Conference & Symposium 2027. Speaker announcements follow on the official MEDSAM channels."
      />

      <section className="bg-navy-950 py-16 md:py-20">
        <div className="container-x">
          <span className="eyebrow-light">Who Will Speak</span>
          <h1 className="h-display text-white">Speakers &amp; Keynotes</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            Distinguished speakers from academia, research, clinical practice and industry will share the science,
            leadership and innovation shaping modern healthcare.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          {loading ? (
            <Spinner label="Loading speakers…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : speakers.length === 0 ? (
            <div className="mx-auto max-w-3xl">
              <ComingSoon label="Speakers are being announced" />
              <div className="card mt-6 flex flex-col items-center gap-5 p-8 text-center sm:flex-row sm:text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-700">
                  <Presentation size={26} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy-950">Speaker announcements coming soon</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    We are finalising our keynote and session speakers. Official announcements will appear on this
                    page and the website announcement bar — register now so you don't miss them.
                  </p>
                </div>
              </div>
              <div className="mt-8 text-center">
                <Link to="/registration" className="btn btn-navy">
                  <Send size={16} /> Register Now
                </Link>
              </div>
            </div>
          ) : (
            <>
              <SectionHeading eyebrow="Confirmed Speakers" title="Meet your speakers" />
              <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {speakers.map((s) => {
                  const img = photoFor(s)
                  return (
                    <div key={s.id} className="card card-hover overflow-hidden">
                      <div className="relative h-72 w-full overflow-hidden bg-navy-100">
                        {img ? (
                          <img src={img} alt={s.name} className="h-full w-full object-cover object-top" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-navy-900 to-navy-700">
                            <UserRound size={56} className="text-gold-400/70" />
                            <span className="px-6 text-center text-[11px] font-bold tracking-[0.2em] text-navy-200 uppercase">
                              Photograph coming soon
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-navy-950">{s.name}</h3>
                        {s.title && <p className="mt-0.5 text-sm font-semibold text-gold-700">{s.title}</p>}
                        {s.institution && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <MapPin size={12} className="shrink-0" /> {s.institution}
                          </p>
                        )}
                        {s.topic && (
                          <p className="mt-3 flex items-start gap-2 rounded-lg bg-navy-50 px-3.5 py-2.5 text-xs font-semibold text-navy-900">
                            <Microscope size={14} className="mt-0.5 shrink-0 text-gold-600" />
                            {s.topic}
                          </p>
                        )}
                        {s.biography && <p className="mt-3 text-sm leading-relaxed text-slate-600">{s.biography}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
