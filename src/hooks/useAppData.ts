import { useCallback, useEffect, useState } from 'react'
import { INITIAL_DATA, sortByFichaOrder } from '../data/initialData'
import type { AppData, Exercise, SessionEntry, WorkoutSession } from '../types'

const STORAGE_KEY = 'treino-rapido-v6'

function normalizeGroup(
  group: string,
  exerciseName: string
): import('../types').MuscleGroup {
  // panturrilha sempre faz parte do treino de perna (não é categoria própria)
  if (
    group === 'Panturrilha' ||
    exerciseName.toLowerCase().includes('panturrilha')
  ) {
    return 'Pernas'
  }
  return group as import('../types').MuscleGroup
}

function load(): AppData {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem('treino-rapido-v5') ??
      localStorage.getItem('treino-rapido-v4')
    if (!raw) return structuredClone(INITIAL_DATA)
    const parsed = JSON.parse(raw) as AppData
    if (!parsed.exercises?.length || !parsed.exercises[0]?.steps) {
      return structuredClone(INITIAL_DATA)
    }
    const byName = new Map(INITIAL_DATA.exercises.map((e) => [e.name.toLowerCase(), e]))
    byName.set('agachamento', INITIAL_DATA.exercises.find((e) => e.name === 'Agacho')!)

    parsed.exercises = sortByFichaOrder(
      parsed.exercises.map((ex) => {
        const key = ex.name.toLowerCase()
        const seed =
          byName.get(key) ||
          (key === 'agachamento' ? byName.get('agacho') : undefined)
        const name = key === 'agachamento' ? 'Agacho' : ex.name
        // seed da ficha manda no grupo muscular (Panturrilha → Pernas)
        const muscleGroup =
          seed?.muscleGroup ??
          normalizeGroup(String(ex.muscleGroup), name)
        return {
          ...ex,
          name,
          muscleGroup,
          gifUrl: ex.gifUrl || seed?.gifUrl,
          gifCredit: ex.gifCredit ?? seed?.gifCredit,
          motion: ex.motion || seed?.motion || 'generic',
        }
      })
    )
    return parsed
  } catch {
    return structuredClone(INITIAL_DATA)
  }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(() => load())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const updateProfile = useCallback(
    (
      partial: Partial<
        Pick<AppData, 'profileName' | 'workoutTitle' | 'warmupNote' | 'coreNote' | 'goals'>
      >
    ) => {
      setData((d) => ({ ...d, ...partial }))
    },
    []
  )

  const setExercises = useCallback((exercises: Exercise[]) => {
    setData((d) => {
      const ordered = sortByFichaOrder(
        exercises.map((ex) => ({
          ...ex,
          muscleGroup: normalizeGroup(String(ex.muscleGroup), ex.name),
        }))
      )
      const ids = new Set(ordered.map((e) => e.id))
      const sessions = d.sessions.map((s) => ({
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
      }))
      return { ...d, exercises: ordered, sessions }
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
      const prev = getActiveSession(d)
      const newSession: WorkoutSession = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        label: label ?? `Sessão ${d.sessions.length + 1}`,
        entries: d.exercises.map((ex) => {
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
      if (d.sessions.length <= 1) return d
      const sessions = d.sessions.filter((s) => s.id !== id)
      return {
        ...d,
        sessions,
        activeSessionId:
          d.activeSessionId === id ? sessions[sessions.length - 1].id : d.activeSessionId,
      }
    })
  }, [])

  const resetAll = useCallback(() => {
    setData(structuredClone(INITIAL_DATA))
  }, [])

  return {
    data,
    updateProfile,
    setExercises,
    updateEntry,
    addSession,
    setActiveSession,
    deleteSession,
    resetAll,
  }
}

export function getActiveSession(data: AppData): WorkoutSession | undefined {
  return (
    data.sessions.find((s) => s.id === data.activeSessionId) ??
    data.sessions[data.sessions.length - 1]
  )
}

export function getPreviousWeight(
  data: AppData,
  exerciseId: string,
  currentSessionId: string
): number | null {
  const idx = data.sessions.findIndex((s) => s.id === currentSessionId)
  for (let i = idx - 1; i >= 0; i--) {
    const entry = data.sessions[i].entries.find((e) => e.exerciseId === exerciseId)
    if (entry?.currentWeight != null && entry.currentWeight > 0) {
      return entry.currentWeight
    }
  }
  return null
}
