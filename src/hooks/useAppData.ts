import { useCallback, useEffect, useState } from 'react'
import { GIF_CREDIT_PRIMARY, gifForName, normalizeExerciseName } from '../data/gifs'
import { INITIAL_DATA, getWorkout } from '../data/initialData'
import type {
  AppData,
  Exercise,
  SessionEntry,
  WorkoutProgram,
  WorkoutSession,
} from '../types'

const STORAGE_KEY = 'treino-rapido-v8'
const WORKOUT_OMBROS_ID = 'wk-ombros'

function isValidStored(data: unknown): data is AppData {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as AppData).workouts) &&
    (data as AppData).workouts.length >= 4
  )
}

/** Corrige GIFs 404 / desatualizados usando o catálogo por nome. */
function repairExerciseGifs(ex: Exercise): Exercise {
  const catalog = gifForName(ex.name)
  let next = ex
  if (ex.name.toLowerCase().includes('panturrilha')) {
    next = { ...next, muscleGroup: 'Pernas' as const }
  }
  if (catalog?.gifUrl && next.gifUrl !== catalog.gifUrl) {
    next = {
      ...next,
      gifUrl: catalog.gifUrl,
      gifCredit: catalog.gifCredit ?? next.gifCredit ?? GIF_CREDIT_PRIMARY,
    }
  } else if (!next.gifUrl && catalog?.gifUrl) {
    next = {
      ...next,
      gifUrl: catalog.gifUrl,
      gifCredit: catalog.gifCredit ?? GIF_CREDIT_PRIMARY,
    }
  }
  return next
}

/** Inclui exercícios novos do seed (ex.: bi/tri na ficha de ombro) sem apagar histórico. */
function mergeMissingSeedExercises(data: AppData): AppData {
  const seedOmbro = INITIAL_DATA.workouts.find((w) => w.id === WORKOUT_OMBROS_ID)
  if (!seedOmbro) return data

  const workouts = data.workouts.map((w) => {
    if (w.id !== WORKOUT_OMBROS_ID) return w
    const have = new Set(w.exercises.map((e) => normalizeExerciseName(e.name)))
    const missing = seedOmbro.exercises.filter(
      (se) => !have.has(normalizeExerciseName(se.name))
    )
    if (!missing.length) {
      return {
        ...w,
        title: seedOmbro.title,
        shortLabel: seedOmbro.shortLabel,
        warmupNote: seedOmbro.warmupNote,
        coreNote: seedOmbro.coreNote,
        goals: seedOmbro.goals,
      }
    }
    return {
      ...w,
      title: seedOmbro.title,
      shortLabel: seedOmbro.shortLabel,
      warmupNote: seedOmbro.warmupNote,
      coreNote: seedOmbro.coreNote,
      goals: seedOmbro.goals,
      exercises: [...w.exercises, ...missing.map((e) => structuredClone(e))],
    }
  })

  const ombro = workouts.find((w) => w.id === WORKOUT_OMBROS_ID)
  if (!ombro) return { ...data, workouts }

  const sessions = data.sessions.map((s) => {
    if (s.workoutId !== WORKOUT_OMBROS_ID) return s
    const haveIds = new Set(s.entries.map((e) => e.exerciseId))
    const extra = ombro.exercises
      .filter((ex) => !haveIds.has(ex.id))
      .map((ex) => ({
        exerciseId: ex.id,
        performedReps: null as number | null,
        currentWeight: null as number | null,
      }))
    if (!extra.length) return s
    return { ...s, entries: [...s.entries, ...extra] }
  })

  return { ...data, workouts, sessions }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(INITIAL_DATA)
    const parsed = JSON.parse(raw) as unknown
    if (!isValidStored(parsed)) return structuredClone(INITIAL_DATA)
    for (const w of parsed.workouts) {
      w.exercises = w.exercises.map(repairExerciseGifs)
    }
    if (!parsed.workouts.some((w) => w.id === parsed.activeWorkoutId)) {
      parsed.activeWorkoutId = parsed.workouts[0].id
    }
    // Nome padrão do atleta
    if (!parsed.profileName?.trim() || parsed.profileName.trim() === 'Atleta') {
      parsed.profileName = 'Marlon Miranda'
    }
    return mergeMissingSeedExercises(parsed)
  } catch {
    return structuredClone(INITIAL_DATA)
  }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(() => load())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const setActiveWorkout = useCallback((workoutId: string) => {
    setData((d) => {
      const workout = d.workouts.find((w) => w.id === workoutId)
      if (!workout) return d
      const sessionsOf = d.sessions.filter((s) => s.workoutId === workoutId)
      let activeSessionId = d.activeSessionId
      let sessions = d.sessions
      if (!sessionsOf.length) {
        const neu: WorkoutSession = {
          id: crypto.randomUUID(),
          workoutId,
          date: new Date().toISOString().slice(0, 10),
          label: 'Sessão de hoje',
          entries: workout.exercises.map((ex) => ({
            exerciseId: ex.id,
            performedReps: null,
            currentWeight: null,
          })),
        }
        sessions = [...d.sessions, neu]
        activeSessionId = neu.id
      } else {
        activeSessionId = sessionsOf[sessionsOf.length - 1].id
      }
      return { ...d, activeWorkoutId: workoutId, sessions, activeSessionId }
    })
  }, [])

  const updateProfile = useCallback((profileName: string) => {
    setData((d) => ({ ...d, profileName: profileName.trim() || 'Marlon Miranda' }))
  }, [])

  const updateActiveWorkoutMeta = useCallback(
    (partial: Partial<Pick<WorkoutProgram, 'title' | 'warmupNote' | 'coreNote' | 'goals'>>) => {
      setData((d) => ({
        ...d,
        workouts: d.workouts.map((w) =>
          w.id === d.activeWorkoutId ? { ...w, ...partial } : w
        ),
      }))
    },
    []
  )

  const setExercises = useCallback((exercises: Exercise[]) => {
    setData((d) => {
      const workoutId = d.activeWorkoutId
      const workouts = d.workouts.map((w) =>
        w.id !== workoutId
          ? w
          : {
              ...w,
              exercises: exercises.map((ex) =>
                ex.name.toLowerCase().includes('panturrilha')
                  ? { ...ex, muscleGroup: 'Pernas' as const }
                  : ex
              ),
            }
      )
      const ordered = workouts.find((w) => w.id === workoutId)?.exercises ?? []
      const ids = new Set(ordered.map((e) => e.id))
      const sessions = d.sessions.map((s) => {
        if (s.workoutId !== workoutId) return s
        return {
          ...s,
          entries: ordered.map((ex) => {
            const existing = s.entries.find((e) => e.exerciseId === ex.id)
            return (
              existing ?? {
                exerciseId: ex.id,
                performedReps: null as number | null,
                currentWeight: null as number | null,
              }
            )
          }).filter((e) => ids.has(e.exerciseId)),
        }
      })
      return { ...d, workouts, sessions }
    })
  }, [])

  const updateEntry = useCallback(
    (sessionId: string, exerciseId: string, patch: Partial<SessionEntry>) => {
      setData((d) => ({
        ...d,
        sessions: d.sessions.map((s) =>
          s.id !== sessionId
            ? s
            : {
                ...s,
                entries: s.entries.map((e) =>
                  e.exerciseId === exerciseId ? { ...e, ...patch } : e
                ),
              }
        ),
      }))
    },
    []
  )

  const addSession = useCallback((label?: string) => {
    setData((d) => {
      const workout = getWorkout(d)
      const sessionsOf = d.sessions.filter((s) => s.workoutId === workout.id)
      const prev = sessionsOf[sessionsOf.length - 1]
      const newSession: WorkoutSession = {
        id: crypto.randomUUID(),
        workoutId: workout.id,
        date: new Date().toISOString().slice(0, 10),
        label: label ?? `Sessão ${sessionsOf.length + 1}`,
        entries: workout.exercises.map((ex) => {
          const last = prev?.entries.find((e) => e.exerciseId === ex.id)
          return {
            exerciseId: ex.id,
            performedReps: null,
            currentWeight: last?.currentWeight ?? null,
          }
        }),
      }
      return {
        ...d,
        sessions: [...d.sessions, newSession],
        activeSessionId: newSession.id,
      }
    })
  }, [])

  const setActiveSession = useCallback((id: string) => {
    setData((d) => ({ ...d, activeSessionId: id }))
  }, [])

  const deleteSession = useCallback((id: string) => {
    setData((d) => {
      const target = d.sessions.find((s) => s.id === id)
      if (!target) return d
      const same = d.sessions.filter((s) => s.workoutId === target.workoutId)
      if (same.length <= 1) return d
      const sessions = d.sessions.filter((s) => s.id !== id)
      const remaining = sessions.filter((s) => s.workoutId === target.workoutId)
      return {
        ...d,
        sessions,
        activeSessionId:
          d.activeSessionId === id
            ? remaining[remaining.length - 1].id
            : d.activeSessionId,
      }
    })
  }, [])

  const resetAll = useCallback(() => {
    setData(structuredClone(INITIAL_DATA))
  }, [])

  return {
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
  }
}

export function getActiveWorkout(data: AppData): WorkoutProgram {
  return getWorkout(data)
}

export function getActiveSession(data: AppData): WorkoutSession | undefined {
  const workout = getActiveWorkout(data)
  const sessions = data.sessions.filter((s) => s.workoutId === workout.id)
  return (
    sessions.find((s) => s.id === data.activeSessionId) ??
    sessions[sessions.length - 1]
  )
}

export function getPreviousWeight(
  data: AppData,
  exerciseId: string,
  currentSessionId: string
): number | null {
  const current = data.sessions.find((s) => s.id === currentSessionId)
  if (!current) return null
  const same = data.sessions.filter((s) => s.workoutId === current.workoutId)
  const idx = same.findIndex((s) => s.id === currentSessionId)
  for (let i = idx - 1; i >= 0; i--) {
    const entry = same[i].entries.find((e) => e.exerciseId === exerciseId)
    if (entry?.currentWeight != null && entry.currentWeight > 0) {
      return entry.currentWeight
    }
  }
  return null
}
