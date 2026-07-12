import { useLayoutEffect, useRef, useState } from 'react'
import { LETTER_STAGGER, toWords, type Segment } from '../lib/anim'
import { SplitText } from './SplitText'

const grad = (s: string): Segment[] => toWords(s).map((w) => ({ ...w, classes: ['gradient'] }))
const letterCount = (s: string) => s.replace(/\s/g, '').length

const CREDITS = [
  { prefix: 'written by', name: 'Jan Heinemeyer', url: 'https://www.linkedin.com/in/janheinemeyer/' },
  { prefix: 'designed by', name: 'Benjamin Erxleben', url: 'https://www.linkedin.com/in/benjamin-erxleben/' },
] as const

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

  const [c1, c2] = CREDITS
  const cred1Delay = 1.95
  const name1Delay = cred1Delay + letterCount(c1.prefix) * LETTER_STAGGER
  const cred2Delay = cred1Delay + letterCount(c1.prefix + c1.name) * LETTER_STAGGER + 0.2
  const name2Delay = cred2Delay + letterCount(c2.prefix) * LETTER_STAGGER
  const pressDelay = cred2Delay + letterCount(c2.prefix + c2.name) * LETTER_STAGGER + 0.6
  const nameDelays = [name1Delay, name2Delay]
  const prefixDelays = [cred1Delay, cred2Delay]

  return (
    <div className="title-screen">
      <div className="ts-head" ref={headRef}>
        <SplitText words={grad('Reconstruct Your Mind')} animate="visible" as="h1" className="ts-title" baseDelay={0.2} />
        <div className="ts-credits">
          {CREDITS.map((c, i) => (
            <div className="ts-credit" key={c.name}>
              <SplitText words={toWords(c.prefix)} animate="visible" as="span" baseDelay={prefixDelays[i]} />{' '}
              <a
                className="credit-link"
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <SplitText words={toWords(c.name)} animate="visible" as="span" baseDelay={nameDelays[i]} />
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="press" style={pressTop != null ? { top: pressTop } : { display: 'none' }}>
        <SplitText words={toWords('Press to start')} animate="visible" className="ts-press-text" baseDelay={pressDelay} />
        <span className="press-key" style={{ animationDelay: `${pressDelay + 0.5}s` }} aria-hidden="true">
          →
        </span>
      </div>
    </div>
  )
}
