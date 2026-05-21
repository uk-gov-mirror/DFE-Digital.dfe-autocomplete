import { describe, it, expect, vi, afterEach } from 'vitest'
import { createAutocompleteFixture, cleanupFixtures } from 'test-helpers/dom'

import { setupAccessibleAutoComplete } from '@/dfe-autocomplete'
import accessibleAutocomplete from 'accessible-autocomplete'

// Mock accessible-autocomplete to test suggestion template directly
vi.mock('accessible-autocomplete', () => ({
  default: {
    enhanceSelectElement: vi.fn()
  }
}))

function getSuggestionTemplate (container) {
  setupAccessibleAutoComplete(container)
  return accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0].templates.suggestion
}

describe('XSS Prevention - suggestion template', () => {
  afterEach(() => {
    cleanupFixtures()
    vi.clearAllMocks()
  })

  describe('data-append attribute', () => {
    it('escapes script tags in append', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', append: '<script>alert("xss")</script>' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('escapes img onerror in append', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', append: '<img src=x onerror="alert(document.cookie)">' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).not.toContain('<img')
      expect(html).toContain('&lt;img')
    })

    it('escapes event handlers in append', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', append: '" onmouseover="alert(1)"' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).not.toContain('onmouseover="alert(1)"')
      expect(html).toContain('&quot;')
    })
  })

  describe('data-hint attribute', () => {
    it('escapes script tags in hint', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', hint: '<script>alert("xss")</script>' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('escapes img onerror in hint', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', hint: '<img src=x onerror="alert(1)">' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).not.toContain('<img')
      expect(html).toContain('&lt;img')
    })
  })

  describe('option value (name)', () => {
    it('escapes HTML in option value', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: '<img src=x onerror="alert(1)">', text: '<img src=x onerror="alert(1)">' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('<img src=x onerror="alert(1)">')

      // The < and > are escaped, so the browser will not parse this as an HTML tag
      expect(html).not.toContain('<img')
      expect(html).toContain('&lt;img')
      expect(html).toContain('&quot;alert(1)&quot;')
    })
  })

  describe('javascript: protocol', () => {
    it('escapes javascript: protocol link in append', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', append: '<a href="javascript:alert(1)">click</a>' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).not.toContain('<a href=')
      expect(html).toContain('&lt;a')
    })
  })

  describe('data: protocol', () => {
    it('escapes data: protocol link in append', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', append: '<a href="data:text/html,<script>alert(1)</script>">click</a>' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).not.toContain('<a href=')
      expect(html).toContain('&lt;a')
    })
  })

  describe('safe content', () => {
    it('renders normal text correctly', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Mathematics', text: 'Mathematics', append: '(MATH)', hint: 'A core subject' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Mathematics')

      expect(html).toContain('<span>Mathematics</span>')
      expect(html).toContain('(MATH)')
      expect(html).toContain('A core subject')
    })
  })
})
