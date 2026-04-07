import { Controller } from '@hotwired/stimulus'
import { setupAccessibleAutoComplete } from '../dfe-autocomplete'
import { AccessibleAutocompleteEngine } from '../engines/accessible-autocomplete'

export class DfeAutocompleteController extends Controller {
  static values = {
    minLength: { type: Number, default: 1 },
    autoselect: { type: Boolean, default: true },
    rawAttribute: { type: Boolean, default: false },
    showAllOnFocus: { type: Boolean, default: false },
    maxResults: { type: Number, default: 0 },
    highlightMatches: { type: Boolean, default: false }
  }

  connect () {
    const options = {
      minLength: this.minLengthValue,
      autoselect: this.autoselectValue,
      rawAttribute: this.rawAttributeValue,
      showAllOnFocus: this.showAllOnFocusValue
    }
    if (this.maxResultsValue > 0) options.maxResults = this.maxResultsValue
    if (this.highlightMatchesValue) options.highlightMatches = true

    this.instance = setupAccessibleAutoComplete(this.element, options, AccessibleAutocompleteEngine)
  }

  disconnect () {
    this.instance?.destroy()
  }
}
