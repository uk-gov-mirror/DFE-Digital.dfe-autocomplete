const noop = { log () {}, warn () {}, error () {} }

export function createLogger (enabled) {
  if (!enabled) return noop
  return {
    log: (...args) => console.log('[dfe-autocomplete]', ...args),
    warn: (...args) => console.warn('[dfe-autocomplete]', ...args),
    error: (...args) => console.error('[dfe-autocomplete]', ...args)
  }
}
