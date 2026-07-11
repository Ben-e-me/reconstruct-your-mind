import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Scene } from '../lib/parseStory'

// A "step" is one click. Ellipsis beats are not steps — they auto-reveal after
// their preceding beat, so they never consume a click.
export function useReader(scenes: Scene[]) {
  const steps = useMemo(() => {
    const arr: { sceneIndex: number; localIndex: number }[] = []
    scenes.forEach((s, si) =>
      s.beats.forEach((b, li) => {
        if (b.type !== 'ellipsis') arr.push({ sceneIndex: si, localIndex: li })
      }),
    )
    return arr
  }, [scenes])

  const total = steps.length
  const [pos, setPos] = useState(0)

  const clamp = useCallback((n: number) => Math.max(0, Math.min(total - 1, n)), [total])
  const next = useCallback(() => setPos((p) => clamp(p + 1)), [clamp])
  const prev = useCallback(() => setPos((p) => clamp(p - 1)), [clamp])
  const restart = useCallback(() => setPos(0), [])
  const goTo = useCallback((n: number) => setPos(() => clamp(n)), [clamp])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        restart()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, restart])

  const cur = steps[pos] ?? { sceneIndex: 0, localIndex: 0 }
  const scene = scenes[cur.sceneIndex]

  return {
    scene,
    revealedLocalIndex: cur.localIndex,
    next,
    prev,
    restart,
    goTo,
    pos,
    total,
    atStart: pos === 0,
    atEnd: pos >= total - 1,
  }
}
