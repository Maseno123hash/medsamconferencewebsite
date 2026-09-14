import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  ImageIcon,
  Mic,
  CalendarDays,
  Images,
  Handshake,
  Building2,
  HeartHandshake,
  Megaphone,
  FolderDown,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Globe,
} from 'lucide-react'
import { MedsamLogo } from '../../components/ui/MedsamLogo'
import { Spinner } from '../../components/ui/Feedback'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { cn } from '../../lib/utils'

const NAV = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/registrations', label: 'Registrations', Icon: Users },
  { to: '/admin/abstracts', label: 'Abstracts', Icon: FileText },
  { to: '/admin/submissions', label: 'Posters & Innovations', Icon: ImageIcon },
  { to: '/admin/speakers', label: 'Speakers', Icon: Mic },
  { to: '/admin/programme', label: 'Programme', Icon: CalendarDays },
  { to: '/admin/gallery', label: 'Gallery', Icon: Images },
  { to: '/admin/sponsors', label: 'Sponsors & Exhibitors', Icon: Handshake },
  { to: '/admin/partners', label: 'Partners', Icon: Building2 },
  { to: '/admin/support', label: 'Support & Messages', Icon: HeartHandshake },
  { to: '/admin/announcements', label: 'Announcements', Icon: Megaphone },
  { to: '/admin/downloads', label: 'Downloads', Icon: FolderDown },
  { to: '/admin/settings', label: 'Settings', Icon: Settings },
]

/**
 * Guarded shell for the admin area. Requires a Supabase session AND an
 * `admin_profiles` row — delegates can never reach these routes.
 */
export default function AdminLayout() {
  const { loading, adminLoading, session, admin, isAdmin, signOut } = useAdminAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (loading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Spinner label="Checking authorisation…" />
      </div>
    )
  }
  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  async function onLogout() {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy-950 lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <MedsamLogo dark compact />
          <span className="ml-3 text-sm font-black tracking-wide text-white">ADMIN</span>
        </div>
        <nav className="thin-scroll flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] font-semibold transition-colors',
                  isActive ? 'bg-gold-500 text-navy-950' : 'text-navy-200 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/20 text-gold-300">
              <ShieldCheck size={17} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{admin?.full_name ?? 'Administrator'}</p>
              <p className="truncate text-[11px] text-navy-300">{session.user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onLogout}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-navy-100 transition-colors hover:bg-white/10"
            >
              <LogOut size={14} /> Logout
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-navy-100 transition-colors hover:bg-white/10"
              title="View public site"
            >
              <Globe size={14} /> Site
            </a>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-navy-950 px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg p-1.5 text-white hover:bg-white/10"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle admin menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="text-sm font-black text-white">MEDSAM Admin</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-navy-100"
        >
          <LogOut size={13} /> Logout
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/70" onClick={() => setMobileOpen(false)} />
          <nav className="absolute top-14 bottom-0 left-0 w-72 space-y-0.5 overflow-y-auto bg-navy-950 px-3 py-4" aria-label="Admin navigation (mobile)">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-semibold',
                    isActive ? 'bg-gold-500 text-navy-950' : 'text-navy-200 hover:bg-white/5',
                  )
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Content */}
      <main className="min-w-0 flex-1 px-4 pt-20 pb-10 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
