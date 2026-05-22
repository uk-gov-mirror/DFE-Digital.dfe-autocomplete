/**
 * Creates an autocomplete fixture matching the expected DOM structure.
 *
 * @param {Object} opts
 * @param {string} opts.selectName - Name attribute for the select element
 * @param {string} opts.defaultValue - data-default-value on the container
 * @param {boolean} opts.hasError - Whether to add error class to form group
 * @param {Array<{value: string, label: string, text?: string, synonyms?: string, append?: string, hint?: string, boost?: string}>} opts.options
 * @returns {HTMLElement} The container element
 */
export function createAutocompleteFixture ({
  selectName = 'course[subject]',
  defaultValue = '',
  hasError = false,
  options = [
    { value: '', label: 'Select a subject' },
    { value: '1', label: 'Mathematics', text: 'Mathematics', synonyms: 'maths|math', boost: '1.5' },
    { value: '2', label: 'English Literature', text: 'English Literature' },
    { value: '3', label: 'Physics', text: 'Physics', append: '(PHY)', hint: 'Science subject' }
  ]
} = {}) {
  const container = document.createElement('div')
  container.setAttribute('data-module', 'app-dfe-autocomplete')
  if (defaultValue) {
    container.setAttribute('data-default-value', defaultValue)
  }

  const formGroup = document.createElement('div')
  formGroup.className = hasError ? 'govuk-form-group govuk-form-group--error' : 'govuk-form-group'

  const select = document.createElement('select')
  select.name = selectName
  select.id = 'subject'

  options.forEach(opt => {
    const option = document.createElement('option')
    option.value = opt.value
    option.textContent = opt.text || opt.label
    option.label = opt.label
    if (opt.synonyms) option.setAttribute('data-synonyms', opt.synonyms)
    if (opt.append) option.setAttribute('data-append', opt.append)
    if (opt.hint) option.setAttribute('data-hint', opt.hint)
    if (opt.boost) option.setAttribute('data-boost', opt.boost)
    select.appendChild(option)
  })

  formGroup.appendChild(select)
  container.appendChild(formGroup)
  document.body.appendChild(container)

  return container
}

/**
 * Removes all autocomplete fixtures from the DOM.
 */
export function cleanupFixtures () {
  document.querySelectorAll('[data-module="app-dfe-autocomplete"]').forEach(el => el.remove())
}
