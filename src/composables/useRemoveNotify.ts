import { useToast } from '@nuxt/ui/composables'

/** Shared "removed" confirmation for the form's add/remove patterns. */
export function useRemoveNotify() {
  const toast = useToast()
  return {
    removed(item: string): void {
      toast.add({ title: `${item} removed`, color: 'neutral' })
    },
  }
}
