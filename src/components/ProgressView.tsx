import { useMemo, useState } from 'react'
import { Activity, History, LineChart as LineIcon, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AppData } from '../types'
import { getActiveWorkout } from '../hooks/useAppData'
import { chartDataForExercise, overallVolumeSeries, volumeForSession } from '../utils/stats'

interface ProgressViewProps {
  data: AppData
}

export function ProgressView({ data }: ProgressViewProps) {
  const workout = getActiveWorkout(data)
  const [exerciseId, setExerciseId] = useState(workout.exercises[0]?.id ?? '')

  // sync when workout switches
  if (workout.exercises.length && !workout.exercises.some((e) => e.id === exerciseId)) {
    setExerciseId(workout.exercises[0].id)
  }

  const volumeSeries = useMemo(() => overallVolumeSeries(data), [data])
  const exerciseSeries = useMemo(
    () => (exerciseId ? chartDataForExercise(data, exerciseId) : []),
    [data, exerciseId]
  )

  const selected = workout.exercises.find((e) => e.id === exerciseId)
  const sessions = data.sessions.filter((s) => s.workoutId === workout.id)

  const tooltipStyle = {
    background: '#0b1220',
    border: '1px solid #1e2d4a',
    borderRadius: 10,
    fontSize: 13,
    color: '#e2e8f0',
  }

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex items-start gap-3">
          <span className="icon-blob h-10 w-10">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Evolução física</h2>
            <p className="mt-1 text-sm text-slate-500">
              Dados do treino ativo: {workout.shortLabel}
            </p>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
          <span className="icon-blob h-8 w-8">
            <Activity className="h-4 w-4" />
          </span>
          Volume total por sessão
        </h3>
        {volumeSeries.every((v) => v.volume === 0) ? (
          <EmptyChart msg="Preencha pesos e reps em pelo menos uma sessão para ver o volume." />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeSeries}>
                <defs>
                  <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#8b9bb8', fontSize: 12 }}
                  tickFormatter={(v) => formatDate(String(v))}
                />
                <YAxis tick={{ fill: '#8b9bb8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(v) => formatDate(String(v))}
                  formatter={(value) => [`${Number(value).toLocaleString('pt-BR')} kg`, 'Volume']}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#3b82f6"
                  fill="url(#volFill)"
                  strokeWidth={2}
                  name="Volume"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <span className="icon-blob h-8 w-8">
              <LineIcon className="h-4 w-4" />
            </span>
            Carga por exercício
          </h3>
          <select
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            className="field w-auto min-w-[200px] text-sm"
          >
            {workout.exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.muscleGroup})
              </option>
            ))}
          </select>
        </div>

        {exerciseSeries.length === 0 ? (
          <EmptyChart
            msg={`Ainda sem histórico de carga para ${selected?.name ?? 'este exercício'}.`}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Peso (kg)
              </p>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={exerciseSeries}>
                  <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8b9bb8', fontSize: 12 }}
                    tickFormatter={(v) => formatDate(String(v))}
                  />
                  <YAxis tick={{ fill: '#8b9bb8', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#60a5fa' }}
                    name="Peso (kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reps
              </p>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={exerciseSeries}>
                  <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8b9bb8', fontSize: 12 }}
                    tickFormatter={(v) => formatDate(String(v))}
                  />
                  <YAxis tick={{ fill: '#8b9bb8', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="reps" fill="#ef4444" name="Reps" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <span className="icon-blob h-8 w-8">
              <History className="h-4 w-4" />
            </span>
            Histórico de sessões
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Data</th>
                <th className="px-3 py-3">Label</th>
                <th className="px-3 py-3">Preenchidos</th>
                <th className="px-5 py-3">Volume est.</th>
              </tr>
            </thead>
            <tbody>
              {[...sessions].reverse().map((s) => {
                const filled = s.entries.filter(
                  (e) => e.currentWeight != null || e.performedReps != null
                ).length
                const vol = volumeForSession(data, s.id)
                return (
                  <tr key={s.id} className="border-b border-border/70">
                    <td className="px-5 py-3 text-slate-300">{formatDate(s.date)}</td>
                    <td className="px-3 py-3 text-white">{s.label}</td>
                    <td className="px-3 py-3 text-slate-400">
                      {filled}/{workout.exercises.length}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-300">
                      {vol.toLocaleString('pt-BR')} kg
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function EmptyChart({ msg }: { msg: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl bg-panel-2 text-center text-sm text-slate-500 ring-1 ring-border">
      {msg}
    </div>
  )
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}`
}
