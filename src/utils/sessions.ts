import type { AppData, WorkoutSession } from '../types'
import { toISODate } from '../utils/stats'

function todayISO(): string {
  return toISODate(new Date())
}

function sessionLabelForDate(iso: string): string {
  const today = todayISO()
  if (iso === today) return 'Sessão de hoje'
  const [y, m, d] = iso.split('-')
  return `Sessão ${d}/${m}/${y}`
}

/**
 * Garante que cada ficha com histórico tenha uma sessão com a data de HOJE,
 * sem apagar sessões de dias anteriores. Assim o filtro de Data lista ontem, anteontem…
 */
export function ensureSessionsForToday(data: AppData): AppData {
  const today = todayISO()
  let sessions = [...data.sessions]
  let activeSessionId = data.activeSessionId
  let changed = false

  for (const workout of data.workouts) {
    const ofW = sessions
      .filter((s) => s.workoutId === workout.id)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))

    if (ofW.some((s) => s.date === today)) continue
    // não cria dia vazio em fichas nunca usadas
    if (ofW.length === 0 && workout.id !== data.activeWorkoutId) continue

    const prev = ofW[ofW.length - 1]
    const neu: WorkoutSession = {
      id: crypto.randomUUID(),
      workoutId: workout.id,
      date: today,
      label: sessionLabelForDate(today),
      entries: workout.exercises.map((ex) => {
        const last = prev?.entries.find((e) => e.exerciseId === ex.id)
        return {
          exerciseId: ex.id,
          performedReps: null as number | null,
          currentWeight: last?.currentWeight ?? null,
          cardioType: last?.cardioType ?? null,
        }
      }),
    }
    sessions.push(neu)
    if (workout.id === data.activeWorkoutId) {
      activeSessionId = neu.id
    }
    changed = true
  }

  // Corrige rótulos antigos genéricos com a data real
  sessions = sessions.map((s) => {
    if (s.label === 'Sessão de hoje' && s.date !== today) {
      changed = true
      return { ...s, label: sessionLabelForDate(s.date) }
    }
    return s
  })

  if (!changed) return data
  return { ...data, sessions, activeSessionId }
}

export function formatSessionOption(
  date: string,
  label: string,
  workoutShort?: string
): string {
  const [y, m, d] = date.split('-')
  const pretty = y && m && d ? `${d}/${m}/${y}` : date
  const bits = [pretty]
  if (workoutShort) bits.push(workoutShort)
  if (label && !label.startsWith('Sessão ') && label !== pretty) bits.push(label)
  else if (label && label.startsWith('Sessão ')) {
    // já tem a data no label às vezes — evita duplicar
    if (!label.includes(`${d}/${m}`)) bits.push(label)
  }
  return bits.join(' · ')
}
