<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { useSaveToBrowser } from '@/composables/useSaveToBrowser'
import ResumeFormPanel from '@/components/resume-form/ResumeFormPanel.vue'
import ResumePreview from '@/components/resume-preview/ResumePreview.vue'

/**
 * Adaptive layout: below `lg` the form and the review live in tabs (each gets
 * full width); at `lg`+ the classic side-by-side grid is shown. Both branches
 * stay mounted — the inactive one is hidden via CSS / the `hidden` attribute
 * (`:unmount-on-hide="false"`) — so no state is lost on tab switches (the
 * store itself is a module-level singleton anyway).
 */

/**
 * Restore-on-init: overlay the last saved blob on top of the blank store
 * before anything (incl. child panels) renders. Silent failure policy: no
 * toast — a boot-time toast is noise the user can't act on; corrupt blobs
 * fall back to the blank resume and log to the console only.
 */
const { ok: restoreOk, errors: restoreErrors } = useResumeStore().restoreFromLocalStorage()
if (!restoreOk) console.warn('Resume restore failed:', restoreErrors)

const activeTab = ref<'form' | 'review'>('form')
const mobileTabs = [
  { label: 'Form', value: 'form', slot: 'form' },
  { label: 'Review', value: 'review', slot: 'review' },
]
const formPanelEl = ref<ComponentPublicInstance | null>(null)
const reviewPanelEl = ref<ComponentPublicInstance | null>(null)

/** Panels stay mounted across tab switches — reset the newly shown one to the top. */
const { saveToBrowser } = useSaveToBrowser()

/**
 * Ctrl+S (Cmd+S on macOS) saves the resume to this browser's localStorage —
 * the same action as the "Save to Browser" toolbar button. Only the plain
 * save chord is captured: Ctrl+Shift+S (browser "Save As…") and Ctrl+Alt+S
 * (menu accelerators) pass through untouched, and no match is made while an
 * IME composition is in flight. Listeners live on `window` (repo precedent:
 * FormNav.vue) so keydowns from form fields are covered; the app *is* a form.
 */
function isSaveShortcut(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.isComposing) return false
  return (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 's'
}

function onKeydown(e: KeyboardEvent): void {
  if (!isSaveShortcut(e)) return
  e.preventDefault()
  saveToBrowser()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

watch(activeTab, async (tab) => {
  await nextTick()
  const panel = tab === 'form' ? formPanelEl.value : reviewPanelEl.value
  const el = panel?.$el
  if (el instanceof HTMLElement) el.scrollTo?.({ top: 0 })
})
</script>

<template>
  <UApp>
    <!-- Desktop / lg+ : side-by-side form and preview (unchanged). -->
    <div class="hidden h-dvh grid-cols-2 overflow-hidden lg:grid" data-testid="desktop-layout">
      <ResumeFormPanel class="h-full overflow-y-auto border-r border-gray-200" />
      <ResumePreview />
    </div>

    <!-- Mobile / <lg : form and review as full-height tabs. -->
    <div class="h-dvh overflow-hidden lg:hidden" data-testid="mobile-layout">
      <UTabs
        v-model="activeTab"
        :items="mobileTabs"
        :unmount-on-hide="false"
        class="flex h-full flex-col"
        :ui="{ content: 'min-h-0 flex-1' }"
        data-testid="mobile-tabs"
      >
        <template #form>
          <ResumeFormPanel ref="formPanelEl" class="h-full overflow-y-auto" />
        </template>
        <template #review>
          <ResumePreview ref="reviewPanelEl" />
        </template>
      </UTabs>
    </div>
  </UApp>
</template>
