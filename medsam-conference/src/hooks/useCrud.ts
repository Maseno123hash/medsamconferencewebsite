import { useCallback, useEffect, useState } from 'react'
import { supabase, requireSupabase } from '../lib/supabase'

/**
 * Generic CRUD helpers for admin content tables.
 * `key` identifies the table; rows are plain objects.
 */
export function useCrud<T extends { id: string }>(table: string) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!supabase) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from(table)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    setRows((data as T[] | null) ?? [])
    if (e) setError(e.message)
    setLoading(false)
  }, [table])

  useEffect(() => {
    void load()
  }, [load])

  async function insert(row: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T | null> {
    const client = requireSupabase()
    const { data, error: e } = await client.from(table).insert(row as object).select().single()
    if (e) throw new Error(e.message)
    await load()
    return data as T
  }

  async function update(id: string, patch: Partial<T>): Promise<void> {
    const client = requireSupabase()
    const { error: e } = await client.from(table).update({ ...patch, updated_at: new Date().toISOString() } as object).eq('id', id)
    if (e) throw new Error(e.message)
    await load()
  }

  async function remove(id: string): Promise<void> {
    const client = requireSupabase()
    const { error: e } = await client.from(table).delete().eq('id', id)
    if (e) throw new Error(e.message)
    await load()
  }

  return { rows, loading, error, reload: load, insert, update, remove }
}

/** Upload a file to a Supabase bucket and return its storage path. */
export async function uploadToBucket(bucket: string, folder: string, file: File, contentType?: string): Promise<string> {
  const client = requireSupabase()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80)
  const path = `${folder}/${Date.now()}-${safeName}`
  const { error } = await client.storage
    .from(bucket)
    .upload(path, file, { contentType: contentType ?? file.type, upsert: false })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  return path
}

/** Public URL for files in public buckets. */
export function publicUrl(bucket: string, path: string): string {
  if (!supabase) return ''
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
