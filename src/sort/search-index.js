import defaultClean from './clean'
import defaultRemoveStopWords from './stop_words'
import defaultCalculateWeight from './calculateWeight'
import { byWeightThenAlphabetically } from './index'

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
    this.removeStopWordsFn = removeStopWords || defaultRemoveStopWords
    this.options = options
    this.index = new Map()
    this.build()
  }

  build () {
    for (const option of this.options) {
      // Pre-compute clean data
      const cleanName = this.cleanFn(option.name)
      const synonyms = (option.synonyms || []).map(s => this.cleanFn(s))

      option.clean = {
        name: cleanName,
        nameWithoutStopWords: this.removeStopWordsFn(option.name),
        synonyms,
        synonymsWithoutStopWords: synonyms.map(s => this.removeStopWordsFn(s)),
        boost: option.boost || 1
      }

      const nameWords = this.tokenize(cleanName)
      const synonymWords = synonyms.flatMap(s => this.tokenize(s))
      const allWords = [...nameWords, ...synonymWords]

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
    const candidates = index.search(query)

    return candidates
      .map(option => {
        const weight = calculateWeightFn(option.clean, cleanQuery) * option.clean.boost
        return { name: option.name, weight }
      })
      .filter(o => o.weight > 0)
      .sort(byWeightThenAlphabetically)
      .map(o => o.name)
  }
}
