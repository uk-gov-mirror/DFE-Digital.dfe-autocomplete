import { removeStopWords } from './stop-words'

export const WEIGHT = {
  EXACT_NAME: 100,
  EXACT_NAME_NO_STOPWORDS: 95,
  EXACT_SYNONYM: 75,
  EXACT_SYNONYM_NO_STOPWORDS: 70,
  NAME_STARTS_WITH: 60,
  NAME_STARTS_WITH_NO_STOPWORDS: 55,
  SYNONYM_STARTS_WITH: 50,
  SYNONYM_STARTS_WITH_NO_STOPWORDS: 40,
  WORDS_MATCH_NAME: 25,
  WORDS_MATCH_SYNONYM: 10,
  NO_MATCH: 0
}

export const exactMatch = (word, query) => word === query

export const startsWithRegExp = (query) => new RegExp('\\b' + query, 'i')
export const startsWith = (word, query) => word.search(startsWithRegExp(query)) === 0

export const wordsStartsWithQuery = (word, regExps) => regExps.every((regExp) => word.search(regExp) >= 0)

const anyMatch = (words, query, evaluatorFn) => words.some((word) => evaluatorFn(word, query))
export const synonymsExactMatch = (synonyms, query) => anyMatch(synonyms, query, exactMatch)
export const synonymsStartsWith = (synonyms, query) => anyMatch(synonyms, query, startsWith)

export const wordInSynonymStartsWithQuery = (synonyms, startsWithQueryWordsRegexes) =>
  anyMatch(synonyms, startsWithQueryWordsRegexes, wordsStartsWithQuery)

export function calculateWeight ({ name, synonyms, nameWithoutStopWords, synonymsWithoutStopWords }, query) {
  const queryWithoutStopWords = removeStopWords(query)

  if (exactMatch(name, query)) return WEIGHT.EXACT_NAME
  if (exactMatch(nameWithoutStopWords, queryWithoutStopWords)) return WEIGHT.EXACT_NAME_NO_STOPWORDS

  if (synonymsExactMatch(synonyms, query)) return WEIGHT.EXACT_SYNONYM
  if (synonymsExactMatch(synonymsWithoutStopWords, queryWithoutStopWords)) return WEIGHT.EXACT_SYNONYM_NO_STOPWORDS

  if (startsWith(name, query)) return WEIGHT.NAME_STARTS_WITH
  if (startsWith(nameWithoutStopWords, queryWithoutStopWords)) return WEIGHT.NAME_STARTS_WITH_NO_STOPWORDS

  if (synonymsStartsWith(synonyms, query)) return WEIGHT.SYNONYM_STARTS_WITH
  if (synonymsStartsWith(synonyms, queryWithoutStopWords)) return WEIGHT.SYNONYM_STARTS_WITH_NO_STOPWORDS

  const startsWithRegExps = queryWithoutStopWords.split(/\s+/).map(startsWithRegExp)

  if (wordsStartsWithQuery(nameWithoutStopWords, startsWithRegExps)) return WEIGHT.WORDS_MATCH_NAME
  if (wordInSynonymStartsWithQuery(synonymsWithoutStopWords, startsWithRegExps)) return WEIGHT.WORDS_MATCH_SYNONYM

  return WEIGHT.NO_MATCH
}
