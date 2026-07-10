import { useEffect, useRef } from 'react'

// rust palette
const COLORS = ['#e8b08a', '#d67d4a', '#b5533a']

const RING_COUNT = 7
const SPEED = 1.2
const BASE_RADIUS = 0.26
const OPACITY = 0.35
const LINE = 2

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// subtle, blurry, liquid concentric rings — vertically oriented ellipses
export function MagicRings() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf = 0
    const t0 = performance.now()

    const size = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, rect.width * dpr)
      canvas.height = Math.max(1, rect.height * dpr)
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(canvas)

    const frame = (now: number) => {
      const t = ((now - t0) / 1000) * SPEED
      const w = canvas.width
      const h = canvas.height
      const unit = Math.min(w, h)
      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2, h / 2)
      for (let i = 0; i < RING_COUNT; i++) {
        const phase = (t * 0.16 + i / RING_COUNT) % 1
        const r = (BASE_RADIUS + phase * 0.9) * unit * 0.5
        const alpha = OPACITY * Math.sin(phase * Math.PI) * (1 - phase * 0.3)
        if (alpha <= 0) continue
        ctx.beginPath()
        // vertical ellipse (rotation 90): taller than wide
        ctx.ellipse(0, 0, r * 0.62, r, 0, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(COLORS[i % COLORS.length], alpha)
        ctx.lineWidth = LINE * dpr
        ctx.stroke()
      }
      ctx.restore()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={ref} className="magic-rings" aria-hidden="true" />
}
