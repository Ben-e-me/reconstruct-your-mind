import { motion } from 'framer-motion'
import type { Beat as BeatT } from '../lib/parseStory'
import { ELLIPSIS_DOT_STAGGER } from '../lib/anim'
import { SplitText } from './SplitText'

export function Beat({
  beat,
  revealed,
  dimmed = false,
  startAfter = 0,
}: {
  beat: BeatT
  revealed: boolean
  dimmed?: boolean
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
    // three dots pulsing sequentially, starting after the previous line finished
    return (
      <div className={`beat ellipsis place-${beat.placement}`}>
        {[0, 1, 2].map((i) => {
          const d = startAfter + i * ELLIPSIS_DOT_STAGGER
          return (
            <span
              key={i}
              className={`dot ${revealed ? 'pulsing' : ''}`}
              style={revealed ? { animationDelay: `${d}s, ${d + 0.6}s` } : undefined}
            >
              .
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <SplitText
      words={beat.words}
      animate={revealed ? 'visible' : 'hidden'}
      dimmed={dimmed}
      as={beat.type === 'title' ? 'h1' : 'p'}
      className={`beat ${beat.type} place-${beat.placement}`}
    />
  )
}
