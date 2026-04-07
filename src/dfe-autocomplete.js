import defaultSort, { createSort } from './sort'
import { createRemoveStopWords } from './sort/stop_words'
import { createIndexedSort } from './sort/search-index'
import { escapeHtml } from './utils/escape'
import { createLogger } from './utils/logger'
import { EventEmitter } from './events'
import { AccessibleAutocompleteEngine } from './engines/accessible-autocomplete'
import { getGlobalPlugins } from './plugins'

const instances = new WeakMap()

const nullTracker = {
  sendTrackingEvent: function() { },
  trackSearch: function() { }
}

const defaultValueOption = component => component.getAttribute('data-default-value') || ''

const highlightMatch = (text, query) => {
  if (!query) return escapeHtml(text)
  const escaped = escapeHtml(text)
  const escapedQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return escaped.replace(regex, '<strong>$1</strong>')
}

const suggestion = (value, options, { highlightMatches = false, currentQuery = '' } = {}) => {
  const option = options.find(o => o.name === value || o.text == value)
  if (option) {
    const renderedValue = highlightMatches ? highlightMatch(value, currentQuery) : escapeHtml(value)
    const escapedAppend = escapeHtml(option.append)
    const escapedHint = escapeHtml(option.hint)
    const html = escapedAppend
      ? `<span>${renderedValue}</span> ${escapedAppend}`
      : `<span>${renderedValue}</span>`
    return escapedHint ? `${html}<br>${escapedHint}` : html
  } else {
    return `<span>No results found</span>`
  }
}

const enhanceOption = (option) => {
  return {
    name: option.label,
    synonyms: (option.getAttribute('data-synonyms') ? option.getAttribute('data-synonyms').split('|') : []),
    append: option.getAttribute('data-append'),
    hint: option.getAttribute('data-hint'),
    boost: (parseFloat(option.getAttribute('data-boost')) || 1),
    text: option.textContent || option.innerText
  }
}

// Generate the correct name for the autocomplete field
//
// Scenario 1: If a 'name' is explicitly passed in the options, use it directly
// This scenario bypasses the rest of the logic and assigns the 'name' passed in the options.
// Example: libraryOptions.name = 'some_value'
//
// Scenario 2: If no 'name' is passed, apply regex logic based on the 'select' element's name.
// The regex looks for the format 'course_details[subject]' and splits it into two parts.
// Example: selectEl.name = 'course_details[subject]'
//
// Scenario 2.1: If 'rawAttribute' is true, append '_raw' to the second part of the name.
// Example: selectEl.name = 'course_details[subject]' and libraryOptions.rawAttribute = true
// Result: 'course_details[subject_raw]'
//
// Scenario 2.2: If 'rawAttribute' is false (or not specified), keep the name as it is.
// Example: selectEl.name = 'course_details[subject]' and libraryOptions.rawAttribute = false
// Result: 'course_details[subject]'
//
// Scenario 3: If no match is found from the regex, return the original 'select' element's name.
// Example: selectEl.name = 'subject'
// Result: 'subject'
//
function generateAutocompleteName(selectEl, libraryOptions) {
  if (libraryOptions.name) {
    return libraryOptions.name;
  }

  const matches = /^(?<prefix>\w+)\[(?<key>\w+)\]$/.exec(selectEl.name);

  if (matches) {
    if (libraryOptions.rawAttribute) {
      return `${matches.groups.prefix}[${matches.groups.key}_raw]`;
    } else {
      return `${matches.groups.prefix}[${matches.groups.key}]`;
    }
  } else {
    return selectEl.name;
  }
}

export const setupAccessibleAutoComplete = (component, libraryOptions = {}, EngineClass = AccessibleAutocompleteEngine) => {
  const selectEl = component.querySelector('select')

  if (!selectEl) {
    console.warn('[dfe-autocomplete] No <select> found inside element. The native select will remain usable.')
    return null
  }

  const debug = component.getAttribute('data-debug') === 'true'
  const log = createLogger(debug)
  const emitter = new EventEmitter()

  const selectOptions = Array.from(selectEl.options)
  const options = selectOptions.map(o => enhanceOption(o))
  const formGroup = component.querySelector('div.govuk-form-group')
  const inError = formGroup ? formGroup.className.includes('error') : false
  const inputValue = defaultValueOption(component)
  const tracker = libraryOptions.tracker || nullTracker
  const maxResults = libraryOptions.maxResults || Infinity
  const plugins = [...getGlobalPlugins(), ...(libraryOptions.plugins || [])]

  // Build sort function: custom sort > search index > custom internal functions > default
  let sortFn
  if (libraryOptions.sort) {
    sortFn = libraryOptions.sort
  } else if (libraryOptions.useSearchIndex) {
    const indexedSort = createIndexedSort(options, {
      clean: libraryOptions.clean,
      removeStopWords: libraryOptions.stopWords ? createRemoveStopWords(libraryOptions.stopWords) : undefined,
      calculateWeight: libraryOptions.calculateWeight
    })
    sortFn = (query, _options) => indexedSort(query)
  } else if (libraryOptions.stopWords || libraryOptions.calculateWeight || libraryOptions.clean) {
    sortFn = createSort({
      clean: libraryOptions.clean,
      removeStopWords: libraryOptions.stopWords ? createRemoveStopWords(libraryOptions.stopWords) : undefined,
      calculateWeight: libraryOptions.calculateWeight
    })
  } else {
    sortFn = defaultSort
  }
  const doHighlight = libraryOptions.highlightMatches || false
  let currentQuery = ''
  const customSource = libraryOptions.source
  // Track async results for suggestion template when using custom source
  let asyncOptions = options

  // Build the source callback
  let sourceCallback
  if (typeof customSource === 'function') {
    // Async function mode
    let debounceTimer
    const debounceMs = customSource.debounce || 0
    sourceCallback = (query, populateResults) => {
      currentQuery = query
      if (!/\S/.test(query)) return
      clearTimeout(debounceTimer)
      const run = async () => {
        tracker.trackSearch(query)
        emitter.emit('loading', { loading: true })
        try {
          const results = await customSource(query)
          const limited = results.slice(0, maxResults)
          asyncOptions = limited.map(r => (typeof r === 'string' ? { name: r, text: r } : r))
          log.log('Search:', query, '\u2192', limited.length, 'results')
          emitter.emit('search', { query, results: limited })
          plugins.forEach(p => p.onSearch?.({ query, results: limited }))
          emitter.emit('loading', { loading: false })
          populateResults(limited.map(r => (typeof r === 'string' ? r : r.name)))
        } catch (error) {
          log.error('Search failed:', error)
          emitter.emit('loading', { loading: false })
          emitter.emit('error', { error })
          populateResults([])
        }
      }
      if (debounceMs > 0) {
        debounceTimer = setTimeout(run, debounceMs)
      } else {
        run()
      }
    }
  } else if (customSource && typeof customSource === 'object' && customSource.url) {
    // Declarative URL mode
    const { url, queryParam = 'q', debounce: debounceMs = 300, transform } = customSource
    const fetchSource = async (query) => {
      const res = await fetch(`${url}?${queryParam}=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return transform ? transform(data) : data
    }
    fetchSource.debounce = debounceMs
    // Reuse function mode with the fetch wrapper
    let debounceTimer
    sourceCallback = (query, populateResults) => {
      currentQuery = query
      if (!/\S/.test(query)) return
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(async () => {
        tracker.trackSearch(query)
        emitter.emit('loading', { loading: true })
        try {
          const results = await fetchSource(query)
          const limited = results.slice(0, maxResults)
          asyncOptions = limited.map(r => (typeof r === 'string' ? { name: r, text: r } : r))
          log.log('Search:', query, '\u2192', limited.length, 'results')
          emitter.emit('search', { query, results: limited })
          plugins.forEach(p => p.onSearch?.({ query, results: limited }))
          emitter.emit('loading', { loading: false })
          populateResults(limited.map(r => (typeof r === 'string' ? r : r.name)))
        } catch (error) {
          log.error('Search failed:', error)
          emitter.emit('loading', { loading: false })
          emitter.emit('error', { error })
          populateResults([])
        }
      }, debounceMs)
    }
  } else {
    // Default: synchronous local sort
    sourceCallback = (query, populateResults) => {
      currentQuery = query
      if (/\S/.test(query)) {
        tracker.trackSearch(query)
        const results = sortFn(query, options).slice(0, maxResults)
        log.log('Search:', query, '\u2192', results.length, 'results')
        emitter.emit('search', { query, results })
        plugins.forEach(p => p.onSearch?.({ query, results }))
        populateResults(results)
      }
    }
  }

  const defaultOptions = {
    autoselect: true,
    defaultValue: inError ? '' : inputValue,
    minLength: 1,
    rawAttribute: false,
    showAllValues: libraryOptions.showAllOnFocus || false,
    selectElement: selectEl,
    trackerObject: tracker,
    onConfirm: (val) => {
      log.log('Selected:', val)
      emitter.emit('select', { value: val })
      plugins.forEach(p => p.onSelect?.({ value: val }))
      tracker.sendTrackingEvent(val, selectEl.name)
      const selectedOption = [].filter.call(selectOptions, option => (option.textContent || option.innerText) === val)[0]
      if (selectedOption) selectedOption.selected = true
    },
    source: sourceCallback,
    templates: {
      suggestion: (value) => suggestion(value, customSource ? asyncOptions : options, { highlightMatches: doHighlight, currentQuery })
    }
  }

  // Merge options but don't let libraryOptions.source overwrite our built callback
  const { source: _source, plugins: _plugins, ...restLibraryOptions } = libraryOptions
  const autocompleteOptions = Object.assign({}, defaultOptions, restLibraryOptions)
  autocompleteOptions.name = generateAutocompleteName(selectEl, autocompleteOptions)

  const engine = new EngineClass(component, autocompleteOptions)
  engine.initialize()

  log.log('Initialized on', selectEl.name, 'with', options.length, 'options')
  plugins.forEach(p => p.onInitialize?.({ element: component, options }))

  if (inError) {
    engine.setValue(inputValue)
  }

  const instance = {
    on: (event, cb) => emitter.on(event, cb),
    off: (event, cb) => emitter.off(event, cb),
    getValue: () => engine.getValue(),
    setValue: (value) => engine.setValue(value),
    destroy () {
      emitter.emit('destroy')
      plugins.forEach(p => p.onDestroy?.())
      engine.destroy()
      instances.delete(component)
    }
  }

  instances.set(component, instance)
  return instance
}
