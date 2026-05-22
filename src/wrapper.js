import { setupAccessibleAutoComplete } from './dfe-autocomplete'
import { AccessibleAutocompleteEngine } from './engines/accessible-autocomplete'
import { BaseEngine } from './engines/base'
import { registerPlugin } from './plugins'

let CurrentEngine = AccessibleAutocompleteEngine

function setEngine (EngineClass) { CurrentEngine = EngineClass }
function getEngine () { return CurrentEngine }

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

function dfeAutocompleteField (element, options = {}) {
  return setupAccessibleAutoComplete(element, options, CurrentEngine)
}

dfeAutocomplete.use = (plugin) => registerPlugin(plugin)

export { setEngine, getEngine, dfeAutocompleteField, AccessibleAutocompleteEngine, BaseEngine }
export default dfeAutocomplete
