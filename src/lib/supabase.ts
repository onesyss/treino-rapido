import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  HAS_SUPABASE_ENV,
  SUPABASE_KEY,
  SUPABASE_URL,
} from '../config/supabaseEnv'

function isPlaceholder(url: string, key: string): boolean {
  if (!url || !key) return true
  if (!url.startsWith('http')) return true
  if (url.includes('SEU_PROJETO')) return true
  if (key.includes('sua_key') || key.includes('sua_anon')) return true
  if (key === 'sb_publishable_sua_key_aqui') return true
  return false
}

export function getSupabaseConfig(): { url: string; key: string } | null {
  if (!HAS_SUPABASE_ENV || isPlaceholder(SUPABASE_URL, SUPABASE_KEY)) return null
  return { url: SUPABASE_URL, key: SUPABASE_KEY }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() != null
}

export function describeSupabaseEnv(): {
  hasUrl: boolean
  hasKey: boolean
  urlHost: string | null
  keyPrefix: string | null
  configured: boolean
  source: string
} {
  const url = SUPABASE_URL
  const key = SUPABASE_KEY
  let urlHost: string | null = null
  try {
    if (url) urlHost = new URL(url).host
  } catch {
    urlHost = url ? url.slice(0, 40) : null
  }
  return {
    hasUrl: Boolean(url),
    hasKey: Boolean(key),
    urlHost,
    keyPrefix: key ? `${key.slice(0, 18)}…` : null,
    configured: getSupabaseConfig() != null,
    source: url && key ? 'configured' : 'empty',
  }
}

let client: SupabaseClient | null = null
let clientKey: string | null = null

export function getSupabase(): SupabaseClient {
  const cfg = getSupabaseConfig()
  if (!cfg) {
    const info = describeSupabaseEnv()
    throw new Error(
      'Supabase não configurado. '.concat(
        `URL=${info.hasUrl ? 'ok' : 'FALTANDO'}, KEY=${info.hasKey ? 'ok' : 'FALTANDO'}. `,
        'Coloque .env na pasta do projeto e rode npm run dev (http://localhost:5173).'
      )
    )
  }
  if (!client || clientKey !== cfg.key) {
    client = createClient(cfg.url, cfg.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
    clientKey = cfg.key
  }
  return client
}
