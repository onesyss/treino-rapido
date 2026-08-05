import {
  CalendarDays,
  CheckCircle2,
  ListOrdered,
  Plus,
  TrendingDown,
  TrendingUp,
  Trash2,
  ArrowUpRight,
  Layers,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AppData, Exercise } from '../types'
import { getActiveSession, getActiveWorkout, getPreviousWeight } from '../hooks/useAppData'
import { percentIncrease } from '../utils/stats'
import { formatSessionOption } from '../utils/sessions'
import { GROUP_STYLE, GroupIcon } from '../utils/icons'
import { HowToModal } from './HowToModal'
import { WorkoutEvolutionCharts } from './WorkoutEvolutionCharts'
import { GifThumb } from './GifThumb'

interface WorkoutViewProps {
  data: AppData
  onUpdateEntry: (
    sessionId: string,
    exerciseId: string,
    patch: {
      performedReps?: number | null
      currentWeight?: number | null
      cardioType?: string | null
    }
  ) => void
  onAddSession: () => void
  onSetActiveSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onAddCardio: () => void
  onRemoveCardio: (exerciseId: string) => void
  onEditClick: () => void
}

export function WorkoutView({
  data,
  onUpdateEntry,
  onAddSession,
  onSetActiveSession,
  onDeleteSession,
  onAddCardio,
  onRemoveCardio,
  onEditClick,
}: WorkoutViewProps) {
  const workout = getActiveWorkout(data)
  const session = getActiveSession(data)
  const [howTo, setHowTo] = useState<Exercise | null>(null)

  const workoutSessions = useMemo(
    () =>
      data.sessions
        .filter((s) => s.workoutId === workout.id)
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date) || b.label.localeCompare(a.label)),
    [data.sessions, workout.id]
  )

  const rows = workout.exercises
  const cardioCount = rows.filter(
    (ex) =>
      ex.muscleGroup === 'Cardio' || ex.name.toLowerCase().startsWith('cardio')
  ).length

  if (!session) {
    return (
      <p className="text-sm text-slate-400">Nenhuma sessão. Crie um treino em “Montar / editar”.</p>
    )
  }

  return (
    <div className="space-y-5">
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="icon-blob h-9 w-9">
                <ListOrdered className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-white">{workout.title}</h2>
                <p className="text-sm text-slate-500">{workout.shortLabel}</p>
              </div>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                {workout.warmupNote}
              </span>
              {workout.coreNote && (
                <>
                  <span className="text-slate-600">·</span>
                  <span>{workout.coreNote}</span>
                </>
              )}
            </p>
            {workout.goals.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {workout.goals.map((g) => (
                  <span key={g} className="goal-chip">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onEditClick}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-300 hover:text-red-300"
          >
            Editar programação
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4">
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Sessão
          </label>
          <select
            value={session.id}
            onChange={(e) => onSetActiveSession(e.target.value)}
            className="field w-auto min-w-[180px] text-sm"
          >
            {workoutSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {formatSessionOption(s.date, s.label)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAddSession}
            className="btn-ghost"
          >
            <Plus className="h-4 w-4" />
            Nova sessão
          </button>
          <button
            type="button"
            onClick={onAddCardio}
            className="btn-ghost"
            title="Registre um segundo cardio no dia (ex.: esteira + vôlei)"
          >
            <Plus className="h-4 w-4" />
            Cardio
          </button>
          {workoutSessions.length > 1 && (
            <button
              type="button"
              onClick={() => onDeleteSession(session.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-300"
              title="Excluir sessão atual"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
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
                <th className="px-3 py-3 font-semibold">% aumento</th>
                <th className="px-5 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {rows.map((ex) => {
                const entry = session.entries.find((e) => e.exerciseId === ex.id)
                const prev = getPreviousWeight(data, ex.id, session.id)
                const current = entry?.currentWeight ?? null
                const performed = entry?.performedReps ?? null
                const cardioType = entry?.cardioType ?? ''
                const pct = percentIncrease(prev, current)
                const hitTarget = performed != null && performed >= ex.targetReps
                const style = GROUP_STYLE[ex.muscleGroup] ?? GROUP_STYLE.Outro
                const isCardio =
                  ex.muscleGroup === 'Cardio' || ex.name.toLowerCase().startsWith('cardio')
                const unit = isCardio ? 'km' : 'kg'
                const loadStep = isCardio ? 0.1 : 0.5
                const displayName =
                  isCardio && cardioType.trim()
                    ? cardioType.trim()
                    : isCardio
                      ? ex.name
                      : ex.name

                return (
                  <tr key={ex.id} className="table-row-glow border-b border-border/70 transition">
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
                        {isCardio ? 'Cardio' : ex.muscleGroup}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <GifThumb
                          name={ex.name}
                          gifUrl={ex.gifUrl}
                          onClick={() => setHowTo(ex)}
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="ex-link"
                            onClick={() => setHowTo(ex)}
                            title="Ver execução"
                          >
                            {displayName}
                          </button>
                          {!isCardio && ex.warmup && (
                            <div className="mt-0.5 text-xs text-slate-500">{ex.warmup}</div>
                          )}
                          {!isCardio && ex.notes && (
                            <div className="mt-0.5 text-xs text-slate-500">{ex.notes}</div>
                          )}
                          {isCardio && (
                            <div className="mt-1.5 space-y-1">
                              <input
                                type="text"
                                list={`cardio-types-${ex.id}`}
                                placeholder="Tipo (ex.: esteira, bike, vôlei…)"
                                value={cardioType}
                                onChange={(e) =>
                                  onUpdateEntry(session.id, ex.id, {
                                    cardioType:
                                      e.target.value.trim() === ''
                                        ? null
                                        : e.target.value,
                                  })
                                }
                                className="field w-full min-w-[160px] max-w-[240px] text-xs"
                                title="Qual tipo de cardio você vai fazer"
                              />
                              <datalist id={`cardio-types-${ex.id}`}>
                                <option value="Esteira" />
                                <option value="Bike" />
                                <option value="Vôlei" />
                                <option value="Elíptico" />
                                <option value="Corrida" />
                                <option value="Caminhada" />
                                <option value="Remo" />
                                <option value="Natação" />
                              </datalist>
                              <div className="text-[11px] text-slate-500">
                                min · km opcional
                                {cardioCount > 1 && (
                                  <span className="ml-1 text-slate-600">· {ex.name}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-300">
                      {isCardio ? '—' : ex.sets}
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-300">
                      {isCardio ? `${ex.targetReps} min` : ex.targetReps}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          placeholder={isCardio ? 'min' : '—'}
                          value={performed ?? ''}
                          onChange={(e) =>
                            onUpdateEntry(session.id, ex.id, {
                              performedReps:
                                e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          className="field w-16 text-center tabular-nums"
                          title={isCardio ? 'Minutos' : 'Repetições realizadas'}
                        />
                        {isCardio ? (
                          <span className="text-xs text-slate-500">min</span>
                        ) : (
                          performed != null && (
                            <span
                              className={[
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
                                hitTarget
                                  ? 'chip-ok'
                                  : 'bg-red-500/10 text-red-300 ring-1 ring-red-500/30',
                              ].join(' ')}
                            >
                              {hitTarget ? (
                                <CheckCircle2 className="h-3 w-3 text-blue-400" />
                              ) : null}
                              {performed}
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-400">
                      {prev != null ? `${prev} ${unit}` : '—'}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          step={loadStep}
                          placeholder={isCardio ? 'km' : 'kg'}
                          value={current ?? ''}
                          onChange={(e) =>
                            onUpdateEntry(session.id, ex.id, {
                              currentWeight:
                                e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          className="field w-20 text-center tabular-nums"
                          title={isCardio ? 'Quilômetros (opcional)' : 'Peso atual'}
                        />
                        <span className="text-xs text-slate-500">{unit}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      {pct != null ? (
                        <span
                          className={[
                            'inline-flex items-center gap-1 font-bold tabular-nums',
                            pct >= 0 ? 'stat-up' : 'stat-down',
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
                    <td className="px-5 py-3.5">
                      {isCardio && cardioCount > 1 ? (
                        <button
                          type="button"
                          onClick={() => onRemoveCardio(ex.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                          title="Remover este cardio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
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
