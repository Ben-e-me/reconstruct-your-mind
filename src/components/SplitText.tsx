import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { COMMA_PAUSE, EASE, LETTER_DUR, LETTER_RISE, LETTER_STAGGER, type Segment } from '../lib/anim'

type As = 'p' | 'h1' | 'span' | 'div'

interface Props {
  words: Segment[]
  animate: string
  as?: As
  className?: string
  baseDelay?: number
}

// Each letter animates on its own (explicit initial/animate + per-letter delay).
// A comma adds an extra pause to everything that follows it, like speech.
export function SplitText({ words, animate, as = 'span', className = '', baseDelay = 0 }: Props) {
  const Tag = as
  const shown = animate === 'visible'
  let li = 0
  let commaExtra = 0

  return (
    <Tag className={className}>
      {words.map((w, wi) => (
        <Fragment key={wi}>
          <span className={['word', ...(w.classes ?? [])].join(' ').trim()}>
            {Array.from(w.text).map((ch, ci) => {
              const delay = baseDelay + li * LETTER_STAGGER + commaExtra
              li++
              if (ch === ',') commaExtra += COMMA_PAUSE
              return (
                <motion.span
                  key={ci}
                  className="letter"
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
      ))}
    </Tag>
  )
}
