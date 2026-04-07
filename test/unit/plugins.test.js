import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { createAutocompleteFixture, cleanupFixtures } from '../helpers/dom'
import { registerPlugin, getGlobalPlugins, clearGlobalPlugins } from '../../src/plugins'

vi.mock('accessible-autocomplete', () => ({
  default: {
    enhanceSelectElement: vi.fn()
  }
}))

import { setupAccessibleAutoComplete } from '../../src/dfe-autocomplete'
import accessibleAutocomplete from 'accessible-autocomplete'

describe('Plugin system', () => {
  beforeEach(() => {
    clearGlobalPlugins()
  })

  afterEach(() => {
    clearGlobalPlugins()
    cleanupFixtures()
    vi.clearAllMocks()
  })

  describe('registerPlugin', () => {
    it('adds plugin to global registry', () => {
      const plugin = { name: 'test' }
      registerPlugin(plugin)
      expect(getGlobalPlugins()).toContain(plugin)
    })

    it('throws if plugin has no name', () => {
      expect(() => registerPlugin({})).toThrow('[dfe-autocomplete] Plugin must have a name')
    })
  })

  describe('lifecycle hooks', () => {
    it('calls onInitialize after setup', () => {
      const plugin = { name: 'test', onInitialize: vi.fn() }
      const container = createAutocompleteFixture()

      setupAccessibleAutoComplete(container, { plugins: [plugin] })

      expect(plugin.onInitialize).toHaveBeenCalledWith({
        element: container,
        options: expect.any(Array)
      })
    })

    it('calls onSearch when source is invoked', () => {
      const plugin = { name: 'test', onSearch: vi.fn() }
      const container = createAutocompleteFixture()

      setupAccessibleAutoComplete(container, { plugins: [plugin] })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('math', populateResults)

      expect(plugin.onSearch).toHaveBeenCalledWith({
        query: 'math',
        results: expect.any(Array)
      })
    })

    it('calls onSelect when option is confirmed', () => {
      const plugin = { name: 'test', onSelect: vi.fn() }
      const container = createAutocompleteFixture()

      setupAccessibleAutoComplete(container, { plugins: [plugin] })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      opts.onConfirm('Mathematics')

      expect(plugin.onSelect).toHaveBeenCalledWith({ value: 'Mathematics' })
    })

    it('calls onDestroy when instance is destroyed', () => {
      const plugin = { name: 'test', onDestroy: vi.fn() }
      const container = createAutocompleteFixture()

      accessibleAutocomplete.enhanceSelectElement.mockImplementation(() => {
        const wrapper = document.createElement('div')
        wrapper.className = 'autocomplete__wrapper'
        container.appendChild(wrapper)
        container.querySelector('select').style.display = 'none'
      })

      const instance = setupAccessibleAutoComplete(container, { plugins: [plugin] })
      instance.destroy()

      expect(plugin.onDestroy).toHaveBeenCalled()
    })
  })

  describe('global plugins', () => {
    it('global plugins are called alongside instance plugins', () => {
      const globalPlugin = { name: 'global', onSearch: vi.fn() }
      const instancePlugin = { name: 'instance', onSearch: vi.fn() }

      registerPlugin(globalPlugin)
      const container = createAutocompleteFixture()

      setupAccessibleAutoComplete(container, { plugins: [instancePlugin] })

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      opts.source('math', populateResults)

      expect(globalPlugin.onSearch).toHaveBeenCalled()
      expect(instancePlugin.onSearch).toHaveBeenCalled()
    })
  })

  describe('plugin without hooks', () => {
    it('does not throw when plugin has no hooks', () => {
      const plugin = { name: 'empty' }
      const container = createAutocompleteFixture()

      expect(() => {
        setupAccessibleAutoComplete(container, { plugins: [plugin] })
      }).not.toThrow()

      const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
      const populateResults = vi.fn()
      expect(() => opts.source('test', populateResults)).not.toThrow()
      expect(() => opts.onConfirm('Test')).not.toThrow()
    })
  })

  describe('dfeAutocomplete.use()', () => {
    it('registers global plugins via use()', async () => {
      const mod = await import('../../src/wrapper.js')
      const plugin = { name: 'via-use', onSearch: vi.fn() }

      mod.default.use(plugin)

      expect(getGlobalPlugins()).toContain(plugin)
    })
  })
})
