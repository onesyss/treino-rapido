import { useState } from 'react'
import { gifForName, sourcesFromEntry } from '../data/gifs'

/** Thumbnail com cadeia de fallback (GIF principal → alt repo → free-exercise-db). */
export function GifThumb({
  name,
  gifUrl,
  className = 'h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black/30 ring-1 ring-border',
  onClick,
}: {
  name: string
  gifUrl?: string
  className?: string
  onClick?: () => void
}) {
  const sources = sourcesFromEntry(gifForName(name), gifUrl)
  const [i, setI] = useState(0)
  const [dead, setDead] = useState(sources.length === 0)
  const src = sources[i]

  if (dead || !src) return null

  return (
    <button type="button" onClick={onClick} className={className} title="Ver demo">
      <img
        key={src}
        src={src}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => {
          if (i + 1 < sources.length) setI((n) => n + 1)
          else setDead(true)
        }}
      />
    </button>
  )
}
