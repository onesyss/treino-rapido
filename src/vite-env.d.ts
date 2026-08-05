/// <reference types="vite/client" />

declare module 'virtual:supabase-env' {
  export const SUPABASE_URL: string
  export const SUPABASE_KEY: string
  export const HAS_SUPABASE_ENV: boolean
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
