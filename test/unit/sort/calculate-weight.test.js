import { describe, it, expect } from 'vitest'
import {
  calculateWeight,
  exactMatch,
  startsWithRegExp,
  startsWith,
  wordsStartsWithQuery,
  synonymsExactMatch,
  synonymsStartsWith,
  wordInSynonymStartsWithQuery
} from '@/sort/calculate-weight'

describe('helper functions', () => {
  describe('exactMatch', () => {
    it('returns true for identical strings', () => {
      expect(exactMatch('london', 'london')).toBe(true)
    })

    it('returns false for different strings', () => {
      expect(exactMatch('london', 'londo')).toBe(false)
    })

    it('is case sensitive', () => {
      expect(exactMatch('London', 'london')).toBe(false)
    })
  })

  describe('startsWithRegExp', () => {
    it('creates a regex matching word boundaries', () => {
      const regex = startsWithRegExp('lon')
      expect(regex).toBeInstanceOf(RegExp)
      expect(regex.test('london')).toBe(true)
    })

    it('is case insensitive', () => {
      const regex = startsWithRegExp('lon')
      expect(regex.test('London')).toBe(true)
    })
  })

  describe('startsWith', () => {
    it('returns true when word starts with query', () => {
      expect(startsWith('london', 'lon')).toBe(true)
    })

    it('returns false when word does not start with query', () => {
      expect(startsWith('london', 'don')).toBe(false)
    })

    it('returns true for exact match', () => {
      expect(startsWith('london', 'london')).toBe(true)
    })
  })

  describe('wordsStartsWithQuery', () => {
    it('returns true when all regexps match', () => {
      const regExps = [startsWithRegExp('uni'), startsWithRegExp('lon')]
      expect(wordsStartsWithQuery('university of london', regExps)).toBe(true)
    })

    it('returns false when not all regexps match', () => {
      const regExps = [startsWithRegExp('uni'), startsWithRegExp('xyz')]
      expect(wordsStartsWithQuery('university of london', regExps)).toBe(false)
    })
  })

  describe('synonymsExactMatch', () => {
    it('returns true when a synonym matches exactly', () => {
      expect(synonymsExactMatch(['ucl', 'university college london'], 'ucl')).toBe(true)
    })

    it('returns false when no synonym matches', () => {
      expect(synonymsExactMatch(['ucl', 'university college london'], 'oxford')).toBe(false)
    })
  })

  describe('synonymsStartsWith', () => {
    it('returns true when a synonym starts with query', () => {
      expect(synonymsStartsWith(['university college london'], 'uni')).toBe(true)
    })

    it('returns false when no synonym starts with query', () => {
      expect(synonymsStartsWith(['university college london'], 'xyz')).toBe(false)
    })
  })

  describe('wordInSynonymStartsWithQuery', () => {
    it('returns true when synonym words match query word regexps', () => {
      const regExps = [startsWithRegExp('col'), startsWithRegExp('lon')]
      expect(wordInSynonymStartsWithQuery(['university college london'], regExps)).toBe(true)
    })

    it('returns false when synonym words do not match', () => {
      const regExps = [startsWithRegExp('xyz')]
      expect(wordInSynonymStartsWithQuery(['university college london'], regExps)).toBe(false)
    })
  })
})

describe('calculateWeight', () => {
  const makeOption = (name, synonyms = []) => ({
    name,
    nameWithoutStopWords: name,
    synonyms,
    synonymsWithoutStopWords: synonyms
  })

  it('returns 100 for exact name match', () => {
    expect(calculateWeight(makeOption('london'), 'london')).toBe(100)
  })

  it('returns 95 for exact match after stop word removal', () => {
    const option = {
      name: 'the university of london',
      nameWithoutStopWords: 'university london',
      synonyms: [],
      synonymsWithoutStopWords: []
    }
    expect(calculateWeight(option, 'the university of london')).toBe(100) // exact match first
    // To get 95, name must not match but nameWithoutStopWords must
    const option2 = {
      name: 'university of london',
      nameWithoutStopWords: 'university london',
      synonyms: [],
      synonymsWithoutStopWords: []
    }
    expect(calculateWeight(option2, 'the university of london')).toBe(95)
  })

  it('returns 75 for exact synonym match', () => {
    expect(calculateWeight(makeOption('university college london', ['ucl']), 'ucl')).toBe(75)
  })

  it('returns 70 for synonym match after stop word removal', () => {
    // To get 70: raw synonyms must NOT match query, but synonymsWithoutStopWords must match queryWithoutStopWords.
    // A raw exact synonym match would score 75 instead.
    const option2 = {
      name: 'some university',
      nameWithoutStopWords: 'some university',
      synonyms: ['the college of the arts'],
      synonymsWithoutStopWords: ['college arts']
    }
    // query = "college arts" → queryWithoutStopWords = "college arts"
    // synonyms = ['the college of the arts'] !== 'college arts' → not 75
    // synonymsWithoutStopWords = ['college arts'] === 'college arts' → 70
    expect(calculateWeight(option2, 'college arts')).toBe(70)
  })

  it('returns 60 for name starts with query', () => {
    expect(calculateWeight(makeOption('london metropolitan'), 'lon')).toBe(60)
  })

  it('returns 55 for name starts with query after stop word removal', () => {
    const option = {
      name: 'the arts university',
      nameWithoutStopWords: 'arts university',
      synonyms: [],
      synonymsWithoutStopWords: []
    }
    // query "arts" → name "the arts university" does NOT start with "arts" (position != 0)
    // but nameWithoutStopWords "arts university" starts with "arts" → 55
    expect(calculateWeight(option, 'arts')).toBe(55)
  })

  it('returns 50 for synonym starts with query', () => {
    const option = makeOption('some name', ['university college london'])
    expect(calculateWeight(option, 'uni')).toBe(50)
  })

  it('returns 40 for synonym starts with query after stop word removal', () => {
    // query = "the col" → without stop words = "col"
    // synonyms don't start with "the col" (no synonym starts with it)
    // but synonym "the college of arts" starts with "the col"? Let's check startsWith:
    // "the college of arts".search(\bthe col) → position 0 → yes → that would be 50
    // For 40 we need: synonyms don't startsWith query, but synonyms startsWith queryWithoutStopWords
    // query = "col" has no stop words so queryWithoutStopWords = "col"
    // synonyms = ["the college of arts"].search(\bcol) = 4, not 0 → not 50
    // synonyms startsWith queryWithoutStopWords "col" → same check → not 50
    // Let me rethink...
    // The code: synonymsStartsWith(synonyms, queryWithoutStopWords) → checks if any synonym starts with "col"
    // "the college of arts".search(\bcol) = 4 → not 0 → false
    // Actually we need synonymsWithoutStopWords for the 40 check... wait no.
    // Line 32: synonymsStartsWith(synonyms, queryWithoutStopWords) return 40
    // This uses raw synonyms, not synonymsWithoutStopWords. And queryWithoutStopWords.
    // So for 40: no raw synonym starts with raw query, but a raw synonym starts with queryWithoutStopWords
    const option2 = {
      name: 'some name',
      nameWithoutStopWords: 'some name',
      synonyms: ['college of arts'],
      synonymsWithoutStopWords: ['college arts']
    }
    // query = "the college" → queryWithoutStopWords = "college"
    // synonymsStartsWith(synonyms, query="the college") → "college of arts".search(\bthe college) → no match → not 50
    // synonymsStartsWith(synonyms, queryWithoutStopWords="college") → "college of arts".search(\bcollege) = 0 → yes → 40
    expect(calculateWeight(option2, 'the college')).toBe(40)
  })

  it('returns 25 for multiple query words matching word boundaries in name', () => {
    const option = {
      name: 'university college london',
      nameWithoutStopWords: 'university college london',
      synonyms: [],
      synonymsWithoutStopWords: []
    }
    // query "col lon" → each word matches a word boundary in nameWithoutStopWords
    expect(calculateWeight(option, 'col lon')).toBe(25)
  })

  it('returns 10 for multiple query words matching word boundaries in synonym', () => {
    const option = {
      name: 'some name',
      nameWithoutStopWords: 'some name',
      synonyms: [],
      synonymsWithoutStopWords: ['university college london']
    }
    expect(calculateWeight(option, 'col lon')).toBe(10)
  })

  it('returns 0 for no match', () => {
    expect(calculateWeight(makeOption('london'), 'xyz')).toBe(0)
  })
})
