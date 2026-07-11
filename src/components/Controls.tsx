import type { MouseEvent } from 'react'

interface Props {
  visible: boolean
  showNav: boolean
  theme: 'light' | 'dark'
  onToggleTheme: (e: MouseEvent) => void
  onRestart: (e: MouseEvent) => void
  onPrev: (e: MouseEvent) => void
  onNext: (e: MouseEvent) => void
  atStart: boolean
  atEnd: boolean
  ready: boolean
  pos: number
  total: number
  onStep: (i: number) => void
}

export function Controls({
  visible,
  showNav,
  theme,
  onToggleTheme,
  onRestart,
  onPrev,
  onNext,
  atStart,
  atEnd,
  ready,
  pos,
  total,
  onStep,
}: Props) {
  return (
    <>
      <div className={`controls ${visible ? 'show' : 'hide'}`} aria-hidden={!visible}>
        <div className="topbar">
          <button className="ctrl label" onClick={onRestart} aria-label="Restart">
            RESTART
          </button>
          <span className="sep">|</span>
          <button className="ctrl label" onClick={onToggleTheme} aria-label="Toggle dark mode">
            {theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
          </button>
        </div>

        <div className="progress">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              className={`step ${i <= pos ? 'done' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onStep(i)
              }}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {showNav && (
        <>
          <button
            className={`arrow arrow-left ${visible ? 'show' : ''}`}
            onClick={onPrev}
            disabled={atStart}
            aria-label="Back"
          >
            <span className="arrow-glyph">←</span>
          </button>
          <button
            className={`arrow arrow-right ${ready ? 'ready' : ''}`}
            onClick={onNext}
            disabled={atEnd}
            aria-label="Forward"
          >
            <span className="arrow-glyph">→</span>
          </button>
        </>
      )}
    </>
  )
}
