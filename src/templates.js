import { escapeHtml } from './utils/escape'

// Escape regex metacharacters so a user-supplied string can be used as a literal
// inside `new RegExp(...)`. The character class lists every special character;
// `\\$&` is a backreference that re-emits the matched character prefixed by `\`.
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
      result += `<mark>${escapeHtml(matches[i])}</mark>`
    }
  })
  return result
}

function resolveOption (value, getOptions) {
  // If value is already an option object (from sort pipeline), use it directly
  if (value && typeof value === 'object') return value

  // If value is a string (e.g. default value set by accessible-autocomplete),
  // look it up in the options list
  const opts = typeof getOptions === 'function' ? getOptions() : getOptions
  return opts.find(o => o.name === value || o.text === value)
}

function inputValue (value) {
  if (value && typeof value === 'object') return value.name
  return value
}

function createSuggestionRenderer (getOptions, { highlightMatches, getCurrentQuery }) {
  return (value) => {
    const option = resolveOption(value, getOptions)
    if (!option) return '<span>No results found</span>'

    const displayName = option.name || String(value)
    const query = getCurrentQuery()
    const renderedValue = highlightMatches ? highlightMatch(displayName, query) : escapeHtml(displayName)
    const escapedAppend = escapeHtml(option.append)
    const escapedHint = escapeHtml(option.hint)

    let html = escapedAppend
      ? `<span>${renderedValue}</span> ${escapedAppend}`
      : `<span>${renderedValue}</span>`

    if (escapedHint) html += `<br>${escapedHint}`
    return html
  }
}

export { inputValue, createSuggestionRenderer }
