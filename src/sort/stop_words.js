export const defaultStopWords = ['the', 'of', 'in', 'and', 'at', '&', 'with']

export function createRemoveStopWords (words) {
  return (text) => {
    const isAllStopWords = text.trim().split(' ').every((word) => words.includes(word))

    if (isAllStopWords) {
      return text
    }

    const regex = new RegExp(words.map(word => `(\\s+)?${word}(\\s+)?`).join('|'), 'gi')
    return text.replace(regex, ' ').trim()
  }
}

const removeStopWords = createRemoveStopWords(defaultStopWords)

export default removeStopWords
