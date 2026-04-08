import { describe, it, expect, vi, afterEach } from 'vitest'
import { createAutocompleteFixture, cleanupFixtures } from '../helpers/dom'

// Mock accessible-autocomplete to avoid Preact rendering
vi.mock('accessible-autocomplete', () => ({
  default: {
    enhanceSelectElement: vi.fn()
  }
}))

import dfeAutocomplete, { dfeAutocompleteField } from '../../src/wrapper'
import accessibleAutocomplete from 'accessible-autocomplete'

describe('Public API Contract', () => {
  afterEach(() => {
    cleanupFixtures()
    vi.clearAllMocks()
  })

  describe('dfeAutocomplete (default export)', () => {
    it('is a function', () => {
      expect(typeof dfeAutocomplete).toBe('function')
    })

    it('accepts an empty options object', () => {
      expect(() => dfeAutocomplete({})).not.toThrow()
    })

    it('accepts no arguments', () => {
      expect(() => dfeAutocomplete()).not.toThrow()
    })

    it('finds elements with data-module="app-dfe-autocomplete"', () => {
      createAutocompleteFixture()
      createAutocompleteFixture()

      dfeAutocomplete()

      expect(accessibleAutocomplete.enhanceSelectElement).toHaveBeenCalledTimes(2)
    })

    it('passes library options to each instance', () => {
      createAutocompleteFixture()

      dfeAutocomplete({ minLength: 3 })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.minLength).toBe(3)
    })
  })

  describe('dfeAutocompleteField (named export)', () => {
    it('is a function', () => {
      expect(typeof dfeAutocompleteField).toBe('function')
    })

    it('accepts element and options', () => {
      const container = createAutocompleteFixture()
      expect(() => dfeAutocompleteField(container, {})).not.toThrow()
    })

    it('supports minLength option', () => {
      const container = createAutocompleteFixture()
      dfeAutocompleteField(container, { minLength: 2 })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.minLength).toBe(2)
    })

    it('supports autoselect option', () => {
      const container = createAutocompleteFixture()
      dfeAutocompleteField(container, { autoselect: false })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.autoselect).toBe(false)
    })

    it('supports rawAttribute option', () => {
      const container = createAutocompleteFixture({ selectName: 'course[subject]' })
      dfeAutocompleteField(container, { rawAttribute: true })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.name).toBe('course[subject_raw]')
    })

    it('supports trackerObject option', () => {
      const tracker = {
        sendTrackingEvent: vi.fn(),
        trackSearch: vi.fn()
      }
      const container = createAutocompleteFixture()
      dfeAutocompleteField(container, { tracker })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      options.source('test', populateResults)
      expect(tracker.trackSearch).toHaveBeenCalledWith('test')
    })

    it('supports name option', () => {
      const container = createAutocompleteFixture()
      dfeAutocompleteField(container, { name: 'custom_field' })

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.name).toBe('custom_field')
    })
  })

  describe('Data Attributes', () => {
    it('reads data-default-value', () => {
      const container = createAutocompleteFixture({ defaultValue: 'Physics' })
      dfeAutocompleteField(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.defaultValue).toBe('Physics')
    })

    it('reads data-synonyms with pipe separator', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', synonyms: 'alias1|alias2|alias3' }
        ]
      })
      dfeAutocompleteField(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      options.source('alias2', populateResults)
      expect(populateResults).toHaveBeenCalled()
      expect(populateResults.mock.calls[0][0].map(r => r.name)).toContain('Test')
    })

    it('reads data-append', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', append: '(CODE)' }
        ]
      })
      dfeAutocompleteField(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const html = options.templates.suggestion('Test')
      expect(html).toContain('(CODE)')
    })

    it('reads data-hint', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', hint: 'A helpful hint' }
        ]
      })
      dfeAutocompleteField(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const html = options.templates.suggestion('Test')
      expect(html).toContain('A helpful hint')
    })

    it('reads data-boost as number', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Alpha', text: 'Alpha', boost: '2.0' },
          { value: '2', label: 'Alpha Beta', text: 'Alpha Beta' }
        ]
      })
      dfeAutocompleteField(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      options.source('alpha', populateResults)
      const results = populateResults.mock.calls[0][0]
      // Boosted option should come first
      expect(results[0].name).toBe('Alpha')
    })
  })
})
