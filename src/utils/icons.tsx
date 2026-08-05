import {
  Armchair,
  Activity,
  BicepsFlexed,
  CircleDot,
  Dumbbell,
  Footprints,
  Heart,
  LayoutGrid,
  PersonStanding,
  Target,
  Zap,
} from 'lucide-react'
import type { MuscleGroup } from '../types'

/** Grupos em vermelho / azul (alta tech) */
export const GROUP_STYLE: Record<
  MuscleGroup,
  { bg: string; text: string; ring: string; icon: string; solid: string }
> = {
  Pernas: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    ring: 'ring-blue-500/40',
    icon: 'text-blue-400',
    solid: '#3b82f6',
  },
  Costas: {
    bg: 'bg-red-500/15',
    text: 'text-red-300',
    ring: 'ring-red-500/40',
    icon: 'text-red-400',
    solid: '#ef4444',
  },
  Peito: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    ring: 'ring-blue-500/40',
    icon: 'text-blue-400',
    solid: '#60a5fa',
  },
  Ombros: {
    bg: 'bg-red-500/15',
    text: 'text-red-300',
    ring: 'ring-red-500/40',
    icon: 'text-red-400',
    solid: '#f87171',
  },
  Bíceps: {
    bg: 'bg-blue-500/15',
    text: 'text-cyan-300',
    ring: 'ring-blue-400/40',
    icon: 'text-cyan-400',
    solid: '#22d3ee',
  },
  Tríceps: {
    bg: 'bg-red-500/15',
    text: 'text-rose-300',
    ring: 'ring-rose-500/40',
    icon: 'text-rose-400',
    solid: '#fb7185',
  },
  Abdômen: {
    bg: 'bg-blue-500/10',
    text: 'text-sky-300',
    ring: 'ring-sky-500/35',
    icon: 'text-sky-400',
    solid: '#38bdf8',
  },
  Cardio: {
    bg: 'bg-red-500/15',
    text: 'text-orange-300',
    ring: 'ring-orange-500/40',
    icon: 'text-orange-400',
    solid: '#fb923c',
  },
  Outro: {
    bg: 'bg-panel-2',
    text: 'text-slate-300',
    ring: 'ring-border',
    icon: 'text-slate-400',
    solid: '#94a3b8',
  },
}

export function GroupIcon({
  group,
  className = 'h-3.5 w-3.5',
}: {
  group: MuscleGroup | 'TODOS'
  className?: string
}) {
  if (group === 'TODOS') return <LayoutGrid className={className} />
  switch (group) {
    case 'Pernas':
      return <Footprints className={className} />
    case 'Costas':
      return <PersonStanding className={className} />
    case 'Peito':
      return <Heart className={className} />
    case 'Ombros':
      return <Zap className={className} />
    case 'Bíceps':
      return <BicepsFlexed className={className} />
    case 'Tríceps':
      return <Armchair className={className} />
    case 'Abdômen':
      return <Target className={className} />
    case 'Cardio':
      return <Activity className={className} />
    default:
      return <CircleDot className={className} />
  }
}

export function BrandMark({ className = 'h-7 w-7' }: { className?: string }) {
  return <Dumbbell className={className} strokeWidth={2.25} />
}
