import { describe, it, expect, vi, afterEach } from 'vitest'
import { createAutocompleteFixture, cleanupFixtures } from 'test-helpers/dom'

vi.mock('accessible-autocomplete', () => ({
  default: { enhanceSelectElement: vi.fn() }
}))

import { setupAccessibleAutoComplete } from '@/dfe-autocomplete'
import accessibleAutocomplete from 'accessible-autocomplete'

describe('Async source', () => {
  afterEach(() => {
    cleanupFixtures()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('function mode', () => {
    it('calls async source function with query', async () => {
      const asyncSource = vi.fn(async (query) => [
        { name: 'Result 1', text: 'Result 1' },
        { name: 'Result 2', text: 'Result 2' }
      ])

      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container, { source: asyncSource })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('test', populateResults)

      // Wait for async
      await vi.waitFor(() => {
        expect(asyncSource).toHaveBeenCalledWith('test')
      })

      await vi.waitFor(() => {
        expect(populateResults).toHaveBeenCalledWith([
          { name: 'Result 1', text: 'Result 1' },
          { name: 'Result 2', text: 'Result 2' }
        ])
      })
    })

    it('handles string array results', async () => {
      const asyncSource = vi.fn(async () => ['Alpha', 'Beta'])

      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container, { source: asyncSource })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('test', populateResults)

      await vi.waitFor(() => {
        expect(populateResults).toHaveBeenCalledWith([
          { name: 'Alpha', text: 'Alpha' },
          { name: 'Beta', text: 'Beta' }
        ])
      })
    })

    it('emits loading events', async () => {
      const asyncSource = vi.fn(async () => ['Result'])

      const container = createAutocompleteFixture()
      const instance = setupAccessibleAutoComplete(container, { source: asyncSource })

      const loadingStates = []
      instance.on('loading', ({ loading }) => loadingStates.push(loading))

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      opts.source('test', vi.fn())

      await vi.waitFor(() => {
        expect(loadingStates).toEqual([true, false])
      })
    })

    it('emits error event on failure', async () => {
      const asyncSource = vi.fn(async () => { throw new Error('Network error') })

      vi.spyOn(console, 'error').mockImplementation(() => {})

      const container = createAutocompleteFixture()
      const instance = setupAccessibleAutoComplete(container, { source: asyncSource })

      const errors = []
      instance.on('error', ({ error }) => errors.push(error))

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('test', populateResults)

      await vi.waitFor(() => {
        expect(errors.length).toBe(1)
        expect(errors[0].message).toBe('Network error')
      })

      // Should call populateResults with empty array on error
      await vi.waitFor(() => {
        expect(populateResults).toHaveBeenCalledWith([])
      })
    })

    it('respects maxResults', async () => {
      const asyncSource = vi.fn(async () => [
        { name: 'A', text: 'A' },
        { name: 'B', text: 'B' },
        { name: 'C', text: 'C' }
      ])

      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container, { source: asyncSource, maxResults: 2 })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('test', populateResults)

      await vi.waitFor(() => {
        expect(populateResults.mock.calls[0][0].length).toBe(2)
      })
    })

    it('ignores whitespace-only queries', () => {
      const asyncSource = vi.fn(async () => [])

      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container, { source: asyncSource })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      opts.source('   ', vi.fn())

      expect(asyncSource).not.toHaveBeenCalled()
    })
  })

  describe('declarative URL mode', () => {
    it('fetches from URL with query parameter', async () => {
      const mockFetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ name: 'London', text: 'London' }])
      }))
      vi.stubGlobal('fetch', mockFetch)

      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container, {
        source: { url: '/api/search', queryParam: 'q' }
      })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('london', populateResults)

      // Wait for debounce (300ms default) + async
      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/search?q=london')
      }, { timeout: 500 })

      await vi.waitFor(() => {
        expect(populateResults).toHaveBeenCalledWith([
          { name: 'London', text: 'London' }
        ])
      })
    })

    it('applies transform function to response', async () => {
      const mockFetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { results: ['Alpha', 'Beta'] } })
      }))
      vi.stubGlobal('fetch', mockFetch)

      const container = createAutocompleteFixture()
      setupAccessibleAutoComplete(container, {
        source: {
          url: '/api/search',
          transform: (data) => data.data.results
        }
      })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('test', populateResults)

      await vi.waitFor(() => {
        expect(populateResults).toHaveBeenCalledWith([
          { name: 'Alpha', text: 'Alpha' },
          { name: 'Beta', text: 'Beta' }
        ])
      }, { timeout: 500 })
    })

    it('emits error on HTTP failure', async () => {
      const mockFetch = vi.fn(() => Promise.resolve({ ok: false, status: 500 }))
      vi.stubGlobal('fetch', mockFetch)
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const container = createAutocompleteFixture()
      const instance = setupAccessibleAutoComplete(container, {
        source: { url: '/api/search' }
      })

      const errors = []
      instance.on('error', ({ error }) => errors.push(error))

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      opts.source('test', vi.fn())

      await vi.waitFor(() => {
        expect(errors.length).toBe(1)
        expect(errors[0].message).toContain('500')
      }, { timeout: 500 })
    })
  })
})
