import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { RESUME_STORAGE_KEY, useResumeStore } from '@/composables/useResumeStore'
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

/**
 * Deterministic toast: App (via useSaveToBrowser) calls useToast().add() —
 * assert on the spy instead of the toast DOM (rendering needs the UApp
 * provider). Harmless for the existing App tests, which never toast.
 */
const { toastAddSpy } = vi.hoisted(() => ({
  toastAddSpy: vi.fn<(toast: { title: string; color: string }) => void>(),
}))

vi.mock('@nuxt/ui/composables', () => ({
  useToast: () => ({ add: toastAddSpy }),
}))

describe('App', () => {
  beforeEach(() => {
    useResumeStore().resetStore()
    // restore-on-mount reads localStorage — without a clear, tests become
    // order-dependent on leftover keys from earlier tests.
    localStorage.clear()
  })

  describe('Ctrl+S hotkey', () => {
    let wrapper: ReturnType<typeof mountApp>

    beforeEach(() => {
      toastAddSpy.mockClear()
      localStorage.clear()
      wrapper = mountApp()
    })

    // Mandatory: App registers a window keydown listener in onMounted;
    // without unmounting, the listener leaks into later tests in this file
    // and fires on their dispatches. This suite must unmount before the
    // existing App tests mount (they never unmount and never dispatch keys,
    // so they stay inert afterwards).
    afterEach(() => {
      wrapper.unmount()
    })

    function dispatchHotkey(init: KeyboardEventInit): KeyboardEvent {
      const evt = new KeyboardEvent('keydown', init)
      window.dispatchEvent(evt)
      return evt
    }

    it('saves to localStorage and blocks the browser default on Ctrl+S', () => {
      const store = useResumeStore()
      store.resume.personal.name = 'Budi Santoso'

      const evt = dispatchHotkey({ key: 's', ctrlKey: true, cancelable: true })

      expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBe(store.exportJson())
      expect(toastAddSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Resume saved to this browser.', color: 'success' }),
      )
      expect(evt.defaultPrevented).toBe(true)
    })

    it('saves with Cmd+S (macOS parity)', () => {
      const store = useResumeStore()
      store.resume.personal.name = 'Siti Rahma'

      const evt = dispatchHotkey({ key: 's', metaKey: true, cancelable: true })

      expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBe(store.exportJson())
      expect(toastAddSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Resume saved to this browser.', color: 'success' }),
      )
      expect(evt.defaultPrevented).toBe(true)
    })

    it('does not hijack Ctrl+Shift+S (browser Save As…)', () => {
      const evt = dispatchHotkey({ key: 'S', ctrlKey: true, shiftKey: true, cancelable: true })

      expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull()
      expect(toastAddSpy).not.toHaveBeenCalled()
      expect(evt.defaultPrevented).toBe(false)
    })

    it('does not hijack Ctrl+Alt+S', () => {
      const evt = dispatchHotkey({ key: 's', ctrlKey: true, altKey: true, cancelable: true })

      expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull()
      expect(toastAddSpy).not.toHaveBeenCalled()
      expect(evt.defaultPrevented).toBe(false)
    })

    it('does nothing for a bare S key', () => {
      const evt = dispatchHotkey({ key: 's', cancelable: true })

      expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull()
      expect(toastAddSpy).not.toHaveBeenCalled()
      expect(evt.defaultPrevented).toBe(false)
    })

    it('shows the quota error toast and keeps the store intact when saving fails', () => {
      const store = useResumeStore()
      store.resume.personal.name = 'Budi Santoso'

      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError')
      })
      try {
        dispatchHotkey({ key: 's', ctrlKey: true, cancelable: true })
      } finally {
        spy.mockRestore()
      }

      expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull()
      expect(store.resume.personal.name).toBe('Budi Santoso')
      expect(toastAddSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Save failed: browser storage is full.',
          color: 'error',
        }),
      )
    })

    it('removes the window listener on unmount', () => {
      wrapper.unmount()
      toastAddSpy.mockClear()

      dispatchHotkey({ key: 's', ctrlKey: true, cancelable: true })

      expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull()
      expect(toastAddSpy).not.toHaveBeenCalled()
    })
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

  describe('restore on mount', () => {
    beforeEach(() => {
      toastAddSpy.mockClear()
    })

    it('restores a saved resume from localStorage on first mount', () => {
      localStorage.setItem(
        RESUME_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          personal: { name: 'Seeded Name' },
          skills: [],
          experience: [],
          projects: [],
          education: [],
          certifications: [],
          languages: [],
        }),
      )

      mountApp()

      expect(useResumeStore().resume.personal.name).toBe('Seeded Name')
    })

    it('keeps the blank resume when storage is empty', () => {
      expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull()

      mountApp()

      expect(useResumeStore().resume.personal.name).toBe('')
      expect(useResumeStore().resume.skills).toEqual([])
    })

    it('never shows a toast for a completed restore', () => {
      localStorage.setItem(
        RESUME_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          personal: { name: 'Seeded Name' },
          skills: [],
          experience: [],
          projects: [],
          education: [],
          certifications: [],
          languages: [],
        }),
      )

      mountApp()

      expect(useResumeStore().resume.personal.name).toBe('Seeded Name')
      expect(toastAddSpy).not.toHaveBeenCalled()
    })
  })
})
