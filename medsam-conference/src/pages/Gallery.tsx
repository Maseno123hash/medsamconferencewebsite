import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Image as ImageIcon, Video, Camera } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { Spinner, ErrorState, EmptyState } from '../components/ui/Feedback'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { GalleryItem } from '../lib/types'
import { cn } from '../lib/utils'

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'pre_conference', label: 'Pre-Conference' },
  { id: 'main_conference', label: 'Main Conference' },
  { id: 'presentations', label: 'Scientific Presentations' },
  { id: 'innovation', label: 'Innovation' },
  { id: 'networking', label: 'Networking' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'other', label: 'Other' },
]

/**
 * Public gallery. Images are uploaded by the Secretariat (Admin → Gallery)
 * into the public `gallery` bucket; video items embed via URL.
 */
export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [cat, setCat] = useState('all')
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let mounted = true
    requireSupabase()
      .from('gallery_items')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .then(({ data, error: e }) => {
        if (!mounted) return
        if (e) setError(e.message)
        else setItems((data as GalleryItem[] | null) ?? [])
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => (cat === 'all' ? items : items.filter((i) => i.category === cat)), [items, cat])

  function imageUrl(it: GalleryItem): string {
    if (!it.file_path) return ''
    return requireSupabase().storage.from('gallery').getPublicUrl(it.file_path).data.publicUrl
  }

  return (
    <>
      <Seo
        title="Gallery"
        description="Photos and videos from the MEDSAM Scientific Conference & Symposium — pre-conference workshop, presentations, innovation showcase, networking and sponsors."
      />

      <section className="bg-navy-950 py-14 md:py-16">
        <div className="container-x">
          <span className="eyebrow-light">Moments</span>
          <h1 className="h-display text-white">Gallery</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            A growing collection of moments from the workshop and the main conference — shared by the Secretariat
            after the event.
          </p>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x">
          <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label="Gallery categories">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={cat === c.id}
                onClick={() => setCat(c.id)}
                className={cn(
                  'rounded-full px-4.5 py-2 text-sm font-bold transition-all',
                  cat === c.id ? 'bg-navy-900 text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:border-navy-400',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {loading ? (
            <Spinner label="Loading gallery…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Camera size={26} />}
              title="Gallery coming soon"
              message={
                items.length === 0
                  ? 'Photos and videos will be published here by the Secretariat as the event approaches and unfolds.'
                  : 'No items in this category yet — check another category.'
              }
              action={
                <Link to="/contact" className="btn btn-navy btn-sm">
                  Suggest photos or videos
                </Link>
              }
            />
          ) : (
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
              {filtered.map((it) => (
                <figure key={it.id} className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {it.media_type === 'image' ? (
                    <button onClick={() => setLightbox(it)} className="block w-full cursor-zoom-in">
                      <img src={imageUrl(it)} alt={it.title ?? 'Gallery image'} className="w-full transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    </button>
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-navy-950 p-6 text-center">
                      <Video size={34} className="text-gold-400" />
                      {it.video_url ? (
                        <a href={it.video_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white underline decoration-gold-400 underline-offset-4 hover:text-gold-300">
                          Watch this video
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-navy-200">Video coming soon</p>
                      )}
                    </div>
                  )}
                  {(it.title || it.caption) && (
                    <figcaption className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-600">
                      {it.media_type === 'image' ? <ImageIcon size={13} className="shrink-0 text-gold-600" /> : <Video size={13} className="shrink-0 text-gold-600" />}
                      <span className="truncate">{it.title ?? it.caption}</span>
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-navy-950/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title ?? 'Image preview'}
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-5 right-5 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20" aria-label="Close preview">
            ✕
          </button>
          <img src={imageUrl(lightbox)} alt={lightbox.title ?? 'Gallery image'} className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" />
          {(lightbox.title || lightbox.caption) && (
            <p className="absolute bottom-6 left-1/2 max-w-[90%] -translate-x-1/2 text-center text-sm font-semibold text-white">
              {lightbox.title}
              {lightbox.caption ? ` — ${lightbox.caption}` : ''}
            </p>
          )}
        </div>
      )}
    </>
  )
}
