import type { AppData, Exercise } from '../types'
import { getPreviousWeight } from '../hooks/useAppData'

export function percentIncrease(prev: number | null, current: number | null): number | null {
  if (prev == null || current == null || prev <= 0) return null
  return ((current - prev) / prev) * 100
}

export function volumeForSession(data: AppData, sessionId: string): number {
  const session = data.sessions.find((s) => s.id === sessionId)
  if (!session) return 0
  return session.entries.reduce((sum, e) => {
    const ex = data.exercises.find((x) => x.id === e.exerciseId)
    if (!ex || e.currentWeight == null || e.performedReps == null) return sum
    return sum + e.currentWeight * e.performedReps * ex.sets
  }, 0)
}

export function volumeForSessionEntry(
  ex: Exercise | undefined,
  weight: number | null,
  reps: number | null
): number {
  if (!ex || weight == null || reps == null) return 0
  return weight * reps * ex.sets
}

export function chartDataForExercise(data: AppData, exerciseId: string) {
  return data.sessions
    .map((s) => {
      const entry = s.entries.find((e) => e.exerciseId === exerciseId)
      if (!entry || entry.currentWeight == null) return null
      return {
        date: s.date,
        label: s.label,
        weight: entry.currentWeight,
        reps: entry.performedReps,
        volume:
          entry.performedReps != null
            ? entry.currentWeight *
              entry.performedReps *
              (data.exercises.find((x) => x.id === exerciseId)?.sets ?? 1)
            : null,
      }
    })
    .filter(Boolean) as {
    date: string
    label: string
    weight: number
    reps: number | null
    volume: number | null
  }[]
}

export function overallVolumeSeries(data: AppData) {
  return data.sessions.map((s) => ({
    date: s.date,
    label: s.label,
    volume: volumeForSession(data, s.id),
  }))
}

export function rowMetrics(data: AppData, exercise: Exercise, sessionId: string) {
  const session = data.sessions.find((s) => s.id === sessionId)
  const entry = session?.entries.find((e) => e.exerciseId === exercise.id)
  const prev = getPreviousWeight(data, exercise.id, sessionId)
  const current = entry?.currentWeight ?? null
  const pct = percentIncrease(prev, current)
  return {
    entry,
    previousWeight: prev,
    currentWeight: current,
    percent: pct,
  }
}

/** Evolução no dia/sessão: carga, reps e volume por exercício */
export function dayProgressData(data: AppData, sessionId: string) {
  const session = data.sessions.find((s) => s.id === sessionId)
  if (!session) return []

  return data.exercises.map((ex) => {
    const entry = session.entries.find((e) => e.exerciseId === ex.id)
    const weight = entry?.currentWeight ?? 0
    const reps = entry?.performedReps ?? 0
    const volume = volumeForSessionEntry(
      ex,
      entry?.currentWeight ?? null,
      entry?.performedReps ?? null
    )
    const filled = entry?.currentWeight != null || entry?.performedReps != null
    return {
      name: ex.name,
      shortName: ex.name.length > 12 ? `${ex.name.slice(0, 11)}…` : ex.name,
      weight,
      reps,
      volume,
      filled,
    }
  })
}

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function startOfWeekISO(dateISO: string): string {
  const d = parseLocalDate(dateISO)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toISODate(d)
}

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

/** Evolução na semana (seg–dom) */
export function weekProgressData(data: AppData, refDateISO: string) {
  const start = parseLocalDate(startOfWeekISO(refDateISO))

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    const iso = toISODate(day)
    const sessionsThatDay = data.sessions.filter((s) => s.date === iso)
    const volume = sessionsThatDay.reduce((sum, s) => sum + volumeForSession(data, s.id), 0)

    let avgWeight = 0
    if (sessionsThatDay.length > 0) {
      let total = 0
      let count = 0
      for (const s of sessionsThatDay) {
        for (const e of s.entries) {
          if (e.currentWeight != null && e.currentWeight > 0) {
            total += e.currentWeight
            count++
          }
        }
      }
      avgWeight = count ? total / count : 0
    }

    const totalReps = sessionsThatDay.reduce(
      (sum, s) => sum + s.entries.reduce((a, e) => a + (e.performedReps ?? 0), 0),
      0
    )

    return {
      day: WEEKDAY_LABELS[i],
      date: iso,
      label: `${WEEKDAY_LABELS[i]} ${iso.slice(8, 10)}/${iso.slice(5, 7)}`,
      volume: Math.round(volume),
      pesoMedio: Math.round(avgWeight * 10) / 10,
      reps: totalReps,
      sessoes: sessionsThatDay.length,
    }
  })
}

export function daySummary(data: AppData, sessionId: string) {
  const points = dayProgressData(data, sessionId)
  const filled = points.filter((p) => p.filled).length
  const volume = points.reduce((s, p) => s + p.volume, 0)
  const totalReps = points.reduce((s, p) => s + p.reps, 0)
  return { filled, total: points.length, volume, totalReps }
}

export function weekSummary(week: ReturnType<typeof weekProgressData>) {
  const trainDays = week.filter((d) => d.sessoes > 0).length
  const volume = week.reduce((s, d) => s + d.volume, 0)
  const reps = week.reduce((s, d) => s + d.reps, 0)
  return { trainDays, volume, reps }
}
