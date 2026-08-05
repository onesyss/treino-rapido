/**
 * Fonte única das chaves Supabase no client.
 * Preferência: virtual module injetado pelo Vite (vite.config.ts).
 * Fallback: import.meta.env (VITE_*).
 */
import {
  HAS_SUPABASE_ENV as VIRTUAL_HAS,
  SUPABASE_KEY as VIRTUAL_KEY,
  SUPABASE_URL as VIRTUAL_URL,
} from 'virtual:supabase-env'

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
  return {
    url: clean(import.meta.env.VITE_SUPABASE_URL),
    key: clean(
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env.VITE_SUPABASE_ANON_KEY
    ),
  }
}

const meta = fromMeta()
const url = clean(VIRTUAL_URL) || meta.url
const key = clean(VIRTUAL_KEY) || meta.key

export const SUPABASE_URL = url
export const SUPABASE_KEY = key
export const HAS_SUPABASE_ENV = Boolean(
  (VIRTUAL_HAS && url && key) || (url && key)
)
