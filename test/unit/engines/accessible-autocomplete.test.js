import { describe, it, expect, afterEach } from 'vitest'
import { AccessibleAutocompleteEngine } from '@/engines/accessible-autocomplete'
import { createAutocompleteFixture, cleanupFixtures } from 'test-helpers/dom'

describe('AccessibleAutocompleteEngine', () => {
  afterEach(() => {
    cleanupFixtures()
  })

  function createEngine () {
    const container = createAutocompleteFixture()
    const selectEl = container.querySelector('select')
    const options = {
      selectElement: selectEl,
      source: (query, cb) => {
        const results = []
        cb(results)
      },
      name: 'test'
    }
    const engine = new AccessibleAutocompleteEngine(container, options)
    return { container, engine, selectEl }
  }

  it('initializes and hides the select', () => {
    const { container, engine, selectEl } = createEngine()
    engine.initialize()

    expect(selectEl.style.display).toBe('none')
    expect(container.querySelector('.autocomplete__wrapper')).not.toBeNull()
  })

  it('creates an input element on initialize', () => {
    const { container, engine } = createEngine()
    engine.initialize()

    expect(container.querySelector('input')).not.toBeNull()
  })

  it('destroys and restores the select', () => {
    const { container, engine, selectEl } = createEngine()
    engine.initialize()

    engine.destroy()

    expect(selectEl.style.display).toBe('')
    expect(container.querySelector('.autocomplete__wrapper')).toBeNull()
  })

  it('restores the select ID on destroy', () => {
    const { engine, selectEl } = createEngine()
    const originalId = selectEl.id

    engine.initialize()
    expect(selectEl.id).toBe(originalId + '-select')

    engine.destroy()
    expect(selectEl.id).toBe(originalId)
  })

  it('getValue returns input value', () => {
    const { container, engine } = createEngine()
    engine.initialize()

    const input = container.querySelector('input')
    input.value = 'test value'

    expect(engine.getValue()).toBe('test value')
  })

  it('getValue returns empty string when no input', () => {
    const { engine } = createEngine()
    // Don't initialize — no input exists
    expect(engine.getValue()).toBe('')
  })

  it('setValue sets input value', () => {
    const { container, engine } = createEngine()
    engine.initialize()

    engine.setValue('new value')

    const input = container.querySelector('input')
    expect(input.value).toBe('new value')
  })
})
