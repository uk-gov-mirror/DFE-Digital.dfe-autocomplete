const DEFAULT_DEBOUNCE_MS = 300
const DEFAULT_QUERY_PARAM = 'q'

function normalizeResults (raw) {
  return raw.map(r => (typeof r === 'string' ? { name: r, text: r } : r))
}

function createAsyncHandler (fetchFn, debounceMs, { tracker, log, emitter, plugins, maxResults, setQuery, setAsyncOptions }) {
  let debounceTimer

  return (query, populateResults) => {
    setQuery(query)
    if (!/\S/.test(query)) return

    clearTimeout(debounceTimer)

    const execute = async () => {
      tracker.trackSearch(query)
      emitter.emit('loading', { loading: true })
      try {
        const raw = await fetchFn(query)
        const limited = raw.slice(0, maxResults)
        const results = normalizeResults(limited)
        setAsyncOptions(results)

        log.log('Search:', query, '→', results.length, 'results')
        emitter.emit('search', { query, results })
        plugins.forEach(p => p.onSearch?.({ query, results }))
        emitter.emit('loading', { loading: false })
        populateResults(results)
      } catch (error) {
        log.error('Search failed:', error)
        emitter.emit('loading', { loading: false })
        emitter.emit('error', { error })
        populateResults([])
      }
    }

    if (debounceMs > 0) {
      debounceTimer = setTimeout(execute, debounceMs)
    } else {
      execute()
    }
  }
}

function createLocalSource (sortFn, options, { tracker, log, emitter, plugins, maxResults, setQuery }) {
  return (query, populateResults) => {
    setQuery(query)
    if (!/\S/.test(query)) return

    tracker.trackSearch(query)
    const results = sortFn(query, options).slice(0, maxResults)
    log.log('Search:', query, '→', results.length, 'results')
    emitter.emit('search', { query, results })
    plugins.forEach(p => p.onSearch?.({ query, results }))
    populateResults(results)
  }
}

export function buildSource (libraryOptions, context) {
  const customSource = libraryOptions.source

  if (customSource && typeof customSource === 'function') {
    return createAsyncHandler(customSource, customSource.debounce || 0, context)
  }

  if (Array.isArray(customSource)) {
    const arrayOptions = normalizeResults(customSource)
    context.setAsyncOptions(arrayOptions)
    return createLocalSource(context.sortFn, arrayOptions, context)
  }

  if (customSource && typeof customSource === 'object' && customSource.url) {
    const { url, queryParam = DEFAULT_QUERY_PARAM, debounce = DEFAULT_DEBOUNCE_MS, transform } = customSource
    const fetchFn = async (query) => {
      const res = await fetch(`${url}?${queryParam}=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return transform ? transform(data) : data
    }
    return createAsyncHandler(fetchFn, debounce, context)
  }

  return createLocalSource(context.sortFn, context.options, context)
}
