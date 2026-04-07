import { describe, it, expect } from 'vitest'
import clean from '../../../src/sort/clean'

describe('clean', () => {
  it('trims whitespace', () => {
    expect(clean('  hello  ')).toBe('hello')
  })

  it('removes smart single quotes', () => {
    expect(clean('it\u2019s')).toBe('its')
  })

  it('removes straight single quotes', () => {
    expect(clean("it's")).toBe('its')
  })

  it('replaces punctuation with spaces', () => {
    expect(clean('hello,world')).toBe('hello world')
    expect(clean('hello.world')).toBe('hello world')
    expect(clean('hello/world')).toBe('hello world')
    expect(clean('hello-world')).toBe('hello world')
    expect(clean('hello(world)')).toBe('hello world ')
  })

  it('lowercases text', () => {
    expect(clean('HELLO')).toBe('hello')
    expect(clean('Hello World')).toBe('hello world')
  })

  it('handles combined transformations', () => {
    expect(clean("  St. Mary's  ")).toBe('st  marys')
  })

  it('handles empty string', () => {
    expect(clean('')).toBe('')
  })

  it('handles text with only punctuation', () => {
    expect(clean('...')).toBe('   ')
  })

  it('preserves numbers', () => {
    expect(clean('Room 101')).toBe('room 101')
  })
})
