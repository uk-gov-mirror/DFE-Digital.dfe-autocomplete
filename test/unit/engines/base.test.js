import { describe, it, expect } from 'vitest'
import { BaseEngine } from '@/engines/base'

describe('BaseEngine', () => {
  it('stores element and options', () => {
    const element = document.createElement('div')
    const options = { foo: 'bar' }
    const engine = new BaseEngine(element, options)

    expect(engine.element).toBe(element)
    expect(engine.options).toBe(options)
  })

  it('throws on initialize()', () => {
    const engine = new BaseEngine(null, {})
    expect(() => engine.initialize()).toThrow('Not implemented')
  })

  it('throws on destroy()', () => {
    const engine = new BaseEngine(null, {})
    expect(() => engine.destroy()).toThrow('Not implemented')
  })

  it('throws on getValue()', () => {
    const engine = new BaseEngine(null, {})
    expect(() => engine.getValue()).toThrow('Not implemented')
  })

  it('throws on setValue()', () => {
    const engine = new BaseEngine(null, {})
    expect(() => engine.setValue('test')).toThrow('Not implemented')
  })
})
