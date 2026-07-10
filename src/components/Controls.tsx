import type { MouseEvent } from 'react'

interface Props {
  visible: boolean
  theme: 'light' | 'dark'
  onToggleTheme: (e: MouseEvent) => void
  onRestart: (e: MouseEvent) => void
  onPrev: (e: MouseEvent) => void
  onNext: (e: MouseEvent) => void
  atStart: boolean
  atEnd: boolean
  pos: number
  total: number
}

export function Controls({
  visible,
  theme,
  onToggleTheme,
  onRestart,
  onPrev,
  onNext,
  atStart,
  atEnd,
  pos,
  total,
}: Props) {
  return (
    <div className={`controls ${visible ? 'show' : 'hide'}`} aria-hidden={!visible}>
      <div className="topbar">
        <button className="ctrl label" onClick={onRestart} aria-label="Restart">
          RESTART
        </button>
        <span className="sep">|</span>
        <button className="ctrl label" onClick={onToggleTheme} aria-label="Toggle dark mode">
          {theme === 'dark' ? 'LIGHT' : 'DARK'}
        </button>
      </div>

      <button className="ctrl arrow arrow-left" onClick={onPrev} disabled={atStart} aria-label="Back">
        ←
      </button>
      <button className="ctrl arrow arrow-right" onClick={onNext} disabled={atEnd} aria-label="Forward">
        →
      </button>

      <div className="progress">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`step ${i <= pos ? 'done' : ''}`} />
        ))}
      </div>
    </div>
  )
}
