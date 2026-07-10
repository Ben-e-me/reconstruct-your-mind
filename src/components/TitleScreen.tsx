import { useLayoutEffect, useRef, useState } from 'react'
import { LETTER_STAGGER, toWords, type Segment } from '../lib/anim'
import { SplitText } from './SplitText'

const grad = (s: string): Segment[] => toWords(s).map((w) => ({ ...w, classes: ['gradient'] }))
const letterCount = (s: string) => s.replace(/\s/g, '').length

const CRED_1 = 'written by Jan Heinemeyer'
const CRED_2 = 'designed by Benjamin Erxleben'

export function TitleScreen() {
  const headRef = useRef<HTMLDivElement>(null)
  const [pressTop, setPressTop] = useState<number | null>(null)

  // place "press to start" at the vertical midpoint between the subline and the bottom edge
  useLayoutEffect(() => {
    const measure = () => {
      if (!headRef.current) return
      const bottom = headRef.current.getBoundingClientRect().bottom
      setPressTop((bottom + window.innerHeight) / 2)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (headRef.current) ro.observe(headRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const cred1Delay = 1.95
  const cred2Delay = cred1Delay + letterCount(CRED_1) * LETTER_STAGGER + 0.2
  const pressDelay = cred2Delay + letterCount(CRED_2) * LETTER_STAGGER + 0.6

  return (
    <div className="title-screen">
      <div className="ts-head" ref={headRef}>
        <SplitText words={grad('Reconstruct Your Mind')} animate="visible" as="h1" className="ts-title" baseDelay={0.2} />
        <div className="ts-credits">
          <SplitText words={toWords(CRED_1)} animate="visible" className="ts-credit" baseDelay={cred1Delay} />
          <SplitText words={toWords(CRED_2)} animate="visible" className="ts-credit" baseDelay={cred2Delay} />
        </div>
      </div>

      <div className="press" style={pressTop != null ? { top: pressTop } : { display: 'none' }}>
        <SplitText words={toWords('Press to start')} animate="visible" className="ts-press-text" baseDelay={pressDelay} />
      </div>
    </div>
  )
}
