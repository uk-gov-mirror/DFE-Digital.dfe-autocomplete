import { clean as defaultClean } from './clean'
import { removeStopWords as defaultRemoveStopWords } from './stop-words'

export function createNormaliser (cleanFn = defaultClean, removeStopWordsFn = defaultRemoveStopWords) {
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

export const normalise = createNormaliser()
