import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function readUrl(): string | undefined {
  return (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || undefined
}

/** Publishable key (sb_publishable_...) ou anon JWT (eyJ...). */
function readKey(): string | undefined {
  const value =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  return value?.trim() || undefined
}

const url = readUrl()
const apiKey = readKey()

export const isSupabaseConfigured = Boolean(
  url &&
    apiKey &&
    url.startsWith('https://') &&
    !url.includes('SEU_PROJETO') &&
    !apiKey.includes('sua_') &&
    !apiKey.includes('eyJhbGciOi...')
)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase não configurado. No .env use:\n' +
        'VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
        'VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...'
    )
  }
  if (!client) {
    client = createClient(url!, apiKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}
