export function enhanceOption (option) {
  const synonymsAttr = option.getAttribute('data-synonyms')
  return {
    name: option.label,
    synonyms: synonymsAttr ? synonymsAttr.split('|') : [],
    append: option.getAttribute('data-append'),
    hint: option.getAttribute('data-hint'),
    boost: parseFloat(option.getAttribute('data-boost')) || 1,
    text: option.textContent || ''
  }
}

export function getDefaultValue (component) {
  return component.getAttribute('data-default-value') || ''
}

// Generates the correct name for the autocomplete input field.
//
// Priority:
// 1. Explicit name option: libraryOptions.name = 'custom' → 'custom'
// 2. Bracketed select name with rawAttribute: 'course[subject]' → 'course[subject_raw]'
// 3. Bracketed select name without rawAttribute: 'course[subject]' → 'course[subject]'
// 4. Simple select name: 'subject' → 'subject'
export function generateFieldName (selectEl, libraryOptions) {
  if (libraryOptions.name) return libraryOptions.name

  const matches = /^(?<prefix>\w+)\[(?<key>\w+)\]$/.exec(selectEl.name)
  if (!matches) return selectEl.name

  const { prefix, key } = matches.groups
  return libraryOptions.rawAttribute
    ? `${prefix}[${key}_raw]`
    : `${prefix}[${key}]`
}
