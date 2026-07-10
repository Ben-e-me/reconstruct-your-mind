export type Placement = 'left' | 'right' | 'center'
export type BeatType = 'text' | 'title' | 'ellipsis' | 'divider'
export type SceneKind = 'stack' | 'grid'

export interface Word {
  text: string
  classes: string[]
  space: boolean
}

export interface Beat {
  id: number
  type: BeatType
  placement: Placement
  words: Word[]
  audioAt?: number
}

export interface Scene {
  id: number
  kind: SceneKind
  beats: Beat[]
}

const placementRe = /^\{(left|right|center)\}\s*/
const isEllipsis = (t: string) => t === '…' || t === '...'
const isDivider = (t: string) => t === '—' || t === '--'

// Inline markup + auto-italic quotes -> per-word tokens (classes carried onto each word).
const MARK =
  /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|~[^~]+~|\[[^\]]+\]\{[A-Za-z0-9_-]+\}|“[^”]+”|"[^"]+")/g

function classifySegment(seg: string): { text: string; classes: string[] } {
  if (/^\*\*[^*]+\*\*$/.test(seg)) return { text: seg.slice(2, -2), classes: ['gradient', 'impact'] }
  if (/^\*[^*]+\*$/.test(seg)) return { text: seg.slice(1, -1), classes: ['gradient'] }
  if (/^__[^_]+__$/.test(seg)) return { text: seg.slice(2, -2), classes: ['bold'] }
  if (/^_[^_]+_$/.test(seg)) return { text: seg.slice(1, -1), classes: ['light'] }
  if (/^~[^~]+~$/.test(seg)) return { text: seg.slice(1, -1), classes: ['soft'] }
  const custom = seg.match(/^\[([^\]]+)\]\{([A-Za-z0-9_-]+)\}$/)
  if (custom) return { text: custom[1], classes: [custom[2]] }
  if (/^“.+”$/.test(seg) || /^".+"$/.test(seg)) return { text: seg, classes: ['quote'] }
  return { text: seg, classes: [] }
}

function tokenize(raw: string): Word[] {
  const parts = raw.split(MARK).filter((p) => p !== undefined && p !== '')
  // stream of word/whitespace pieces, carrying class per piece
  const stream: { text: string; classes: string[]; isSpace: boolean }[] = []
  for (const part of parts) {
    const { text, classes } = classifySegment(part)
    // inline ellipsis -> three separate dots so each animates on its own
    for (const piece of text.replace(/…/g, '...').split(/(\s+)/)) {
      if (piece === '') continue
      stream.push({ text: piece, classes, isSpace: /^\s+$/.test(piece) })
    }
  }
  const words: Word[] = []
  for (let i = 0; i < stream.length; i++) {
    const s = stream[i]
    if (s.isSpace) continue
    const space = i + 1 < stream.length && stream[i + 1].isSpace
    words.push({ text: s.text, classes: s.classes, space })
  }
  return words
}

export function parseStory(raw: string): Scene[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const scenes: Scene[] = []
  let beatId = 0
  let sceneId = 0

  let fence: { kind: SceneKind; beats: Beat[] } | null = null
  let buffer: string[] = []

  const makeBeat = (line: string): Beat => {
    let text = line.trim()
    let placement: Placement = 'center'
    const pm = text.match(placementRe)
    if (pm) {
      placement = pm[1] as Placement
      text = text.slice(pm[0].length).trim()
    }
    if (isEllipsis(text)) return { id: beatId++, type: 'ellipsis', placement, words: [] }
    if (isDivider(text)) return { id: beatId++, type: 'divider', placement, words: [] }
    let type: BeatType = 'text'
    if (text.startsWith('# ')) {
      type = 'title'
      text = text.slice(2).trim()
    }
    return { id: beatId++, type, placement, words: tokenize(text) }
  }

  const flush = () => {
    if (fence) {
      for (const l of buffer) if (l.trim() !== '') fence.beats.push(makeBeat(l))
      buffer = []
      return
    }
    const block = buffer.join('\n')
    buffer = []
    const trimmed = block.trim()
    if (trimmed === '') return

    // A lone ellipsis attaches to the previous scene (appears below, accumulates).
    if (isEllipsis(trimmed)) {
      const ell = makeBeat('…')
      const prev = scenes[scenes.length - 1]
      if (prev) prev.beats.push(ell)
      else scenes.push({ id: sceneId++, kind: 'stack', beats: [ell] })
      return
    }

    const joined = block.split('\n').map((s) => s.trim()).filter(Boolean).join(' ')
    scenes.push({ id: sceneId++, kind: 'stack', beats: [makeBeat(joined)] })
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!fence && trimmed.startsWith(':::') && trimmed.length > 3) {
      flush()
      fence = { kind: /grid/.test(trimmed) ? 'grid' : 'stack', beats: [] }
      continue
    }
    if (fence && trimmed === ':::') {
      flush()
      scenes.push({ id: sceneId++, kind: fence.kind, beats: fence.beats })
      fence = null
      continue
    }
    if (trimmed === '') {
      if (!fence) flush()
      continue
    }
    buffer.push(line)
  }

  flush()
  if (fence) scenes.push({ id: sceneId++, kind: fence.kind, beats: fence.beats })

  return scenes
}

export function totalBeats(scenes: Scene[]): number {
  return scenes.reduce((n, s) => n + s.beats.length, 0)
}
