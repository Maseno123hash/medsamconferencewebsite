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

/** Urgent announcements strip — driven by the announcements table (admin-managed). */
function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!supabase || dismissed) return
    let mounted = true
    const now = new Date().toISOString()
    supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!mounted) return
        const rows = (data ?? []) as Announcement[]
        const active = rows.find((a) => (!a.starts_at || a.starts_at <= now) && (!a.ends_at || a.ends_at >= now))
        if (active) setAnnouncement(active)
      })
    return () => {
      mounted = false
    }
  }, [supabase, dismissed])

  if (!isSupabaseConfigured || dismissed || !announcement) return null

  const urgent = announcement.type === 'urgent'

  return (
    <div className={`no-print border-b ${urgent ? 'border-red-300 bg-red-50' : 'border-gold-300 bg-gold-50'}`}>
      <div className="container-x flex items-center gap-3 py-2.5">
        <Megaphone size={17} className={`shrink-0 ${urgent ? 'text-red-600' : 'text-gold-700'}`} />
        <p className={`min-w-0 flex-1 truncate text-xs font-semibold sm:text-sm ${urgent ? 'text-red-900' : 'text-navy-950'}`}>
          <span className="mr-1.5 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold uppercase">
            {announcement.type}
          </span>
          {announcement.title}: {announcement.body}
        </p>
        {announcement.type === 'abstract' && (
          <a href="/abstracts" className="hidden items-center gap-1 text-xs font-bold text-gold-700 hover:underline sm:flex">
            Submit <ExternalLink size={12} />
          </a>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-1 text-slate-500 transition-colors hover:bg-black/5"
          aria-label="Dismiss announcement"
        >
          <X size={15} />
        </button>
      </div>
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
