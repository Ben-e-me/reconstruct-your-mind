import { Fragment, Suspense, lazy, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { COMMA_PAUSE, EASE, LETTER_DUR, LETTER_RISE, LETTER_STAGGER, type Segment } from '../lib/anim'

// three.js is heavy — only load it when an organic-beat actually renders
const MagicRings = lazy(() => import('./MagicRings').then((m) => ({ default: m.MagicRings })))

type As = 'p' | 'h1' | 'span' | 'div'

interface Props {
  words: Segment[]
  animate: string
  as?: As
  className?: string
  baseDelay?: number
  dimmed?: boolean
}

export function SplitText({ words, animate, as = 'span', className = '', baseDelay = 0, dimmed = false }: Props) {
  const Tag = as
  const shown = animate === 'visible'
  let li = 0
  let commaExtra = 0

  const renderWord = (w: Segment, key: number): ReactNode => {
    const classes = w.classes ?? []
    const isGradient = classes.includes('gradient')
    const chars = Array.from(w.text)
    const n = chars.length
    return (
      <Fragment key={key}>
        <span className={['word', ...classes].join(' ').trim()}>
          {chars.map((ch, ci) => {
            const delay = baseDelay + li * LETTER_STAGGER + commaExtra
            li++
            if (ch === ',') commaExtra += COMMA_PAUSE
            let style: CSSProperties | undefined
            if (isGradient) {
              const slice = n > 1 ? `${(ci / (n - 1)) * 100}%` : '50%'
              style = {
                backgroundSize: `${n * 100}% 100%`,
                // static per-letter slice + a time-based pulse (see .gradient .letter)
                backgroundPositionX: `calc(${slice} + var(--grad-shift, 0%))`,
              }
            }
            return (
              <motion.span
                key={ci}
                className="letter"
                style={style}
                initial={{ opacity: 0, y: LETTER_RISE }}
                animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: LETTER_RISE }}
                transition={{ duration: LETTER_DUR, ease: EASE, delay: shown ? delay : 0 }}
              >
                {ch}
              </motion.span>
            )
          })}
        </span>
        {w.space ? ' ' : ''}
      </Fragment>
    )
  }

  // group consecutive organic-beat words so the rings render once, centered on the phrase
  const nodes: ReactNode[] = []
  let i = 0
  while (i < words.length) {
    if (words[i].classes?.includes('organic-beat')) {
      const run: Segment[] = []
      const startKey = i
      while (i < words.length && words[i].classes?.includes('organic-beat')) {
        run.push(words[i])
        i++
      }
      nodes.push(
        <span key={`organic-${startKey}`} className="organic-group">
          <Suspense fallback={null}>
            <MagicRings />
          </Suspense>
          {run.map((rw, ri) => renderWord(rw, startKey * 1000 + ri))}
        </span>,
      )
    } else {
      nodes.push(renderWord(words[i], i))
      i++
    }
  }

  return (
    <Tag className={className} style={{ opacity: dimmed ? 0.4 : 1, transition: 'opacity 0.6s ease' }}>
      {nodes}
    </Tag>
  )
}
