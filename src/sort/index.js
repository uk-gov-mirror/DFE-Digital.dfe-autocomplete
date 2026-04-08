import defaultClean from './clean'
import defaultCalculateWeight from './calculateWeight'
import { cleanseOption, createOptionCleanser } from './cleanse'

const hasWeight = (option) => option.weight > 0

const byWeightThenAlphabetically = (a, b) => {
  if (a.weight > b.weight) return -1
  if (a.weight < b.weight) return 1
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return 0
}

const optionName = (option) => option.name

function buildPipeline (cleanFn, cleanseOptionFn, calculateWeightFn) {
  return (query, options) => {
    const cleanQuery = cleanFn(query)

    return options
      .map(cleanseOptionFn)
      .map((option) => {
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
  const cleanseOptionFn = (clean || removeStopWords)
    ? createOptionCleanser(cleanFn, removeStopWords)
    : cleanseOption

  return buildPipeline(cleanFn, cleanseOptionFn, calculateWeightFn)
}

export { cleanseOption, hasWeight, byWeightThenAlphabetically, optionName }
export default buildPipeline(defaultClean, cleanseOption, defaultCalculateWeight)
