import accessibleAutocomplete from 'accessible-autocomplete'
import { BaseEngine } from './base'

class AccessibleAutocompleteEngine extends BaseEngine {
  initialize () {
    accessibleAutocomplete.enhanceSelectElement(this.options)
  }

  destroy () {
    const wrapper = this.element.querySelector('.autocomplete__wrapper')
    if (wrapper) wrapper.remove()
    const select = this.options.selectElement
    select.style.display = ''
    if (select.id.endsWith('-select')) {
      select.id = select.id.replace(/-select$/, '')
    }
  }

  getValue () {
    const input = this.element.querySelector('input')
    return input ? input.value : ''
  }

  setValue (value) {
    const input = this.element.querySelector('input')
    if (input) input.value = value
  }
}

export { AccessibleAutocompleteEngine }
