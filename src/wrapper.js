import { setupAccessibleAutoComplete } from './dfe-autocomplete'

function dfeAutocomplete(libraryOptions = {}) {
  const $allAutocompleteElements = document.querySelectorAll('[data-module="app-dfe-autocomplete"]')

  $allAutocompleteElements.forEach((element) => {
    try {
      setupAccessibleAutoComplete(element, libraryOptions)
    } catch (error) {
      console.error('[dfe-autocomplete] Failed to initialize:', error)
    }
  });
}

export { setupAccessibleAutoComplete as dfeAutocompleteField }
export default dfeAutocomplete
