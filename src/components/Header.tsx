import { BarChart3, CalendarDays, Dumbbell, Pencil } from 'lucide-react'
import type { ViewMode, WorkoutProgram } from '../types'

interface HeaderProps {
  name: string
  workouts: WorkoutProgram[]
  activeWorkoutId: string
  sessionCount: number
  view: ViewMode
  onViewChange: (v: ViewMode) => void
  onWorkoutChange: (id: string) => void
}

export function Header({
  name,
  workouts,
  activeWorkoutId,
  sessionCount,
  view,
  onViewChange,
  onWorkoutChange,
}: HeaderProps) {
  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const active = workouts.find((w) => w.id === activeWorkoutId) ?? workouts[0]

  return (
    <header className="space-y-4">
      <div className="card px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="icon-blob h-12 w-12">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display brand-title text-2xl font-bold tracking-tight sm:text-3xl">
                Treino de Marlon Miranda
              </h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
                <span className="font-medium text-blue-200">{name}</span>
                <span className="text-red-500/50">·</span>
                <span className="text-slate-300">{active?.title}</span>
                <span className="text-red-500/50">·</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-400" />
                  {today}
                </span>
                <span className="text-red-500/50">·</span>
                <span className="text-red-300/90">
                  {sessionCount} sessão{sessionCount !== 1 ? 'ões' : ''}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <NavBtn
              active={view === 'treino'}
              onClick={() => onViewChange('treino')}
              icon={<Dumbbell className="h-4 w-4" />}
            >
              Meu treino
            </NavBtn>
            <NavBtn
              active={view === 'editar'}
              onClick={() => onViewChange('editar')}
              icon={<Pencil className="h-4 w-4" />}
            >
              Montar / editar
            </NavBtn>
            <NavBtn
              active={view === 'evolucao'}
              onClick={() => onViewChange('evolucao')}
              icon={<BarChart3 className="h-4 w-4" />}
            >
              Evolução
            </NavBtn>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {workouts.map((w) => {
          const on = w.id === activeWorkoutId
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onWorkoutChange(w.id)}
              className={[
                'rounded-lg px-3.5 py-2 text-sm font-semibold transition',
                on ? 'pill-active' : 'pill-idle',
              ].join(' ')}
            >
              {w.shortLabel}
            </button>
          )
        })}
      </div>
    </header>
  )
}

function NavBtn({
  children,
  active,
  onClick,
  icon,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={['nav-btn', active ? 'nav-btn-active' : 'nav-btn-idle'].join(' ')}
    >
      <span className={active ? 'text-white' : 'text-blue-400'}>{icon}</span>
      {children}
    </button>
  )
}
