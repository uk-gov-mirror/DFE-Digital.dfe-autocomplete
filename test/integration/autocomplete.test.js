import { describe, it, expect, afterEach } from 'vitest'
import { createAutocompleteFixture, cleanupFixtures } from 'test-helpers/dom'
import { setupAccessibleAutoComplete } from '@/dfe-autocomplete'

/**
 * Integration tests that use the real accessible-autocomplete library (no mocking).
 * These test the full initialization flow in jsdom.
 */

describe('Integration: accessible-autocomplete rendering', () => {
  afterEach(() => {
    cleanupFixtures()
  })

  it('hides the original select element', () => {
    const container = createAutocompleteFixture()
    setupAccessibleAutoComplete(container)

    const select = container.querySelector('select')
    expect(select.style.display).toBe('none')
  })

  it('creates an input element', () => {
    const container = createAutocompleteFixture()
    setupAccessibleAutoComplete(container)

    const input = container.querySelector('input')
    expect(input).not.toBeNull()
  })

  it('sets the input name from select name', () => {
    const container = createAutocompleteFixture({ selectName: 'course[subject]' })
    setupAccessibleAutoComplete(container)

    const input = container.querySelector('input')
    expect(input.name).toBe('course[subject]')
  })

  it('sets the input name with _raw when rawAttribute is true', () => {
    const container = createAutocompleteFixture({ selectName: 'course[subject]' })
    setupAccessibleAutoComplete(container, { rawAttribute: true })

    const input = container.querySelector('input')
    expect(input.name).toBe('course[subject_raw]')
  })

  it('pre-populates input with default value', () => {
    const container = createAutocompleteFixture({ defaultValue: 'Mathematics' })
    setupAccessibleAutoComplete(container)

    const input = container.querySelector('input')
    expect(input.value).toBe('Mathematics')
  })

  it('creates an autocomplete wrapper', () => {
    const container = createAutocompleteFixture()
    setupAccessibleAutoComplete(container)

    const wrapper = container.querySelector('.autocomplete__wrapper')
    expect(wrapper).not.toBeNull()
  })

  it('creates a dropdown menu element', () => {
    const container = createAutocompleteFixture()
    setupAccessibleAutoComplete(container)

    const menu = container.querySelector('[role="listbox"]')
    expect(menu).not.toBeNull()
  })

  it('sets correct ARIA attributes on input', () => {
    const container = createAutocompleteFixture()
    setupAccessibleAutoComplete(container)

    const input = container.querySelector('input')
    expect(input.getAttribute('role')).toBe('combobox')
    expect(input.getAttribute('aria-autocomplete')).toBe('both')
  })

  it('initializes multiple autocompletes independently', () => {
    const container1 = createAutocompleteFixture({ selectName: 'field1' })
    const container2 = createAutocompleteFixture({ selectName: 'field2' })

    setupAccessibleAutoComplete(container1)
    setupAccessibleAutoComplete(container2)

    const inputs = document.querySelectorAll('input[role="combobox"]')
    expect(inputs.length).toBe(2)
  })

  it('handles error state: clears default value then restores to input', () => {
    const container = createAutocompleteFixture({
      defaultValue: 'Mathematics',
      hasError: true
    })
    setupAccessibleAutoComplete(container)

    const input = container.querySelector('input')
    // In error state, the code sets input.value = inputValue after init
    expect(input.value).toBe('Mathematics')
  })
})
