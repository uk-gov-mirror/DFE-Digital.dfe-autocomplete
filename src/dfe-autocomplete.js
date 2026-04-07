import defaultSort, { createSort } from './sort'
import { createRemoveStopWords } from './sort/stop_words'
import { escapeHtml } from './utils/escape'
import { createLogger } from './utils/logger'
import { EventEmitter } from './events'
import { AccessibleAutocompleteEngine } from './engines/accessible-autocomplete'

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

  // Build sort function: custom sort > custom internal functions > default
  let sortFn
  if (libraryOptions.sort) {
    sortFn = libraryOptions.sort
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
      tracker.sendTrackingEvent(val, selectEl.name)
      const selectedOption = [].filter.call(selectOptions, option => (option.textContent || option.innerText) === val)[0]
      if (selectedOption) selectedOption.selected = true
    },
    source: (query, populateResults) => {
      currentQuery = query
      if (/\S/.test(query)) {
        tracker.trackSearch(query)
        const results = sortFn(query, options).slice(0, maxResults)
        log.log('Search:', query, '\u2192', results.length, 'results')
        emitter.emit('search', { query, results })
        populateResults(results)
      }
    },
    templates: {
      suggestion: (value) => suggestion(value, options, { highlightMatches: doHighlight, currentQuery })
    }
  }

  const autocompleteOptions = Object.assign({}, defaultOptions, libraryOptions)
  autocompleteOptions.name = generateAutocompleteName(selectEl, libraryOptions)

  const engine = new EngineClass(component, autocompleteOptions)
  engine.initialize()

  log.log('Initialized on', selectEl.name, 'with', options.length, 'options')

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
      engine.destroy()
      instances.delete(component)
    }
  }

  instances.set(component, instance)
  return instance
}
