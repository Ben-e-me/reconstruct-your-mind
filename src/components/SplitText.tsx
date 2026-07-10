import { Fragment, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { COMMA_PAUSE, EASE, LETTER_DUR, LETTER_RISE, LETTER_STAGGER, type Segment } from '../lib/anim'
import { MagicRings } from './MagicRings'

type As = 'p' | 'h1' | 'span' | 'div'

interface Props {
  words: Segment[]
  animate: string
  as?: As
  className?: string
  baseDelay?: number
}

// Each letter animates on its own. For gradient words the gradient is sliced
// across the letters so it reads as one continuous sweep over the whole word.
export function SplitText({ words, animate, as = 'span', className = '', baseDelay = 0 }: Props) {
  const Tag = as
  const shown = animate === 'visible'
  let li = 0
  let commaExtra = 0

  return (
    <Tag className={className}>
      {words.map((w, wi) => {
        const classes = w.classes ?? []
        const isGradient = classes.includes('gradient')
        const isOrganic = classes.includes('organic-beat')
        const chars = Array.from(w.text)
        const n = chars.length

        return (
          <Fragment key={wi}>
            <span
              className={['word', ...classes].join(' ').trim()}
              style={isOrganic ? { position: 'relative' } : undefined}
            >
              {isOrganic && <MagicRings />}
              {chars.map((ch, ci) => {
                const delay = baseDelay + li * LETTER_STAGGER + commaExtra
                li++
                if (ch === ',') commaExtra += COMMA_PAUSE

                let style: CSSProperties | undefined
                if (isGradient) {
                  style = {
                    backgroundSize: `${n * 100}% 100%`,
                    backgroundPositionX: n > 1 ? `${(ci / (n - 1)) * 100}%` : '50%',
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
      })}
    </Tag>
  )
}
