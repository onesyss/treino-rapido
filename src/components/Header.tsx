import { BarChart3, CalendarDays, Dumbbell, Pencil, Sparkles } from 'lucide-react'
import type { ViewMode } from '../types'

interface HeaderProps {
  name: string
  workoutTitle: string
  sessionCount: number
  view: ViewMode
  onViewChange: (v: ViewMode) => void
}

export function Header({ name, workoutTitle, sessionCount, view, onViewChange }: HeaderProps) {
  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="card overflow-hidden px-5 py-5 sm:px-6">
      <div className="card-accent card-accent-sky" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="icon-blob h-13 w-13 h-12 w-12 bg-gradient-to-br from-sky-500/30 via-emerald-500/20 to-orange-500/25 text-sky-300 ring-1 ring-sky-400/30 shadow-[0_0_24px_rgba(91,159,212,0.15)]">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="brand-gradient">Treino Rápido</span>
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/20">
                <Sparkles className="h-3 w-3" />
                Online
              </span>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
              <span className="font-medium text-slate-200">{name}</span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1 text-orange-300/90">
                <Dumbbell className="h-3.5 w-3.5 text-orange-400" />
                {workoutTitle}
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-sky-400" />
                {today}
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1 text-teal-400/90">
                <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
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
            activeTone="sky"
            idleIcon="text-sky-400"
          >
            Meu treino
          </NavBtn>
          <NavBtn
            active={view === 'editar'}
            onClick={() => onViewChange('editar')}
            icon={<Pencil className="h-4 w-4" />}
            activeTone="amber"
            idleIcon="text-amber-400"
          >
            Montar / editar
          </NavBtn>
          <NavBtn
            active={view === 'evolucao'}
            onClick={() => onViewChange('evolucao')}
            icon={<BarChart3 className="h-4 w-4" />}
            activeTone="emerald"
            idleIcon="text-emerald-400"
          >
            Evolução
          </NavBtn>
        </div>
      </div>
    </header>
  )
}

function NavBtn({
  children,
  active,
  onClick,
  icon,
  activeTone,
  idleIcon,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  activeTone: 'sky' | 'amber' | 'emerald'
  idleIcon: string
}) {
  const activeCls = {
    sky: 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20',
    amber: 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20',
    emerald: 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20',
  }[activeTone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
        active ? activeCls : `bg-panel-2 text-slate-200 ring-1 ring-border hover:bg-slate-700/50`,
      ].join(' ')}
    >
      <span className={active ? 'opacity-90' : idleIcon}>{icon}</span>
      {children}
    </button>
  )
}
