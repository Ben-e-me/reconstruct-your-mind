import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type TouchEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import storyRaw from '../content/story.txt?raw'
import { parseStory, type Beat as BeatT } from '../lib/parseStory'
import { useReader } from '../hooks/useReader'
import { useIdleUI } from '../hooks/useIdleUI'
import { useTheme } from '../hooks/useTheme'
import {
  ARROW_DELAY,
  BLUR_DUR,
  ELLIPSIS_PAUSE,
  ELLIPSIS_DOT_STAGGER,
  LETTER_DUR,
  revealDuration,
} from '../lib/anim'
import { Beat } from './Beat'
import { Controls } from './Controls'
import { TitleScreen } from './TitleScreen'

// group grid beats into rows: a {left} directly followed by a {right} share one row
function gridRows(beats: BeatT[]): { beat: BeatT; index: number }[][] {
  const rows: { beat: BeatT; index: number }[][] = []
  for (let i = 0; i < beats.length; ) {
    const b = beats[i]
    if (b.placement === 'left' && beats[i + 1]?.placement === 'right') {
      rows.push([
        { beat: b, index: i },
        { beat: beats[i + 1], index: i + 1 },
      ])
      i += 2
    } else {
      rows.push([{ beat: b, index: i }])
      i += 1
    }
  }
  return rows
}

export function Reader() {
  const scenes = useMemo(() => parseStory(storyRaw), [])
  const { scene, revealedLocalIndex, next, prev, restart, goTo, atStart, atEnd, pos, total } = useReader(scenes)
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

  // jump straight to a step from a progress dot — works from the title too
  const jumpTo = useCallback(
    (i: number) => {
      goTo(i)
      setPhase('reading')
    },
    [goTo],
  )

  const advance = useCallback(() => {
    if (phase === 'title') start()
    else next()
  }, [phase, start, next])

  // Advance on a real tap. Touch fires `touchend` directly (so a single tap works even
  // while the idle UI is hidden — no "first tap only wakes the UI" dead tap), and the
  // synthesized click is de-duped by timestamp. Taps on a control are left to the control.
  const lastTouch = useRef(0)
  const isControl = (t: EventTarget | null) =>
    t instanceof Element && !!t.closest('.ctrl, .arrow, .step, .credit-link')
  const onStageClick = (e: MouseEvent) => {
    if (Date.now() - lastTouch.current < 700) return
    if (isControl(e.target)) return
    advance()
  }
  const onStageTouchEnd = (e: TouchEvent) => {
    if (isControl(e.target)) return
    lastTouch.current = Date.now()
    advance()
  }

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

  // nudge the forward arrow once the current step is fully done
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
    const timer = window.setTimeout(() => setBeatDone(true), (finish + ARROW_DELAY) * 1000)
    return () => window.clearTimeout(timer)
  }, [phase, scene, revealedLocalIndex])

  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation()
    fn()
  }

  const transition = { duration: BLUR_DUR, ease: 'easeInOut' as const }

  // the very last beat ("Welcome home") fades in much more slowly for a gentle finale
  const finaleScale = atEnd ? 4 : 1

  const renderBeat = (b: BeatT, index: number) => {
    const revealed = index <= revealedLocalIndex || (b.type === 'ellipsis' && index - 1 <= revealedLocalIndex)
    const dimmed = b.type !== 'ellipsis' && index < revealedLocalIndex
    const startAfter =
      b.type === 'ellipsis' && index > 0 && scene
        ? revealDuration(scene.beats[index - 1].words) + ELLIPSIS_PAUSE
        : 0
    return (
      <Beat key={b.id} beat={b} revealed={revealed} dimmed={dimmed} startAfter={startAfter} durScale={finaleScale} />
    )
  }

  return (
    <div className="stage" onClick={onStageClick} onTouchEnd={onStageTouchEnd}>
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
            {scene?.kind === 'grid'
              ? gridRows(scene.beats).map((row, ri) => (
                  <div key={ri} className={`grid-row ${row.length === 1 ? 'lead' : ''}`}>
                    {row.map(({ beat, index }) => renderBeat(beat, index))}
                  </div>
                ))
              : scene?.beats.map((b, i) => renderBeat(b, i))}
          </motion.section>
        )}
      </AnimatePresence>

      <Controls
        visible={uiActive}
        showNav
        theme={theme}
        onToggleTheme={stop(toggle)}
        onRestart={stop(toTitle)}
        onPrev={stop(prev)}
        onNext={stop(phase === 'title' ? start : next)}
        onStep={jumpTo}
        atStart={phase === 'title' || atStart}
        atEnd={phase === 'reading' && atEnd}
        ready={phase === 'title' || (phase === 'reading' && beatDone && !atEnd)}
        pos={phase === 'title' ? -1 : pos}
        total={total}
      />
    </div>
  )
}
