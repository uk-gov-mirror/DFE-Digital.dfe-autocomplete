const defaultStopWords = ['the', 'of', 'in', 'and', 'at', '&', 'with']

function escapeRegExp (str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createRemoveStopWords (words) {
  const regex = new RegExp(words.map(word => `(\\s+)?${escapeRegExp(word)}(\\s+)?`).join('|'), 'gi')

  return (text) => {
    const isAllStopWords = text.trim().split(/\s+/).every((word) => words.includes(word))
    if (isAllStopWords) return text
    return text.replace(regex, ' ').trim()
  }
}

export const removeStopWords = createRemoveStopWords(defaultStopWords)
