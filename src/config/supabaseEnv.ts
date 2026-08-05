/**
 * Fonte única das chaves Supabase no client.
 * Ordem: virtual module (Vite) → import.meta.env → fallback público no código.
 */
import {
  SUPABASE_KEY as VIRTUAL_KEY,
  SUPABASE_URL as VIRTUAL_URL,
} from 'virtual:supabase-env'
import { PUBLIC_SUPABASE_KEY, PUBLIC_SUPABASE_URL } from './publicSupabase'

function clean(value: unknown): string {
  if (typeof value !== 'string') return ''
  let v = value.trim()
  if (v.charCodeAt(0) === 0xfeff) v = v.slice(1)
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim()
  }
  return v
}

function fromMeta(): { url: string; key: string } {
  try {
    return {
      url: clean(import.meta.env.VITE_SUPABASE_URL),
      key: clean(
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          import.meta.env.VITE_SUPABASE_ANON_KEY
      ),
    }
  } catch {
    return { url: '', key: '' }
  }
}

const meta = fromMeta()
const url =
  clean(VIRTUAL_URL) || meta.url || clean(PUBLIC_SUPABASE_URL)
const key =
  clean(VIRTUAL_KEY) || meta.key || clean(PUBLIC_SUPABASE_KEY)

export const SUPABASE_URL = url
export const SUPABASE_KEY = key
export const HAS_SUPABASE_ENV = Boolean(url && key)
