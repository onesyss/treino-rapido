/**
 * Catálogo de mídia dos exercícios seed.
 * Fontes:
 *  1. ExerciseGymGifsDB (GIFs — jsDelivr)
 *  2. hasaneyldrm/exercises-dataset (GIFs)
 *  3. yuhonas/free-exercise-db (fotos .jpg no GitHub raw)
 */

export const GIF_PRIMARY =
  'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0'

export const GIF_ALT =
  'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main'

/** free-exercise-db — imagens estáticas de execução */
export const FREE_DB =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

export const GIF_CREDIT_PRIMARY = 'Animação: ExerciseGymGifsDB · Gym Visual'
export const GIF_CREDIT_ALT = 'Animação: Gym Visual · exercises-dataset'
export const GIF_CREDIT_FREE_DB = 'Foto: free-exercise-db · yuhonas'

function primary(path: string) {
  return `${GIF_PRIMARY}/${path}`
}

function alt(video: string) {
  return `${GIF_ALT}/videos/${video}`
}

/** @param folder pasta do exercício no free-exercise-db · @param n 0 ou 1 */
function freeDb(folder: string, n: 0 | 1 = 1) {
  return `${FREE_DB}/${folder}/${n}.jpg`
}

export type GifEntry = {
  /** Principal (preferir GIF animado) */
  gifUrl: string
  /** Secundário (legado) */
  gifFallback?: string
  /** Cadeia extra de URLs (outro repo, foto, etc.) */
  fallbacks?: string[]
  gifCredit?: string
}

/** Todas as URLs candidatas, sem duplicar. */
export function sourcesFromEntry(entry?: GifEntry, exerciseGif?: string): string[] {
  if (!entry && !exerciseGif) return []
  const list = [
    exerciseGif,
    entry?.gifUrl,
    entry?.gifFallback,
    ...(entry?.fallbacks ?? []),
  ].filter((u): u is string => Boolean(u))
  return [...new Set(list)]
}

export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[°º]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Mapa canônico: cada exercise seed tem URL verificada.
 * GIFs primeiro; free-exercise-db como rede de segurança.
 */
export const GIF_BY_NAME: Record<string, GifEntry> = {
  abdutora: {
    gifUrl: primary('abductors/lever-seated-hip-abduction.gif'),
    fallbacks: [freeDb('Thigh_Abductor')],
  },
  extensora: {
    gifUrl: primary('quads/lever-leg-extension.gif'),
    fallbacks: [freeDb('Leg_Extensions')],
  },
  agacho: {
    gifUrl: primary('glutes/barbell-full-squat.gif'),
    fallbacks: [freeDb('Barbell_Full_Squat'), freeDb('Barbell_Squat')],
  },
  stiff: {
    gifUrl: primary('hamstrings/barbell-straight-leg-deadlift.gif'),
    fallbacks: [freeDb('Romanian_Deadlift'), freeDb('Stiff-Legged_Barbell_Deadlift')],
  },
  'elevacao pelvica': {
    gifUrl: primary('glutes/barbell-glute-bridge-two-legs-on-bench-male.gif'),
    fallbacks: [freeDb('Barbell_Hip_Thrust'), freeDb('Barbell_Glute_Bridge')],
  },
  'leg 45': {
    gifUrl: primary('glutes/sled-45-leg-press.gif'),
    fallbacks: [freeDb('Narrow_Stance_Leg_Press'), freeDb('Leg_Press')],
  },
  'cadeira flexora': {
    gifUrl: primary('hamstrings/lever-seated-leg-curl.gif'),
    fallbacks: [freeDb('Seated_Leg_Curl'), freeDb('Lying_Leg_Curls')],
  },
  panturrilha: {
    gifUrl: primary('calves/barbell-standing-calf-raise.gif'),
    fallbacks: [freeDb('Standing_Calf_Raises'), freeDb('Barbell_Seated_Calf_Raise')],
  },
  'suspensao na barra': {
    gifUrl: alt('0688-uTBt1HV.gif'),
    gifFallback: primary('lats/pull-up.gif'),
    fallbacks: [freeDb('Scapular_Pull-Up'), freeDb('One_Handed_Hang'), freeDb('Pullups')],
    gifCredit: GIF_CREDIT_ALT,
  },
  'remada curvada': {
    gifUrl: primary('upper-back/barbell-bent-over-row.gif'),
    fallbacks: [freeDb('Bent_Over_Barbell_Row'), freeDb('Reverse_Grip_Bent-Over_Rows')],
  },
  'puxada aberta': {
    gifUrl: primary('lats/cable-bar-lateral-pulldown.gif'),
    gifFallback: primary('lats/cable-pulldown.gif'),
    // wide grip + close grip (user) do free-exercise-db
    fallbacks: [
      freeDb('Wide-Grip_Lat_Pulldown'),
      freeDb('Close-Grip_Front_Lat_Pulldown'),
      freeDb('Close-Grip_Front_Lat_Pulldown', 0),
      freeDb('V-Bar_Pulldown'),
    ],
  },
  'remada articulada': {
    gifUrl: primary('upper-back/lever-seated-row.gif'),
    fallbacks: [freeDb('Seated_Cable_Rows'), freeDb('Leverage_Iso_Row')],
  },
  'puxada unilateral': {
    gifUrl: primary('lats/cable-one-arm-pulldown.gif'),
    gifFallback: alt('3563-U5INZY6.gif'),
    fallbacks: [
      freeDb('Close-Grip_Front_Lat_Pulldown'),
      freeDb('One-Arm_Kettlebell_Row'),
    ],
  },
  /** Pulldown clássico / puxada na polia — prioriza a foto close-grip que o user passou */
  pulldown: {
    gifUrl: freeDb('Close-Grip_Front_Lat_Pulldown'),
    gifFallback: freeDb('Close-Grip_Front_Lat_Pulldown', 0),
    fallbacks: [
      freeDb('V-Bar_Pulldown'),
      freeDb('Wide-Grip_Lat_Pulldown'),
      primary('lats/cable-straight-arm-pulldown.gif'),
      alt('0238-x69MAlq.gif'),
    ],
    gifCredit: GIF_CREDIT_FREE_DB,
  },
  'rosca scott': {
    gifUrl: primary('biceps/barbell-preacher-curl.gif'),
    fallbacks: [freeDb('Preacher_Curl'), freeDb('Barbell_Curl')],
  },
  'supino declinado maquina': {
    gifUrl: primary('pectorals/lever-chest-press.gif'),
    fallbacks: [freeDb('Decline_Dumbbell_Bench_Press'), freeDb('Machine_Bench_Press')],
  },
  'supino com halteres': {
    gifUrl: primary('pectorals/dumbbell-bench-press.gif'),
    fallbacks: [freeDb('Dumbbell_Bench_Press'), freeDb('Barbell_Bench_Press_-_Medium_Grip')],
  },
  'triceps frances': {
    gifUrl: primary('triceps/dumbbell-seated-triceps-extension.gif'),
    fallbacks: [freeDb('Seated_Bent-Over_Two-Arm_Dumbbell_Triceps_Extension'), freeDb('Standing_Dumbbell_Triceps_Extension')],
  },
  'triceps maquina': {
    gifUrl: primary('triceps/lever-triceps-extension.gif'),
    fallbacks: [freeDb('Triceps_Pushdown')],
  },
  'elevacao lateral': {
    gifUrl: primary('delts/dumbbell-lateral-raise.gif'),
    fallbacks: [freeDb('Side_Lateral_Raise'), freeDb('Cable_Seated_Lateral_Raise')],
  },
  'desenvolvimento militar': {
    gifUrl: primary('delts/barbell-seated-overhead-press.gif'),
    fallbacks: [freeDb('Barbell_Shoulder_Press')],
  },
  'face pull': {
    gifUrl: primary('delts/cable-standing-rear-delt-row-with-rope.gif'),
    gifFallback: primary('delts/cable-rear-delt-row-with-rope.gif'),
    fallbacks: [freeDb('Face_Pull'), freeDb('Cable_Rear_Delt_Fly')],
  },
  cardio: {
    // demo genérica de cardio (não amarra a uma modalidade)
    gifUrl: primary('cardio/stationary-bike-walk.gif'),
    gifFallback: primary('cardio/walk-elliptical-cross-trainer.gif'),
    fallbacks: [
      freeDb('Elliptical_Trainer'),
      freeDb('Jogging_Treadmill'),
      freeDb('Air_Bike'),
      primary('cardio/walking-on-incline-treadmill.gif'),
      alt('2141-rjtuP6X.gif'),
    ],
  },
}

export function gifForName(name: string): GifEntry | undefined {
  const key = normalizeExerciseName(name)
  if (key === 'cardio' || key.startsWith('cardio ')) return GIF_BY_NAME.cardio
  return GIF_BY_NAME[key]
}

export function isCardioExerciseName(name: string): boolean {
  const key = normalizeExerciseName(name)
  return key === 'cardio' || key.startsWith('cardio ')
}

export const GIF_SUSPENSAO = GIF_BY_NAME['suspensao na barra'].gifUrl
