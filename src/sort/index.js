import defaultClean from './clean'
import defaultRemoveStopWords from './stop_words'
import defaultCalculateWeight from './calculateWeight'

const addWeightWithBoost = (option, query) => {
  option.weight = defaultCalculateWeight(option.clean, query) * option.clean.boost

  return option
}

const cleanseOption = (option) => {
  const synonyms = (option.synonyms || []).map(defaultClean)

  option.clean = {
    name: defaultClean(option.name),
    nameWithoutStopWords: defaultRemoveStopWords(option.name),
    synonyms: synonyms,
    synonymsWithoutStopWords: synonyms.map(defaultRemoveStopWords),
    boost: (option.boost || 1)
  }

  return option
}

const hasWeight = (option) => (option.weight > 0)

const byWeightThenAlphabetically = (a, b) => {
  if (a.weight > b.weight) return -1
  if (a.weight < b.weight) return 1
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1

  return 0
}

const optionName = (option) => option.name

export function createSort ({ clean, removeStopWords, calculateWeight } = {}) {
  const cleanFn = clean || defaultClean
  const removeStopWordsFn = removeStopWords || defaultRemoveStopWords
  const calculateWeightFn = calculateWeight || defaultCalculateWeight

  const customCleanseOption = (option) => {
    const synonyms = (option.synonyms || []).map(cleanFn)

    option.clean = {
      name: cleanFn(option.name),
      nameWithoutStopWords: removeStopWordsFn(option.name),
      synonyms: synonyms,
      synonymsWithoutStopWords: synonyms.map(removeStopWordsFn),
      boost: (option.boost || 1)
    }

    return option
  }

  const customAddWeight = (option, query) => {
    option.weight = calculateWeightFn(option.clean, query) * option.clean.boost
    return option
  }

  return (query, options) => {
    const cleanQuery = cleanFn(query)

    return options.map(customCleanseOption)
      .map((option) => customAddWeight(option, cleanQuery))
      .filter(hasWeight)
      .sort(byWeightThenAlphabetically)
      .map(optionName)
  }
}

export {
  addWeightWithBoost,
  cleanseOption,
  hasWeight,
  byWeightThenAlphabetically,
  optionName
}
export default (query, options) => {
  const cleanQuery = defaultClean(query)

  return options.map(cleanseOption)
    .map((option) => addWeightWithBoost(option, cleanQuery))
    .filter(hasWeight)
    .sort(byWeightThenAlphabetically)
    .map(optionName)
}
