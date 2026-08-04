import type { AppData, Exercise, WorkoutProgram } from '../types'
import { GIF_CREDIT_PRIMARY, gifForName } from './gifs'

function id() {
  return crypto.randomUUID()
}

function ex(
  partial: Omit<Exercise, 'gifCredit' | 'steps' | 'tips' | 'motion' | 'gifUrl'> & {
    motion?: Exercise['motion']
    steps?: string[]
    tips?: string
    gifUrl?: string
    gifCredit?: string
  }
): Exercise {
  const catalog = gifForName(partial.name)
  const { gifUrl: overrideUrl, gifCredit: overrideCredit, ...rest } = partial
  return {
    motion: 'generic',
    steps: [
      'Posicione-se e ajuste a carga.',
      'Execute o movimento com controle.',
      'Mantenha postura e core firme.',
      'Volte à posição inicial de forma lenta.',
    ],
    tips: 'Foque na amplitude e no músculo-alvo.',
    ...rest,
    gifUrl: overrideUrl ?? catalog?.gifUrl,
    gifCredit: overrideCredit ?? catalog?.gifCredit ?? GIF_CREDIT_PRIMARY,
  }
}

export { GIF_SUSPENSAO, gifForName } from './gifs'
export { GIF_BY_NAME } from './gifs'

// --- IDs treino pernas ---
const EX_ABDUTORA = id()
const EX_EXTENSORA = id()
const EX_AGACHO = id()
const EX_STIFF = id()
const EX_PELVICA = id()
const EX_LEG45 = id()
const EX_FLEXORA = id()
const EX_PANTURRILHA = id()

// --- IDs treino A ---
const EX_SUSPENSAO = id()
const EX_REMADA_CURVADA = id()
const EX_PUXADA_ABERTA = id()
const EX_REMADA_ART = id()
const EX_PUXADA_UNI = id()
const EX_PULLDOWN = id()
const EX_FACE_PULL = id()
const EX_ROSCA_SCOTT = id()

// --- IDs treino B ---
const EX_SUPINO_DECL = id()
const EX_SUPINO_HALT = id()
const EX_ELEV_LAT = id()
const EX_DEV_MILITAR = id()
const EX_TRI_FRANCES = id()
const EX_TRI_MAQ = id()
const EX_OMBRO_ROSCA = id()
const EX_OMBRO_TRI_FR = id()
const EX_OMBRO_TRI_MQ = id()

const WORKOUT_PERNAS = 'wk-pernas'
const WORKOUT_COSTAS_BICEPS = 'wk-costas-biceps'
const WORKOUT_PEITO_TRICEPS = 'wk-peito-triceps'
const WORKOUT_OMBROS = 'wk-ombros'

const today = new Date().toISOString().slice(0, 10)

const pernas: WorkoutProgram = {
  id: WORKOUT_PERNAS,
  title: 'Treino de perna 2x semana',
  shortLabel: 'Perna',
  warmupNote: 'Mobilidade — tornozelo, joelho e quadril',
  coreNote: 'Abdominal → prancha e alongamentos do core',
  goals: ['↑ volume', '↑ amplitude'],
  exercises: [
    ex({
      id: EX_ABDUTORA,
      name: 'Abdutora',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 15,
      motion: 'abduction',
      steps: [
        'Sente-se com a coluna e o quadril firmes no encosto.',
        'Posicione as pernas nos pads internos, pés firmes.',
        'Empurre as pernas para fora com controle (abdução).',
        'Volte lentamente sem deixar os pesos baterem.',
      ],
      tips: 'Não balance o tronco. Foque glúteo médio e controle a volta.',
    }),
    ex({
      id: EX_EXTENSORA,
      name: 'Extensora',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 10,
      warmup: '1×15 aquecimento',
      motion: 'extension',
    }),
    ex({
      id: EX_AGACHO,
      name: 'Agacho',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 10,
      warmup: '1×15 aquecimento',
      motion: 'squat',
    }),
    ex({
      id: EX_STIFF,
      name: 'Stiff',
      muscleGroup: 'Pernas',
      sets: 4,
      targetReps: 10,
      motion: 'hinge',
    }),
    ex({
      id: EX_PELVICA,
      name: 'Elevação pélvica',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 10,
      warmup: '1×12 aquecimento',
      motion: 'hipthrust',
    }),
    ex({
      id: EX_LEG45,
      name: 'Leg 45°',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 12,
      motion: 'legpress',
    }),
    ex({
      id: EX_FLEXORA,
      name: 'Cadeira flexora',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 12,
      motion: 'curl',
    }),
    ex({
      id: EX_PANTURRILHA,
      name: 'Panturrilha',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 15,
      notes: 'Fazer 3× na semana',
      motion: 'calf',
    }),
  ],
}

const costasBiceps: WorkoutProgram = {
  id: WORKOUT_COSTAS_BICEPS,
  title: 'Treino A — Costas e Bíceps',
  shortLabel: 'Costas e Bíceps',
  warmupNote: 'Superiores · puxar',
  coreNote: 'Escápulas e cotovelos firmes',
  goals: ['↑ volume', '↑ controle'],
  exercises: [
    ex({
      id: EX_SUSPENSAO,
      name: 'Suspensão na barra',
      muscleGroup: 'Costas',
      sets: 2,
      targetReps: 15,
      notes: '2 séries de 10–20 segundos',
      tips: 'Segure a barra com ombros abaixados (não encolha). Respire e mantenha o core. Vale depressão de escápulas leve, como no início da animação.',
    }),
    ex({
      id: EX_REMADA_CURVADA,
      name: 'Remada curvada',
      muscleGroup: 'Costas',
      sets: 3,
      targetReps: 10,
      warmup: '1×15 aquecimento',
      tips: 'Tronco inclinado, puxe o cotovelo para trás e suba o peito levemente.',
    }),
    ex({
      id: EX_PUXADA_ABERTA,
      name: 'Puxada aberta',
      muscleGroup: 'Costas',
      sets: 3,
      targetReps: 10,
      tips: 'Puxada ampla até a clavícula / parte alta do peito. Controle a subida.',
    }),
    ex({
      id: EX_REMADA_ART,
      name: 'Remada articulada',
      muscleGroup: 'Costas',
      sets: 3,
      targetReps: 10,
      tips: 'Peito apoiado/estável. Puxe cotovelos para trás sem balançar o tronco.',
    }),
    ex({
      id: EX_PUXADA_UNI,
      name: 'Puxada unilateral',
      muscleGroup: 'Costas',
      sets: 3,
      targetReps: 10,
      tips: 'Um lado de cada vez. Mantenha ombro estável e amplitude completa.',
    }),
    ex({
      id: EX_PULLDOWN,
      name: 'Pulldown',
      muscleGroup: 'Costas',
      sets: 3,
      targetReps: 12,
      notes: '3×10–12',
      tips: 'Braços estendidos, leve o cabo para a frente da coxa com controle nos dorsais.',
    }),
    ex({
      id: EX_ROSCA_SCOTT,
      name: 'Rosca Scott',
      muscleGroup: 'Bíceps',
      sets: 3,
      targetReps: 12,
      notes: '3×10–12',
      tips: 'Braços apoiados no banco Scott. Suba sem levantar o cotovelo do apoio.',
    }),
  ],
}

const peitoTriceps: WorkoutProgram = {
  id: WORKOUT_PEITO_TRICEPS,
  title: 'Treino B — Peito e Tríceps',
  shortLabel: 'Peito e Tríceps',
  warmupNote: 'Superiores · empurrar',
  coreNote: 'Escápulas retraídas no peito',
  goals: ['↑ volume', '↑ estabilidade'],
  exercises: [
    ex({
      id: EX_SUPINO_DECL,
      name: 'Supino declinado máquina',
      muscleGroup: 'Peito',
      sets: 3,
      targetReps: 10,
      warmup: '1×15 aquecimento',
      tips: 'Trajetória declinada. Empurre e volte sem bater os pesos.',
    }),
    ex({
      id: EX_SUPINO_HALT,
      name: 'Supino com halteres',
      muscleGroup: 'Peito',
      sets: 3,
      targetReps: 10,
      warmup: '1×15 aquecimento',
      tips: 'Halteres descem controlados. Cotovelos ~45° do tronco.',
    }),
    ex({
      id: EX_TRI_FRANCES,
      name: 'Tríceps francês',
      muscleGroup: 'Tríceps',
      sets: 4,
      targetReps: 12,
      notes: '4×10–12',
      tips: 'Cotovelos fixos. Desça a carga atrás da cabeça e estenda até o final.',
    }),
    ex({
      id: EX_TRI_MAQ,
      name: 'Tríceps máquina',
      muscleGroup: 'Tríceps',
      sets: 4,
      targetReps: 12,
      notes: '4×10–12',
      tips: 'Cotovelos colados. Estenda totalmente e controle a volta.',
    }),
  ],
}

const ombros: WorkoutProgram = {
  id: WORKOUT_OMBROS,
  title: 'Ombro, Bíceps e Tríceps',
  shortLabel: 'Ombro',
  warmupNote: 'Aquecimento de ombro, cotovelo e manguito',
  coreNote: 'Não encolher o trapézio · cotovelos estáveis no braço',
  goals: ['↑ ombro', '↑ braço'],
  exercises: [
    ex({
      id: EX_ELEV_LAT,
      name: 'Elevação lateral',
      muscleGroup: 'Ombros',
      sets: 4,
      targetReps: 12,
      notes: '4×10–12',
      tips: 'Cotovelos levemente flexionados. Suba até a linha do ombro sem encolher.',
    }),
    ex({
      id: EX_DEV_MILITAR,
      name: 'Desenvolvimento militar',
      muscleGroup: 'Ombros',
      sets: 3,
      targetReps: 10,
      tips: 'Empurre a barra para cima sem arquear demais a lombar. Core firme.',
    }),
    ex({
      id: EX_FACE_PULL,
      name: 'Face Pull',
      muscleGroup: 'Ombros',
      sets: 3,
      targetReps: 12,
      tips: 'Puxe em direção ao rosto, cotovelos altos. Foque rotadores e deltoide posterior.',
    }),
    ex({
      id: EX_OMBRO_ROSCA,
      name: 'Rosca Scott',
      muscleGroup: 'Bíceps',
      sets: 3,
      targetReps: 12,
      notes: '3×10–12',
      tips: 'Braços apoiados no banco Scott. Suba sem levantar o cotovelo do apoio.',
    }),
    ex({
      id: EX_OMBRO_TRI_FR,
      name: 'Tríceps francês',
      muscleGroup: 'Tríceps',
      sets: 4,
      targetReps: 12,
      notes: '4×10–12',
      tips: 'Cotovelos fixos. Desça a carga atrás da cabeça e estenda até o final.',
    }),
    ex({
      id: EX_OMBRO_TRI_MQ,
      name: 'Tríceps máquina',
      muscleGroup: 'Tríceps',
      sets: 4,
      targetReps: 12,
      notes: '4×10–12',
      tips: 'Cotovelos colados. Estenda totalmente e controle a volta.',
    }),
  ],
}

function entriesFor(workout: WorkoutProgram) {
  return workout.exercises.map((e) => ({
    exerciseId: e.id,
    performedReps: null as number | null,
    currentWeight: null as number | null,
  }))
}

const sessionPernas = id()

export const INITIAL_DATA: AppData = {
  profileName: 'Marlon Miranda',
  workouts: [pernas, costasBiceps, peitoTriceps, ombros],
  activeWorkoutId: WORKOUT_PERNAS,
  sessions: [
    {
      id: sessionPernas,
      workoutId: WORKOUT_PERNAS,
      date: today,
      label: 'Sessão de hoje',
      entries: entriesFor(pernas),
    },
  ],
  activeSessionId: sessionPernas,
}

export const WORKOUT_IDS = {
  PERNAS: WORKOUT_PERNAS,
  COSTAS_BICEPS: WORKOUT_COSTAS_BICEPS,
  PEITO_TRICEPS: WORKOUT_PEITO_TRICEPS,
  OMBROS: WORKOUT_OMBROS,
} as const

export function getWorkout(data: AppData, workoutId?: string): WorkoutProgram {
  const id = workoutId ?? data.activeWorkoutId
  return data.workouts.find((w) => w.id === id) ?? data.workouts[0]
}
