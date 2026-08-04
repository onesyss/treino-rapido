export type MuscleGroup =
  | 'Pernas'
  | 'Costas'
  | 'Peito'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Abdômen'
  | 'Outro'


/** Tipo de movimento para o gráfico de execução */
export type MotionType =
  | 'abduction'
  | 'extension'
  | 'squat'
  | 'hinge'
  | 'hipthrust'
  | 'legpress'
  | 'curl'
  | 'calf'
  | 'generic'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  sets: number
  targetReps: number
  warmup?: string
  notes?: string
  motion: MotionType
  steps: string[]
  tips: string
  /** GIF de demonstração (CDN ExerciseGymGifsDB / jsDelivr) */
  gifUrl?: string
  /** Crédito da animação */
  gifCredit?: string
}

export interface SessionEntry {
  exerciseId: string
  performedReps: number | null
  currentWeight: number | null
}

export interface WorkoutSession {
  id: string
  date: string
  label: string
  entries: SessionEntry[]
}

export interface AppData {
  profileName: string
  workoutTitle: string
  warmupNote: string
  coreNote: string
  goals: string[]
  exercises: Exercise[]
  sessions: WorkoutSession[]
  activeSessionId: string | null
}

export type ViewMode = 'treino' | 'evolucao' | 'editar'
