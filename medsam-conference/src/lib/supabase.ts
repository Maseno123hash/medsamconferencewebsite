import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True once both Supabase environment variables are present. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Fetch wrapper that rewrites absolute Supabase URLs to the same-origin
 * /sbapi proxy during local Vite development. Production deployments use
 * the Supabase URL directly because Vercel does not provide this dev proxy.
 */
function proxiedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const doFetch = (value: RequestInfo | URL, options?: RequestInit) => fetch(value, options)
  if (import.meta.env.DEV && url) {
    try {
      let raw: string
      if (typeof input === 'string') raw = input
      else if (input instanceof URL) raw = input.toString()
      else raw = input.url
      if (raw.startsWith(url)) {
        return doFetch(raw.replace(url, '/sbapi'), init)
      }
    } catch {
      /* fall through to a plain fetch */
    }
  }
  return doFetch(input, init)
}

/** Shared client. `null` until env vars are set — every data call must handle this. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      global: { fetch: proxiedFetch },
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

/** Throws a friendly, user-safe error when the app runs without Supabase config. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'The conference database is not connected yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example) and redeploy.',
    )
  }
  return supabase
}
