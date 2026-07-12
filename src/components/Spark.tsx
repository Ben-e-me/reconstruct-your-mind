import { useEffect, useMemo, useRef, useState } from 'react'

// "Spark": ReactBits ClickSpark's plop burst (radiating lines), auto-emitted at points
// spread stochastically but evenly across the screen. The bursts fire in one wave that
// radiates out from the centre, looping. Each point peaks around 40% opacity, ±20%.

interface Point {
  x: number // 0..1
  y: number // 0..1
  angles: number[]
  delay: number // s (distance from centre -> outward wave)
  peak: number // 0..1
}

const SPACING = 0.12 // normalized grid spacing
const JITTER = 0.5
const SPARK_COUNT = 8
const BURST = 0.5 // seconds a single plop lasts
const WAVE = 1.4 // seconds from centre to the far corner
const CYCLE = 3.6 // seconds per loop

function buildPoints(): Point[] {
  const pts: Point[] = []
  const n = Math.ceil(1 / SPACING)
  const maxDist = Math.hypot(0.5, 0.5)
  for (let r = 0; r <= n; r++) {
    for (let c = 0; c <= n; c++) {
      const x = c * SPACING + (Math.random() - 0.5) * SPACING * JITTER * 2
      const y = r * SPACING + (Math.random() - 0.5) * SPACING * JITTER * 2
      if (x < -0.05 || x > 1.05 || y < -0.05 || y > 1.05) continue
      const dist = Math.hypot(x - 0.5, y - 0.5) / maxDist
      const base = Math.random() * Math.PI * 2
      const angles = Array.from({ length: SPARK_COUNT }, (_, i) => base + (i / SPARK_COUNT) * Math.PI * 2)
      pts.push({ x, y, angles, delay: dist * WAVE, peak: 0.4 * (1 + (Math.random() - 0.5) * 0.4) })
    }
  }
  return pts
}

const easeOut = (t: number) => t * (2 - t)

export function Spark({ active = true, delay = 0 }: { active?: boolean; delay?: number }) {
  const [started, setStarted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const points = useMemo(buildPoints, [])

  useEffect(() => {
    if (!active) {
      setStarted(false)
      return
    }
    const t = window.setTimeout(() => setStarted(true), delay * 1000)
    return () => window.clearTimeout(t)
  }, [active, delay])

  useEffect(() => {
    if (!started) return
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    const ctx = canvas.getContext('2d')
    if (!parent || !ctx) return

    let dpr = Math.min(window.devicePixelRatio, 2)
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio, 2)
      const { width, height } = parent.getBoundingClientRect()
      canvas.width = width * dpr
      canvas.height = height * dpr
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    const stroke = getComputedStyle(canvas).color || '#eae6e1'
    let frame = 0
    const t0 = performance.now()
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw)
      const t = (now - t0) / 1000
      const W = canvas.width
      const H = canvas.height
      const min = Math.min(W, H)
      const radius = min * 0.05
      const len = min * 0.032
      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.5 * dpr
      ctx.lineCap = 'round'
      for (const p of points) {
        const phase = (t - p.delay) % CYCLE
        if (phase < 0 || phase >= BURST) continue
        const prog = phase / BURST
        const eased = easeOut(prog)
        const dist = eased * radius
        const lineLen = len * (1 - eased)
        const px = p.x * W
        const py = p.y * H
        ctx.globalAlpha = p.peak * (1 - prog)
        ctx.beginPath()
        for (const a of p.angles) {
          const ca = Math.cos(a)
          const sa = Math.sin(a)
          ctx.moveTo(px + dist * ca, py + dist * sa)
          ctx.lineTo(px + (dist + lineLen) * ca, py + (dist + lineLen) * sa)
        }
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [started, points])

  // rendered inside the scene (absolute) so it blurs out with the text on scene exit
  return (
    <div className={`spark-fx ${started ? 'appear' : ''}`} aria-hidden="true">
      <canvas ref={canvasRef} className="spark-canvas" />
    </div>
  )
}
