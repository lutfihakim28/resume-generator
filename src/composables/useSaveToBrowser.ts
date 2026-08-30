import { useToast } from '@nuxt/ui/composables'
import { useResumeStore } from '@/composables/useResumeStore'

/** Map the store's distinct save-error strings to a single actionable toast title. */
function saveErrorTitle(message: string, lang: string): string {
  const isId = lang === 'id'
  switch (message) {
    case 'Storage quota exceeded':
      return isId ? 'Gagal menyimpan: penyimpanan browser penuh.' : 'Save failed: browser storage is full.'
    case 'Storage unavailable':
      return isId ? 'Gagal menyimpan: penyimpanan browser tidak tersedia.' : 'Save failed: browser storage is not available.'
    default:
      return isId ? 'Gagal menyimpan.' : 'Save failed.'
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
      const isId = store.activeLang === 'id'
      if (result.ok) {
        toast.add({
          title: isId ? 'Resume disimpan ke browser ini.' : 'Resume saved to this browser.',
          color: 'success',
        })
      } else {
        toast.add({ title: saveErrorTitle(result.errors[0] ?? '', store.activeLang), color: 'error' })
      }
    },
  }
}
