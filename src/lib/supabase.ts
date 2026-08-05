import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function cleanEnv(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  let v = value.trim()
  // remove BOM / aspas acidentais
  if (v.charCodeAt(0) === 0xfeff) v = v.slice(1)
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim()
  }
  return v || undefined
}

function readUrl(): string | undefined {
  return cleanEnv(import.meta.env.VITE_SUPABASE_URL)
}

/** Publishable (sb_publishable_...) ou anon JWT (eyJ...). */
function readKey(): string | undefined {
  return (
    cleanEnv(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) ||
    cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)
  )
}

function isPlaceholder(url: string | undefined, key: string | undefined): boolean {
  if (!url || !key) return true
  if (!url.startsWith('http')) return true
  if (url.includes('SEU_PROJETO')) return true
  if (key.includes('sua_key') || key.includes('sua_anon')) return true
  if (key === 'sb_publishable_sua_key_aqui') return true
  if (key.startsWith('eyJhbGciOi...') || key === 'eyJhbGciOi...') return true
  return false
}

/** Avalia no momento do uso (não cacheia no load do módulo). */
export function getSupabaseConfig(): { url: string; key: string } | null {
  const url = readUrl()
  const key = readKey()
  if (isPlaceholder(url, key) || !url || !key) return null
  return { url, key }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() != null
}

/** Diagnóstico seguro (sem vazar a key completa). */
export function describeSupabaseEnv(): {
  hasUrl: boolean
  hasKey: boolean
  urlHost: string | null
  keyPrefix: string | null
  configured: boolean
} {
  const url = readUrl()
  const key = readKey()
  let urlHost: string | null = null
  try {
    if (url) urlHost = new URL(url).host
  } catch {
    urlHost = url?.slice(0, 40) ?? null
  }
  return {
    hasUrl: Boolean(url),
    hasKey: Boolean(key),
    urlHost,
    keyPrefix: key ? `${key.slice(0, 18)}…` : null,
    configured: getSupabaseConfig() != null,
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
        'Crie .env na raiz do projeto com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY e reinicie o npm run dev.'
      )
    )
  }
  // recria se a key mudou (hot reload / .env novo)
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
