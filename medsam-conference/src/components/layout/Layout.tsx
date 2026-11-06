import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Megaphone, X, ExternalLink } from 'lucide-react'
import { Header } from './Header'
import { Footer } from './Footer'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { Announcement } from '../../lib/types'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

/** Rotating announcement ticker — displays all admin-managed active announcements. */
function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  // Fetch all active announcements within their scheduled date ranges.
  useEffect(() => {
    if (!supabase || dismissed) return

    let mounted = true
    const now = new Date().toISOString()

    supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!mounted) return

        const rows = (data ?? []) as Announcement[]

        const active = rows.filter(
          (a) =>
            (!a.starts_at || a.starts_at <= now) &&
            (!a.ends_at || a.ends_at >= now),
        )

        setAnnouncements(active)
        setCurrentIndex(0)
      })

    return () => {
      mounted = false
    }
  }, [dismissed])

  // Rotate to the next announcement every 6 seconds.
  useEffect(() => {
    if (announcements.length <= 1 || dismissed) return

    const interval = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % announcements.length)
    }, 6000)

    return () => window.clearInterval(interval)
  }, [announcements.length, dismissed])

  if (
    !isSupabaseConfigured ||
    dismissed ||
    announcements.length === 0
  ) {
    return null
  }

  const announcement = announcements[currentIndex]
  const urgent = announcement.type === 'urgent'

  return (
    <div
      className={`no-print flex items-center border-b ${
        urgent
          ? 'border-red-300 bg-red-50'
          : 'border-gold-300 bg-gold-50'
      }`}
    >
      <Megaphone
        size={17}
        className={`ml-4 shrink-0 ${
          urgent ? 'text-red-600' : 'text-gold-700'
        }`}
      />

      <div className="min-w-0 flex-1 overflow-hidden py-2.5">
        <div
          className={`announcement-track text-xs font-semibold sm:text-sm ${
            urgent ? 'text-red-900' : 'text-navy-950'
          }`}
        >
          <span className="mr-2 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold uppercase">
            {announcement.type}
          </span>

          <strong>{announcement.title}:</strong>
          <span className="ml-2">{announcement.body}</span>

          {announcement.type === 'abstract' && (
            <a
              href="/abstracts"
              className="ml-4 font-bold text-gold-700 underline"
            >
              Submit your abstract
            </a>
          )}
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="mx-3 shrink-0 rounded p-1 text-slate-500 transition-colors hover:bg-black/5"
        aria-label="Dismiss announcement"
      >
        <X size={15} />
      </button>
    </div>
  )
}

/** Shared shell for all public pages: top announcement strip + header + footer. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
