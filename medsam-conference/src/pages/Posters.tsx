import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, Lightbulb, Award, FileDown, ExternalLink, ImageIcon } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Spinner, ErrorState, EmptyState } from '../components/ui/Feedback'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { PosterSubmission, InnovationSubmission } from '../lib/types'
import { cn } from '../lib/utils'

type Tab = 'posters' | 'innovations' | 'highlights'

interface DisplayItem {
  id: string
  title: string
  author: string
  institution: string | null
  track: string | null
  imagePath: string | null
  pdfPath: string | null
  description: string | null
  bucket: 'posters' | 'innovations'
}

/**
 * Public gallery of APPROVED posters, innovations and research highlights.
 * Nothing is shown here unless the Secretariat marks the submission
 * "approved" in the admin dashboard.
 */
export default function Posters() {
  const [tab, setTab] = useState<Tab>('posters')
  const [posters, setPosters] = useState<DisplayItem[]>([])
  const [innovations, setInnovations] = useState<DisplayItem[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabaseSafe()) {
      setLoading(false)
      return
    }
    let mounted = true
    const client = requireSupabase()
    Promise.all([
      client.from('poster_submissions').select('*').eq('status', 'approved').order('created_at', { ascending: false }),
      client.from('innovation_submissions').select('*').eq('status', 'approved').order('created_at', { ascending: false }),
    ]).then(([p, i]) => {
      if (!mounted) return
      if (p.error) throw new Error(p.error.message)
      if (i.error) throw new Error(i.error.message)
      setPosters(
        ((p.data as PosterSubmission[] | null) ?? []).map((x) => ({
          id: x.id,
          title: x.title,
          author: `${x.contact_name}${x.team_members ? ` · ${x.team_members}` : ''}`,
          institution: x.institution,
          track: x.track,
          imagePath: x.poster_image_path,
          pdfPath: x.poster_pdf_path,
          description: x.description,
          bucket: 'posters' as const,
        })),
      )
      setInnovations(
        ((i.data as InnovationSubmission[] | null) ?? []).map((x) => ({
          id: x.id,
          title: x.title,
          author: `${x.contact_name}${x.team_members ? ` · ${x.team_members}` : ''}`,
          institution: x.institution,
          track: x.track,
          imagePath: x.image_path,
          pdfPath: x.materials_path,
          description: x.description,
          bucket: 'innovations' as const,
        })),
      )
      setLoading(false)
    }).catch((e) => {
      if (mounted) {
        setError(e.message)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function imageUrl(bucket: 'posters' | 'innovations', path: string | null): string | null {
    if (!path || !isSupabaseConfigured) return null
    return requireSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  const items = tab === 'posters' ? posters : tab === 'innovations' ? innovations : [...posters, ...innovations]
  const bucket = tab === 'innovations' ? 'innovations' : 'posters'

  return (
    <>
      <Seo
        title="Posters & Innovations"
        description="Explore approved scientific posters, health innovations and research highlights from the MEDSAM Scientific Conference & Symposium 2027."
      />

      <section className="bg-navy-950 py-14 md:py-16">
        <div className="container-x">
          <span className="eyebrow-light">Showcase</span>
          <h1 className="h-display text-white">Posters &amp; Innovations</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            Approved posters, innovations and research highlights are published here. Have a project worth
            showcasing? Submit it below for Secretariat review.
          </p>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x">
          {/* Tabs */}
          <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label="Content categories">
            {[
              { id: 'posters' as Tab, label: 'Scientific Posters', Icon: LayoutGrid },
              { id: 'innovations' as Tab, label: 'Innovations', Icon: Lightbulb },
              { id: 'highlights' as Tab, label: 'Research Highlights', Icon: Award },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all',
                  tab === id ? 'bg-navy-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-navy-400',
                )}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {loading ? (
            <Spinner label="Loading showcase…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<ImageIcon size={26} />}
              title="Nothing published yet"
              message="Approved items will appear here once the Secretariat reviews submissions. Be among the first to be featured!"
              action={
                <Link to="/submit-poster" className="btn btn-navy btn-sm">
                  Submit Your Work
                </Link>
              }
            />
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((it) => {
                const img = tab === 'posters' || tab === 'highlights' ? imageUrl('posters', it.imagePath) : imageUrl('innovations', it.imagePath)
                return (
                  <article key={it.id} className="card card-hover group overflow-hidden">
                    <div className="relative h-60 overflow-hidden bg-gradient-to-br from-navy-900 to-navy-700">
                      {img ? (
                        <img src={img} alt={it.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Lightbulb size={54} className="text-gold-400/50" />
                        </div>
                      )}
                      {it.track && (
                        <span className="absolute top-3 left-3 rounded-full bg-navy-950/85 px-3 py-1 text-[10px] font-black tracking-wider text-gold-300 uppercase backdrop-blur-sm">
                          {it.track}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-base leading-snug font-bold text-navy-950">{it.title}</h3>
                      <p className="mt-1.5 text-sm font-semibold text-gold-700">{it.author}</p>
                      {it.institution && <p className="mt-0.5 text-xs text-slate-500">{it.institution}</p>}
                      {it.description && <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-slate-600">{it.description}</p>}
                      {it.pdfPath && (
                        <a
                          href={requireSupabase().storage.from(it.bucket).getPublicUrl(it.pdfPath).data.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-navy-800 transition-colors hover:text-gold-700"
                        >
                          <FileDown size={15} /> View full document
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* Submit CTA */}
          <div className="mt-14 rounded-2xl bg-navy-950 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-black text-white">Have a poster or innovation to showcase?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-navy-200">
              Submit your poster PDF, poster image or innovation pitch. The Secretariat reviews every submission —
              only approved items are published here.
            </p>
            <Link to="/submit-poster" className="btn btn-gold mt-6">
              <Lightbulb size={16} /> Submit Poster / Innovation
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function supabaseSafe(): boolean {
  return isSupabaseConfigured
}
