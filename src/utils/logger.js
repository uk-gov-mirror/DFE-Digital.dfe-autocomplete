// warn and error always go through — they signal real problems (bad config,
// failed requests) that the consumer needs to see even with debug disabled.
// Only `log` (verbose tracing) is gated by the debug flag.
const warn = (...args) => console.warn('[dfe-autocomplete]', ...args)
const error = (...args) => console.error('[dfe-autocomplete]', ...args)

function createLogger (enabled) {
  return {
    log: enabled ? (...args) => console.log('[dfe-autocomplete]', ...args) : () => {},
    warn,
    error
  }
}

export { createLogger }
