import { useEffect, useMemo, useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight, Dumbbell, Sun, Weight } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AppData } from '../types'
import { getActiveWorkout } from '../hooks/useAppData'
import {
  dayProgressData,
  daySummary,
  shiftDateISO,
  startOfWeekISO,
  weekProgressData,
  weekSummary,
} from '../utils/stats'

interface WorkoutEvolutionChartsProps {
  data: AppData
  sessionId: string
  sessionDate: string
}

const tooltipStyle = {
  background: '#0b1220',
  border: '1px solid #1e2d4a',
  borderRadius: 10,
  fontSize: 13,
  color: '#e2e8f0',
}

const CHART_A = '#3b82f6'
const CHART_B = '#ef4444'
const CHART_C = '#22d3ee'

type DayMetric = 'weight' | 'reps' | 'volume'
type WeekMetric = 'volume' | 'reps' | 'pesoMedio'

const DAY_METRICS: { id: DayMetric; label: string }[] = [
  { id: 'weight', label: 'Peso' },
  { id: 'reps', label: 'Reps' },
  { id: 'volume', label: 'Volume' },
]

const WEEK_METRICS: { id: WeekMetric; label: string }[] = [
  { id: 'volume', label: 'Volume' },
  { id: 'reps', label: 'Reps' },
  { id: 'pesoMedio', label: 'Peso médio' },
]

export function WorkoutEvolutionCharts({
  data,
  sessionId,
  sessionDate,
}: WorkoutEvolutionChartsProps) {
  const workout = getActiveWorkout(data)
  const muscleGroups = useMemo(() => {
    const set = new Set(workout.exercises.map((ex) => ex.muscleGroup))
    return Array.from(set)
  }, [workout.exercises])

  const daySessions = useMemo(() => {
    return data.sessions
      .filter((s) => s.workoutId === workout.id)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.label.localeCompare(a.label))
  }, [data.sessions, workout.id])

  const [daySessionId, setDaySessionId] = useState(sessionId)
  const [dayMetrics, setDayMetrics] = useState<DayMetric[]>(['weight', 'reps', 'volume'])

  useEffect(() => {
    setDaySessionId(sessionId)
  }, [sessionId])

  const effectiveDaySessionId = daySessions.some((s) => s.id === daySessionId)
    ? daySessionId
    : sessionId

  const [weekExerciseId, setWeekExerciseId] = useState('')
  const [weekMuscle, setWeekMuscle] = useState('')
  const [weekMetrics, setWeekMetrics] = useState<WeekMetric[]>(['volume', 'reps', 'pesoMedio'])
  const [weekOffset, setWeekOffset] = useState(0)

  const weekOptions = useMemo(
    () => ({
      exerciseId: weekExerciseId || null,
      muscleGroup: !weekExerciseId && weekMuscle ? weekMuscle : null,
    }),
    [weekExerciseId, weekMuscle]
  )

  const weekRefDate = useMemo(
    () => shiftDateISO(sessionDate, weekOffset * 7),
    [sessionDate, weekOffset]
  )
  const weekStart = startOfWeekISO(weekRefDate)
  const weekEnd = shiftDateISO(weekStart, 6)

  const dayData = useMemo(
    () => dayProgressData(data, effectiveDaySessionId),
    [data, effectiveDaySessionId]
  )
  const weekData = useMemo(
    () => weekProgressData(data, weekRefDate, weekOptions),
    [data, weekRefDate, weekOptions]
  )
  const day = useMemo(
    () => daySummary(data, effectiveDaySessionId),
    [data, effectiveDaySessionId]
  )
  const week = useMemo(() => weekSummary(weekData), [weekData])

  const dayHasData = dayData.some((d) => d.filled)
  const weekHasData = weekData.some((d) => d.sessoes > 0 || d.volume > 0 || d.reps > 0)
  const activeDayMetrics = dayMetrics.length ? dayMetrics : (['weight'] as DayMetric[])
  const activeWeekMetrics = weekMetrics.length ? weekMetrics : (['volume'] as WeekMetric[])

  return (
    <section className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-start gap-3">
              <span className="icon-blob h-10 w-10">
                <Sun className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-white">Evolução do dia</h3>
                <p className="text-sm text-slate-500">Carga e volume por exercício na data escolhida</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div className="inline-flex items-center gap-1">
                <Dumbbell className="h-3 w-3" />
                {day.filled}/{day.total} exercícios
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 tabular-nums font-semibold text-slate-300">
                <Weight className="h-3 w-3" />
                {day.volume.toLocaleString('pt-BR')} kg vol.
              </div>
            </div>
          </div>

          <label className="mt-3 block max-w-xs">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Data
            </span>
            <select
              value={effectiveDaySessionId}
              onChange={(e) => setDaySessionId(e.target.value)}
              className="field w-full text-sm"
            >
              {daySessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatFullDate(s.date)}
                  {s.label ? ` — ${s.label}` : ''}
                </option>
              ))}
            </select>
          </label>

          <MetricChips
            options={DAY_METRICS}
            selected={dayMetrics}
            onToggle={(id) => setDayMetrics((prev) => toggleMetric(prev, id))}
          />

          {!dayHasData ? (
            <Empty msg="Preencha peso e reps na sessão dessa data para ver o gráfico do dia." />
          ) : (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: '#8b9bb8', fontSize: 11 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis tick={{ fill: '#8b9bb8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => {
                      const v = Number(value)
                      if (name === 'weight') return [`${v} kg`, 'Peso']
                      if (name === 'reps') return [v, 'Reps']
                      if (name === 'volume') return [`${v.toLocaleString('pt-BR')} kg`, 'Volume']
                      return [v, String(name)]
                    }}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as { name?: string } | undefined
                      return p?.name ?? ''
                    }}
                  />
                  <Legend
                    formatter={(v) =>
                      v === 'weight' ? 'Peso (kg)' : v === 'reps' ? 'Reps' : 'Volume'
                    }
                  />
                  {activeDayMetrics.includes('weight') && (
                    <Bar dataKey="weight" fill={CHART_A} radius={[4, 4, 0, 0]} name="weight" />
                  )}
                  {activeDayMetrics.includes('reps') && (
                    <Bar dataKey="reps" fill={CHART_B} radius={[4, 4, 0, 0]} name="reps" />
                  )}
                  {activeDayMetrics.includes('volume') && (
                    <Bar dataKey="volume" fill={CHART_C} radius={[4, 4, 0, 0]} name="volume" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-start gap-3">
              <span className="icon-blob h-10 w-10">
                <CalendarRange className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-white">Evolução da semana</h3>
                <p className="text-sm text-slate-500">
                  {formatDayMonth(weekStart)} – {formatDayMonth(weekEnd)}
                  {weekOffset === 0 ? ' · esta semana' : weekOffset < 0 ? ' · semanas anteriores' : ''}
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{week.trainDays} dia(s) de treino</div>
              <div className="mt-0.5 tabular-nums font-semibold text-slate-300">
                {week.volume.toLocaleString('pt-BR')} kg vol.
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekOffset((o) => o - 1)}
              className="btn-ghost h-9 px-2.5 text-xs"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
              Ant.
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className="btn-ghost h-9 px-2.5 text-xs disabled:opacity-40"
            >
              Esta semana
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
              disabled={weekOffset >= 0}
              className="btn-ghost h-9 px-2.5 text-xs disabled:opacity-40"
              aria-label="Semana seguinte"
            >
              Próx.
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <ChartFilters
            exerciseId={weekExerciseId}
            muscleGroup={weekMuscle}
            exercises={workout.exercises}
            muscleGroups={muscleGroups}
            onExerciseChange={(id) => {
              setWeekExerciseId(id)
              if (id) setWeekMuscle('')
            }}
            onMuscleChange={(g) => {
              setWeekMuscle(g)
              if (g) setWeekExerciseId('')
            }}
          />

          <MetricChips
            options={WEEK_METRICS}
            selected={weekMetrics}
            onToggle={(id) => setWeekMetrics((prev) => toggleMetric(prev, id))}
          />

          {!weekHasData ? (
            <Empty msg="Sem dados nesta semana para o filtro atual. Escolha outra semana ou limpe o filtro." />
          ) : (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weekVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: '#8b9bb8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#8b9bb8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as { label?: string } | undefined
                      return p?.label ?? ''
                    }}
                    formatter={(value, name) => {
                      const v = Number(value)
                      if (name === 'volume') return [`${v.toLocaleString('pt-BR')} kg`, 'Volume']
                      if (name === 'reps') return [v, 'Reps']
                      if (name === 'pesoMedio') return [`${v} kg`, 'Peso médio']
                      return [v, String(name)]
                    }}
                  />
                  <Legend
                    formatter={(v) =>
                      v === 'volume' ? 'Volume' : v === 'reps' ? 'Reps' : 'Peso médio'
                    }
                  />
                  {activeWeekMetrics.includes('volume') && (
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke={CHART_A}
                      fill="url(#weekVol)"
                      strokeWidth={2}
                      name="volume"
                    />
                  )}
                  {activeWeekMetrics.includes('reps') && (
                    <Area
                      type="monotone"
                      dataKey="reps"
                      stroke={CHART_B}
                      fill="transparent"
                      strokeWidth={2}
                      name="reps"
                    />
                  )}
                  {activeWeekMetrics.includes('pesoMedio') && (
                    <Area
                      type="monotone"
                      dataKey="pesoMedio"
                      stroke={CHART_C}
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      name="pesoMedio"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ChartFilters({
  exerciseId,
  muscleGroup,
  exercises,
  muscleGroups,
  onExerciseChange,
  onMuscleChange,
}: {
  exerciseId: string
  muscleGroup: string
  exercises: { id: string; name: string; muscleGroup: string }[]
  muscleGroups: string[]
  onExerciseChange: (id: string) => void
  onMuscleChange: (group: string) => void
}) {
  const filteredExercises = muscleGroup
    ? exercises.filter((ex) => ex.muscleGroup === muscleGroup)
    : exercises

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Grupo
        </span>
        <select
          value={muscleGroup}
          onChange={(e) => onMuscleChange(e.target.value)}
          className="field w-full text-sm"
        >
          <option value="">Todos os grupos</option>
          {muscleGroups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Exercício
        </span>
        <select
          value={exerciseId}
          onChange={(e) => onExerciseChange(e.target.value)}
          className="field w-full text-sm"
        >
          <option value="">Todos os exercícios</option>
          {filteredExercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function MetricChips<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: { id: T; label: string }[]
  selected: T[]
  onToggle: (id: T) => void
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="mr-1 self-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Métricas
      </span>
      {options.map((opt) => {
        const active = selected.includes(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={[
              'rounded-lg px-2.5 py-1 text-xs font-medium transition ring-1',
              active
                ? 'bg-blue-500/20 text-blue-200 ring-blue-500/40'
                : 'bg-panel-2 text-slate-400 ring-border hover:text-slate-200',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function toggleMetric<T extends string>(prev: T[], id: T): T[] {
  if (prev.includes(id)) {
    const next = prev.filter((m) => m !== id)
    return next.length ? next : prev
  }
  return [...prev, id]
}

function formatDayMonth(iso: string) {
  const [, m, d] = iso.split('-')
  if (!m || !d) return iso
  return `${d}/${m}`
}

function formatFullDate(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="mt-4 flex h-64 items-center justify-center rounded-xl bg-panel-2 px-4 text-center text-sm text-slate-500 ring-1 ring-border">
      {msg}
    </div>
  )
}
