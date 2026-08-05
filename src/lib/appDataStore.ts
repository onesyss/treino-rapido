import { GIF_CREDIT_PRIMARY, gifForName, isCardioExerciseName, normalizeExerciseName } from '../data/gifs'
import { INITIAL_DATA } from '../data/initialData'
import type { AppData, Exercise, WorkoutProgram } from '../types'
import { getSupabase, isSupabaseConfigured } from './supabase'
import { isSharedTableMissingError, SHARED_SETUP_SQL } from './sharedSetupSql'

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

/** Quanto mais preenchido, maior o score — evita aparelho vazio apagar o treino do tablet. */
export function fillScore(data: AppData | null | undefined): number {
  if (!data || !isValidStored(data)) return -1
  let score = 0
  score += data.sessions.length * 3
  for (const s of data.sessions) {
    for (const e of s.entries) {
      if (e.currentWeight != null && e.currentWeight > 0) score += 4
      if (e.performedReps != null && e.performedReps > 0) score += 4
      if (e.cardioType) score += 2
    }
  }
  score += data.workouts.reduce((n, w) => n + w.exercises.length, 0)
  return score
}

function pickRichest(...candidates: Array<AppData | null | undefined>): AppData {
  let best: AppData = normalizeAppData(structuredClone(INITIAL_DATA))
  let bestScore = fillScore(best)
  for (const c of candidates) {
    if (!c || !isValidStored(c)) continue
    const n = normalizeAppData(c)
    const s = fillScore(n)
    if (s > bestScore) {
      best = n
      bestScore = s
    }
  }
  return best
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

export function writeLocalMirror(data: AppData) {
  try {
    localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

function clearOldLegacyKeys() {
  for (const key of LOCAL_LEGACY_KEYS) {
    if (key === LOCAL_MIRROR_KEY) continue
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }
}

/** Garante sessão (anônima se necessário). Falha NÃO bloqueia o shared se tiver ok. */
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
        'Anonymous sign-ins estão desativados no Supabase. Ative em: Authentication → Providers → Anonymous.'
      )
    }
    throw error
  }
  if (!data.user?.id) throw new Error('Falha ao autenticar (anônimo).')
  return data.user.id
}

function sharedMissingMessage(detail: string): string {
  return (
    'Falta criar a tabela shared_app_state no Supabase. ' +
    'Abra o projeto qjkdtipsshfjqttbpwpj → SQL Editor → cole o SQL do botão “Copiar SQL” e clique Run. ' +
    'Espere 10s e toque em “Tentar de novo”. ' +
    `Detalhe: ${detail}`
  )
}

function isMissingSharedTable(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false
  return isSharedTableMissingError(err.message) || err.code === 'PGRST205' || err.code === '42P01'
}

async function upsertShared(data: AppData): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('shared_app_state').upsert({
    id: SHARED_STATE_ID,
    data,
  })
  if (error) throw new Error(sharedMissingMessage(error.message))
}

async function loadPrivateAndLocal(): Promise<AppData> {
  const supabase = getSupabase()
  let own: AppData | null = null
  try {
    const userId = await ensureAuthUserId()
    const ownRes = await supabase
      .from('app_state')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
    if (!ownRes.error && ownRes.data?.data && isValidStored(ownRes.data.data)) {
      own = normalizeAppData(ownRes.data.data as AppData)
    }
  } catch (e) {
    console.warn('[Supabase] auth/backup:', e)
  }
  return pickRichest(own, readLegacyLocal())
}

/**
 * Fonte única: shared_app_state (id=main) = mesmo treino em tablet e celular.
 * Se a tabela não existir, usa backup local/privado e devolve erro para o app mostrar o SQL.
 */
export async function loadAppDataFromSupabase(): Promise<AppData> {
  if (!isSupabaseConfigured()) {
    const data = pickRichest(readLegacyLocal())
    writeLocalMirror(data)
    return data
  }

  const supabase = getSupabase()

  const sharedRes = await supabase
    .from('shared_app_state')
    .select('data')
    .eq('id', SHARED_STATE_ID)
    .maybeSingle()

  if (sharedRes.error && isMissingSharedTable(sharedRes.error)) {
    // App continua com dados locais/privados, mas sinaliza SQL obrigatório
    const fallback = await loadPrivateAndLocal()
    writeLocalMirror(fallback)
    const err = new Error(sharedMissingMessage(sharedRes.error.message))
    ;(err as Error & { fallbackData?: AppData; needsSetupSql?: boolean }).fallbackData = fallback
    ;(err as Error & { needsSetupSql?: boolean }).needsSetupSql = true
    throw err
  }

  if (sharedRes.error) {
    throw new Error(sharedMissingMessage(sharedRes.error.message))
  }

  const shared =
    sharedRes.data?.data && isValidStored(sharedRes.data.data)
      ? normalizeAppData(sharedRes.data.data as AppData)
      : null

  let own: AppData | null = null
  try {
    const userId = await ensureAuthUserId()
    const ownRes = await supabase
      .from('app_state')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
    if (!ownRes.error && ownRes.data?.data && isValidStored(ownRes.data.data)) {
      own = normalizeAppData(ownRes.data.data as AppData)
    }
  } catch (e) {
    console.warn('[Supabase] auth/backup opcional:', e)
  }

  const chosen = pickRichest(shared, own, readLegacyLocal())
  writeLocalMirror(chosen)
  clearOldLegacyKeys()

  if (!shared || fillScore(chosen) > fillScore(shared)) {
    await upsertShared(chosen)
  }

  try {
    const userId = await ensureAuthUserId()
    await supabase.from('app_state').upsert({ user_id: userId, data: chosen })
  } catch {
    /* ignore */
  }

  return chosen
}

export async function saveAppDataToSupabase(data: AppData): Promise<void> {
  writeLocalMirror(data)
  if (!isSupabaseConfigured()) return

  try {
    await upsertShared(data)
  } catch (e) {
    // Ainda salva backup privado para não perder no aparelho
    try {
      const userId = await ensureAuthUserId()
      const supabase = getSupabase()
      await supabase.from('app_state').upsert({ user_id: userId, data })
    } catch {
      /* ignore */
    }
    throw e
  }

  try {
    const userId = await ensureAuthUserId()
    const supabase = getSupabase()
    await supabase.from('app_state').upsert({ user_id: userId, data })
  } catch {
    /* backup opcional */
  }
}

/** Recarrega a nuvem (ex.: ao voltar pro app no celular). */
export async function reloadRichestFromCloud(): Promise<AppData> {
  return loadAppDataFromSupabase()
}

export { SHARED_SETUP_SQL }
