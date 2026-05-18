import { describe, it, expect, vi, afterEach } from 'vitest'
import { createAutocompleteFixture, cleanupFixtures } from 'test-helpers/dom'

vi.mock('accessible-autocomplete', () => ({
  default: {
    enhanceSelectElement: vi.fn()
  }
}))

import { setupAccessibleAutoComplete } from '@/dfe-autocomplete'
import accessibleAutocomplete from 'accessible-autocomplete'

describe('Behaviour options', () => {
  afterEach(() => {
    cleanupFixtures()
    vi.clearAllMocks()
  })

  describe('maxResults', () => {
    it('limits the number of results returned', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Alpha One', text: 'Alpha One' },
          { value: '2', label: 'Alpha Two', text: 'Alpha Two' },
          { value: '3', label: 'Alpha Three', text: 'Alpha Three' },
          { value: '4', label: 'Alpha Four', text: 'Alpha Four' },
        ]
      })
      setupAccessibleAutoComplete(container, { maxResults: 2 })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('alpha', populateResults)

      expect(populateResults.mock.calls[0][0].length).toBe(2)
    })

    it('returns all results when maxResults is not set', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Alpha One', text: 'Alpha One' },
          { value: '2', label: 'Alpha Two', text: 'Alpha Two' },
          { value: '3', label: 'Alpha Three', text: 'Alpha Three' },
        ]
      })
      setupAccessibleAutoComplete(container)

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('alpha', populateResults)

      expect(populateResults.mock.calls[0][0].length).toBe(3)
    })
  })

  describe('showAllOnFocus', () => {
    it('passes showAllValues to accessible-autocomplete when true', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container, { showAllOnFocus: true })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(opts.showAllValues).toBe(true)
    })

    it('defaults showAllValues to false', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(opts.showAllValues).toBe(false)
    })
  })

  describe('highlightMatches', () => {
    it('bolds matching text in suggestions when enabled', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Mathematics', text: 'Mathematics' }
        ]
      })
      setupAccessibleAutoComplete(container, { highlightMatches: true })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]

      // Trigger a search to set currentQuery
      const populateResults = vi.fn()
      opts.source('math', populateResults)

      // Now render suggestion — should highlight the matched text
      const html = opts.templates.suggestion('Mathematics')
      expect(html).toContain('<strong>Math</strong>')
      expect(html).toContain('ematics')
    })

    it('does not highlight when disabled (default)', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Mathematics', text: 'Mathematics' }
        ]
      })
      setupAccessibleAutoComplete(container)

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]

      const populateResults = vi.fn()
      opts.source('math', populateResults)

      const html = opts.templates.suggestion('Mathematics')
      expect(html).not.toContain('<strong>')
      expect(html).toContain('<span>Mathematics</span>')
    })

    it('escapes HTML in highlighted text', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: '<b>Test</b>', text: '<b>Test</b>' }
        ]
      })
      setupAccessibleAutoComplete(container, { highlightMatches: true })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('<b>', populateResults)

      const html = opts.templates.suggestion('<b>Test</b>')
      // Should be escaped, not rendered as actual bold HTML
      expect(html).not.toContain('<b>Test</b>')
      expect(html).toContain('&lt;b&gt;')
    })

    it('is case insensitive', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Mathematics', text: 'Mathematics' }
        ]
      })
      setupAccessibleAutoComplete(container, { highlightMatches: true })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('MATH', populateResults)

      const html = opts.templates.suggestion('Mathematics')
      expect(html).toContain('<strong>Math</strong>')
    })
  })
})
