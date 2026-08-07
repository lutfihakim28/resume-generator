import { beforeEach, describe, expect, it } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import App from '../App.vue'

/**
 * The nuxt/ui vite plugin rewrites `<U*>` tags into script-setup imports
 * during vitest transform, so VTU `global.stubs` cannot intercept them — the
 * real nuxt/ui components run in jsdom (see resume-form.spec.ts). Only UApp is
 * stubbed to skip the provider layer.
 */
function mountApp() {
  return mount(App, {
    global: {
      stubs: {
        UApp: { template: '<div><slot /></div>' },
      },
    },
  })
}

describe('App', () => {
  beforeEach(() => {
    useResumeStore().resetStore()
  })

  it('mounts renders properly', () => {
    const wrapper = mountApp()
    expect(wrapper.exists()).toBe(true)
  })

  it('keeps the side-by-side grid for desktop and tabs for mobile', () => {
    const wrapper = mountApp()

    // Desktop branch (shown at lg+) still holds the form + preview grid.
    const desktop = wrapper.find('[data-testid="desktop-layout"]')
    expect(desktop.exists()).toBe(true)
    expect(desktop.find('[data-testid="preview-panel"]').exists()).toBe(true)

    // Mobile branch (shown below lg) holds a Form/Review tab pair. The list
    // scoping keeps out the form's own UTabs (EN/ID, education level).
    const tabs = wrapper.find('[data-testid="mobile-tabs"]')
    expect(tabs.exists()).toBe(true)
    const tabList = tabs.find('[data-slot="list"]')
    const tabButtons = tabList.findAll('button[role="tab"]')
    expect(tabButtons.map((tab) => tab.text())).toEqual(['Form', 'Review'])

    // Both panels are mounted from the start (state survives tab switches);
    // the Form panel is the active one.
    const tabpanels = tabs.findAll('[role="tabpanel"]')
    expect(tabpanels).toHaveLength(2)
    const formPanel = tabpanels[0]!
    const reviewPanel = tabpanels[1]!
    expect(formPanel.attributes('hidden')).toBeUndefined()
    expect(reviewPanel.attributes('hidden')).toBeDefined()
    expect(formPanel.find('[data-testid="input-name"]').exists()).toBe(true)
    expect(reviewPanel.find('[data-testid="preview-panel"]').exists()).toBe(true)

    // On mobile the section navigation lives in a popup bar (the sidebar nav
    // is hidden below lg), so it never squeezes the form width.
    expect(formPanel.find('[data-testid="mobile-sections-bar"]').exists()).toBe(true)
    expect(formPanel.find('[data-testid="sections-toggle"]').exists()).toBe(true)
  })

  it('switches between the Form and Review tabs without losing state', async () => {
    const wrapper = mountApp()
    const tabs = wrapper.find('[data-testid="mobile-tabs"]')
    const tabList = tabs.find('[data-slot="list"]')
    const tabButtons = tabList.findAll('button[role="tab"]')
    const tabpanels = tabs.findAll('[role="tabpanel"]')
    const formTab = tabButtons[0]!
    const reviewTab = tabButtons[1]!
    const formPanel = tabpanels[0]!
    const reviewPanel = tabpanels[1]!
    const nameInput = () => formPanel.find('[data-testid="input-name"]').element as HTMLInputElement

    // Type into the form (store-backed), then move to the Review tab.
    await formPanel.find('[data-testid="input-name"]').setValue('Budi Santoso')
    await reviewTab.trigger('mousedown')
    await flushPromises()
    await nextTick()

    // Review is now visible; the form panel stays mounted but hidden.
    expect(reviewPanel.attributes('hidden')).toBeUndefined()
    expect(formPanel.attributes('hidden')).toBeDefined()
    expect(nameInput().value).toBe('Budi Santoso')

    // Back to the form: the typed value is still there.
    await formTab.trigger('mousedown')
    await flushPromises()
    await nextTick()
    expect(formPanel.attributes('hidden')).toBeUndefined()
    expect(nameInput().value).toBe('Budi Santoso')
  })
})
