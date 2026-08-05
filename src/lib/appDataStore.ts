import { GIF_CREDIT_PRIMARY, gifForName, normalizeExerciseName } from '../data/gifs'
import { INITIAL_DATA } from '../data/initialData'
import type { AppData, Exercise, WorkoutProgram } from '../types'
import { getSupabase, isSupabaseConfigured } from './supabase'

const LOCAL_LEGACY_KEYS = [
  'treino-rapido-v8',
  'treino-rapido-v7',
  'treino-rapido-v6',
  'treino-rapido-v5',
  'treino-rapido-v1',
]

const WORKOUT_OMBROS_ID = 'wk-ombros'
const WORKOUT_PEITO_TRICEPS_ID = 'wk-peito-triceps'
const WORKOUT_COSTAS_BICEPS_ID = 'wk-costas-biceps'

function isValidStored(data: unknown): data is AppData {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as AppData).workouts) &&
    (data as AppData).workouts.length >= 4
  )
}

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

function reconcileFromSeed(stored: WorkoutProgram, seed: WorkoutProgram): WorkoutProgram {
  const byName = new Map(
    stored.exercises.map((e) => [normalizeExerciseName(e.name), e] as const)
  )
  const exercises = seed.exercises.map((se) => {
    const existing = byName.get(normalizeExerciseName(se.name))
    if (!existing) return structuredClone(se)
    const base = {
      ...existing,
      name: se.name,
      sets: se.sets,
      targetReps: se.targetReps,
      warmup: se.warmup,
      notes: se.notes,
      tips: se.tips,
      steps: se.steps,
      muscleGroup: se.muscleGroup,
      motion: se.motion,
    }
    if (normalizeExerciseName(se.name) === 'cardio') {
      return repairExerciseGifs({
        ...base,
        name: 'Cardio',
        notes: undefined,
      })
    }
    return repairExerciseGifs(base)
  })
  return {
    ...stored,
    title: seed.title,
    shortLabel: seed.shortLabel,
    warmupNote: seed.warmupNote,
    coreNote: seed.coreNote,
    goals: seed.goals,
    exercises,
  }
}

export function normalizeAppData(raw: AppData): AppData {
  let data = structuredClone(raw)
  for (const w of data.workouts) {
    w.exercises = w.exercises.map(repairExerciseGifs)
  }
  if (!data.workouts.some((w) => w.id === data.activeWorkoutId)) {
    data.activeWorkoutId = data.workouts[0]?.id ?? ''
  }
  if (!data.profileName?.trim() || data.profileName.trim() === 'Atleta') {
    data.profileName = 'Marlon Miranda'
  }

  let workouts = data.workouts.map((w) => {
    const seed = INITIAL_DATA.workouts.find((s) => s.id === w.id)
    if (!seed) return w
    if (w.id === WORKOUT_PEITO_TRICEPS_ID || w.id === WORKOUT_COSTAS_BICEPS_ID) {
      return reconcileFromSeed(w, seed)
    }
    const have = new Set(w.exercises.map((e) => normalizeExerciseName(e.name)))
    const missing = seed.exercises.filter(
      (se) => !have.has(normalizeExerciseName(se.name))
    )
    const exercises = w.exercises.map((ex) => {
      if (normalizeExerciseName(ex.name) !== 'cardio') return repairExerciseGifs(ex)
      const seedCardio = seed.exercises.find(
        (se) => normalizeExerciseName(se.name) === 'cardio'
      )
      if (!seedCardio) return repairExerciseGifs(ex)
      return repairExerciseGifs({
        ...ex,
        name: 'Cardio',
        notes: undefined,
        tips: seedCardio.tips,
        steps: seedCardio.steps,
        muscleGroup: 'Cardio',
        motion: seedCardio.motion,
        sets: seedCardio.sets,
        targetReps: seedCardio.targetReps,
      })
    })
    if (!missing.length) return { ...w, exercises }
    return {
      ...w,
      exercises: [...exercises, ...missing.map((e) => structuredClone(e))],
    }
  })

  const sessions = data.sessions.map((s) => {
    const workout = workouts.find((w) => w.id === s.workoutId)
    if (!workout) return s
    const haveIds = new Set(s.entries.map((e) => e.exerciseId))
    const extra = workout.exercises
      .filter((ex) => !haveIds.has(ex.id))
      .map((ex) => ({
        exerciseId: ex.id,
        performedReps: null as number | null,
        currentWeight: null as number | null,
        cardioType: null as string | null,
      }))
    if (!extra.length) return s
    return { ...s, entries: [...s.entries, ...extra] }
  })

  workouts = workouts.map((w) => {
    if (w.id !== WORKOUT_OMBROS_ID) return w
    const seed = INITIAL_DATA.workouts.find((s) => s.id === WORKOUT_OMBROS_ID)
    if (!seed) return w
    return {
      ...w,
      title: seed.title,
      shortLabel: seed.shortLabel,
      warmupNote: seed.warmupNote,
      coreNote: seed.coreNote,
      goals: seed.goals,
    }
  })

  return { ...data, workouts, sessions }
}

function readLegacyLocal(): AppData | null {
  for (const key of LOCAL_LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as unknown
      if (isValidStored(parsed)) return normalizeAppData(parsed)
    } catch {
      /* ignore */
    }
  }
  return null
}

function clearLegacyLocal() {
  for (const key of LOCAL_LEGACY_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }
}

/** Garante sessão (anônima se necessário) e devolve o user id. */
export async function ensureAuthUserId(): Promise<string> {
  const supabase = getSupabase()
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  if (sessionData.session?.user?.id) return sessionData.session.user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    const msg = error.message || String(error)
    if (/anonymous/i.test(msg) && /disabled/i.test(msg)) {
      throw new Error(
        'Anonymous sign-ins estão desativados no Supabase. Ative em: Authentication → Sign In / Providers → Anonymous → Enable. Depois recarregue a página.'
      )
    }
    throw error
  }
  if (!data.user?.id) throw new Error('Falha ao autenticar (anônimo).')
  return data.user.id
}

/**
 * Carrega o estado no Supabase.
 * Se não houver linha, migra localStorage legado uma vez e salva no cloud.
 */
export async function loadAppDataFromSupabase(): Promise<AppData> {
  if (!isSupabaseConfigured()) {
    return normalizeAppData(structuredClone(INITIAL_DATA))
  }

  const supabase = getSupabase()
  const userId = await ensureAuthUserId()

  const { data: row, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  const payload = row?.data as AppData | undefined
  if (payload && isValidStored(payload)) {
    return normalizeAppData(payload)
  }

  // Primeira vez: migrar do local ou usar seed
  const legacy = readLegacyLocal()
  const initial = normalizeAppData(legacy ?? structuredClone(INITIAL_DATA))

  const { error: upsertError } = await supabase.from('app_state').upsert({
    user_id: userId,
    data: initial,
  })

  if (upsertError) throw upsertError

  // Migração concluída: remove cache local antigo
  clearLegacyLocal()

  return initial
}

export async function saveAppDataToSupabase(data: AppData): Promise<void> {
  if (!isSupabaseConfigured()) return

  const supabase = getSupabase()
  const userId = await ensureAuthUserId()

  const { error } = await supabase.from('app_state').upsert({
    user_id: userId,
    data,
  })

  if (error) throw error
}
