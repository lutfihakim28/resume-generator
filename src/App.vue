<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import ResumeFormPanel from '@/components/resume-form/ResumeFormPanel.vue'
import ResumePreview from '@/components/resume-preview/ResumePreview.vue'

/**
 * Adaptive layout: below `lg` the form and the review live in tabs (each gets
 * full width); at `lg`+ the classic side-by-side grid is shown. Both branches
 * stay mounted — the inactive one is hidden via CSS / the `hidden` attribute
 * (`:unmount-on-hide="false"`) — so no state is lost on tab switches (the
 * store itself is a module-level singleton anyway).
 */
const activeTab = ref<'form' | 'review'>('form')
const mobileTabs = [
  { label: 'Form', value: 'form', slot: 'form' },
  { label: 'Review', value: 'review', slot: 'review' },
]
const formPanelEl = ref<ComponentPublicInstance | null>(null)
const reviewPanelEl = ref<ComponentPublicInstance | null>(null)

/** Panels stay mounted across tab switches — reset the newly shown one to the top. */
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
