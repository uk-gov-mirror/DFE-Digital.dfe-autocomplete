import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAutocompleteFixture, cleanupFixtures } from 'test-helpers/dom'

// Mock accessible-autocomplete to avoid Preact rendering in unit tests
vi.mock('accessible-autocomplete', () => ({
  default: {
    enhanceSelectElement: vi.fn()
  }
}))

import { setupAccessibleAutoComplete } from '@/dfe-autocomplete'
import accessibleAutocomplete from 'accessible-autocomplete'

describe('setupAccessibleAutoComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanupFixtures()
  })

  describe('default options', () => {
    it('calls enhanceSelectElement', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      expect(accessibleAutocomplete.enhanceSelectElement).toHaveBeenCalledTimes(1)
    })

    it('sets autoselect to true by default', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.autoselect).toBe(true)
    })

    it('sets minLength to 1 by default', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.minLength).toBe(1)
    })

    it('passes the select element', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.selectElement.tagName).toBe('SELECT')
    })
  })

  describe('option enhancement (enhanceOption)', () => {
    it('reads data-synonyms and splits by pipe', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      // Call source to get the enhanced options used internally
      const populateResults = vi.fn()
      options.source('math', populateResults)

      // populateResults should be called with sorted results
      expect(populateResults).toHaveBeenCalled()
      const results = populateResults.mock.calls[0][0]
      // "math" is a synonym of Mathematics, so it should appear
      expect(results.map(r => r.name)).toContain('Mathematics')
    })

    it('reads data-append', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      // The suggestion template should include append text
      const html = options.templates.suggestion('Physics')
      expect(html).toContain('(PHY)')
    })

    it('reads data-hint', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const html = options.templates.suggestion('Physics')
      expect(html).toContain('Science subject')
    })

    it('reads data-boost as a number', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      // Search for a prefix that matches both Mathematics (boosted) and another option
      const populateResults = vi.fn()
      options.source('mat', populateResults)
      const results = populateResults.mock.calls[0][0]
      expect(results.map(r => r.name)).toContain('Mathematics')
    })

    it('defaults boost to 1 when not specified', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Alpha', text: 'Alpha' },
          { value: '2', label: 'Beta', text: 'Beta' },
        ]
      })
      setupAccessibleAutoComplete(container)

      // Should not throw - boost defaults to 1
      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      options.source('alpha', populateResults)
      expect(populateResults).toHaveBeenCalled()
    })
  })

  describe('suggestion template', () => {
    it('wraps value in span for basic option', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const html = options.templates.suggestion('English Literature')
      expect(html).toBe('<span>English Literature</span>')
    })

    it('includes append text when present', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const html = options.templates.suggestion('Physics')
      expect(html).toContain('<span>Physics</span>')
      expect(html).toContain('(PHY)')
    })

    it('includes hint with line break when present', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const html = options.templates.suggestion('Physics')
      expect(html).toContain('<br>')
      expect(html).toContain('Science subject')
    })

    it('returns "No results found" for unknown value', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const html = options.templates.suggestion('Unknown Option')
      expect(html).toBe('<span>No results found</span>')
    })
  })

  describe('generateAutocompleteName', () => {
    it('uses explicit name option when provided', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container, { name: 'custom_name' })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.name).toBe('custom_name')
    })

    it('preserves original name for bracketed format', () => {
      const container = createAutocompleteFixture({ selectName: 'course[subject]' })
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.name).toBe('course[subject]')
    })

    it('appends _raw with rawAttribute option', () => {
      const container = createAutocompleteFixture({ selectName: 'course[subject]' })
      setupAccessibleAutoComplete(container, { rawAttribute: true })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.name).toBe('course[subject_raw]')
    })

    it('returns original name for non-bracketed format', () => {
      const container = createAutocompleteFixture({ selectName: 'subject' })
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.name).toBe('subject')
    })
  })

  describe('defaultValueOption', () => {
    it('reads data-default-value attribute', () => {
      const container = createAutocompleteFixture({ defaultValue: 'Mathematics' })
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.defaultValue).toBe('Mathematics')
    })

    it('defaults to empty string when attribute is missing', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.defaultValue).toBe('')
    })
  })

  describe('error state', () => {
    it('sets defaultValue to empty string when in error state', () => {
      const container = createAutocompleteFixture({
        defaultValue: 'Mathematics',
        hasError: true
      })

      // The real accessible-autocomplete creates an input element.
      // Since we mock it, we need to simulate that.
      accessibleAutocomplete.enhanceSelectElement.mockImplementation(() => {
        const input = document.createElement('input')
        container.appendChild(input)
      })

      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.defaultValue).toBe('')
    })

    it('restores input value after init when in error state', () => {
      const container = createAutocompleteFixture({
        defaultValue: 'Mathematics',
        hasError: true
      })

      accessibleAutocomplete.enhanceSelectElement.mockImplementation(() => {
        const input = document.createElement('input')
        container.appendChild(input)
      })

      setupAccessibleAutoComplete(container)

      const input = container.querySelector('input')
      expect(input.value).toBe('Mathematics')
    })
  })

  describe('source callback', () => {
    it('filters whitespace-only queries', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      options.source('   ', populateResults)
      expect(populateResults).not.toHaveBeenCalled()
    })

    it('calls populateResults for valid queries', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      options.source('math', populateResults)
      expect(populateResults).toHaveBeenCalledTimes(1)
    })
  })

  describe('tracker integration', () => {
    it('uses nullTracker when no tracker provided', () => {
      const container = createAutocompleteFixture()
      // Should not throw
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      // This calls tracker.trackSearch internally — should not throw
      options.source('test', populateResults)
    })

    it('calls tracker.trackSearch on search', () => {
      const tracker = {
        sendTrackingEvent: vi.fn(),
        trackSearch: vi.fn()
      }
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container, { tracker })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      options.source('math', populateResults)
      expect(tracker.trackSearch).toHaveBeenCalledWith('math')
    })

    it('calls tracker.sendTrackingEvent on confirm', () => {
      const tracker = {
        sendTrackingEvent: vi.fn(),
        trackSearch: vi.fn()
      }
      const container = createAutocompleteFixture({ selectName: 'course[subject]' })
      setupAccessibleAutoComplete(container, { tracker })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      options.onConfirm('Mathematics')
      expect(tracker.sendTrackingEvent).toHaveBeenCalledWith('Mathematics', 'course[subject]')
    })
  })

  describe('onConfirm', () => {
    it('selects the matching option in the original select', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      options.onConfirm('Mathematics')

      const select = container.querySelector('select')
      const selectedOption = select.querySelector('option[value="1"]')
      expect(selectedOption.selected).toBe(true)
    })

    it('does not throw for unknown value', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      // Should not throw
      options.onConfirm('Unknown Value')
    })
  })

  describe('library options override', () => {
    it('allows overriding autoselect', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container, { autoselect: false })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.autoselect).toBe(false)
    })

    it('allows overriding minLength', () => {
      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container, { minLength: 3 })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.minLength).toBe(3)
    })
  })
})
