## v1.0.0

### Security
* Fix XSS vulnerability in suggestion template — `value`, `data-append`, and `data-hint` are now HTML-escaped

### Bug fixes
* Fix duplicate option names showing wrong hint/append — sort returns option objects instead of strings
* Fix upstream options (`confirmOnBlur`, `displayMenu`, etc.) not passing through to accessible-autocomplete
* Guard against missing `<select>` and missing `.govuk-form-group` elements
* One broken autocomplete no longer prevents others from initializing

### New features
* **Events**: `instance.on('search' | 'select' | 'destroy' | 'loading' | 'error', callback)`
* **Instance methods**: `instance.getValue()`, `instance.setValue(value)`, `instance.destroy()`
* **Behaviour options**: `maxResults`, `showAllOnFocus`, `highlightMatches`
* **Replaceable functions**: `sort`, `stopWords`, `calculateWeight`, `clean` via options
* **Async/remote data source**: function mode and declarative URL mode with debounce
* **Plugin system**: lifecycle hooks (`onInitialize`, `onSearch`, `onSelect`, `onDestroy`), global and per-instance
* **Search index**: inverted index for O(1) candidate lookup on large datasets via `useSearchIndex: true`
* **Engine abstraction**: `BaseEngine` / `AccessibleAutocompleteEngine` with `setEngine()` / `getEngine()`
* **Stimulus controller**: `DfeAutocompleteController` for Hotwire/Turbo apps
* **Debug mode**: `data-debug="true"` for console logging
* **CSS custom properties**: `--dfe-autocomplete-border-color`, `--dfe-autocomplete-menu-max-height`, `--dfe-autocomplete-menu-shadow`

### Internal
* 255 tests across 23 files (unit, integration, contract, security)
* Decomposed into 18 focused source modules
* Named weight constants, shared option cleansing, regex-safe stop words

## v0.2.0

* Updates the target version of node to the latest LTS version
* Updates accessible-autocomplete and the devDependencies to their latest versions
* replaces uglifyjs-webpack-plugin (which is no longer maintained) with terser-webpack-plugin
* replaces @babel/plugin-proposal-class-properties with its replacement @babel/plugin-transform-class-properties
* removes node-sass (the repo already has sass so I don't think this is needed)
* removes csso-cli (couldn't find any uses of this or documentation)
* removes webpack-dev-server (couldn't find any uses of this or documentation)
* Expose individual setup of specific elements (example via Stimulus):
    ```
    import { Controller } from '@hotwired/stimulus'
    import { dfeAutocompleteField } from 'dfe-autocomplete';

     export default class extends Controller {
       connect() {
         dfeAutocompleteField(this.element, {
           minLength: 2,
         })
       }
    }
    ```
* Fix name accessible autocomplete overwrite: Now you pass name: as option to the autocomplete
and will work as expected.

## v0.1.0

* First release of the rubygem and the npm package
