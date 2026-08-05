import { useCallback, useEffect, useRef, useState } from 'react'
import { INITIAL_DATA, getWorkout } from '../data/initialData'
import {
  loadAppDataFromSupabase,
  saveAppDataToSupabase,
} from '../lib/appDataStore'
import { isSupabaseConfigured } from '../lib/supabase'
import type {
  AppData,
  Exercise,
  SessionEntry,
  WorkoutProgram,
  WorkoutSession,
} from '../types'

export type SyncStatus = 'loading' | 'ready' | 'saving' | 'saved' | 'error'

export function useAppData() {
  const [data, setData] = useState<AppData | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading')
  const [syncError, setSyncError] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bootstrapped = useRef(false)

  // Carrega do Supabase (com migração de localStorage se existir)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setSyncStatus('loading')
        setSyncError(null)
        if (!isSupabaseConfigured()) {
          throw new Error(
            'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env (veja .env.example) e reinicie o npm run dev.'
          )
        }
        const loaded = await loadAppDataFromSupabase()
        if (cancelled) return
        setData(loaded)
        setSyncStatus('ready')
        bootstrapped.current = true
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Erro ao carregar dados'
        setSyncError(msg)
        setSyncStatus('error')
        // fallback só para não quebrar a UI — não persiste em localStorage
        setData(structuredClone(INITIAL_DATA))
        bootstrapped.current = true
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Persistência com debounce no Supabase
  useEffect(() => {
    if (!data || !bootstrapped.current) return
    if (!isSupabaseConfigured()) return
    if (syncStatus === 'loading') return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        setSyncStatus('saving')
        await saveAppDataToSupabase(data)
        setSyncStatus('saved')
        setSyncError(null)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao salvar'
        setSyncError(msg)
        setSyncStatus('error')
      }
    }, 500)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [data])

  const setActiveWorkout = useCallback((workoutId: string) => {
    setData((d) => {
      if (!d) return d
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
            cardioType: null,
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
    setData((d) =>
      d ? { ...d, profileName: profileName.trim() || 'Marlon Miranda' } : d
    )
  }, [])

  const updateActiveWorkoutMeta = useCallback(
    (partial: Partial<Pick<WorkoutProgram, 'title' | 'warmupNote' | 'coreNote' | 'goals'>>) => {
      setData((d) =>
        d
          ? {
              ...d,
              workouts: d.workouts.map((w) =>
                w.id === d.activeWorkoutId ? { ...w, ...partial } : w
              ),
            }
          : d
      )
    },
    []
  )

  const setExercises = useCallback((exercises: Exercise[]) => {
    setData((d) => {
      if (!d) return d
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
          entries: ordered
            .map((ex) => {
              const existing = s.entries.find((e) => e.exerciseId === ex.id)
              return (
                existing ?? {
                  exerciseId: ex.id,
                  performedReps: null as number | null,
                  currentWeight: null as number | null,
                  cardioType: null as string | null,
                }
              )
            })
            .filter((e) => ids.has(e.exerciseId)),
        }
      })
      return { ...d, workouts, sessions }
    })
  }, [])

  const addCardio = useCallback(() => {
    setData((d) => {
      if (!d) return d
      const workoutId = d.activeWorkoutId
      const workout = d.workouts.find((w) => w.id === workoutId)
      if (!workout) return d

      const cardioCount = workout.exercises.filter(
        (ex) =>
          ex.muscleGroup === 'Cardio' ||
          ex.name.toLowerCase().startsWith('cardio')
      ).length
      const template = workout.exercises.find(
        (ex) =>
          ex.muscleGroup === 'Cardio' ||
          ex.name.toLowerCase().startsWith('cardio')
      )
      const label = cardioCount === 0 ? 'Cardio' : `Cardio ${cardioCount + 1}`
      const neu: Exercise = {
        id: crypto.randomUUID(),
        name: label,
        muscleGroup: 'Cardio',
        sets: 1,
        targetReps: template?.targetReps ?? 20,
        motion: 'cardio',
        steps: template?.steps ?? [
          'Escolha o cardio do dia (esteira, bike, vôlei, etc.).',
          'Faça o tempo que quiser e anote os minutos.',
          'Se quiser, anote também a distância em km.',
          'Finalize no ritmo que preferir.',
        ],
        tips:
          template?.tips ??
          'Escreva o tipo (esteira, bike, vôlei…). Anote minutos e, se quiser, os km.',
        gifUrl: template?.gifUrl,
        gifCredit: template?.gifCredit,
      }

      const exercises = [...workout.exercises, neu]
      const workouts = d.workouts.map((w) =>
        w.id === workoutId ? { ...w, exercises } : w
      )
      const sessions = d.sessions.map((s) => {
        if (s.workoutId !== workoutId) return s
        if (s.entries.some((e) => e.exerciseId === neu.id)) return s
        return {
          ...s,
          entries: [
            ...s.entries,
            {
              exerciseId: neu.id,
              performedReps: null as number | null,
              currentWeight: null as number | null,
              cardioType: null as string | null,
            },
          ],
        }
      })
      return { ...d, workouts, sessions }
    })
  }, [])

  const removeCardio = useCallback((exerciseId: string) => {
    setData((d) => {
      if (!d) return d
      const workoutId = d.activeWorkoutId
      const workout = d.workouts.find((w) => w.id === workoutId)
      if (!workout) return d
      const target = workout.exercises.find((ex) => ex.id === exerciseId)
      if (
        !target ||
        (target.muscleGroup !== 'Cardio' &&
          !target.name.toLowerCase().startsWith('cardio'))
      ) {
        return d
      }
      const cardios = workout.exercises.filter(
        (ex) =>
          ex.muscleGroup === 'Cardio' ||
          ex.name.toLowerCase().startsWith('cardio')
      )
      if (cardios.length <= 1) return d

      const exercises = workout.exercises.filter((ex) => ex.id !== exerciseId)
      const workouts = d.workouts.map((w) =>
        w.id === workoutId ? { ...w, exercises } : w
      )
      const sessions = d.sessions.map((s) => {
        if (s.workoutId !== workoutId) return s
        return {
          ...s,
          entries: s.entries.filter((e) => e.exerciseId !== exerciseId),
        }
      })
      return { ...d, workouts, sessions }
    })
  }, [])

  const updateEntry = useCallback(
    (sessionId: string, exerciseId: string, patch: Partial<SessionEntry>) => {
      setData((d) =>
        d
          ? {
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
            }
          : d
      )
    },
    []
  )

  const addSession = useCallback((label?: string) => {
    setData((d) => {
      if (!d) return d
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
            cardioType: last?.cardioType ?? null,
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
    setData((d) => (d ? { ...d, activeSessionId: id } : d))
  }, [])

  const deleteSession = useCallback((id: string) => {
    setData((d) => {
      if (!d) return d
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

  const retrySync = useCallback(async () => {
    if (!data) return
    try {
      setSyncStatus('saving')
      await saveAppDataToSupabase(data)
      setSyncStatus('saved')
      setSyncError(null)
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Erro ao salvar')
      setSyncStatus('error')
    }
  }, [data])

  return {
    data,
    syncStatus,
    syncError,
    isLoading: data == null || syncStatus === 'loading',
    setActiveWorkout,
    updateProfile,
    updateActiveWorkoutMeta,
    setExercises,
    addCardio,
    removeCardio,
    updateEntry,
    addSession,
    setActiveSession,
    deleteSession,
    resetAll,
    retrySync,
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
