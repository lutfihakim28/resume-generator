import { useToast } from '@nuxt/ui/composables'
import { useResumeStore } from '@/composables/useResumeStore'

/** Shared "removed" confirmation for the form's add/remove patterns. */
export function useRemoveNotify() {
  const toast = useToast()
  const store = useResumeStore()
  return {
    removed(item: string): void {
      const isId = store.activeLang === 'id'
      toast.add({ title: isId ? `${item} dihapus` : `${item} removed`, color: 'neutral' })
    },
  }
}
