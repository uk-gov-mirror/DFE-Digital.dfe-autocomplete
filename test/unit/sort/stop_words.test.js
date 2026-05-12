import { describe, it, expect } from 'vitest'
import removeStopWords from '@/sort/stop_words'

describe('removeStopWords', () => {
  it('removes "the"', () => {
    expect(removeStopWords('the university')).toBe('university')
  })

  it('removes "of"', () => {
    expect(removeStopWords('university of london')).toBe('university london')
  })

  it('removes "in"', () => {
    expect(removeStopWords('studies in art')).toBe('studies art')
  })

  it('removes "and"', () => {
    expect(removeStopWords('art and design')).toBe('art design')
  })

  it('removes "at"', () => {
    expect(removeStopWords('study at home')).toBe('study home')
  })

  it('removes "&"', () => {
    expect(removeStopWords('art & design')).toBe('art design')
  })

  it('removes "with"', () => {
    // Note: the regex (\s+)?with(\s+)? also matches "with" inside "maths" → "ma hs"
    // This is a known limitation of the current stop words implementation
    expect(removeStopWords('science with art')).toBe('science art')
  })

  it('removes multiple stop words', () => {
    // Double space is expected: each stop word replacement leaves a single space
    expect(removeStopWords('the university of the arts')).toBe('university  arts')
  })

  it('preserves text when ALL words are stop words', () => {
    expect(removeStopWords('the and')).toBe('the and')
  })

  it('preserves single stop word', () => {
    expect(removeStopWords('the')).toBe('the')
  })

  it('NOTE: regex matches stop words inside longer words (known limitation)', () => {
    // "theatre" contains "the" and "at" — the regex does not use word boundaries
    // so it incorrectly strips these substrings. This is a known bug.
    const result = removeStopWords('theatre')
    expect(result).not.toBe('theatre') // documents the bug
  })

  it('NOTE: regex matches "at" inside "mathematics" (known limitation)', () => {
    // "mathematics" contains "at" — gets incorrectly stripped
    const result = removeStopWords('mathematics')
    expect(result).not.toBe('mathematics') // documents the bug
  })

  it('is case insensitive', () => {
    expect(removeStopWords('The University')).toBe('University')
  })
})
