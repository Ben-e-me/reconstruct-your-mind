import { motion } from 'framer-motion'
import type { Beat as BeatT } from '../lib/parseStory'
import { SplitText } from './SplitText'

export function Beat({ beat, revealed }: { beat: BeatT; revealed: boolean }) {
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
    // no extra click — the dots simply follow the text after a 2s pause
    return (
      <div className={`beat ellipsis place-${beat.placement}`}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="dot"
            initial={{ opacity: 0, y: '0.3em' }}
            animate={revealed ? { opacity: 0.4, y: 0 } : { opacity: 0, y: '0.3em' }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: revealed ? 2 + i * 0.6 : 0 }}
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
