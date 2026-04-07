import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanupFixtures } from '../helpers/dom'

// Mock accessible-autocomplete
vi.mock('accessible-autocomplete', () => ({
  default: {
    enhanceSelectElement: vi.fn()
  }
}))

import { setupAccessibleAutoComplete } from '../../src/dfe-autocomplete'
import dfeAutocomplete from '../../src/wrapper'
import accessibleAutocomplete from 'accessible-autocomplete'

describe('Error handling', () => {
  afterEach(() => {
    cleanupFixtures()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('missing select element', () => {
    it('returns null when no select is found', () => {
      const container = document.createElement('div')
      container.setAttribute('data-module', 'app-dfe-autocomplete')
      document.body.appendChild(container)

      const result = setupAccessibleAutoComplete(container)

      expect(result).toBeNull()
    })

    it('warns to console when no select is found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const container = document.createElement('div')
      container.setAttribute('data-module', 'app-dfe-autocomplete')
      document.body.appendChild(container)

      setupAccessibleAutoComplete(container)

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[dfe-autocomplete]')
      )
    })

    it('does not call enhanceSelectElement', () => {
      const container = document.createElement('div')
      container.setAttribute('data-module', 'app-dfe-autocomplete')
      document.body.appendChild(container)

      setupAccessibleAutoComplete(container)

      expect(accessibleAutocomplete.enhanceSelectElement).not.toHaveBeenCalled()
    })
  })

  describe('missing form group', () => {
    it('does not throw when govuk-form-group div is missing', () => {
      const container = document.createElement('div')
      container.setAttribute('data-module', 'app-dfe-autocomplete')
      const select = document.createElement('select')
      select.name = 'test'
      const option = document.createElement('option')
      option.value = '1'
      option.textContent = 'Test'
      option.label = 'Test'
      select.appendChild(option)
      container.appendChild(select)
      document.body.appendChild(container)

      expect(() => setupAccessibleAutoComplete(container)).not.toThrow()
      expect(accessibleAutocomplete.enhanceSelectElement).toHaveBeenCalled()
    })

    it('treats missing form group as not in error state', () => {
      const container = document.createElement('div')
      container.setAttribute('data-module', 'app-dfe-autocomplete')
      container.setAttribute('data-default-value', 'Test')
      const select = document.createElement('select')
      select.name = 'test'
      const option = document.createElement('option')
      option.value = '1'
      option.textContent = 'Test'
      option.label = 'Test'
      select.appendChild(option)
      container.appendChild(select)
      document.body.appendChild(container)

      setupAccessibleAutoComplete(container)

      const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      expect(options.defaultValue).toBe('Test')
    })
  })

  describe('wrapper error isolation', () => {
    it('continues initializing other elements when one fails', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Create a broken element (throws during init)
      const broken = document.createElement('div')
      broken.setAttribute('data-module', 'app-dfe-autocomplete')
      const brokenSelect = document.createElement('select')
      brokenSelect.name = 'broken'
      broken.appendChild(brokenSelect)
      document.body.appendChild(broken)

      // Make enhanceSelectElement throw on first call, succeed on second
      let callCount = 0
      accessibleAutocomplete.enhanceSelectElement.mockImplementation(() => {
        callCount++
        if (callCount === 1) throw new Error('Simulated failure')
      })

      // Create a working element
      const working = document.createElement('div')
      working.setAttribute('data-module', 'app-dfe-autocomplete')
      const formGroup = document.createElement('div')
      formGroup.className = 'govuk-form-group'
      const workingSelect = document.createElement('select')
      workingSelect.name = 'working'
      const opt = document.createElement('option')
      opt.value = '1'
      opt.textContent = 'Option'
      opt.label = 'Option'
      workingSelect.appendChild(opt)
      formGroup.appendChild(workingSelect)
      working.appendChild(formGroup)
      document.body.appendChild(working)

      // Should not throw
      expect(() => dfeAutocomplete()).not.toThrow()

      // Second element should still be initialized
      expect(accessibleAutocomplete.enhanceSelectElement).toHaveBeenCalledTimes(2)

      // Error should be logged
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[dfe-autocomplete]'),
        expect.any(Error)
      )
    })
  })
})
