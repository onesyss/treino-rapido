import { useState } from 'react'
import { X, Target, Layers, PlayCircle } from 'lucide-react'
import type { Exercise } from '../types'
import { gifForName, sourcesFromEntry } from '../data/gifs'
import { GROUP_STYLE, GroupIcon } from '../utils/icons'
import { ExecutionFigure } from './ExecutionFigure'

interface HowToModalProps {
  exercise: Exercise
  onClose: () => void
}

export function HowToModal({ exercise, onClose }: HowToModalProps) {
  const catalog = gifForName(exercise.name)
  const sources = sourcesFromEntry(catalog, exercise.gifUrl)
  const [srcIndex, setSrcIndex] = useState(0)
  const [gifLoaded, setGifLoaded] = useState(false)
  const [exhausted, setExhausted] = useState(false)
  const currentSrc = !exhausted ? sources[srcIndex] : undefined
  const showGif = Boolean(currentSrc)
  const style = GROUP_STYLE[exercise.muscleGroup] ?? GROUP_STYLE.Outro
  const credit =
    gifForName(exercise.name)?.gifCredit ?? exercise.gifCredit

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
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="icon-blob h-10 w-10">
              <PlayCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
            <div className="relative overflow-hidden rounded-xl bg-black/40 ring-1 ring-border">
              {!gifLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                  Carregando…
                </div>
              )}
              <img
                key={currentSrc}
                src={currentSrc}
                alt={`Demonstração: ${exercise.name}`}
                className="mx-auto max-h-[300px] w-full object-contain"
                loading="eager"
                onLoad={() => setGifLoaded(true)}
                onError={() => {
                  setGifLoaded(false)
                  if (srcIndex + 1 < sources.length) {
                    setSrcIndex((i) => i + 1)
                  } else {
                    setExhausted(true)
                  }
                }}
              />
              {credit && gifLoaded && (
                <p className="px-2 py-1 text-center text-[10px] text-slate-500">{credit}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <ExecutionFigure motion={exercise.motion} />
              <p className="text-center text-xs text-slate-500">
                Demonstração em GIF indisponível — use os passos abaixo.
              </p>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Layers className="h-3.5 w-3.5" />
              Passos
            </div>
            <ol className="space-y-2">
              {(exercise.steps ?? []).map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg bg-panel-2 px-3 py-2.5 ring-1 ring-border/60"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-panel text-xs font-bold text-slate-400 ring-1 ring-border">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {exercise.tips && (
            <div className="rounded-lg bg-panel-2 px-3 py-3 ring-1 ring-border">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Target className="h-3.5 w-3.5" />
                Dica
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{exercise.tips}</p>
            </div>
          )}

          {exercise.notes && <p className="text-xs text-slate-500">Obs.: {exercise.notes}</p>}

          <button type="button" onClick={onClose} className="btn-primary w-full justify-center py-3">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
