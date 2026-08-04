import { useState } from 'react'
import { X, Target, Layers, PlayCircle } from 'lucide-react'
import type { Exercise } from '../types'
import { GROUP_STYLE, GroupIcon } from '../utils/icons'
import { ExecutionFigure } from './ExecutionFigure'

interface HowToModalProps {
  exercise: Exercise
  onClose: () => void
}

export function HowToModal({ exercise, onClose }: HowToModalProps) {
  const [gifError, setGifError] = useState(false)
  const [gifLoaded, setGifLoaded] = useState(false)
  const showGif = Boolean(exercise.gifUrl) && !gifError
  const style = GROUP_STYLE[exercise.muscleGroup] ?? GROUP_STYLE.Outro

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="howto-title"
    >
      <div
        className="card max-h-[92vh] w-full max-w-lg overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-accent card-accent-sky" />
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className={[
                'icon-blob h-10 w-10 ring-1',
                style.bg,
                style.icon,
                style.ring,
              ].join(' ')}
            >
              <PlayCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
                Como executar
              </p>
              <h2 id="howto-title" className="font-display mt-0.5 text-xl font-bold text-white">
                {exercise.name}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                <span
                  className={[
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ring-1',
                    style.bg,
                    style.text,
                    style.ring,
                  ].join(' ')}
                >
                  <GroupIcon group={exercise.muscleGroup} className="h-3 w-3" />
                  {exercise.muscleGroup}
                </span>
                <span>
                  {exercise.sets}×{exercise.targetReps}
                  {exercise.warmup ? ` · ${exercise.warmup}` : ''}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {showGif ? (
            <div className="relative overflow-hidden rounded-xl bg-black/40 ring-1 ring-sky-500/20">
              {!gifLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                  Carregando…
                </div>
              )}
              <img
                src={exercise.gifUrl}
                alt={`Demonstração: ${exercise.name}`}
                className="mx-auto max-h-[300px] w-full object-contain"
                loading="eager"
                onLoad={() => setGifLoaded(true)}
                onError={() => setGifError(true)}
              />
            </div>
          ) : (
            <ExecutionFigure motion={exercise.motion} />
          )}

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-400">
              <Layers className="h-3.5 w-3.5" />
              Passos
            </div>
            <ol className="space-y-2">
              {(exercise.steps ?? []).map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg bg-panel-2 px-3 py-2.5 ring-1 ring-border/60"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-500/15 text-xs font-bold text-sky-400">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {exercise.tips && (
            <div className="rounded-lg bg-emerald-500/5 px-3 py-3 ring-1 ring-emerald-500/20">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
                <Target className="h-3.5 w-3.5" />
                Dica
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{exercise.tips}</p>
            </div>
          )}

          {exercise.notes && (
            <p className="text-xs text-amber-400/90">Obs.: {exercise.notes}</p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-sky-500 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
