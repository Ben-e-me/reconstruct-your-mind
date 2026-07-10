import { LETTER_STAGGER, toWords, type Segment } from '../lib/anim'
import { SplitText } from './SplitText'

const grad = (s: string): Segment[] => toWords(s).map((w) => ({ ...w, classes: ['gradient'] }))
const letterCount = (s: string) => s.replace(/\s/g, '').length

const CRED_1 = 'written by Jan Heinemeyer'
const CRED_2 = 'designed by Benjamin Erxleben'

export function TitleScreen() {
  const titleDelay = 0.2
  const cred1Delay = 1.95 // +30% pause vs. the first pass
  const cred2Delay = cred1Delay + letterCount(CRED_1) * LETTER_STAGGER + 0.2 // short gap, then continue
  const pressDelay = cred2Delay + letterCount(CRED_2) * LETTER_STAGGER + 0.6

  return (
    <div className="title-screen">
      <SplitText words={grad('Reconstruct Your Mind')} animate="visible" as="h1" className="ts-title" baseDelay={titleDelay} />

      <div className="ts-credits">
        <SplitText words={toWords(CRED_1)} animate="visible" className="ts-credit" baseDelay={cred1Delay} />
        <SplitText words={toWords(CRED_2)} animate="visible" className="ts-credit" baseDelay={cred2Delay} />
      </div>

      <div className="press">
        <SplitText words={toWords('Press to start')} animate="visible" className="ts-press-text" baseDelay={pressDelay} />
      </div>
    </div>
  )
}
