import { useState } from 'react'
import { Header } from './components/Header'
import { WorkoutView } from './components/WorkoutView'
import { ProgressView } from './components/ProgressView'
import { EditWorkoutView } from './components/EditWorkoutView'
import { useAppData, getActiveWorkout } from './hooks/useAppData'
import type { ViewMode } from './types'

export default function App() {
  const {
    data,
    setActiveWorkout,
    updateProfile,
    updateActiveWorkoutMeta,
    setExercises,
    updateEntry,
    addSession,
    setActiveSession,
    deleteSession,
    resetAll,
  } = useAppData()
  const [view, setView] = useState<ViewMode>('treino')
  const activeWorkout = getActiveWorkout(data)
  const sessionCount = data.sessions.filter((s) => s.workoutId === activeWorkout.id).length

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
        </footer>
      </div>
    </div>
  )
}
