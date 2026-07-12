import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

// "Spark": small dots spread stochastically but evenly (a jittered grid) across the
// screen. After the text finishes they pop in one wave that radiates out from the
// centre, looping. Each dot peaks around 40% opacity in the contrast colour, ±20%.

interface Dot {
  x: number // %
  y: number // %
  size: number // px
  delay: number // s (distance-based -> outward wave)
  peak: number // 0..1
}

const SPACING = 8 // vw/vh grid spacing
const JITTER = 0.45 // fraction of spacing
const WAVE = 1.5 // seconds from centre to the far corner
const CYCLE = 5 // seconds per loop (pop, then quiet)

function buildDots(): Dot[] {
  const dots: Dot[] = []
  const cols = Math.ceil(100 / SPACING)
  const rows = Math.ceil(100 / SPACING)
  const maxDist = Math.hypot(50, 50)
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const jx = (Math.random() - 0.5) * SPACING * JITTER * 2
      const jy = (Math.random() - 0.5) * SPACING * JITTER * 2
      const x = c * SPACING + jx
      const y = r * SPACING + jy
      if (x < -2 || x > 102 || y < -2 || y > 102) continue
      const dist = Math.hypot(x - 50, y - 50) / maxDist
      dots.push({
        x,
        y,
        size: 3 + Math.random() * 3,
        delay: dist * WAVE,
        peak: 0.4 * (1 + (Math.random() - 0.5) * 0.4), // ±20%
      })
    }
  }
  return dots
}

export function Spark({ active = true, delay = 0 }: { active?: boolean; delay?: number }) {
  const [started, setStarted] = useState(false)
  const dots = useMemo(buildDots, [])

  useEffect(() => {
    if (!active) {
      setStarted(false)
      return
    }
    const t = window.setTimeout(() => setStarted(true), delay * 1000)
    return () => window.clearTimeout(t)
  }, [active, delay])

  if (!started) return null

  return createPortal(
    <div className="spark-fx appear" aria-hidden="true">
      {dots.map((d, i) => (
        <span
          key={i}
          className="spark"
          style={
            {
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              '--peak': d.peak,
              animationDelay: `${d.delay}s`,
              animationDuration: `${CYCLE}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  )
}
