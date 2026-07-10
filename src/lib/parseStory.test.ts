import { describe, it, expect } from 'vitest'
import { parseStory, totalBeats } from './parseStory'

describe('parseStory', () => {
  it('splits blank-line blocks into separate stack scenes', () => {
    const scenes = parseStory('One line.\n\nTwo line.')
    expect(scenes).toHaveLength(2)
    expect(totalBeats(scenes)).toBe(2)
  })

  it('tokenizes words with emphasis classes', () => {
    const [scene] = parseStory('a **big** and *warm* word')
    const words = scene.beats[0].words
    expect(words.find((w) => w.text === 'big')?.classes).toContain('impact')
    expect(words.find((w) => w.text === 'warm')?.classes).toContain('gradient')
  })

  it('auto-italicizes quoted text', () => {
    const [scene] = parseStory('She said “no” today')
    const quoted = scene.beats[0].words.filter((w) => w.classes.includes('quote'))
    expect(quoted.map((w) => w.text).join(' ')).toContain('no')
  })

  it('attaches a lone ellipsis to the previous scene', () => {
    const scenes = parseStory('Just notice.\n\n…\n\nNext thought.')
    expect(scenes).toHaveLength(2)
    expect(scenes[0].beats).toHaveLength(2)
    expect(scenes[0].beats[1].type).toBe('ellipsis')
  })

  it('builds a grid scene with left/right placement pairs', () => {
    const src = '::: grid\nRules like…\n{left} A\n{right} B\n{left} C\n{right} D\n:::'
    const [scene] = parseStory(src)
    expect(scene.kind).toBe('grid')
    expect(scene.beats).toHaveLength(5)
    expect(scene.beats[1].placement).toBe('left')
    expect(scene.beats[2].placement).toBe('right')
  })

  it('detects title and divider beats', () => {
    const scenes = parseStory('# The Title\n\n—')
    expect(scenes[0].beats[0].type).toBe('title')
    expect(scenes[1].beats[0].type).toBe('divider')
  })
})
