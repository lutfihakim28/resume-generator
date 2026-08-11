import { useToast } from '@nuxt/ui/composables'
import { useResumeStore } from '@/composables/useResumeStore'

/** Map the store's distinct save-error strings to a single actionable toast title. */
function saveErrorTitle(message: string): string {
  switch (message) {
    case 'Storage quota exceeded':
      return 'Save failed: browser storage is full.'
    case 'Storage unavailable':
      return 'Save failed: browser storage is not available.'
    default:
      return 'Save failed.'
  }
}

/**
 * Shared "save the current resume to this browser" action. One source of
 * truth for the toolbar button and the Ctrl+S hotkey — both paths run the
 * same store call and produce the same toasts, so they cannot drift.
 */
export function useSaveToBrowser() {
  const store = useResumeStore()
  const toast = useToast()
  return {
    saveToBrowser(): void {
      const result = store.saveToLocalStorage()
      if (result.ok) {
        toast.add({ title: 'Resume saved to this browser.', color: 'success' })
      } else {
        toast.add({ title: saveErrorTitle(result.errors[0] ?? ''), color: 'error' })
      }
    },
  }
}
