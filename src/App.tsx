import { useState } from 'react'
import { Cloud, CloudOff, Copy, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { Header } from './components/Header'
import { WorkoutView } from './components/WorkoutView'
import { ProgressView } from './components/ProgressView'
import { EditWorkoutView } from './components/EditWorkoutView'
import { useAppData, getActiveWorkout } from './hooks/useAppData'
import { describeSupabaseEnv, isSupabaseConfigured } from './lib/supabase'
import { isSharedTableMissingError, SHARED_SETUP_SQL } from './lib/sharedSetupSql'
import type { ViewMode } from './types'

export default function App() {
  const {
    data,
    isLoading,
    syncStatus,
    syncError,
    setActiveWorkout,
    updateProfile,
    updateActiveWorkoutMeta,
    setExercises,
    addCardio,
    removeCardio,
    updateEntry,
    addSession,
    setActiveSession,
    deleteSession,
    resetAll,
    retrySync,
  } = useAppData()
  const [view, setView] = useState<ViewMode>('treino')
  const [copiedSql, setCopiedSql] = useState(false)
  const envInfo = describeSupabaseEnv()
  const needsSharedSql = isSharedTableMissingError(syncError)

  async function copySetupSql() {
    try {
      await navigator.clipboard.writeText(SHARED_SETUP_SQL)
      setCopiedSql(true)
      setTimeout(() => setCopiedSql(false), 2500)
    } catch {
      // fallback for older browsers
      window.prompt('Copie o SQL (Ctrl+C):', SHARED_SETUP_SQL)
    }
  }

  if (isLoading || !data) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-sm p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-400" />
          <p className="mt-4 font-display text-lg font-semibold text-white">
            Conectando ao Supabase…
          </p>
          <p className="mt-1 text-sm text-slate-400">Carregando treino do Marlon Miranda</p>
          <p className="mt-3 font-mono text-[11px] text-slate-500">
            env: url={envInfo.hasUrl ? 'ok' : 'no'} key={envInfo.hasKey ? 'ok' : 'no'}
          </p>
        </div>
      </div>
    )
  }

  const activeWorkout = getActiveWorkout(data)
  const sessionCount = data.sessions.filter((s) => s.workoutId === activeWorkout.id).length

  const statusLabel =
    syncStatus === 'saving'
      ? 'Salvando…'
      : syncStatus === 'saved'
        ? 'Salvo na nuvem'
        : syncStatus === 'error'
          ? 'Erro ao sync'
          : !isSupabaseConfigured()
            ? 'Sem .env'
            : 'Online'

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2 text-xs">
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1',
              syncStatus === 'error' || !isSupabaseConfigured()
                ? 'bg-red-500/15 text-red-300 ring-red-500/40'
                : 'bg-blue-500/10 text-blue-300 ring-blue-500/30',
            ].join(' ')}
          >
            {syncStatus === 'saving' || syncStatus === 'loading' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : syncStatus === 'error' || !isSupabaseConfigured() ? (
              <CloudOff className="h-3.5 w-3.5" />
            ) : (
              <Cloud className="h-3.5 w-3.5" />
            )}
            {statusLabel}
          </span>
          {syncStatus === 'error' && (
            <button type="button" onClick={() => void retrySync()} className="btn-ghost text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar de novo
            </button>
          )}
        </div>

        {syncError && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <p>{syncError}</p>
            {needsSharedSql && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-300/90">
                  Passo único (Supabase)
                </p>
                <ol className="list-decimal space-y-1 pl-4 text-xs text-red-100/90">
                  <li>
                    Abra o SQL Editor:{' '}
                    <a
                      className="underline"
                      href="https://supabase.com/dashboard/project/qjkdtipsshfjqttbpwpj/sql/new"
                      target="_blank"
                      rel="noreferrer"
                    >
                      projeto Supabase
                    </a>
                  </li>
                  <li>
                    Clique em <strong>Copiar SQL</strong> e cole no editor (cria a tabela{' '}
                    <code className="text-red-50">treino_sync</code> com colunas de perfil, treinos e
                    sessões)
                  </li>
                  <li>
                    Clique em <strong>Run</strong> → espere Success → volte e <strong>Tentar de novo</strong>
                  </li>
                  <li>
                    Preencha no tablet → badge “Salvo na nuvem” → abra no celular (mesmos dados)
                  </li>
                </ol>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void copySetupSql()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-100 ring-1 ring-red-400/40"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedSql ? 'SQL copiado!' : 'Copiar SQL'}
                  </button>
                  <a
                    href="https://supabase.com/dashboard/project/qjkdtipsshfjqttbpwpj/sql/new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-panel-2 px-3 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-border"
                  >
                    Abrir SQL Editor
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/40 p-2 font-mono text-[10px] text-red-100/80">
                  {SHARED_SETUP_SQL}
                </pre>
              </div>
            )}
            {!needsSharedSql && (
              <p className="mt-2 font-mono text-xs text-red-300/80">
                diagnóstico: hasUrl={String(envInfo.hasUrl)} hasKey={String(envInfo.hasKey)} host=
                {envInfo.urlHost ?? '—'} key={envInfo.keyPrefix ?? '—'}
              </p>
            )}
          </div>
        )}

        <Header
          name={data.profileName}
          workouts={data.workouts}
          activeWorkoutId={data.activeWorkoutId}
          sessionCount={sessionCount}
          view={view}
          onViewChange={setView}
          onWorkoutChange={setActiveWorkout}
        />

        <main className="mt-6">
          {view === 'treino' && (
            <WorkoutView
              data={data}
              onUpdateEntry={updateEntry}
              onAddSession={addSession}
              onSetActiveSession={setActiveSession}
              onDeleteSession={deleteSession}
              onAddCardio={addCardio}
              onRemoveCardio={removeCardio}
              onEditClick={() => setView('editar')}
            />
          )}
          {view === 'evolucao' && <ProgressView data={data} />}
          {view === 'editar' && (
            <EditWorkoutView
              data={data}
              onSaveProfile={updateProfile}
              onSaveMeta={updateActiveWorkoutMeta}
              onSaveExercises={setExercises}
              onReset={resetAll}
            />
          )}
        </main>

        <footer className="app-footer mt-10 pb-6 text-center text-xs">
          <span>Treino de Marlon Miranda</span>
          <span className="mt-1 block text-slate-600">Dados no Supabase</span>
        </footer>
      </div>
    </div>
  )
}
