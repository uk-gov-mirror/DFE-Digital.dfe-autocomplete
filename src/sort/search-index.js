import defaultClean from './clean'
import defaultCalculateWeight from './calculateWeight'
import { createNormaliser } from './cleanse'
import { byWeightThenAlphabetically } from './comparators'

function intersection (setA, setB) {
  const result = new Set()
  for (const item of setA) {
    if (setB.has(item)) result.add(item)
  }
  return result
}

export class SearchIndex {
  constructor (options, { clean, removeStopWords } = {}) {
    this.cleanFn = clean || defaultClean
    this.options = options
    this.index = new Map()

    const normaliseFn = createNormaliser(this.cleanFn, removeStopWords)
    options.forEach(normaliseFn)
    this.build()
  }

  build () {
    for (const option of this.options) {
      const allWords = [
        ...this.tokenize(option.clean.name),
        ...option.clean.synonyms.flatMap(s => this.tokenize(s))
      ]

      for (const word of allWords) {
        for (let i = 1; i <= word.length; i++) {
          const prefix = word.slice(0, i)
          if (!this.index.has(prefix)) this.index.set(prefix, new Set())
          this.index.get(prefix).add(option)
        }
      }
    }
  }

  tokenize (text) {
    return text.split(/\s+/).filter(Boolean)
  }

  search (query) {
    const words = this.tokenize(this.cleanFn(query))
    if (words.length === 0) return []

    let candidates = null
    for (const word of words) {
      const matches = this.index.get(word) || new Set()
      candidates = candidates === null ? new Set(matches) : intersection(candidates, matches)
    }

    return [...(candidates || [])]
  }
}

export function createIndexedSort (options, { clean, removeStopWords, calculateWeight } = {}) {
  const cleanFn = clean || defaultClean
  const calculateWeightFn = calculateWeight || defaultCalculateWeight
  const index = new SearchIndex(options, { clean: cleanFn, removeStopWords })

  return (query) => {
    const cleanQuery = cleanFn(query)

    return index.search(query)
      .map(option => {
        option.weight = calculateWeightFn(option.clean, cleanQuery) * option.clean.boost
        return option
      })
      .filter(o => o.weight > 0)
      .sort(byWeightThenAlphabetically)
  }
}
