import defaultClean from './clean'
import defaultRemoveStopWords from './stop_words'

export function createOptionCleanser (cleanFn = defaultClean, removeStopWordsFn = defaultRemoveStopWords) {
  return (option) => {
    const synonyms = (option.synonyms || []).map(cleanFn)

    option.clean = {
      name: cleanFn(option.name),
      nameWithoutStopWords: removeStopWordsFn(option.name),
      synonyms,
      synonymsWithoutStopWords: synonyms.map(removeStopWordsFn),
      boost: option.boost || 1
    }

    return option
  }
}

export const cleanseOption = createOptionCleanser()
