import {
  Armchair,
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

export const GROUP_STYLE: Record<
  MuscleGroup,
  { bg: string; text: string; ring: string; icon: string; solid: string }
> = {
  Pernas: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    ring: 'ring-orange-500/25',
    icon: 'text-orange-400',
    solid: '#fb923c',
  },
  Costas: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    ring: 'ring-sky-500/25',
    icon: 'text-sky-400',
    solid: '#38bdf8',
  },
  Peito: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    ring: 'ring-rose-500/25',
    icon: 'text-rose-400',
    solid: '#fb7185',
  },
  Ombros: {
    bg: 'bg-violet-500/15',
    text: 'text-violet-400',
    ring: 'ring-violet-500/25',
    icon: 'text-violet-400',
    solid: '#a78bfa',
  },
  Bíceps: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    ring: 'ring-amber-500/25',
    icon: 'text-amber-400',
    solid: '#fbbf24',
  },
  Tríceps: {
    bg: 'bg-lime-500/15',
    text: 'text-lime-400',
    ring: 'ring-lime-500/25',
    icon: 'text-lime-400',
    solid: '#a3e635',
  },
  Abdômen: {
    bg: 'bg-teal-500/15',
    text: 'text-teal-400',
    ring: 'ring-teal-500/25',
    icon: 'text-teal-400',
    solid: '#2dd4bf',
  },
  Outro: {
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    ring: 'ring-slate-500/25',
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
    default:
      return <CircleDot className={className} />
  }
}

export function BrandMark({ className = 'h-7 w-7' }: { className?: string }) {
  return <Dumbbell className={className} strokeWidth={2.25} />
}
