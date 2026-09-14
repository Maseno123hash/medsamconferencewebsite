import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { PublicLayout } from './components/layout/Layout'
import { Spinner } from './components/ui/Feedback'

/* Public pages (eager — core UX) */
import Home from './pages/Home'
import About from './pages/About'
import Conference from './pages/Conference'
import Workshop from './pages/Workshop'
import Programme from './pages/Programme'
import Speakers from './pages/Speakers'
import Abstracts from './pages/Abstracts'
import Registration from './pages/Registration'
import Confirmation from './pages/Confirmation'
import Posters from './pages/Posters'
import SubmitPoster from './pages/SubmitPoster'
import Sponsors from './pages/Sponsors'
import OurSponsors from './pages/OurSponsors'
import Partners from './pages/Partners'
import Social from './pages/Social'
import Donations from './pages/Donations'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'

/* Admin pages (code-split — keep the public bundle lean) */
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminRegistrations = lazy(() => import('./pages/admin/Registrations'))
const AdminAbstracts = lazy(() => import('./pages/admin/Abstracts'))
const AdminSubmissions = lazy(() => import('./pages/admin/Submissions'))
const AdminSpeakers = lazy(() => import('./pages/admin/SpeakersAdmin'))
const AdminProgramme = lazy(() => import('./pages/admin/ProgrammeAdmin'))
const AdminGallery = lazy(() => import('./pages/admin/GalleryAdmin'))
const AdminSponsors = lazy(() => import('./pages/admin/SponsorsAdmin'))
const AdminPartners = lazy(() => import('./pages/admin/PartnersAdmin'))
const AdminSupport = lazy(() => import('./pages/admin/SupportAdmin'))
const AdminAnnouncements = lazy(() => import('./pages/admin/AnnouncementsAdmin'))
const AdminDownloads = lazy(() => import('./pages/admin/Downloads'))
const AdminSettings = lazy(() => import('./pages/admin/SettingsAdmin'))

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <Spinner label="Loading admin area…" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/conference" element={<Conference />} />
        <Route path="/workshop" element={<Workshop />} />
        <Route path="/programme" element={<Programme />} />
        <Route path="/speakers" element={<Speakers />} />
        <Route path="/abstracts" element={<Abstracts />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/confirmation/:ref" element={<Confirmation />} />
        <Route path="/posters" element={<Posters />} />
        <Route path="/submit-poster" element={<SubmitPoster />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="/our-sponsors" element={<OurSponsors />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/social" element={<Social />} />
        <Route path="/donations" element={<Donations />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin — separate shell, code-split */}
      <Route path="/admin/login" element={<Suspense fallback={<AdminFallback />}><AdminLogin /></Suspense>} />
      <Route
        path="/admin"
        element={
          <Suspense fallback={<AdminFallback />}>
            <AdminLayout />
          </Suspense>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="registrations" element={<AdminRegistrations />} />
        <Route path="abstracts" element={<AdminAbstracts />} />
        <Route path="submissions" element={<AdminSubmissions />} />
        <Route path="speakers" element={<AdminSpeakers />} />
        <Route path="programme" element={<AdminProgramme />} />
        <Route path="gallery" element={<AdminGallery />} />
        <Route path="sponsors" element={<AdminSponsors />} />
        <Route path="partners" element={<AdminPartners />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="downloads" element={<AdminDownloads />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
