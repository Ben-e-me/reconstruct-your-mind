import { motion } from 'framer-motion'
import type { Beat as BeatT } from '../lib/parseStory'
import { EASE, ELLIPSIS_DOT_STAGGER, LETTER_DUR, LETTER_RISE } from '../lib/anim'
import { SplitText } from './SplitText'

export function Beat({
  beat,
  revealed,
  startAfter = 0,
}: {
  beat: BeatT
  revealed: boolean
  startAfter?: number
}) {
  if (beat.type === 'divider') {
    return (
      <motion.div
        className="beat divider"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <span className="divider-rule" />
      </motion.div>
    )
  }

  if (beat.type === 'ellipsis') {
    // three separate dots, text-appear style, starting only after the previous line finished
    return (
      <div className={`beat ellipsis place-${beat.placement}`}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="dot"
            initial={{ opacity: 0, y: LETTER_RISE }}
            animate={revealed ? { opacity: 0.4, y: 0 } : { opacity: 0, y: LETTER_RISE }}
            transition={{
              duration: LETTER_DUR,
              ease: EASE,
              delay: revealed ? startAfter + i * ELLIPSIS_DOT_STAGGER : 0,
            }}
          >
            .
          </motion.span>
        ))}
      </div>
    )
  }

  return (
    <SplitText
      words={beat.words}
      animate={revealed ? 'visible' : 'hidden'}
      as={beat.type === 'title' ? 'h1' : 'p'}
      className={`beat ${beat.type} place-${beat.placement}`}
    />
  )
}
