import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { cleanupFixtures } from '../helpers/dom'
import { BaseEngine } from '../../src/engines/base'

// Use a fresh import for each test to avoid state leaking
let setEngine, getEngine, AccessibleAutocompleteEngine

beforeEach(async () => {
  const mod = await import('../../src/wrapper.js')
  setEngine = mod.setEngine
  getEngine = mod.getEngine
  AccessibleAutocompleteEngine = mod.AccessibleAutocompleteEngine
})

afterEach(() => {
  // Reset to default engine
  setEngine(AccessibleAutocompleteEngine)
  cleanupFixtures()
})

describe('Engine registration', () => {
  it('defaults to AccessibleAutocompleteEngine', () => {
    expect(getEngine()).toBe(AccessibleAutocompleteEngine)
  })

  it('setEngine changes the current engine', () => {
    class CustomEngine extends BaseEngine {
      initialize () {}
      destroy () {}
      getValue () { return '' }
      setValue () {}
    }

    setEngine(CustomEngine)
    expect(getEngine()).toBe(CustomEngine)
  })

  it('exports BaseEngine for subclassing', async () => {
    const mod = await import('../../src/wrapper.js')
    expect(mod.BaseEngine).toBe(BaseEngine)
  })

  it('exports AccessibleAutocompleteEngine', async () => {
    const mod = await import('../../src/wrapper.js')
    expect(mod.AccessibleAutocompleteEngine).toBeDefined()
  })
})
