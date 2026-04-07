import { describe, it, expect, vi, afterEach } from 'vitest'
import { createAutocompleteFixture, cleanupFixtures } from '../helpers/dom'

// Mock accessible-autocomplete to test suggestion template directly
vi.mock('accessible-autocomplete', () => ({
  default: {
    enhanceSelectElement: vi.fn()
  }
}))

import { setupAccessibleAutoComplete } from '../../src/dfe-autocomplete'
import accessibleAutocomplete from 'accessible-autocomplete'

/**
 * These tests document the current XSS vulnerability in the suggestion template.
 * The `suggestion` function in dfe-autocomplete.js interpolates values directly
 * into HTML without escaping:
 *
 *   const html = option.append ? `<span>${value}</span> ${option.append}` : `<span>${value}</span>`
 *   return option.hint ? `${html}<br>${option.hint}` : html
 *
 * Attack vectors: value (from option text), option.append (data-append), option.hint (data-hint)
 *
 * These tests currently assert that dangerous HTML IS passed through (documenting the vulnerability).
 * When escaping is added in Phase 2, these tests should be updated to assert that HTML IS escaped.
 */

function getSuggestionTemplate(container) {
  setupAccessibleAutoComplete(container)
  return accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0].templates.suggestion
}

describe('XSS Prevention - suggestion template', () => {
  afterEach(() => {
    cleanupFixtures()
    vi.clearAllMocks()
  })

  describe('data-append attribute', () => {
    it('VULNERABLE: renders script tags in append', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', append: '<script>alert("xss")</script>' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      // CURRENT BEHAVIOR: script tag is rendered unescaped
      expect(html).toContain('<script>alert("xss")</script>')
      // DESIRED BEHAVIOR (after fix): should be escaped
      // expect(html).not.toContain('<script>')
      // expect(html).toContain('&lt;script&gt;')
    })

    it('VULNERABLE: renders img onerror in append', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', append: '<img src=x onerror="alert(document.cookie)">' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).toContain('onerror=')
    })

    it('VULNERABLE: renders event handlers in append', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', append: '" onmouseover="alert(1)"' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).toContain('onmouseover=')
    })
  })

  describe('data-hint attribute', () => {
    it('VULNERABLE: renders script tags in hint', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', hint: '<script>alert("xss")</script>' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).toContain('<script>alert("xss")</script>')
    })

    it('VULNERABLE: renders img onerror in hint', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', hint: '<img src=x onerror="alert(1)">' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).toContain('onerror=')
    })
  })

  describe('option value (name)', () => {
    it('VULNERABLE: renders HTML in option value', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: '<img src=x onerror="alert(1)">', text: '<img src=x onerror="alert(1)">' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('<img src=x onerror="alert(1)">')

      // The value is placed inside <span> tags without escaping
      expect(html).toContain('onerror=')
    })
  })

  describe('javascript: protocol', () => {
    it('VULNERABLE: renders javascript: protocol in append', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', append: '<a href="javascript:alert(1)">click</a>' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).toContain('javascript:')
    })
  })

  describe('data: protocol', () => {
    it('VULNERABLE: renders data: protocol in append', () => {
      const container = createAutocompleteFixture({
        options: [
          { value: '1', label: 'Test', text: 'Test', append: '<a href="data:text/html,<script>alert(1)</script>">click</a>' }
        ]
      })
      const suggestion = getSuggestionTemplate(container)
      const html = suggestion('Test')

      expect(html).toContain('data:text/html')
    })
  })
})
