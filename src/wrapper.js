import { setupAccessibleAutoComplete } from './dfe-autocomplete'
import { AccessibleAutocompleteEngine } from './engines/accessible-autocomplete'

let CurrentEngine = AccessibleAutocompleteEngine

export function setEngine (EngineClass) { CurrentEngine = EngineClass }
export function getEngine () { return CurrentEngine }

function dfeAutocomplete (libraryOptions = {}) {
  const $allAutocompleteElements = document.querySelectorAll('[data-module="app-dfe-autocomplete"]')

  $allAutocompleteElements.forEach((element) => {
    try {
      setupAccessibleAutoComplete(element, libraryOptions, CurrentEngine)
    } catch (error) {
      console.error('[dfe-autocomplete] Failed to initialize:', error)
    }
  })
}

export function dfeAutocompleteField (element, options = {}) {
  return setupAccessibleAutoComplete(element, options, CurrentEngine)
}

export { AccessibleAutocompleteEngine }
export { BaseEngine } from './engines/base'
export default dfeAutocomplete
