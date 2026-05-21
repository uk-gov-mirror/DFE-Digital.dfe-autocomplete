import defaultClean from './clean'
import defaultCalculateWeight from './calculate-weight'
import { normalise, createNormaliser } from './cleanse'
import { hasWeight, byWeightThenAlphabetically, optionName } from './comparators'
import { createRemoveStopWords } from './stop-words'
import { createIndexedSort } from './search-index'

function buildPipeline (cleanFn, normaliseFn, calculateWeightFn) {
  return (query, options) => {
    const cleanQuery = cleanFn(query)

    return options
      .map((option) => {
        normaliseFn(option)
        option.weight = calculateWeightFn(option.clean, cleanQuery) * option.clean.boost
        return option
      })
      .filter(hasWeight)
      .sort(byWeightThenAlphabetically)
  }
}

export function createSort ({ clean, removeStopWords, calculateWeight } = {}) {
  const cleanFn = clean || defaultClean
  const calculateWeightFn = calculateWeight || defaultCalculateWeight
  const normaliseFn = (clean || removeStopWords)
    ? createNormaliser(cleanFn, removeStopWords)
    : normalise

  return buildPipeline(cleanFn, normaliseFn, calculateWeightFn)
}

const defaultSort = buildPipeline(defaultClean, normalise, defaultCalculateWeight)

export function buildSortFunction (options, libraryOptions) {
  if (libraryOptions.sort) return libraryOptions.sort

  const hasCustomInternals = libraryOptions.stopWords || libraryOptions.calculateWeight || libraryOptions.clean
  if (!hasCustomInternals && !libraryOptions.useSearchIndex) return defaultSort

  const customConfig = {
    clean: libraryOptions.clean,
    removeStopWords: libraryOptions.stopWords ? createRemoveStopWords(libraryOptions.stopWords) : undefined,
    calculateWeight: libraryOptions.calculateWeight
  }

  if (libraryOptions.useSearchIndex) {
    return createIndexedSort(options, customConfig)
  }

  return createSort(customConfig)
}

export { normalise, hasWeight, byWeightThenAlphabetically, optionName }
export default defaultSort
