import { useState } from 'react'
import { Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react'
import { Header } from './components/Header'
import { WorkoutView } from './components/WorkoutView'
import { ProgressView } from './components/ProgressView'
import { EditWorkoutView } from './components/EditWorkoutView'
import { useAppData, getActiveWorkout } from './hooks/useAppData'
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
    updateEntry,
    addSession,
    setActiveSession,
    deleteSession,
    resetAll,
    retrySync,
  } = useAppData()
  const [view, setView] = useState<ViewMode>('treino')

  if (isLoading || !data) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-sm p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-400" />
          <p className="mt-4 font-display text-lg font-semibold text-white">
            Conectando ao Supabase…
          </p>
          <p className="mt-1 text-sm text-slate-400">Carregando treino do Marlon Miranda</p>
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
          : 'Online'

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2 text-xs">
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1',
              syncStatus === 'error'
                ? 'bg-red-500/15 text-red-300 ring-red-500/40'
                : 'bg-blue-500/10 text-blue-300 ring-blue-500/30',
            ].join(' ')}
          >
            {syncStatus === 'saving' || syncStatus === 'loading' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : syncStatus === 'error' ? (
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
            {syncError}
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
