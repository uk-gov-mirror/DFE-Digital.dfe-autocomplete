import { describe, it, expect, afterEach } from 'vitest'
import { createAutocompleteFixture, cleanupFixtures } from 'test-helpers/dom'
import { setupAccessibleAutoComplete } from '@/dfe-autocomplete'

/**
 * Destroy tests use the real accessible-autocomplete (no mocking)
 * since destroy needs to interact with DOM elements created by the library.
 */

describe('destroy', () => {
  afterEach(() => {
    cleanupFixtures()
  })

  it('returns an instance with a destroy method', () => {
    const container = createAutocompleteFixture()
    const instance = setupAccessibleAutoComplete(container)

    expect(instance).not.toBeNull()
    expect(typeof instance.destroy).toBe('function')
  })

  it('removes the autocomplete wrapper from the DOM', () => {
    const container = createAutocompleteFixture()
    const instance = setupAccessibleAutoComplete(container)

    expect(container.querySelector('.autocomplete__wrapper')).not.toBeNull()

    instance.destroy()

    expect(container.querySelector('.autocomplete__wrapper')).toBeNull()
  })

  it('restores the select element visibility', () => {
    const container = createAutocompleteFixture()
    const instance = setupAccessibleAutoComplete(container)

    const select = container.querySelector('select')
    expect(select.style.display).toBe('none')

    instance.destroy()

    expect(select.style.display).toBe('')
  })

  it('restores the select element ID', () => {
    const container = createAutocompleteFixture()
    const select = container.querySelector('select')
    const originalId = select.id

    const instance = setupAccessibleAutoComplete(container)

    // accessible-autocomplete appends '-select' to the ID
    expect(select.id).toBe(originalId + '-select')

    instance.destroy()

    expect(select.id).toBe(originalId)
  })

  it('allows re-initialization after destroy', () => {
    const container = createAutocompleteFixture()
    const instance1 = setupAccessibleAutoComplete(container)

    instance1.destroy()

    // Re-initialize
    const instance2 = setupAccessibleAutoComplete(container)
    expect(instance2).not.toBeNull()
    expect(container.querySelector('.autocomplete__wrapper')).not.toBeNull()

    // Clean up
    instance2.destroy()
  })
})
