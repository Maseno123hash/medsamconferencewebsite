import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Lock, ShieldCheck, ArrowLeft, Mail, KeyRound, Wrench, CheckCircle2, XCircle } from 'lucide-react'
import { Seo } from '../../components/ui/Seo'
import { MedsamLogo } from '../../components/ui/MedsamLogo'
import { Field, Input } from '../../components/ui/FormControls'
import { Button } from '../../components/ui/Button'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { isSupabaseConfigured } from '../../lib/supabase'
import { isValidEmail } from '../../lib/utils'

/**
 * Admin login — Supabase Auth (email + password). Only users listed in the
 * `admin_profiles` table can enter the dashboard; anyone else is rejected
 * even if they have a Supabase account.
 */
export default function AdminLogin() {
  const { session, admin, adminLoading, loading, signIn, signOut } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [netTest, setNetTest] = useState<{ proxy: string; direct: string } | null>(null)
  const [testing, setTesting] = useState(false)

  if (!loading && session && admin) {
    return <Navigate to="/admin" replace />
  }

  // Signed in with a valid Supabase account, but the email has no admin_profiles row
  const notAuthorized = !loading && !!session && !adminLoading && !admin

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setBusy(true)
    setError(null)
    const { error: err } = await signIn(email.trim().toLowerCase(), password)
    if (err) {
      // Network-level failures (blocked by the preview panel's environment) get specific guidance
      const msg = String(err)
      const isNetwork = /fetch|network|failed to load|timeout|load failed|aborted/i.test(msg)
      setError(isNetwork ? `Network request failed ("${msg}"). This preview panel may be blocking the connection — see the steps below and try the site in a normal browser tab.` : err)
      setBusy(false)
      return
    }
  }

  async function runNetTest() {
    setTesting(true)
    setNetTest(null)
    const directUrl = import.meta.env.VITE_SUPABASE_URL
    async function tryFetch(url: string): Promise<string> {
      const t0 = Date.now()
      try {
        const res = await fetch(`${url}/rest/v1/config?select=key&limit=1`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '' },
        })
        return res.ok ? `OK (${res.status} · ${Date.now() - t0} ms)` : `HTTP ${res.status}`
      } catch (e2) {
        return `FAILED: ${e2 instanceof Error ? e2.message : 'network error'}`
      }
    }
    const [proxy, direct] = await Promise.all([
      tryFetch(window.location.origin + '/sbapi'),
      directUrl ? tryFetch(directUrl) : 'not configured',
    ])
    setNetTest({ proxy, direct })
    setTesting(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <Seo title="Admin Login" />
      <div className="container-x flex items-center py-6">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-navy-200 transition-colors hover:text-gold-300">
          <ArrowLeft size={16} /> Back to website
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <MedsamLogo dark />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-400">
                <ShieldCheck size={28} />
              </div>
              <h1 className="text-xl font-black text-white">Secretariat Login</h1>
              <p className="mt-1.5 text-sm text-navy-200">
                Restricted area. Only authorised MEDSAM administrators can access the dashboard.
              </p>
            </div>

            {notAuthorized && (
              <div className="mb-5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-4 text-xs leading-relaxed text-amber-200">
                <p className="text-sm font-bold text-amber-100">
                  You're signed in — but this email has no admin access
                </p>
                <p className="mt-2">
                  <strong className="text-amber-100">{session.user.email}</strong> is a valid Supabase account,
                  but it has no row in <code className="font-mono">admin_profiles</code>. The admin SQL must match
                  this email <em>exactly</em> (same spelling and case). Run it in the Supabase SQL Editor:
                </p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-navy-950/70 p-3 font-mono text-[11px] leading-relaxed text-gold-200 thin-scroll">
{`insert into public.admin_profiles (user_id, full_name, role)
select id, 'MEDSAM Secretariat', 'admin'
from auth.users
where lower(email) = '${(session.user.email ?? '').toLowerCase()}';`}
                </pre>
                <button onClick={() => void signOut()} className="btn btn-outline-light btn-sm mt-3">
                  Sign out &amp; retry
                </button>
              </div>
            )}

            {!isSupabaseConfigured && (
              <p className="mb-5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
                Supabase is not connected to this deployment yet. Add <code className="font-mono">VITE_SUPABASE_URL</code>{' '}
                and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> (see .env.example), run the database
                migration, and create an admin account as described in the README.
              </p>
            )}

            <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-navy-200 uppercase">
                  <Wrench size={13} className="text-gold-400" /> Connection check
                </p>
                <button type="button" onClick={runNetTest} disabled={testing} className="btn btn-outline-light btn-sm">
                  {testing ? 'Testing…' : 'Test connection'}
                </button>
              </div>
              {netTest && (
                <div className="mt-3 space-y-1.5 text-xs">
                  <p className="flex items-center gap-2 font-mono">
                    {netTest.proxy.startsWith('OK') ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                    <span className={netTest.proxy.startsWith('OK') ? 'text-emerald-300' : 'text-red-300'}>Via this preview (proxy): {netTest.proxy}</span>
                  </p>
                  <p className="flex items-center gap-2 font-mono">
                    {netTest.direct.startsWith('OK') ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                    <span className={netTest.direct.startsWith('OK') ? 'text-emerald-300' : 'text-red-300'}>Direct to Supabase: {netTest.direct}</span>
                  </p>
                  {netTest.proxy.startsWith('OK') && !netTest.direct.startsWith('OK') && (
                    <p className="pt-1 leading-relaxed text-gold-200">
                      The preview panel blocks direct external calls (this is why a sign-in wall appeared), but the
                      built-in proxy works — sign-in should succeed now. If it still fails, open the site in a normal
                      browser tab:
                    </p>
                  )}
                  {netTest.proxy.startsWith('OK') && netTest.direct.startsWith('OK') && (
                    <p className="pt-1 text-emerald-300">Both paths work — if login still fails, check the email/password (and that the admin SQL matches this email exactly).</p>
                  )}
                  {!netTest.proxy.startsWith('OK') && (
                    <p className="pt-1 leading-relaxed text-gold-200">
                      Even the preview-internal path failed — open the site in a normal browser tab and try there:
                    </p>
                  )}
                </div>
              )}
              <p className="mt-3 rounded-lg bg-navy-950/60 px-3 py-2.5 text-[11px] leading-relaxed text-navy-200">
                <strong className="text-gold-300">Still seeing a Microsoft sign-in page?</strong> Copy this address
                into a <em>normal browser tab</em> (not the embedded preview) and sign in there:
                <span className="mt-1 block truncate font-mono text-gold-200">{typeof window !== 'undefined' ? window.location.origin : ''}/admin</span>
              </p>
            </div>

            <form onSubmit={onSubmit} noValidate className="space-y-5">
              <Field label="Email">
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@medsam.org"
                    className="border-white/15 bg-white/5 pl-10 text-white placeholder:text-slate-500"
                    autoComplete="username"
                  />
                </div>
              </Field>
              <Field label="Password">
                <div className="relative">
                  <KeyRound size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-white/15 bg-white/5 pl-10 text-white placeholder:text-slate-500"
                    autoComplete="current-password"
                  />
                </div>
              </Field>
              {error && (
                <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
                  {error}
                </p>
              )}
              <Button type="submit" loading={busy} className="w-full">
                <Lock size={16} /> Sign In
              </Button>
            </form>
          </div>
          <p className="mt-6 text-center text-xs text-navy-300">
            No account? Ask the Secretariat lead to add your email to <code className="font-mono">admin_profiles</code> in Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}
