import { useState } from 'react'
import { Header } from './components/Header'
import { WorkoutView } from './components/WorkoutView'
import { ProgressView } from './components/ProgressView'
import { EditWorkoutView } from './components/EditWorkoutView'
import { useAppData } from './hooks/useAppData'
import type { ViewMode } from './types'

export default function App() {
  const {
    data,
    updateProfile,
    setExercises,
    updateEntry,
    addSession,
    setActiveSession,
    deleteSession,
    resetAll,
  } = useAppData()
  const [view, setView] = useState<ViewMode>('treino')

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Header
        name={data.profileName}
        workoutTitle={data.workoutTitle}
        sessionCount={data.sessions.length}
        view={view}
        onViewChange={setView}
      />

      <main className="mt-8">
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
            onSaveExercises={setExercises}
            onReset={resetAll}
          />
        )}
      </main>

      <footer className="mt-10 pb-6 text-center text-xs text-slate-600">
        <span className="brand-gradient font-display font-semibold">Treino Rápido</span>
      </footer>
    </div>
  )
}
