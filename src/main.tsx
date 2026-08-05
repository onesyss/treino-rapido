import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ensureAuthUserId, loadAppDataFromSupabase } from './lib/appDataStore'
import { getSupabase, isSupabaseConfigured } from './lib/supabase'
import './index.css'

async function logSupabaseConnection() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const hasKey = Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

  console.log('%c[Supabase] checando conexão…', 'color:#60a5fa;font-weight:bold')
  console.log('[Supabase] VITE_SUPABASE_URL =', url || '(vazio)')
  console.log('[Supabase] VITE_SUPABASE_PUBLISHABLE_KEY =', hasKey ? 'definida ✓' : 'faltando ✗')
  console.log('[Supabase] isSupabaseConfigured =', isSupabaseConfigured)

  if (!isSupabaseConfigured) {
    console.error('[Supabase] NÃO configurado — preencha o .env e reinicie o npm run dev')
    return
  }

  try {
    const supabase = getSupabase()
    console.log('[Supabase] client criado ✓')

    const userId = await ensureAuthUserId()
    console.log('[Supabase] autenticado ✓ user_id =', userId)

    const { data, error } = await supabase
      .from('app_state')
      .select('user_id, updated_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[Supabase] erro ao ler app_state:', error.message, error)
      console.error(
        '[Supabase] dica: rode supabase/schema.sql e ative Authentication → Providers → Anonymous'
      )
      return
    }

    if (data) {
      console.log(
        '%c[Supabase] CONECTADO ✓ linha app_state encontrada',
        'color:#4ade80;font-weight:bold',
        data
      )
    } else {
      console.log(
        '%c[Supabase] CONECTADO ✓ (ainda sem linha — o app vai criar no 1º load)',
        'color:#4ade80;font-weight:bold'
      )
    }

    // confere load completo sem travar a UI se falhar
    await loadAppDataFromSupabase()
    console.log('%c[Supabase] loadAppDataFromSupabase OK ✓', 'color:#4ade80;font-weight:bold')
  } catch (e) {
    console.error('[Supabase] FALHA na conexão ✗', e)
  }
}

void logSupabaseConnection()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
