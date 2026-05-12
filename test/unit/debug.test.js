import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanupFixtures } from 'test-helpers/dom'

vi.mock('accessible-autocomplete', () => ({
  default: {
    enhanceSelectElement: vi.fn()
  }
}))

import { setupAccessibleAutoComplete } from '@/dfe-autocomplete'
import accessibleAutocomplete from 'accessible-autocomplete'

function createDebugFixture (debug = false) {
  const container = document.createElement('div')
  container.setAttribute('data-module', 'app-dfe-autocomplete')
  if (debug) container.setAttribute('data-debug', 'true')

  const formGroup = document.createElement('div')
  formGroup.className = 'govuk-form-group'

  const select = document.createElement('select')
  select.name = 'subject'
  const option = document.createElement('option')
  option.value = '1'
  option.textContent = 'Mathematics'
  option.label = 'Mathematics'
  select.appendChild(option)

  formGroup.appendChild(select)
  container.appendChild(formGroup)
  document.body.appendChild(container)
  return container
}

describe('debug mode', () => {
  afterEach(() => {
    cleanupFixtures()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('logs initialization when data-debug="true"', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const container = createDebugFixture(true)

    setupAccessibleAutoComplete(container)

    expect(spy).toHaveBeenCalledWith(
      '[dfe-autocomplete]',
      'Initialized on',
      'subject',
      'with',
      1,
      'options'
    )
  })

  it('logs search when data-debug="true"', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const container = createDebugFixture(true)

    setupAccessibleAutoComplete(container)

    const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    const populateResults = vi.fn()
    options.source('math', populateResults)

    expect(spy).toHaveBeenCalledWith(
      '[dfe-autocomplete]',
      'Search:',
      'math',
      '\u2192',
      expect.any(Number),
      'results'
    )
  })

  it('logs selection when data-debug="true"', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const container = createDebugFixture(true)

    setupAccessibleAutoComplete(container)

    const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    options.onConfirm('Mathematics')

    expect(spy).toHaveBeenCalledWith(
      '[dfe-autocomplete]',
      'Selected:',
      'Mathematics'
    )
  })

  it('does not log when data-debug is not set', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const container = createDebugFixture(false)

    setupAccessibleAutoComplete(container)

    const options = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    const populateResults = vi.fn()
    options.source('math', populateResults)
    options.onConfirm('Mathematics')

    expect(spy).not.toHaveBeenCalled()
  })
})
