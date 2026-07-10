export const EASE = [0.22, 0.61, 0.36, 1] as const

// timing
export const LETTER_STAGGER = 0.045
export const LETTER_DUR = 0.6
export const BLUR_DUR = 0.75
export const COMMA_PAUSE = 0.48 // extra pause after a comma (+20%)
export const LETTER_RISE = '0.32em' // vertical travel per letter (no bounce)
export const ELLIPSIS_PAUSE = 0.35 // pause after the previous line before the ellipsis
export const ELLIPSIS_DOT_STAGGER = 0.22 // per-dot delay for standalone ellipses
export const ARROW_DELAY = 1.0 // wait after the beat finishes before the forward arrow appears

export interface Segment {
  text: string
  classes?: string[]
  space?: boolean
}

export function toWords(str: string): Segment[] {
  return str
    .split(/(\s+)/)
    .filter((p) => p !== '')
    .reduce<Segment[]>((acc, piece) => {
      if (/^\s+$/.test(piece)) {
        if (acc.length) acc[acc.length - 1].space = true
      } else {
        acc.push({ text: piece, classes: [], space: false })
      }
      return acc
    }, [])
}

// time until the last letter of a set of words has finished animating in
export function revealDuration(words: Segment[]): number {
  let letters = 0
  let commas = 0
  for (const w of words) {
    for (const ch of Array.from(w.text.replace(/…/g, '...'))) {
      if (/\s/.test(ch)) continue
      letters++
      if (ch === ',') commas++
    }
  }
  if (letters === 0) return 0
  return (letters - 1) * LETTER_STAGGER + commas * COMMA_PAUSE + LETTER_DUR
}
