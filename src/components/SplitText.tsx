import { Fragment, Suspense, lazy, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { COMMA_PAUSE, EASE, LETTER_DUR, LETTER_RISE, LETTER_STAGGER, revealDuration, type Segment } from '../lib/anim'

// three.js is heavy — only load it when an organic-beat actually renders
const MagicRings = lazy(() => import('./MagicRings').then((m) => ({ default: m.MagicRings })))

type As = 'p' | 'h1' | 'span' | 'div'

interface Props {
  words: Segment[]
  animate: string
  as?: As
  className?: string
  baseDelay?: number
  dimmed?: boolean
  durScale?: number // multiplies each letter's fade duration (used to slow the finale)
}

const has = (w: Segment, c: string) => (w.classes ?? []).includes(c)

// Continuous gradient across a phrase: measure each letter's real offset, then drift a
// shared shift over time so the rust colours flow through the phrase — like ReactBits
// GradientText (background-position animated across a repeating gradient). The gradient
// spans exactly the phrase width and repeats, so a full-width drift loops seamlessly.
const GRAD_CYCLE = 8 // seconds for the colours to travel one full phrase width

function GradientRun({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const widthRef = useRef(1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const base = el.getBoundingClientRect()
      widthRef.current = base.width || 1
      el.querySelectorAll<HTMLElement>('.letter').forEach((l) => {
        const r = l.getBoundingClientRect()
        l.style.backgroundSize = `${base.width}px 100%`
        l.style.setProperty('--gx', `${-(r.left - base.left)}px`)
      })
    }
    measure()
    if (document.fonts?.ready) document.fonts.ready.then(measure)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const t0 = performance.now()
    let mouse = 0
    let target = 0
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      target = ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 24
    }
    window.addEventListener('mousemove', onMove)
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const t = (now - t0) / 1000
      mouse += (target - mouse) * 0.05
      const w = widthRef.current
      const drift = ((t / GRAD_CYCLE) * w) % w // one seamless phrase-width loop
      el.style.setProperty('--gshift', `${drift + mouse}px`)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <span ref={ref} className="gradient-run">
      {children}
    </span>
  )
}

export function SplitText({
  words,
  animate,
  as = 'span',
  className = '',
  baseDelay = 0,
  dimmed = false,
  durScale = 1,
}: Props) {
  const Tag = as
  const shown = animate === 'visible'
  let li = 0
  let commaExtra = 0

  const letter = (ch: string, key: number, grad: boolean) => {
    const delay = baseDelay + li * LETTER_STAGGER + commaExtra
    li++
    if (ch === ',') commaExtra += COMMA_PAUSE
    return (
      <motion.span
        key={key}
        className={grad ? 'letter grad' : 'letter'}
        initial={{ opacity: 0, y: LETTER_RISE }}
        animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: LETTER_RISE }}
        transition={{ duration: LETTER_DUR * durScale, ease: EASE, delay: shown ? delay : 0 }}
      >
        {ch}
      </motion.span>
    )
  }

  const wordSpan = (w: Segment, key: number, grad: boolean) => {
    const cls = ['word', ...(w.classes ?? []).filter((c) => c !== 'gradient' && c !== 'organic-beat')]
    return (
      <Fragment key={key}>
        <span className={cls.join(' ').trim()}>{Array.from(w.text).map((ch, ci) => letter(ch, ci, grad))}</span>
        {w.space ? ' ' : ''}
      </Fragment>
    )
  }

  const ringsDelay = revealDuration(words)

  const nodes: ReactNode[] = []
  let i = 0
  while (i < words.length) {
    if (has(words[i], 'organic-beat')) {
      const start = i
      const run: Segment[] = []
      while (i < words.length && has(words[i], 'organic-beat')) run.push(words[i++])
      nodes.push(
        <span key={`o-${start}`} className="organic-group">
          <Suspense fallback={null}>
            <MagicRings active={shown} delay={ringsDelay} />
          </Suspense>
          <span className="organic-text">{run.map((w, wi) => wordSpan(w, wi, false))}</span>
        </span>,
      )
      continue
    }
    if (has(words[i], 'gradient')) {
      const start = i
      const run: Segment[] = []
      while (i < words.length && has(words[i], 'gradient')) run.push(words[i++])
      nodes.push(<GradientRun key={`g-${start}`}>{run.map((w, wi) => wordSpan(w, wi, true))}</GradientRun>)
      continue
    }
    nodes.push(wordSpan(words[i], i, false))
    i++
  }

  return (
    <Tag className={className} style={{ opacity: dimmed ? 0.34 : 1, transition: 'opacity 0.6s ease' }}>
      {nodes}
    </Tag>
  )
}
