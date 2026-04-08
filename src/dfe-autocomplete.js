import defaultSort, { createSort } from './sort'
import { createRemoveStopWords } from './sort/stop_words'
import { createIndexedSort } from './sort/search-index'
import { createLogger } from './utils/logger'
import { enhanceOption, getDefaultValue, generateFieldName } from './utils/options'
import { EventEmitter } from './events'
import { AccessibleAutocompleteEngine } from './engines/accessible-autocomplete'
import { getGlobalPlugins } from './plugins'
import { createSuggestionRenderer } from './templates'
import { buildSource } from './source'

const instances = new WeakMap()

const AUTOCOMPLETE_EVENTS = ['search', 'select', 'loading', 'error', 'destroy']

function assertKnownEvent (event) {
  if (!AUTOCOMPLETE_EVENTS.includes(event)) {
    throw new Error(`[dfe-autocomplete] Unknown event "${event}". Valid events: ${AUTOCOMPLETE_EVENTS.join(', ')}`)
  }
}

const nullTracker = {
  sendTrackingEvent () {},
  trackSearch () {}
}

function buildSortFunction (options, libraryOptions) {
  if (libraryOptions.sort) return libraryOptions.sort

  const hasCustomInternals = libraryOptions.stopWords || libraryOptions.calculateWeight || libraryOptions.clean
  if (!hasCustomInternals && !libraryOptions.useSearchIndex) return defaultSort

  const customConfig = {
    clean: libraryOptions.clean,
    removeStopWords: libraryOptions.stopWords ? createRemoveStopWords(libraryOptions.stopWords) : undefined,
    calculateWeight: libraryOptions.calculateWeight
  }

  if (libraryOptions.useSearchIndex) {
    return createIndexedSort(options, customConfig)
  }

  return createSort(customConfig)
}

export const setupAccessibleAutoComplete = (component, libraryOptions = {}, EngineClass = AccessibleAutocompleteEngine) => {
  const debug = component.getAttribute('data-debug') === 'true'
  const log = createLogger(debug)
  const selectEl = component.querySelector('select')
  if (!selectEl) {
    log.warn('No <select> found inside element. The native select will remain usable.')
    return null
  }

  const emitter = new EventEmitter()
  const plugins = [...getGlobalPlugins(), ...(libraryOptions.plugins || [])]

  const selectOptions = [...selectEl.options]
  const options = selectOptions.map(enhanceOption)
  const formGroup = component.querySelector('div.govuk-form-group')
  const inError = formGroup ? formGroup.className.includes('error') : false
  const inputValue = getDefaultValue(component)
  const tracker = libraryOptions.tracker || nullTracker
  const maxResults = libraryOptions.maxResults || Infinity
  const sortFn = buildSortFunction(options, libraryOptions)

  let currentQuery = ''
  let asyncOptions = options

  const sourceCallback = buildSource(libraryOptions, {
    sortFn,
    options,
    tracker,
    log,
    emitter,
    plugins,
    maxResults,
    setQuery: (q) => { currentQuery = q },
    setAsyncOptions: (opts) => { asyncOptions = opts }
  })

  const getTemplateOptions = libraryOptions.source
    ? () => asyncOptions
    : () => options

  const suggestionRenderer = createSuggestionRenderer(getTemplateOptions, {
    highlightMatches: libraryOptions.highlightMatches || false,
    getCurrentQuery: () => currentQuery
  })

  // Exclude options consumed by dfe-autocomplete so they don't leak to the engine
  const { source, plugins: instancePlugins, ...restLibraryOptions } = libraryOptions
  const autocompleteOptions = Object.assign({
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
      const selectedOption = selectOptions.find(o => (o.textContent || o.innerText) === val)
      if (selectedOption) selectedOption.selected = true
    },
    source: sourceCallback,
    templates: { suggestion: suggestionRenderer }
  }, restLibraryOptions)

  autocompleteOptions.name = generateFieldName(selectEl, autocompleteOptions)

  const engine = new EngineClass(component, autocompleteOptions)
  engine.initialize()

  log.log('Initialized on', selectEl.name, 'with', options.length, 'options')
  plugins.forEach(p => p.onInitialize?.({ element: component, options }))

  if (inError) engine.setValue(inputValue)

  const instance = {
    on: (event, cb) => {
      assertKnownEvent(event)
      return emitter.on(event, cb)
    },
    off: (event, cb) => {
      assertKnownEvent(event)
      emitter.off(event, cb)
    },
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
