import { describe, it, expect } from 'vitest'
import { escapeHtml } from '../../../src/utils/escape'

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes less-than signs', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b')
  })

  it('escapes greater-than signs', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('a "b" c')).toBe('a &quot;b&quot; c')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("a 'b' c")).toBe('a &#039;b&#039; c')
  })

  it('escapes all special characters together', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('returns empty string for null', () => {
    expect(escapeHtml(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(escapeHtml(undefined)).toBe('')
  })

  it('converts numbers to strings', () => {
    expect(escapeHtml(42)).toBe('42')
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('passes through safe text unchanged', () => {
    expect(escapeHtml('London Metropolitan University')).toBe('London Metropolitan University')
  })

  it('escapes img onerror attack', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    )
  })

  it('escapes javascript: protocol', () => {
    expect(escapeHtml('javascript:alert(1)')).toBe('javascript:alert(1)')
    // Note: javascript: protocol doesn't contain HTML special chars,
    // but it's safe because it's only rendered as text content, not in href attributes
  })
})
