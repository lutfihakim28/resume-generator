import { beforeEach, describe, expect, it } from 'vitest'

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useResumeStore } from '@/composables/useResumeStore'
import ResumeFormPanel from '../components/resume-form/ResumeFormPanel.vue'

/**
 * Note: the nuxt/ui vite plugin rewrites `<U*>` tags into script-setup imports
 * during vitest transform, so VTU `global.stubs` cannot intercept them — tests
 * run against the REAL nuxt/ui components in jsdom (they render and emit
 * `update:modelValue` correctly). Only `FormNav` (a local file component) is
 * stubbed to keep IntersectionObserver/scroll logic out of jsdom.
 */
const stubs = {
  FormNav: defineComponent({ name: 'FormNav', template: '<nav data-testid="form-nav" />' }),
}

function mountPanel() {
  return mount(ResumeFormPanel, { global: { stubs } })
}

describe('ResumeFormPanel', () => {
  beforeEach(() => {
    useResumeStore().resetStore()
  })

  it('renders the language toggle and all form sections', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="lang-toggle"]').exists()).toBe(true)
    expect(wrapper.find('#section-personal').exists()).toBe(true)
    expect(wrapper.find('#section-summary').exists()).toBe(true)
    expect(wrapper.find('#section-skills').exists()).toBe(true)
    expect(wrapper.find('#section-experience').exists()).toBe(true)
    expect(wrapper.find('#section-projects').exists()).toBe(true)
    expect(wrapper.find('#section-education').exists()).toBe(true)
    expect(wrapper.find('#section-certifications').exists()).toBe(true)
    expect(wrapper.find('#section-languages').exists()).toBe(true)
    expect(wrapper.find('#section-options').exists()).toBe(true)
  })

  it('typing in a field updates the store state', async () => {
    const wrapper = mountPanel()
    const store = useResumeStore()
    await wrapper.find('[data-testid="input-name"]').setValue('Budi Santoso')
    expect(store.resume.personal.name).toBe('Budi Santoso')
  })

  it('EN/ID toggle binds the correct language variant', async () => {
    const wrapper = mountPanel()
    const store = useResumeStore()

    // Active variant is 'en' by default.
    await wrapper.find('[data-testid="input-title"]').setValue('Backend Engineer')
    expect(store.resume.personal.title.en).toBe('Backend Engineer')
    expect(store.resume.personal.title.id).toBe('')

    // Real UTabs renders one tab per item with role="tab"; reka-ui selects on mousedown.
    const idTab = wrapper.findAll('button[role="tab"]').find((tab) => tab.text() === 'ID')
    expect(idTab).toBeDefined()
    await idTab!.trigger('mousedown')
    expect(store.activeLang).toBe('id')

    await wrapper.find('[data-testid="input-title"]').setValue('Backend Engineer (ID)')
    expect(store.resume.personal.title.id).toBe('Backend Engineer (ID)')
    expect(store.resume.personal.title.en).toBe('Backend Engineer')
  })

  it('shows the name-required error for an empty name', () => {
    const wrapper = mountPanel()
    expect(wrapper.text()).toContain('Name is required')
  })

  it('adds and removes an experience entry', async () => {
    const wrapper = mountPanel()
    const store = useResumeStore()

    expect(store.resume.experience).toHaveLength(0)
    await wrapper.find('[data-testid="add-experience"]').trigger('click')
    expect(store.resume.experience).toHaveLength(1)

    await wrapper.find('[data-testid="add-experience"]').trigger('click')
    expect(store.resume.experience).toHaveLength(2)

    const firstRemove = wrapper.findAll('[data-testid="remove-entry"]')[0]!
    await firstRemove.trigger('click')
    expect(store.resume.experience).toHaveLength(1)
  })

  it('adds and removes bullets within an experience entry', async () => {
    const wrapper = mountPanel()
    const store = useResumeStore()

    await wrapper.find('[data-testid="add-experience"]').trigger('click')
    const entry = store.resume.experience[0]!
    expect(entry.bullets).toHaveLength(1)

    await wrapper.find('[data-testid="add-bullet"]').trigger('click')
    expect(entry.bullets).toHaveLength(2)

    await wrapper.find('[data-testid="input-bullet-0"]').setValue('Led migration to microservices')
    expect(entry.bullets[0]!.en).toBe('Led migration to microservices')

    await wrapper.find('[data-testid="remove-bullet-0"]').trigger('click')
    expect(entry.bullets).toHaveLength(1)
  })

  it('ID-incomplete alert counts and clears with ID fields', async () => {
    const wrapper = mountPanel()
    const store = useResumeStore()

    // Fresh resume: title.id and summary.id are both empty → 2 incomplete ID fields.
    const alert = wrapper.find('[data-testid="incomplete-alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('2 ID field(s) still empty')

    // EN-only input does not reduce the count.
    await wrapper.find('[data-testid="input-summary"]').setValue('Summary EN only')
    expect(wrapper.find('[data-testid="incomplete-alert"]').text()).toContain(
      '2 ID field(s) still empty',
    )

    // Filling both ID variants clears the alert.
    store.resume.personal.title.id = 'Backend Engineer'
    store.resume.summary.id = 'Ringkasan'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="incomplete-alert"]').exists()).toBe(false)
  })

  it('contact warning appears when phone and email are both empty', async () => {
    const wrapper = mountPanel()
    const store = useResumeStore()

    expect(wrapper.find('[data-testid="contact-alert"]').exists()).toBe(true)

    store.resume.personal.email = 'budi@email.com'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="contact-alert"]').exists()).toBe(false)
  })
})
