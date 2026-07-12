import { useEffect, useMemo, useState, type CSSProperties } from 'react'

// "Starry": a binary-simplified night sky — small circles in the contrast colour,
// scattered stochastically at varied opacities, with the occasional one twinkling
// (roughly one every half second across the field). A crescent moon sits top-right.

interface Star {
  x: number
  y: number
  size: number
  base: number // resting opacity
  dur: number // twinkle cycle
  delay: number
}

const COUNT = 80

function buildStars(): Star[] {
  return Array.from({ length: COUNT }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2.4,
    base: 0.12 + Math.random() * 0.4,
    // each star twinkles once per ~7-13s -> across COUNT stars ~one blink every ~0.5s
    dur: 7 + Math.random() * 6,
    delay: Math.random() * 13,
  }))
}

export function Starry({ active = true, delay = 0 }: { active?: boolean; delay?: number }) {
  const [started, setStarted] = useState(false)
  const stars = useMemo(buildStars, [])

  useEffect(() => {
    if (!active) {
      setStarted(false)
      return
    }
    const t = window.setTimeout(() => setStarted(true), delay * 1000)
    return () => window.clearTimeout(t)
  }, [active, delay])

  return (
    <div className={`starry-fx ${started ? 'appear' : ''}`} aria-hidden="true">
      {started &&
        stars.map((s, i) => (
          <span
            key={i}
            className="star"
            style={
              {
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                '--base': s.base,
                animationDuration: `${s.dur}s`,
                animationDelay: `${s.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      {started && (
        <svg className="starry-moon" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <radialGradient id="moonTex" cx="38%" cy="34%" r="70%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
            </radialGradient>
            <mask id="crescent">
              <rect width="100" height="100" fill="black" />
              <circle cx="50" cy="50" r="34" fill="white" />
              <circle cx="64" cy="42" r="30" fill="black" />
            </mask>
          </defs>
          <g mask="url(#crescent)">
            <circle cx="50" cy="50" r="34" fill="url(#moonTex)" />
            {/* subtle craters */}
            <circle cx="42" cy="60" r="4" fill="currentColor" fillOpacity="0.18" />
            <circle cx="36" cy="48" r="2.6" fill="currentColor" fillOpacity="0.14" />
            <circle cx="47" cy="70" r="2" fill="currentColor" fillOpacity="0.12" />
          </g>
        </svg>
      )}
    </div>
  )
}
