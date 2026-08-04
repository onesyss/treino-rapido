import { useMemo } from 'react'
import { CalendarRange, Dumbbell, Sun, Weight } from 'lucide-react'
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
import {
  dayProgressData,
  daySummary,
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

export function WorkoutEvolutionCharts({
  data,
  sessionId,
  sessionDate,
}: WorkoutEvolutionChartsProps) {
  const dayData = useMemo(() => dayProgressData(data, sessionId), [data, sessionId])
  const weekData = useMemo(() => weekProgressData(data, sessionDate), [data, sessionDate])
  const day = useMemo(() => daySummary(data, sessionId), [data, sessionId])
  const week = useMemo(() => weekSummary(weekData), [weekData])

  const dayHasData = dayData.some((d) => d.filled)
  const weekHasData = weekData.some((d) => d.sessoes > 0)

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
                <p className="text-sm text-slate-500">Carga e volume por exercício nesta sessão</p>
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

          {!dayHasData ? (
            <Empty msg="Preencha peso e reps nos exercícios acima para ver o gráfico do dia." />
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
                  <Bar dataKey="weight" fill={CHART_A} radius={[4, 4, 0, 0]} name="weight" />
                  <Bar dataKey="reps" fill={CHART_B} radius={[4, 4, 0, 0]} name="reps" />
                  <Bar dataKey="volume" fill={CHART_C} radius={[4, 4, 0, 0]} name="volume" />
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
                <p className="text-sm text-slate-500">Volume e reps de segunda a domingo</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{week.trainDays} dia(s) de treino</div>
              <div className="mt-0.5 tabular-nums font-semibold text-slate-300">
                {week.volume.toLocaleString('pt-BR')} kg vol.
              </div>
            </div>
          </div>

          {!weekHasData ? (
            <Empty msg="Ainda sem sessões nesta semana. Preencha o treino e adicione novas sessões." />
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
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke={CHART_A}
                    fill="url(#weekVol)"
                    strokeWidth={2}
                    name="volume"
                  />
                  <Area
                    type="monotone"
                    dataKey="reps"
                    stroke={CHART_B}
                    fill="transparent"
                    strokeWidth={2}
                    name="reps"
                  />
                  <Area
                    type="monotone"
                    dataKey="pesoMedio"
                    stroke={CHART_C}
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    name="pesoMedio"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="mt-4 flex h-64 items-center justify-center rounded-xl bg-panel-2 px-4 text-center text-sm text-slate-500 ring-1 ring-border">
      {msg}
    </div>
  )
}
