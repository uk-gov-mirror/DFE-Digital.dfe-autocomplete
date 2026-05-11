import { describe, it, expect, vi, afterEach } from 'vitest'
import { EventEmitter } from '@/events'
import { cleanupFixtures } from 'test-helpers/dom'

describe('EventEmitter', () => {
  it('calls listener when event is emitted', () => {
    const emitter = new EventEmitter()
    const listener = vi.fn()

    emitter.on('test', listener)
    emitter.emit('test', { value: 42 })

    expect(listener).toHaveBeenCalledWith({ value: 42 })
  })

  it('supports multiple listeners for same event', () => {
    const emitter = new EventEmitter()
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    emitter.on('test', listener1)
    emitter.on('test', listener2)
    emitter.emit('test')

    expect(listener1).toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()
  })

  it('returns unsubscribe function from on()', () => {
    const emitter = new EventEmitter()
    const listener = vi.fn()

    const unsubscribe = emitter.on('test', listener)
    unsubscribe()
    emitter.emit('test')

    expect(listener).not.toHaveBeenCalled()
  })

  it('removes listener with off()', () => {
    const emitter = new EventEmitter()
    const listener = vi.fn()

    emitter.on('test', listener)
    emitter.off('test', listener)
    emitter.emit('test')

    expect(listener).not.toHaveBeenCalled()
  })

  it('does not affect other listeners when removing one', () => {
    const emitter = new EventEmitter()
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    emitter.on('test', listener1)
    emitter.on('test', listener2)
    emitter.off('test', listener1)
    emitter.emit('test')

    expect(listener1).not.toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()
  })

  it('does not throw when emitting event with no listeners', () => {
    const emitter = new EventEmitter()
    expect(() => emitter.emit('nonexistent')).not.toThrow()
  })

  it('does not throw when removing listener from event with no listeners', () => {
    const emitter = new EventEmitter()
    expect(() => emitter.off('nonexistent', () => {})).not.toThrow()
  })
})

// Integration test: events on autocomplete instance
vi.mock('accessible-autocomplete', () => ({
  default: {
    enhanceSelectElement: vi.fn()
  }
}))

import { setupAccessibleAutoComplete } from '@/dfe-autocomplete'
import accessibleAutocomplete from 'accessible-autocomplete'

describe('Autocomplete instance events', () => {
  afterEach(() => {
    cleanupFixtures()
    vi.clearAllMocks()
  })

  function createFixture () {
    const container = document.createElement('div')
    container.setAttribute('data-module', 'app-dfe-autocomplete')
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

  it('instance exposes on() method', () => {
    const container = createFixture()
    const instance = setupAccessibleAutoComplete(container)
    expect(typeof instance.on).toBe('function')
  })

  it('instance exposes off() method', () => {
    const container = createFixture()
    const instance = setupAccessibleAutoComplete(container)
    expect(typeof instance.off).toBe('function')
  })

  it('emits search event with query and results', () => {
    const container = createFixture()
    const instance = setupAccessibleAutoComplete(container)
    const listener = vi.fn()

    instance.on('search', listener)

    const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    const populateResults = vi.fn()
    opts.source('math', populateResults)

    expect(listener).toHaveBeenCalledWith({
      query: 'math',
      results: expect.any(Array)
    })
  })

  it('emits select event with value', () => {
    const container = createFixture()
    const instance = setupAccessibleAutoComplete(container)
    const listener = vi.fn()

    instance.on('select', listener)

    const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    opts.onConfirm('Mathematics')

    expect(listener).toHaveBeenCalledWith({ value: 'Mathematics' })
  })

  it('emits destroy event', () => {
    const container = createFixture()

    // Mock enhanceSelectElement to create the wrapper div
    accessibleAutocomplete.enhanceSelectElement.mockImplementation(() => {
      const wrapper = document.createElement('div')
      wrapper.className = 'autocomplete__wrapper'
      container.appendChild(wrapper)
      container.querySelector('select').style.display = 'none'
    })

    const instance = setupAccessibleAutoComplete(container)
    const listener = vi.fn()

    instance.on('destroy', listener)
    instance.destroy()

    expect(listener).toHaveBeenCalled()
  })
})
