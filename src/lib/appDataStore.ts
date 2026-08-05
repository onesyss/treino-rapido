import { GIF_CREDIT_PRIMARY, gifForName, isCardioExerciseName, normalizeExerciseName } from '../data/gifs'
import { INITIAL_DATA } from '../data/initialData'
import type { AppData, Exercise, WorkoutProgram } from '../types'
import { getSupabase, isSupabaseConfigured } from './supabase'

const LOCAL_LEGACY_KEYS = [
  'treino-rapido-v9',
  'treino-rapido-v8',
  'treino-rapido-v7',
  'treino-rapido-v6',
  'treino-rapido-v5',
  'treino-rapido-v1',
]

const LOCAL_MIRROR_KEY = 'treino-rapido-v9'
const SHARED_STATE_ID = 'main'

const WORKOUT_OMBROS_ID = 'wk-ombros'
const WORKOUT_PEITO_TRICEPS_ID = 'wk-peito-triceps'
const WORKOUT_COSTAS_BICEPS_ID = 'wk-costas-biceps'

function isCardioExercise(ex: Pick<Exercise, 'name' | 'muscleGroup'>): boolean {
  return ex.muscleGroup === 'Cardio' || isCardioExerciseName(ex.name)
}

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
  if (isCardioExercise(next)) {
    next = { ...next, muscleGroup: 'Cardio', motion: 'cardio' }
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

function repairCardioFromSeed(ex: Exercise, seedCardio: Exercise | undefined): Exercise {
  if (!seedCardio) return repairExerciseGifs(ex)
  return repairExerciseGifs({
    ...ex,
    // preserva "Cardio 2", etc.
    name: ex.name?.trim() || 'Cardio',
    notes: ex.notes,
    tips: seedCardio.tips,
    steps: seedCardio.steps,
    muscleGroup: 'Cardio',
    motion: 'cardio',
    sets: seedCardio.sets,
    targetReps: seedCardio.targetReps,
  })
}

function reconcileFromSeed(stored: WorkoutProgram, seed: WorkoutProgram): WorkoutProgram {
  const byName = new Map(
    stored.exercises.map((e) => [normalizeExerciseName(e.name), e] as const)
  )
  const usedIds = new Set<string>()
  const exercises = seed.exercises.map((se) => {
    const existing = byName.get(normalizeExerciseName(se.name))
    if (!existing) return structuredClone(se)
    usedIds.add(existing.id)
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
      return repairCardioFromSeed(
        { ...base, name: existing.name || 'Cardio', notes: existing.notes },
        se
      )
    }
    return repairExerciseGifs(base)
  })

  // preserva cardios extras (Cardio 2, 3…) adicionados pelo usuário
  const extraCardios = stored.exercises
    .filter((e) => isCardioExercise(e) && !usedIds.has(e.id))
    .map((e) =>
      repairCardioFromSeed(
        e,
        seed.exercises.find((se) => normalizeExerciseName(se.name) === 'cardio')
      )
    )

  return {
    ...stored,
    title: seed.title,
    shortLabel: seed.shortLabel,
    warmupNote: seed.warmupNote,
    coreNote: seed.coreNote,
    goals: seed.goals,
    exercises: [...exercises, ...extraCardios],
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
    const hasAnyCardio = w.exercises.some(isCardioExercise)
    const missing = seed.exercises.filter((se) => {
      const n = normalizeExerciseName(se.name)
      if (n === 'cardio') return !hasAnyCardio
      return !have.has(n)
    })
    const seedCardio = seed.exercises.find(
      (se) => normalizeExerciseName(se.name) === 'cardio'
    )
    const exercises = w.exercises.map((ex) => {
      if (!isCardioExercise(ex)) return repairExerciseGifs(ex)
      return repairCardioFromSeed(ex, seedCardio)
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

function writeLocalMirror(data: AppData) {
  try {
    localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

function clearLegacyLocal() {
  for (const key of LOCAL_LEGACY_KEYS) {
    if (key === LOCAL_MIRROR_KEY) continue
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
 * Carrega o estado:
 * 1) shared_app_state (mesmo treino em todos os aparelhos)
 * 2) app_state do usuário anônimo (legado)
 * 3) localStorage / seed
 * Sempre espelha no localStorage e promove para shared quando possível.
 */
export async function loadAppDataFromSupabase(): Promise<AppData> {
  if (!isSupabaseConfigured()) {
    const local = readLegacyLocal()
    const data = normalizeAppData(local ?? structuredClone(INITIAL_DATA))
    writeLocalMirror(data)
    return data
  }

  const supabase = getSupabase()
  const userId = await ensureAuthUserId()

  // 1) Estado compartilhado
  const sharedRes = await supabase
    .from('shared_app_state')
    .select('data')
    .eq('id', SHARED_STATE_ID)
    .maybeSingle()

  if (!sharedRes.error && sharedRes.data?.data && isValidStored(sharedRes.data.data)) {
    const data = normalizeAppData(sharedRes.data.data as AppData)
    writeLocalMirror(data)
    // mantém backup por user
    await supabase.from('app_state').upsert({ user_id: userId, data })
    return data
  }

  // 2) Linha do usuário (browser que já salvava antes)
  const ownRes = await supabase
    .from('app_state')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()

  if (ownRes.error) throw ownRes.error

  let payload: AppData | null = null
  if (ownRes.data?.data && isValidStored(ownRes.data.data)) {
    payload = normalizeAppData(ownRes.data.data as AppData)
  } else {
    const legacy = readLegacyLocal()
    payload = normalizeAppData(legacy ?? structuredClone(INITIAL_DATA))
  }

  writeLocalMirror(payload)

  // 3) Promove para shared (se a tabela existir)
  if (!sharedRes.error || !/shared_app_state|schema cache|does not exist|PGRST/i.test(
    String(sharedRes.error?.message ?? sharedRes.error?.code ?? '')
  )) {
    const { error: sharedUpsertError } = await supabase.from('shared_app_state').upsert({
      id: SHARED_STATE_ID,
      data: payload,
    })
    if (sharedUpsertError) {
      // tabela ainda não criada: ok, usa só app_state
      console.warn('[Supabase] shared_app_state indisponível:', sharedUpsertError.message)
    }
  }

  const { error: upsertError } = await supabase.from('app_state').upsert({
    user_id: userId,
    data: payload,
  })
  if (upsertError) throw upsertError

  clearLegacyLocal()
  return payload
}

export async function saveAppDataToSupabase(data: AppData): Promise<void> {
  writeLocalMirror(data)
  if (!isSupabaseConfigured()) return

  const supabase = getSupabase()
  const userId = await ensureAuthUserId()

  const shared = await supabase.from('shared_app_state').upsert({
    id: SHARED_STATE_ID,
    data,
  })
  if (shared.error) {
    console.warn('[Supabase] save shared:', shared.error.message)
  }

  const { error } = await supabase.from('app_state').upsert({
    user_id: userId,
    data,
  })
  if (error) throw error
}
