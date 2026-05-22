import { describe, it, expect } from 'vitest'
import sort, {
  normalise,
  hasWeight,
  byWeightThenAlphabetically,
  optionName
} from '@/sort/index'

describe('normalise', () => {
  it('creates clean object with processed name', () => {
    const option = { name: 'London', synonyms: [], boost: 1 }
    const result = normalise(option)

    expect(result.clean.name).toBe('london')
    expect(result.clean.boost).toBe(1)
  })

  it('cleans synonyms', () => {
    const option = { name: 'London', synonyms: ['Big Smoke', 'The Capital'], boost: 1 }
    const result = normalise(option)

    expect(result.clean.synonyms).toEqual(['big smoke', 'the capital'])
  })

  it('removes stop words from name', () => {
    const option = { name: 'The University of London', synonyms: [], boost: 1 }
    const result = normalise(option)

    expect(result.clean.nameWithoutStopWords).not.toContain('The')
    expect(result.clean.nameWithoutStopWords).toContain('University')
    expect(result.clean.nameWithoutStopWords).toContain('London')
  })

  it('removes stop words from synonyms', () => {
    const option = { name: 'Test', synonyms: ['The College of Art'], boost: 1 }
    const result = normalise(option)

    expect(result.clean.synonymsWithoutStopWords.length).toBe(1)
    expect(result.clean.synonymsWithoutStopWords[0]).not.toContain('The')
  })

  it('preserves boost value', () => {
    const option = { name: 'Test', synonyms: [], boost: 1.5 }
    const result = normalise(option)

    expect(result.clean.boost).toBe(1.5)
  })

  it('defaults boost to 1 when missing', () => {
    const option = { name: 'Test', synonyms: [] }
    const result = normalise(option)

    expect(result.clean.boost).toBe(1)
  })

  it('handles empty synonyms array', () => {
    const option = { name: 'Test', synonyms: [], boost: 1 }
    const result = normalise(option)

    expect(result.clean.synonyms).toEqual([])
    expect(result.clean.synonymsWithoutStopWords).toEqual([])
  })
})

describe('weight calculation through pipeline', () => {
  it('exact match gets weight 100', () => {
    const results = sort('london', [
      { name: 'London', synonyms: [], boost: 1 }
    ])
    expect(results[0].name).toBe('London')
    expect(results[0].weight).toBe(100)
  })

  it('boost multiplier affects ordering', () => {
    const results = sort('alpha', [
      { name: 'Alpha A', synonyms: [], boost: 1 },
      { name: 'Alpha B', synonyms: [], boost: 2 }
    ])
    expect(results[0].name).toBe('Alpha B')
    expect(results[1].name).toBe('Alpha A')
  })
})

describe('hasWeight', () => {
  it('returns true for positive weight', () => {
    expect(hasWeight({ weight: 1 })).toBe(true)
  })

  it('returns false for zero weight', () => {
    expect(hasWeight({ weight: 0 })).toBe(false)
  })

  it('returns false for negative weight', () => {
    expect(hasWeight({ weight: -1 })).toBe(false)
  })
})

describe('byWeightThenAlphabetically', () => {
  it('sorts higher weight first', () => {
    const a = { weight: 100, name: 'B' }
    const b = { weight: 60, name: 'A' }
    expect(byWeightThenAlphabetically(a, b)).toBe(-1)
  })

  it('sorts lower weight second', () => {
    const a = { weight: 60, name: 'A' }
    const b = { weight: 100, name: 'B' }
    expect(byWeightThenAlphabetically(a, b)).toBe(1)
  })

  it('sorts alphabetically when weights are equal', () => {
    const a = { weight: 100, name: 'Apple' }
    const b = { weight: 100, name: 'Banana' }
    expect(byWeightThenAlphabetically(a, b)).toBe(-1)
  })

  it('returns 0 for identical weight and name', () => {
    const a = { weight: 100, name: 'Apple' }
    const b = { weight: 100, name: 'Apple' }
    expect(byWeightThenAlphabetically(a, b)).toBe(0)
  })
})

describe('optionName', () => {
  it('extracts name from option', () => {
    expect(optionName({ name: 'London' })).toBe('London')
  })
})

describe('sort (default export)', () => {
  const options = [
    { name: 'London', synonyms: ['Big Smoke'], boost: 1 },
    { name: 'Manchester', synonyms: ['Manc'], boost: 1 },
    { name: 'Birmingham', synonyms: [], boost: 1 },
    { name: 'Bristol', synonyms: [], boost: 1 }
  ]

  it('returns matching option objects sorted by relevance', () => {
    const results = sort('london', options)
    expect(results[0].name).toBe('London')
  })

  it('filters out non-matching options', () => {
    const results = sort('xyz', options)
    expect(results).toEqual([])
  })

  it('returns option objects with name and weight', () => {
    const results = sort('lon', options)
    results.forEach(r => {
      expect(r).toHaveProperty('name')
      expect(r).toHaveProperty('weight')
    })
  })

  it('matches via synonyms', () => {
    const results = sort('big smoke', options)
    expect(results.map(r => r.name)).toContain('London')
  })

  it('applies boost multiplier to ordering', () => {
    const boostedOptions = [
      { name: 'Alpha School', synonyms: [], boost: 1 },
      { name: 'Alpha College', synonyms: [], boost: 2 }
    ]
    const results = sort('alpha', boostedOptions)
    expect(results[0].name).toBe('Alpha College')
    expect(results[1].name).toBe('Alpha School')
  })

  it('sorts alphabetically for equal weights', () => {
    const equalOptions = [
      { name: 'Zebra School', synonyms: [], boost: 1 },
      { name: 'Alpha School', synonyms: [], boost: 1 }
    ]
    const results = sort('school', equalOptions)
    expect(results[0].name).toBe('Alpha School')
    expect(results[1].name).toBe('Zebra School')
  })

  it('handles empty options list', () => {
    expect(sort('test', [])).toEqual([])
  })

  it('returns all options for empty query (exact match on empty string)', () => {
    // clean('') returns '' which matches everything via exactMatch since clean(name) for
    // empty-ish names won't match, but the cleaned query '' is compared.
    // Actually: empty query → clean('') = '' → all options get weight because
    // removeStopWords('') returns '' and exactMatch('', '') is false for non-empty names
    // but the regex \b matches. In practice all get non-zero weight.
    const results = sort('', options)
    expect(results.length).toBe(options.length)
  })
})
