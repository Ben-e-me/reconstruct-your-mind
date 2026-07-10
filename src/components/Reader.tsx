import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import storyRaw from '../content/story.txt?raw'
import { parseStory } from '../lib/parseStory'
import { useReader } from '../hooks/useReader'
import { useIdleUI } from '../hooks/useIdleUI'
import { useTheme } from '../hooks/useTheme'
import { BLUR_DUR, ELLIPSIS_PAUSE, ELLIPSIS_DOT_STAGGER, LETTER_DUR, revealDuration } from '../lib/anim'
import { Beat } from './Beat'
import { Controls } from './Controls'
import { TitleScreen } from './TitleScreen'

export function Reader() {
  const scenes = useMemo(() => parseStory(storyRaw), [])
  const { scene, revealedLocalIndex, next, prev, restart, atStart, atEnd, pos, total } = useReader(scenes)
  const uiActive = useIdleUI(2000)
  const { theme, toggle } = useTheme()
  const [phase, setPhase] = useState<'title' | 'reading'>('title')
  const [beatDone, setBeatDone] = useState(false)

  const start = useCallback(() => {
    restart()
    setPhase('reading')
  }, [restart])

  const toTitle = useCallback(() => {
    restart()
    setPhase('title')
  }, [restart])

  useEffect(() => {
    if (phase !== 'title') return
    const onKey = (e: KeyboardEvent) => {
      if (['Enter', ' ', 'Spacebar', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, start])

  // when the current step's animation is fully done, nudge the forward arrow
  useEffect(() => {
    setBeatDone(false)
    if (phase !== 'reading' || !scene) return
    const cur = scene.beats[revealedLocalIndex]
    if (!cur) return
    let finish = cur.type === 'ellipsis' ? 0 : revealDuration(cur.words)
    const nextBeat = scene.beats[revealedLocalIndex + 1]
    if (nextBeat?.type === 'ellipsis') {
      finish = revealDuration(cur.words) + ELLIPSIS_PAUSE + 2 * ELLIPSIS_DOT_STAGGER + LETTER_DUR
    }
    const timer = window.setTimeout(() => setBeatDone(true), (finish + 0.3) * 1000)
    return () => window.clearTimeout(timer)
  }, [phase, scene, revealedLocalIndex])

  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation()
    fn()
  }

  const transition = { duration: BLUR_DUR, ease: 'easeInOut' as const }

  return (
    <div className="stage" onClick={phase === 'title' ? start : next}>
      <AnimatePresence mode="wait">
        {phase === 'title' ? (
          <motion.div
            key="title"
            className="title-phase"
            initial={{ opacity: 1, filter: 'blur(0px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(12px)' }}
            transition={transition}
          >
            <TitleScreen />
          </motion.div>
        ) : (
          <motion.section
            key={scene?.id ?? 'empty'}
            className={`scene ${scene?.kind ?? 'stack'}`}
            initial={{ opacity: 1, filter: 'blur(0px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(12px)' }}
            transition={transition}
          >
            {scene?.beats.map((b, i) => {
              const revealed = i <= revealedLocalIndex || (b.type === 'ellipsis' && i - 1 <= revealedLocalIndex)
              const startAfter =
                b.type === 'ellipsis' && i > 0 ? revealDuration(scene.beats[i - 1].words) + ELLIPSIS_PAUSE : 0
              return <Beat key={b.id} beat={b} revealed={revealed} startAfter={startAfter} />
            })}
          </motion.section>
        )}
      </AnimatePresence>

      <Controls
        visible={uiActive}
        showNav={phase === 'reading'}
        theme={theme}
        onToggleTheme={stop(toggle)}
        onRestart={stop(toTitle)}
        onPrev={stop(prev)}
        onNext={stop(next)}
        atStart={phase === 'title' || atStart}
        atEnd={phase === 'reading' && atEnd}
        ready={phase === 'reading' && beatDone && !atEnd}
        pos={phase === 'title' ? -1 : pos}
        total={total}
      />
    </div>
  )
}
