import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {
  PUBLIC_SUPABASE_KEY,
  PUBLIC_SUPABASE_URL,
} from './src/config/publicSupabase'

const root = path.dirname(fileURLToPath(import.meta.url))
const VIRTUAL_ID = 'virtual:supabase-env'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID

function supabaseEnvPlugin(url: string, key: string): Plugin {
  return {
    name: 'supabase-env-virtual',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return
      return `
export const SUPABASE_URL = ${JSON.stringify(url)};
export const SUPABASE_KEY = ${JSON.stringify(key)};
export const HAS_SUPABASE_ENV = ${JSON.stringify(Boolean(url && key))};
`
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '')
  const url = (
    env.VITE_SUPABASE_URL ||
    PUBLIC_SUPABASE_URL ||
    ''
  ).trim()
  const key = (
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    PUBLIC_SUPABASE_KEY ||
    ''
  ).trim()

  console.log('[vite] root =', root)
  console.log('[vite] mode =', mode)
  console.log('[vite] VITE_SUPABASE_URL =', url || '(VAZIO ✗)')
  console.log(
    '[vite] KEY =',
    key ? `${key.slice(0, 20)}… (${key.length} chars)` : '(VAZIO ✗)'
  )

  return {
    root,
    envDir: root,
    plugins: [react(), tailwindcss(), supabaseEnvPlugin(url, key)],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(key),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(key),
    },
  }
})
