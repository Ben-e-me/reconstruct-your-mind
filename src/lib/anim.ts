export const EASE = [0.22, 0.61, 0.36, 1] as const

// timing
export const LETTER_STAGGER = 0.045
export const LETTER_DUR = 0.6
export const BLUR_DUR = 0.75
export const COMMA_PAUSE = 0.4 // extra pause after a comma, natural speech rhythm
export const LETTER_RISE = '0.32em' // vertical travel per letter (no bounce)

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
