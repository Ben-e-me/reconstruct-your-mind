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
            <span key={i} className={`step ${i <= pos ? 'done' : ''}`} />
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
            className={`arrow arrow-right ${visible ? 'show' : ''} ${ready ? 'ready' : ''}`}
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
