export class BaseEngine {
  constructor (element, options) {
    this.element = element
    this.options = options
  }

  initialize () { throw new Error('Not implemented') }
  destroy () { throw new Error('Not implemented') }
  getValue () { throw new Error('Not implemented') }
  setValue (value) { throw new Error('Not implemented') }
}
