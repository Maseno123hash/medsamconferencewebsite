import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Clock, Info, FileText, Send } from 'lucide-react'
import { Seo } from '../components/ui/Seo'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Spinner, ErrorState, EmptyState } from '../components/ui/Feedback'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { ProgrammeItem } from '../lib/types'
import { formatMoney } from '../lib/utils'
import { useConfig } from '../hooks/useAdminAuth'

const CATEGORY_STYLES: Record<string, string> = {
  opening: 'bg-gold-500/15 text-gold-700',
  keynote: 'bg-navy-900 text-gold-300',
  session: 'bg-navy-100 text-navy-800',
  oral: 'bg-violet-100 text-violet-800',
  poster: 'bg-cyan-100 text-cyan-800',
  innovation: 'bg-emerald-100 text-emerald-800',
  panel: 'bg-amber-100 text-amber-800',
  break: 'bg-slate-100 text-slate-600',
  awards: 'bg-gold-100 text-gold-800',
  closing: 'bg-navy-100 text-navy-800',
  other: 'bg-slate-100 text-slate-600',
}

/**
 * Data-driven programme. Items live in the `programme_items` table and are
 * managed by the Secretariat in Admin → Programme. Until the final
 * programme is published, placeholder (tentative) items are shown.
 */
function formatEventDate(value: string): string {
  if (!value) return 'To be announced'

  const normalized = value.length === 16 ? `${value}:00` : value
  const date = new Date(`${normalized}+03:00`)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeZone: 'Africa/Nairobi',
  }).format(date)
}

function formatEventRange(startAt: string, endAt: string): string {
  if (!startAt) return 'Date to be announced'
  if (!endAt) return formatEventDate(startAt)

  return `${formatEventDate(startAt)} – ${formatEventDate(endAt)}`
}
export default function Programme() {
  const { config } = useConfig()
  const [items, setItems] = useState<ProgrammeItem[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let mounted = true
    supabase
      .from('programme_items')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data, error: e }) => {
        if (!mounted) return
        if (e) setError(e.message)
        else setItems((data as ProgrammeItem[] | null) ?? [])
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const days = items.reduce<Record<string, ProgrammeItem[]>>((acc, it) => {
    ;(acc[it.day] = acc[it.day] ?? []).push(it)
    return acc
  }, {})

  return (
    <>
      <Seo
        title={`Programme | ${config.conference.title}`}
        description={`${config.conference.title}. ${config.conference.theme || 'Conference theme to be announced'}. ${formatEventRange(config.conference.startAt, config.conference.endAt)}. ${config.conference.venue || 'Venue to be announced'}.`}
      />

      <section className="bg-navy-950 py-16 md:py-20">
        <div className="container-x">
         <span className="eyebrow-light">Scientific Programme</span>
          <h1 className="h-display text-white">
            {config.conference.title}
          </h1>
          <p className="mt-4 text-lg font-semibold text-gold-300">
            {config.conference.theme || 'Conference theme to be announced'}
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-navy-100">
            The final programme is updated by the Secretariat as the event approaches. Everything below is
            data-driven — watch this space and the announcement bar for official programme updates.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-white">
           <span className="flex items-center gap-2.5">
              <CalendarDays size={18} className="text-gold-400" />
              {config.workshop.title}: {formatEventRange(config.workshop.startAt, config.workshop.endAt)}
            </span>

            <span className="flex items-center gap-2.5">
              <CalendarDays size={18} className="text-gold-400" />
              {config.conference.title}: {formatEventRange(config.conference.startAt, config.conference.endAt)}
            </span> 
            <p className="mt-4 flex items-center gap-2 text-sm text-navy-200">
              <MapPin size={16} />
              {config.conference.venue || 'Venue to be announced'}
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x max-w-5xl">
          <div className="mb-10 flex items-start gap-3.5 rounded-2xl border border-navy-200 bg-navy-50 px-5 py-4">
            <Info size={20} className="mt-0.5 shrink-0 text-navy-700" />
            <p className="text-sm leading-relaxed text-navy-900">
              <strong>Note:</strong> The programme below reflects the currently published schedule. Items marked{' '}
              <em>tentative</em> may change — the final programme will be announced to registered delegates.
            </p>
          </div>

          {loading ? (
            <Spinner label="Loading programme…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={26} />}
              title="The programme is being finalised"
              message="The Secretariat is preparing the full scientific programme. Official updates will appear here and in the announcement bar."
              action={
                <Link to="/contact" className="btn btn-navy btn-sm">
                  Contact the Organising Team
                </Link>
              }
            />
          ) : (
            <div className="space-y-12">
              {Object.entries(days).map(([day, dayItems]) => (
                <div key={day}>
                  <div className="mb-6 flex items-center gap-4">
                    <h2 className="text-xl font-black text-navy-950 sm:text-2xl">{day}</h2>
                    <div className="h-px flex-1 bg-slate-300" />
                  </div>
                  <ol className="space-y-4">
                    {dayItems.map((it) => (
                      <li key={it.id} className="card card-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
                        <div className="flex w-28 shrink-0 flex-col items-start gap-1 sm:w-32">
                          <span className="flex items-center gap-1.5 text-sm font-black text-navy-950">
                            <Clock size={14} className="text-gold-600" />
                            {it.time ?? 'TBC'}
                          </span>
                          {it.location && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin size={12} /> {it.location}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-base font-bold text-navy-950">{it.title}</h3>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${CATEGORY_STYLES[it.category] ?? CATEGORY_STYLES.other}`}>
                              {it.category}
                            </span>
                          </div>
                          {it.description && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{it.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}

          <div className="mt-14 rounded-2xl bg-navy-950 p-8 text-center">
          <h2 className="text-2xl font-black text-white">
            Ready for {config.conference.title}?
          </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-navy-200">
              Join us for {formatEventRange(config.conference.startAt, config.conference.endAt)}.
Early-bird student rate: {formatMoney(config.earlyBirdStudent, config.currency)}.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/registration" className="btn btn-gold">
                <Send size={16} /> Register Now
              </Link>
              <Link to="/abstracts" className="btn btn-outline-light">
                <FileText size={16} /> Submit Abstract
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
