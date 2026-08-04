export type MuscleGroup =
  | 'Pernas'
  | 'Costas'
  | 'Peito'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Abdômen'
  | 'Outro'

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
  gifUrl?: string
  gifCredit?: string
}

export interface SessionEntry {
  exerciseId: string
  performedReps: number | null
  currentWeight: number | null
}

export interface WorkoutSession {
  id: string
  workoutId: string
  date: string
  label: string
  entries: SessionEntry[]
}

export interface WorkoutProgram {
  id: string
  title: string
  shortLabel: string
  warmupNote: string
  coreNote: string
  goals: string[]
  exercises: Exercise[]
}

export interface AppData {
  profileName: string
  workouts: WorkoutProgram[]
  activeWorkoutId: string
  sessions: WorkoutSession[]
  activeSessionId: string | null
}

export type ViewMode = 'treino' | 'evolucao' | 'editar'
