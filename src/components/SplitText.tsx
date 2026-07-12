import {
  Fragment,
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react'
import { motion } from 'framer-motion'
import { COMMA_PAUSE, EASE, LETTER_DUR, LETTER_RISE, LETTER_STAGGER, revealDuration, type Segment } from '../lib/anim'

// heavy / WebGL effects — only loaded when a beat actually uses one
const MagicRings = lazy(() => import('./MagicRings').then((m) => ({ default: m.MagicRings })))
const Orb = lazy(() => import('./Orb').then((m) => ({ default: m.Orb })))
const Spark = lazy(() => import('./Spark').then((m) => ({ default: m.Spark })))
const Starry = lazy(() => import('./Starry').then((m) => ({ default: m.Starry })))

// class name (from [x]{class} markup) -> full-screen background effect behind the phrase
type EffectProps = { active: boolean; delay: number }
const EFFECTS: Record<string, LazyExoticComponent<ComponentType<EffectProps>>> = {
  'organic-beat': MagicRings,
  orb: Orb,
  spark: Spark,
  starry: Starry,
}
const EFFECT_KEYS = Object.keys(EFFECTS)
// effect classes that are purely background (stripped from the text span). 'spark' is
// kept because it also nudges the word's weight.
const BG_ONLY = new Set(['organic-beat', 'orb', 'starry'])

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
const GRAD_CYCLE = 6.96 // seconds for the colours to travel one full phrase width (~15% faster)

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

  const letter = (ch: string, key: number, grad: boolean, slow: boolean) => {
    const delay = baseDelay + li * LETTER_STAGGER + commaExtra
    li++
    if (ch === ',') commaExtra += COMMA_PAUSE
    return (
      <motion.span
        key={key}
        className={grad ? 'letter grad' : 'letter'}
        initial={{ opacity: 0, y: LETTER_RISE }}
        animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: LETTER_RISE }}
        transition={{ duration: LETTER_DUR * durScale * (slow ? 2 : 1), ease: EASE, delay: shown ? delay : 0 }}
      >
        {ch}
      </motion.span>
    )
  }

  const wordSpan = (w: Segment, key: number, grad: boolean) => {
    // keep 'gradient' on the span (drives its font-weight); the visual fill lives on
    // the letters via `grad`. background-only effect classes are stripped (handled by
    // the effect wrapper).
    const cls = ['word', ...(w.classes ?? []).filter((c) => !BG_ONLY.has(c))]
    // `slow`: fade this word in at 2x and add a comma-length pause after it, so the text
    // reads more slowly here even without a visible comma.
    const slow = has(w, 'slow')
    const spans = Array.from(w.text).map((ch, ci) => letter(ch, ci, grad, slow))
    if (slow) commaExtra += COMMA_PAUSE
    return (
      <Fragment key={key}>
        <span className={cls.join(' ').trim()}>{spans}</span>
        {w.space ? ' ' : ''}
      </Fragment>
    )
  }

  const ringsDelay = revealDuration(words)

  const nodes: ReactNode[] = []
  let i = 0
  while (i < words.length) {
    const effectKey = EFFECT_KEYS.find((k) => has(words[i], k))
    if (effectKey) {
      const Effect = EFFECTS[effectKey]
      const start = i
      const run: Segment[] = []
      while (i < words.length && has(words[i], effectKey)) run.push(words[i++])
      const runGrad = run.some((w) => has(w, 'gradient')) // e.g. [*curiosity*]{organic-beat}
      const inner = run.map((w, wi) => wordSpan(w, wi, runGrad))
      nodes.push(
        <span key={`fx-${start}`} className="organic-group">
          <Suspense fallback={null}>
            <Effect active={shown} delay={ringsDelay} />
          </Suspense>
          <span className="organic-text">{runGrad ? <GradientRun>{inner}</GradientRun> : inner}</span>
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
