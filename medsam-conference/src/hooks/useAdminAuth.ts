import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { AdminProfile, SiteConfig } from '../lib/types'
import { parseConfig } from '../lib/utils'
import { DEFAULT_CONFIG } from '../lib/types'

interface AdminAuth {
  loading: boolean
  /** True while the admin_profiles row for the signed-in user is being checked. */
  adminLoading: boolean
  session: { user: { id: string; email?: string } } | null
  admin: AdminProfile | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

/** Auth + admin-profile check for the /admin area. Delegates never sign in. */
export function useAdminAuth(): AdminAuth {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [adminLoading, setAdminLoading] = useState(false)
  const [session, setSession] = useState<AdminAuth['session']>(null)
  const [admin, setAdmin] = useState<AdminProfile | null>(null)

  useEffect(() => {
    if (!supabase) return
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const nextSession = data.session as AdminAuth['session']
      setAdmin(null)
      setAdminLoading(Boolean(nextSession))
      setSession(nextSession)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return
      const nextSession = s as AdminAuth['session']
      setAdmin(null)
      setAdminLoading(Boolean(nextSession))
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    if (!session) {
      setAdmin(null)
      setAdminLoading(false)
      return
    }
    setAdminLoading(true)
    supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return
        setAdmin((data as AdminProfile | null) ?? null)
        setAdminLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [session])

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    if (!supabase) return { error: 'Supabase is not configured.' }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Sign in failed. Please try again.' }
    setAdmin(null)
    setAdminLoading(true)
    setSession({ user: data.user })
    return { error: null }
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    await supabase.auth.signOut()
    setSession(null)
    setAdmin(null)
  }

  return { loading, adminLoading, session, admin, isAdmin: Boolean(admin), signIn, signOut }
}

/* ---------------- Public site config ---------------- */

export function useConfig(): { config: SiteConfig; loading: boolean } {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let mounted = true
    supabase
      .from('config')
      .select('value')
      .eq('key', 'site')
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return
        if (data?.value) setConfig(parseConfig(data.value))
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { config, loading }
}
