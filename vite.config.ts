import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Garante leitura do .env na pasta do projeto (cwd pode variar)
  const env = loadEnv(mode, root, 'VITE_')
  const url = env.VITE_SUPABASE_URL ?? ''
  const publishable =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? ''
  const anon = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

  if (mode === 'development') {
    console.log('[vite] root =', root)
    console.log('[vite] VITE_SUPABASE_URL =', url ? `${url.slice(0, 32)}…` : '(vazio)')
    console.log(
      '[vite] PUBLISHABLE_KEY =',
      publishable ? `${publishable.slice(0, 18)}…` : '(vazio)'
    )
  }

  return {
    root,
    envDir: root,
    plugins: [react(), tailwindcss()],
    // força replace no bundle (evita import.meta.env vazio em alguns casos)
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(publishable),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(anon),
    },
  }
})
