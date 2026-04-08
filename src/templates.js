import { escapeHtml } from './utils/escape'

function escapeRegExp (str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightMatch (text, query) {
  if (!query) return escapeHtml(text)

  const regex = new RegExp(escapeRegExp(query), 'gi')
  const parts = text.split(regex)
  const matches = text.match(regex) || []

  let result = ''
  parts.forEach((part, i) => {
    result += escapeHtml(part)
    if (i < matches.length) {
      result += `<strong>${escapeHtml(matches[i])}</strong>`
    }
  })
  return result
}

export function createSuggestionRenderer (getOptions, { highlightMatches, getCurrentQuery }) {
  return (value) => {
    const opts = typeof getOptions === 'function' ? getOptions() : getOptions
    const option = opts.find(o => o.name === value || o.text === value)
    if (!option) return '<span>No results found</span>'

    const query = getCurrentQuery()
    const renderedValue = highlightMatches ? highlightMatch(value, query) : escapeHtml(value)
    const escapedAppend = escapeHtml(option.append)
    const escapedHint = escapeHtml(option.hint)

    let html = escapedAppend
      ? `<span>${renderedValue}</span> ${escapedAppend}`
      : `<span>${renderedValue}</span>`

    if (escapedHint) html += `<br>${escapedHint}`
    return html
  }
}
