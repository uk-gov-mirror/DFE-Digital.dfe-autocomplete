import { describe, it, expect, vi, afterEach } from 'vitest'
import { SearchIndex, createIndexedSort } from '../../src/sort/search-index'
import { createAutocompleteFixture, cleanupFixtures } from '../helpers/dom'

vi.mock('accessible-autocomplete', () => ({
  default: { enhanceSelectElement: vi.fn() }
}))

import { setupAccessibleAutoComplete } from '../../src/dfe-autocomplete'
import accessibleAutocomplete from 'accessible-autocomplete'

describe('SearchIndex', () => {
  const options = [
    { name: 'London', synonyms: ['Big Smoke'], boost: 1 },
    { name: 'Manchester', synonyms: ['Manc'], boost: 1 },
    { name: 'Birmingham', synonyms: [], boost: 1 },
    { name: 'University of London', synonyms: ['UCL'], boost: 1 },
  ]

  it('finds options by single word prefix', () => {
    const index = new SearchIndex(options)
    const results = index.search('lon')

    const names = results.map(r => r.name)
    expect(names).toContain('London')
    expect(names).toContain('University of London')
  })

  it('finds options by full word', () => {
    const index = new SearchIndex(options)
    const results = index.search('manchester')

    expect(results.map(r => r.name)).toContain('Manchester')
  })

  it('finds options by synonym', () => {
    const index = new SearchIndex(options)
    const results = index.search('big')

    expect(results.map(r => r.name)).toContain('London')
  })

  it('returns empty for no match', () => {
    const index = new SearchIndex(options)
    expect(index.search('xyz')).toEqual([])
  })

  it('handles multi-word queries (AND logic)', () => {
    const index = new SearchIndex(options)
    const results = index.search('uni lon')

    const names = results.map(r => r.name)
    expect(names).toContain('University of London')
    expect(names).not.toContain('London') // "London" doesn't have "uni"
  })

  it('handles empty query', () => {
    const index = new SearchIndex(options)
    expect(index.search('')).toEqual([])
  })

  it('pre-computes clean data on options', () => {
    const index = new SearchIndex(options)
    expect(options[0].clean).toBeDefined()
    expect(options[0].clean.name).toBe('london')
  })
})

describe('createIndexedSort', () => {
  const options = [
    { name: 'London', synonyms: ['Big Smoke'], boost: 1 },
    { name: 'Manchester', synonyms: ['Manc'], boost: 1 },
    { name: 'Birmingham', synonyms: [], boost: 1 },
  ]

  it('returns sorted names by relevance', () => {
    const sortFn = createIndexedSort(options)
    const results = sortFn('london')

    expect(results[0]).toBe('London')
  })

  it('filters out non-matching options', () => {
    const sortFn = createIndexedSort(options)
    const results = sortFn('xyz')

    expect(results).toEqual([])
  })

  it('matches via synonyms', () => {
    const sortFn = createIndexedSort(options)
    const results = sortFn('big smoke')

    expect(results).toContain('London')
  })
})

describe('useSearchIndex option', () => {
  afterEach(() => {
    cleanupFixtures()
    vi.clearAllMocks()
  })

  it('uses indexed sort when useSearchIndex is true', () => {
    const container = createAutocompleteFixture()

    setupAccessibleAutoComplete(container, { useSearchIndex: true })

    const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    const populateResults = vi.fn()
    opts.source('math', populateResults)

    expect(populateResults).toHaveBeenCalled()
    expect(populateResults.mock.calls[0][0]).toContain('Mathematics')
  })

  it('produces same results as default sort for basic queries', () => {
    // Test default sort
    const container1 = createAutocompleteFixture()
    setupAccessibleAutoComplete(container1, {})
    const opts1 = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    const pop1 = vi.fn()
    opts1.source('physics', pop1)
    const defaultResults = pop1.mock.calls[0][0]
    cleanupFixtures()
    vi.clearAllMocks()

    // Test indexed sort
    const container2 = createAutocompleteFixture()
    setupAccessibleAutoComplete(container2, { useSearchIndex: true })
    const opts2 = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    const pop2 = vi.fn()
    opts2.source('physics', pop2)
    const indexedResults = pop2.mock.calls[0][0]

    expect(defaultResults).toEqual(indexedResults)
  })
})
