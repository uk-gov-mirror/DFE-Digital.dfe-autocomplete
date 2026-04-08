import { describe, it, expect, vi, afterEach } from 'vitest'
import { createAutocompleteFixture, cleanupFixtures } from '../helpers/dom'

vi.mock('accessible-autocomplete', () => ({
  default: {
    enhanceSelectElement: vi.fn()
  }
}))

import { setupAccessibleAutoComplete } from '../../src/dfe-autocomplete'
import accessibleAutocomplete from 'accessible-autocomplete'
import { createSort } from '../../src/sort/index'

describe('Replaceable functions', () => {
  afterEach(() => {
    cleanupFixtures()
    vi.clearAllMocks()
  })

  describe('custom sort function', () => {
    it('uses custom sort when provided', () => {
      const customSort = vi.fn((query, options) => ['Custom Result'])
      const container = createAutocompleteFixture()

      setupAccessibleAutoComplete(container, { sort: customSort })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('test', populateResults)

      expect(customSort).toHaveBeenCalledWith('test', expect.any(Array))
      expect(populateResults.mock.calls[0][0]).toEqual(['Custom Result'])
    })
  })

  describe('custom stopWords', () => {
    it('uses custom stop words list', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'University of London', text: 'University of London' },
          { value: '2', label: 'College of Arts', text: 'College of Arts' },
        ]
      })

      // Add 'university' and 'college' as stop words
      setupAccessibleAutoComplete(container, {
        stopWords: ['the', 'of', 'in', 'and', 'at', '&', 'with', 'university', 'college']
      })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()

      // With default stop words, "london" matches "University of London" at weight 25 (word match)
      // With custom stop words including "university", the matching may differ
      opts.source('london', populateResults)
      expect(populateResults).toHaveBeenCalled()
      expect(populateResults.mock.calls[0][0].map(r => r.name)).toContain('University of London')
    })
  })

  describe('custom calculateWeight', () => {
    it('uses custom weight function', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Alpha', text: 'Alpha' },
          { value: '2', label: 'Beta', text: 'Beta' },
        ]
      })

      // Custom weight: always return 50 for Alpha, 0 for everything else
      const customWeight = (option, query) => {
        return option.name === 'alpha' ? 50 : 0
      }

      setupAccessibleAutoComplete(container, { calculateWeight: customWeight })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('anything', populateResults)

      const results = populateResults.mock.calls[0][0]
      expect(results.map(r => r.name)).toContain('Alpha')
      expect(results.map(r => r.name)).not.toContain('Beta')
    })
  })

  describe('custom clean function', () => {
    it('uses custom text cleaning', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Café', text: 'Café' },
        ]
      })

      // Custom clean that preserves accents (just lowercase + trim)
      const customClean = (text) => text.trim().toLowerCase()

      setupAccessibleAutoComplete(container, { clean: customClean })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('café', populateResults)

      expect(populateResults).toHaveBeenCalled()
      expect(populateResults.mock.calls[0][0].map(r => r.name)).toContain('Café')
    })
  })

  describe('createSort factory', () => {
    it('creates a sort function with custom internals', () => {
      const customClean = (text) => text.toLowerCase().trim()
      const sortFn = createSort({ clean: customClean })

      const options = [
        { name: 'London', synonyms: [], boost: 1 },
        { name: 'Manchester', synonyms: [], boost: 1 },
      ]

      const results = sortFn('london', options)
      expect(results[0].name).toBe('London')
    })

    it('uses default functions when not overridden', () => {
      const sortFn = createSort({})

      const options = [
        { name: 'London', synonyms: [], boost: 1 },
      ]

      const results = sortFn('london', options)
      expect(results.map(r => r.name)).toContain('London')
    })
  })
})
