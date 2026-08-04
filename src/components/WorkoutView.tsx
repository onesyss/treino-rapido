import {
  CalendarDays,
  CheckCircle2,
  Filter,
  ListOrdered,
  Plus,
  TrendingDown,
  TrendingUp,
  Trash2,
  ArrowUpRight,
  Flame,
  Wind,
  Layers,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AppData, Exercise, MuscleGroup } from '../types'
import { getActiveSession, getPreviousWeight } from '../hooks/useAppData'
import { percentIncrease } from '../utils/stats'
import { GROUP_STYLE, GroupIcon } from '../utils/icons'
import { HowToModal } from './HowToModal'
import { WorkoutEvolutionCharts } from './WorkoutEvolutionCharts'

interface WorkoutViewProps {
  data: AppData
  onUpdateEntry: (
    sessionId: string,
    exerciseId: string,
    patch: { performedReps?: number | null; currentWeight?: number | null }
  ) => void
  onAddSession: () => void
  onSetActiveSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onEditClick: () => void
}

const ALL = 'TODOS' as const
type Filter = typeof ALL | MuscleGroup

export function WorkoutView({
  data,
  onUpdateEntry,
  onAddSession,
  onSetActiveSession,
  onDeleteSession,
  onEditClick,
}: WorkoutViewProps) {
  const session = getActiveSession(data)
  const [filter, setFilter] = useState<Filter>(ALL)
  const [howTo, setHowTo] = useState<Exercise | null>(null)

  const groups = useMemo(() => {
    const map = new Map<MuscleGroup, number>()
    for (const ex of data.exercises) {
      map.set(ex.muscleGroup, (map.get(ex.muscleGroup) ?? 0) + 1)
    }
    return map
  }, [data.exercises])

  const rows = useMemo(() => {
    return data.exercises.filter((ex) => filter === ALL || ex.muscleGroup === filter)
  }, [data.exercises, filter])

  if (!session) {
    return (
      <p className="text-sm text-slate-400">Nenhuma sessão. Crie um treino em “Montar / editar”.</p>
    )
  }

  return (
    <div className="space-y-5">
      <section className="card overflow-hidden">
        <div className="card-accent card-accent-orange" />
        <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="icon-blob h-9 w-9 bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/25">
                <ListOrdered className="h-4.5 w-4.5 h-4 w-4" />
              </span>
              <h2 className="font-display text-xl font-bold text-white">Programação de treino</h2>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Wind className="h-3.5 w-3.5 text-sky-400" />
                {data.warmupNote}
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-teal-400" />
                {data.coreNote}
              </span>
            </p>
            {data.goals.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {data.goals.map((g, i) => (
                  <span
                    key={g}
                    className={[
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                      i % 2 === 0
                        ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                        : 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
                    ].join(' ')}
                  >
                    <Flame className="h-3 w-3" />
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onEditClick}
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-400 hover:text-sky-300"
          >
            Editar programação
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4">
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <CalendarDays className="h-3.5 w-3.5 text-sky-400" />
            Sessão
          </label>
          <select
            value={session.id}
            onChange={(e) => onSetActiveSession(e.target.value)}
            className="field w-auto min-w-[180px] text-sm"
          >
            {data.sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.date} — {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAddSession}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-400 ring-1 ring-emerald-500/25 hover:bg-emerald-500/25"
          >
            <Plus className="h-4 w-4" />
            Nova sessão
          </button>
          {data.sessions.length > 1 && (
            <button
              type="button"
              onClick={() => onDeleteSession(session.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400"
              title="Excluir sessão atual"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="border-b border-border px-5 py-4">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Filter className="h-3.5 w-3.5 text-violet-400" />
            Filtrar por grupo muscular
          </p>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              active={filter === ALL}
              onClick={() => setFilter(ALL)}
              label="TODOS"
              count={data.exercises.length}
              group="TODOS"
            />
            {[...groups.entries()].map(([g, count]) => (
              <FilterPill
                key={g}
                active={filter === g}
                onClick={() => setFilter(g)}
                label={g.toUpperCase()}
                count={count}
                group={g}
              />
            ))}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Grupo</th>
                <th className="px-3 py-3 font-semibold">Exercício</th>
                <th className="px-3 py-3 font-semibold">Séries</th>
                <th className="px-3 py-3 font-semibold">Reps alvo</th>
                <th className="px-3 py-3 font-semibold">Rep. realizadas</th>
                <th className="px-3 py-3 font-semibold">Peso ant.</th>
                <th className="px-3 py-3 font-semibold">Peso atual</th>
                <th className="px-5 py-3 font-semibold">% aumento</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ex) => {
                const entry = session.entries.find((e) => e.exerciseId === ex.id)
                const prev = getPreviousWeight(data, ex.id, session.id)
                const current = entry?.currentWeight ?? null
                const performed = entry?.performedReps ?? null
                const pct = percentIncrease(prev, current)
                const hitTarget = performed != null && performed >= ex.targetReps
                const style = GROUP_STYLE[ex.muscleGroup] ?? GROUP_STYLE.Outro

                return (
                  <tr
                    key={ex.id}
                    className="border-b border-border/60 transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={[
                          'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1',
                          style.bg,
                          style.text,
                          style.ring,
                        ].join(' ')}
                      >
                        <GroupIcon group={ex.muscleGroup} className="h-3.5 w-3.5" />
                        {ex.muscleGroup}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {ex.gifUrl ? (
                          <button
                            type="button"
                            onClick={() => setHowTo(ex)}
                            className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black/40 ring-1 ring-border transition hover:ring-sky-400/40"
                            title="Ver demo"
                          >
                            <img
                              src={ex.gifUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </button>
                        ) : null}
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="ex-link"
                            onClick={() => setHowTo(ex)}
                            title="Ver execução"
                          >
                            {ex.name}
                          </button>
                          {ex.warmup && (
                            <div className="mt-0.5 text-xs text-sky-400/70">{ex.warmup}</div>
                          )}
                          {ex.notes && (
                            <div className="mt-0.5 text-xs text-amber-400/90">{ex.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-300">{ex.sets}</td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-300">{ex.targetReps}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          placeholder="—"
                          value={performed ?? ''}
                          onChange={(e) =>
                            onUpdateEntry(session.id, ex.id, {
                              performedReps:
                                e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          className="field w-16 text-center tabular-nums"
                        />
                        {performed != null && (
                          <span
                            className={[
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
                              hitTarget
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-orange-500/15 text-orange-400',
                            ].join(' ')}
                          >
                            {hitTarget ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : null}
                            {performed}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-400">
                      {prev != null ? `${prev} kg` : '—'}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          placeholder="kg"
                          value={current ?? ''}
                          onChange={(e) =>
                            onUpdateEntry(session.id, ex.id, {
                              currentWeight:
                                e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          className="field w-20 text-center tabular-nums"
                        />
                        <span className="text-xs font-medium text-sky-500/70">kg</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {pct != null ? (
                        <span
                          className={[
                            'inline-flex items-center gap-1 font-bold tabular-nums',
                            pct >= 0 ? 'text-emerald-400' : 'text-rose-400',
                          ].join(' ')}
                        >
                          {pct >= 0 ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5" />
                          )}
                          {pct >= 0 ? '+' : ''}
                          {pct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {howTo && <HowToModal exercise={howTo} onClose={() => setHowTo(null)} />}
      </section>

      <WorkoutEvolutionCharts
        data={data}
        sessionId={session.id}
        sessionDate={session.date}
      />
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  group,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  group: MuscleGroup | 'TODOS'
}) {
  const style = group === 'TODOS' ? null : GROUP_STYLE[group]

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide transition',
        active
          ? group === 'TODOS'
            ? 'bg-sky-500 text-slate-950'
            : `${style?.bg} ${style?.text} ring-1 ${style?.ring}`
          : 'bg-panel-2 text-slate-300 ring-1 ring-border hover:text-white',
        active && group !== 'TODOS' ? 'ring-2' : '',
      ].join(' ')}
    >
      <GroupIcon
        group={group}
        className={['h-3.5 w-3.5', !active && group !== 'TODOS' ? style?.icon : ''].join(' ')}
      />
      {label}{' '}
      <span className={active ? 'opacity-70' : 'text-slate-500'}>{count}</span>
    </button>
  )
}
