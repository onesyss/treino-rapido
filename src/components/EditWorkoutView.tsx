import { Plus, Trash2, RotateCcw, Pencil, Save, User } from 'lucide-react'
import { useState } from 'react'
import type { AppData, Exercise, MuscleGroup, WorkoutProgram } from '../types'
import { getActiveWorkout } from '../hooks/useAppData'
import { GROUP_STYLE, GroupIcon } from '../utils/icons'

const GROUPS: MuscleGroup[] = [
  'Pernas',
  'Costas',
  'Peito',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen',
  'Outro',
]

interface EditWorkoutViewProps {
  data: AppData
  onSaveProfile: (name: string) => void
  onSaveMeta: (
    p: Partial<Pick<WorkoutProgram, 'title' | 'warmupNote' | 'coreNote' | 'goals'>>
  ) => void
  onSaveExercises: (exercises: Exercise[]) => void
  onReset: () => void
}

export function EditWorkoutView({
  data,
  onSaveProfile,
  onSaveMeta,
  onSaveExercises,
  onReset,
}: EditWorkoutViewProps) {
  const workout = getActiveWorkout(data)
  const [profileName, setProfileName] = useState(data.profileName)
  const [workoutTitle, setWorkoutTitle] = useState(workout.title)
  const [warmupNote, setWarmupNote] = useState(workout.warmupNote)
  const [coreNote, setCoreNote] = useState(workout.coreNote)
  const [goals, setGoals] = useState(workout.goals.join(', '))
  const [exercises, setExercises] = useState<Exercise[]>(() =>
    structuredClone(workout.exercises)
  )
  const [savedFlash, setSavedFlash] = useState(false)
  const [syncedId, setSyncedId] = useState(workout.id)

  // recarrega form ao trocar ficha
  if (syncedId !== workout.id) {
    setSyncedId(workout.id)
    setWorkoutTitle(workout.title)
    setWarmupNote(workout.warmupNote)
    setCoreNote(workout.coreNote)
    setGoals(workout.goals.join(', '))
    setExercises(structuredClone(workout.exercises))
  }

  function flash() {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  function saveAll() {
    onSaveProfile(profileName)
    onSaveMeta({
      title: workoutTitle.trim() || workout.shortLabel,
      warmupNote,
      coreNote,
      goals: goals
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
    })
    onSaveExercises(exercises)
    flash()
  }

  function updateEx(id: string, patch: Partial<Exercise>) {
    setExercises((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  function removeEx(id: string) {
    setExercises((list) => list.filter((e) => e.id !== id))
  }

  function addEx() {
    const neu: Exercise = {
      id: crypto.randomUUID(),
      name: 'Novo exercício',
      muscleGroup: 'Outro',
      sets: 3,
      targetReps: 10,
      motion: 'generic',
      gifUrl: '',
      steps: [
        'Posicione-se corretamente no aparelho ou com o peso.',
        'Execute o movimento com amplitude controlada.',
        'Mantenha o core firme e não impulse com o tronco.',
        'Volte à posição inicial de forma lenta.',
      ],
      tips: 'Descreva o foco muscular aqui.',
    }
    setExercises((list) => [...list, neu])
  }

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="icon-blob h-10 w-10">
              <Pencil className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-white">Montar / editar treino</h2>
              <p className="text-sm text-slate-500">Editando: {workout.shortLabel}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Restaurar treinos originais e apagar o histórico?')) {
                  onReset()
                  window.location.reload()
                }
              }}
              className="btn-ghost"
            >
              <RotateCcw className="h-4 w-4" />
              Resetar tudo
            </button>
            <button
              type="button"
              onClick={saveAll}
              className="btn-primary"
            >
              <Save className="h-4 w-4" />
              {savedFlash ? 'Salvo ✓' : 'Salvar alterações'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3 text-slate-500" /> Seu nome
              </span>
            }
          >
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="field"
            />
          </Field>
          <Field label="Título do treino">
            <input
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              className="field"
            />
          </Field>
          <Field label="Notas / aquecimento">
            <input
              value={warmupNote}
              onChange={(e) => setWarmupNote(e.target.value)}
              className="field"
            />
          </Field>
          <Field label="Core / observação">
            <input value={coreNote} onChange={(e) => setCoreNote(e.target.value)} className="field" />
          </Field>
          <Field label="Metas (separadas por vírgula)" className="sm:col-span-2">
            <input value={goals} onChange={(e) => setGoals(e.target.value)} className="field" />
          </Field>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-semibold text-white">Exercícios</h3>
          <button
            type="button"
            onClick={addEx}
            className="inline-flex items-center gap-1.5 rounded-lg bg-panel-2 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-border"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>

        <div className="divide-y divide-border">
          {exercises.map((ex, i) => {
            const style = GROUP_STYLE[ex.muscleGroup] ?? GROUP_STYLE.Outro
            return (
              <div key={ex.id} className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-6">
                <div className="lg:col-span-2">
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={style.icon}>
                      <GroupIcon group={ex.muscleGroup} className="h-3.5 w-3.5" />
                    </span>
                    Nome
                  </label>
                  <input
                    value={ex.name}
                    onChange={(e) => updateEx(ex.id, { name: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Grupo</label>
                  <select
                    value={ex.muscleGroup}
                    onChange={(e) =>
                      updateEx(ex.id, { muscleGroup: e.target.value as MuscleGroup })
                    }
                    className="field"
                  >
                    {GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Séries</label>
                  <input
                    type="number"
                    min={1}
                    value={ex.sets}
                    onChange={(e) => updateEx(ex.id, { sets: Number(e.target.value) || 1 })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Reps alvo</label>
                  <input
                    type="number"
                    min={1}
                    value={ex.targetReps}
                    onChange={(e) =>
                      updateEx(ex.id, { targetReps: Number(e.target.value) || 1 })
                    }
                    className="field"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeEx(ex.id)}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-400 ring-1 ring-border hover:text-slate-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    {i + 1}
                  </button>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Aquecimento</label>
                  <input
                    value={ex.warmup ?? ''}
                    onChange={(e) => updateEx(ex.id, { warmup: e.target.value || undefined })}
                    placeholder="ex: 1×15"
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Obs.</label>
                  <input
                    value={ex.notes ?? ''}
                    onChange={(e) => updateEx(ex.id, { notes: e.target.value || undefined })}
                    className="field"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="mb-1 block text-xs text-slate-500">
                    Passos da execução (um por linha)
                  </label>
                  <textarea
                    rows={2}
                    value={(ex.steps ?? []).join('\n')}
                    onChange={(e) =>
                      updateEx(ex.id, {
                        steps: e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="field resize-y"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-slate-500">Dica de foco</label>
                  <input
                    value={ex.tips}
                    onChange={(e) => updateEx(ex.id, { tips: e.target.value })}
                    className="field"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="mb-1 block text-xs text-slate-500">URL do GIF (opcional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={ex.gifUrl ?? ''}
                      onChange={(e) => updateEx(ex.id, { gifUrl: e.target.value || undefined })}
                      className="field"
                    />
                    {ex.gifUrl ? (
                      <img
                        src={ex.gifUrl}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded object-cover ring-1 ring-border"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}
