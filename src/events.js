export class EventEmitter {
  constructor () {
    this.listeners = {}
  }

  on (event, callback) {
    (this.listeners[event] ||= []).push(callback)
    return () => this.off(event, callback)
  }

  off (event, callback) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(fn => fn !== callback)
    if (this.listeners[event].length === 0) delete this.listeners[event]
  }

  emit (event, data) {
    const handlers = this.listeners[event]
    if (!handlers) return
    for (const handler of handlers) {
      try {
        handler(data)
      } catch (error) {
        console.error(`[dfe-autocomplete] Error in "${event}" listener:`, error)
      }
    }
  }

  eventNames () {
    return Object.keys(this.listeners).filter(event => this.listeners[event]?.length > 0)
  }

  listenerCount (event) {
    return this.listeners[event]?.length || 0
  }
}
