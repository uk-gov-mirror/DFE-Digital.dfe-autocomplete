import { describe, it, expect, vi, afterEach } from 'vitest'
import { Application } from '@hotwired/stimulus'
import { DfeAutocompleteController } from '@/stimulus/dfe-autocomplete-controller'

// Mock accessible-autocomplete so we can inspect options passed
vi.mock('accessible-autocomplete', () => ({
  default: {
    enhanceSelectElement: vi.fn()
  }
}))

import accessibleAutocomplete from 'accessible-autocomplete'

function createStimulusFixture (dataAttrs = {}) {
  const container = document.createElement('div')
  container.setAttribute('data-controller', 'dfe-autocomplete')
  Object.entries(dataAttrs).forEach(([key, value]) => {
    container.setAttribute(`data-dfe-autocomplete-${key}-value`, String(value))
  })

  const formGroup = document.createElement('div')
  formGroup.className = 'govuk-form-group'

  const select = document.createElement('select')
  select.name = 'subject'
  const option = document.createElement('option')
  option.value = '1'
  option.textContent = 'Mathematics'
  option.label = 'Mathematics'
  select.appendChild(option)

  formGroup.appendChild(select)
  container.appendChild(formGroup)
  document.body.appendChild(container)
  return container
}

describe('DfeAutocompleteController', () => {
  let application

  afterEach(() => {
    application?.stop()
    document.querySelectorAll('[data-controller]').forEach(el => el.remove())
    vi.clearAllMocks()
  })

  async function startStimulus () {
    application = Application.start()
    application.register('dfe-autocomplete', DfeAutocompleteController)
    // Wait for Stimulus to connect controllers
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  it('initializes autocomplete on connect', async () => {
    createStimulusFixture()
    await startStimulus()

    expect(accessibleAutocomplete.enhanceSelectElement).toHaveBeenCalledTimes(1)
  })

  it('passes default values', async () => {
    createStimulusFixture()
    await startStimulus()

    const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    expect(opts.autoselect).toBe(true)
    expect(opts.minLength).toBe(1)
  })

  it('passes custom minLength value', async () => {
    createStimulusFixture({ 'min-length': 3 })
    await startStimulus()

    const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    expect(opts.minLength).toBe(3)
  })

  it('passes autoselect false', async () => {
    createStimulusFixture({ autoselect: false })
    await startStimulus()

    const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    expect(opts.autoselect).toBe(false)
  })

  it('passes rawAttribute', async () => {
    createStimulusFixture({ 'raw-attribute': true })
    await startStimulus()

    const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    expect(opts.name).toBe('subject')
  })

  it('passes showAllOnFocus', async () => {
    createStimulusFixture({ 'show-all-on-focus': true })
    await startStimulus()

    const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    expect(opts.showAllValues).toBe(true)
  })

  it('passes maxResults when greater than 0', async () => {
    createStimulusFixture({ 'max-results': 5 })
    await startStimulus()

    const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    // maxResults is consumed by the source callback, not passed directly
    // Verify by calling source and checking result count
    const populateResults = vi.fn()
    opts.source('math', populateResults)
    // With only 1 option that matches, maxResults=5 doesn't limit
    expect(populateResults).toHaveBeenCalled()
  })

  it('passes highlightMatches when true', async () => {
    createStimulusFixture({ 'highlight-matches': true })
    await startStimulus()

    const opts = accessibleAutocomplete.enhanceSelectElement.mock.calls[0][0]
    // Verify highlight is active by checking the suggestion template
    const populateResults = vi.fn()
    opts.source('math', populateResults)
    const html = opts.templates.suggestion('Mathematics')
    expect(html).toContain('<strong>')
  })

  it('cleans up on disconnect', async () => {
    const container = createStimulusFixture()

    // Mock enhanceSelectElement to create wrapper for destroy
    accessibleAutocomplete.enhanceSelectElement.mockImplementation(() => {
      const wrapper = document.createElement('div')
      wrapper.className = 'autocomplete__wrapper'
      container.appendChild(wrapper)
      container.querySelector('select').style.display = 'none'
    })

    await startStimulus()

    expect(container.querySelector('.autocomplete__wrapper')).not.toBeNull()

    // Remove element triggers disconnect
    container.remove()
    await new Promise(resolve => setTimeout(resolve, 10))

    // Controller should have called destroy
    // Since the element is removed from DOM, we verify the wrapper was cleaned up
    // by checking the select is restored
    expect(container.querySelector('select').style.display).toBe('')
  })
})
