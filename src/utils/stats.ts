import type { AppData, Exercise } from '../types'
import { getActiveSession, getActiveWorkout, getPreviousWeight } from '../hooks/useAppData'

export function percentIncrease(prev: number | null, current: number | null): number | null {
  if (prev == null || current == null || prev <= 0) return null
  return ((current - prev) / prev) * 100
}

export function volumeForSession(data: AppData, sessionId: string): number {
  const session = data.sessions.find((s) => s.id === sessionId)
  if (!session) return 0
  const workout = data.workouts.find((w) => w.id === session.workoutId)
  if (!workout) return 0
  return session.entries.reduce((sum, e) => {
    const ex = workout.exercises.find((x) => x.id === e.exerciseId)
    if (!ex || ex.muscleGroup === 'Cardio') return sum
    if (e.currentWeight == null || e.performedReps == null) return sum
    return sum + e.currentWeight * e.performedReps * ex.sets
  }, 0)
}

export function volumeForSessionEntry(
  ex: Exercise | undefined,
  weight: number | null,
  reps: number | null
): number {
  if (!ex || ex.muscleGroup === 'Cardio' || weight == null || reps == null) return 0
  return weight * reps * ex.sets
}

export function chartDataForExercise(data: AppData, exerciseId: string) {
  return data.sessions
    .map((s) => {
      const workout = data.workouts.find((w) => w.id === s.workoutId)
      const entry = s.entries.find((e) => e.exerciseId === exerciseId)
      if (!entry || entry.currentWeight == null) return null
      const sets = workout?.exercises.find((x) => x.id === exerciseId)?.sets ?? 1
      return {
        date: s.date,
        label: s.label,
        weight: entry.currentWeight,
        reps: entry.performedReps,
        volume:
          entry.performedReps != null
            ? entry.currentWeight * entry.performedReps * sets
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

/** séries do treino ativo apenas */
export function overallVolumeSeries(data: AppData) {
  const workoutId = data.activeWorkoutId
  return data.sessions
    .filter((s) => s.workoutId === workoutId)
    .map((s) => ({
      date: s.date,
      label: s.label,
      volume: volumeForSession(data, s.id),
    }))
}

export function dayProgressData(
  data: AppData,
  sessionId: string,
  options?: { exerciseId?: string | null; muscleGroup?: string | null }
) {
  const session = data.sessions.find((s) => s.id === sessionId)
  if (!session) return []
  const workout = data.workouts.find((w) => w.id === session.workoutId)
  if (!workout) return []

  let exercises = workout.exercises
  if (options?.exerciseId) {
    exercises = exercises.filter((ex) => ex.id === options.exerciseId)
  } else if (options?.muscleGroup) {
    exercises = exercises.filter((ex) => ex.muscleGroup === options.muscleGroup)
  }

  return exercises.map((ex) => {
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
      exerciseId: ex.id,
      name: ex.name,
      shortName: ex.name.length > 12 ? `${ex.name.slice(0, 11)}…` : ex.name,
      muscleGroup: ex.muscleGroup,
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

export function shiftDateISO(dateISO: string, days: number): string {
  const d = parseLocalDate(dateISO)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function weekProgressData(
  data: AppData,
  refDateISO: string,
  options?: { exerciseId?: string | null; muscleGroup?: string | null }
) {
  const start = parseLocalDate(startOfWeekISO(refDateISO))
  const workoutId = data.activeWorkoutId
  const workout = data.workouts.find((w) => w.id === workoutId)
  const exerciseFilter = options?.exerciseId
  const muscleFilter = options?.muscleGroup

  const exerciseIds = (() => {
    if (!workout) return null as Set<string> | null
    if (exerciseFilter) return new Set([exerciseFilter])
    if (muscleFilter) {
      return new Set(
        workout.exercises.filter((ex) => ex.muscleGroup === muscleFilter).map((ex) => ex.id)
      )
    }
    return null
  })()

  const entryMatches = (exerciseId: string) => {
    if (!exerciseIds) return true
    return exerciseIds.has(exerciseId)
  }

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    const iso = toISODate(day)
    const sessionsThatDay = data.sessions.filter(
      (s) => s.date === iso && s.workoutId === workoutId
    )

    let volume = 0
    let totalWeight = 0
    let weightCount = 0
    let totalReps = 0
    let sessionsWithMatch = 0

    for (const s of sessionsThatDay) {
      let matched = false
      for (const e of s.entries) {
        if (!entryMatches(e.exerciseId)) continue
        if (e.currentWeight == null && e.performedReps == null) continue
        matched = true
        const ex = workout?.exercises.find((x) => x.id === e.exerciseId)
        volume += volumeForSessionEntry(ex, e.currentWeight, e.performedReps)
        if (e.currentWeight != null && e.currentWeight > 0) {
          totalWeight += e.currentWeight
          weightCount++
        }
        totalReps += e.performedReps ?? 0
      }
      if (matched) sessionsWithMatch++
    }

    const avgWeight = weightCount ? totalWeight / weightCount : 0

    return {
      day: WEEKDAY_LABELS[i],
      date: iso,
      label: `${WEEKDAY_LABELS[i]} ${iso.slice(8, 10)}/${iso.slice(5, 7)}`,
      volume: Math.round(volume),
      pesoMedio: Math.round(avgWeight * 10) / 10,
      reps: totalReps,
      sessoes: sessionsWithMatch,
    }
  })
}

export function daySummary(
  data: AppData,
  sessionId: string,
  options?: { exerciseId?: string | null; muscleGroup?: string | null }
) {
  const points = dayProgressData(data, sessionId, options)
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

// re-exports for components that still import helpers
export { getActiveSession, getActiveWorkout, getPreviousWeight }
