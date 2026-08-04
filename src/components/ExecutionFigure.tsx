import type { MotionType } from '../types'

/** Fallback simples se o GIF não carregar */
export function ExecutionFigure({ motion: _motion }: { motion: MotionType }) {
  return (
    <div className="figure-stage flex flex-col items-center justify-center gap-2">
      <div className="text-4xl opacity-40">◉</div>
      <p className="text-xs text-slate-500">Demonstração visual em breve</p>
      <div className="figure-ground" />
    </div>
  )
}
