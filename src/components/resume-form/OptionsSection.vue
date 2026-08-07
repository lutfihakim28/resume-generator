<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { FORM_SECTIONS, sectionHeading } from './sections'

const store = useResumeStore()
const section = FORM_SECTIONS.find((s) => s.key === 'options')!
const heading = computed(() => sectionHeading(section, store.activeLang))

const positionItems = [
  { label: 'Bottom (mid-level)', value: 'bottom' },
  { label: 'Top (fresh grad)', value: 'top' },
]
</script>

<template>
  <section :id="section.id" class="scroll-mt-6 max-lg:scroll-mt-12 space-y-4">
    <h2 class="text-lg font-semibold">{{ heading }}</h2>
    <p class="text-sm text-gray-500">
      Template options from the dev-hybrid preset — applied in the live preview.
    </p>

    <USwitch
      v-model="store.resume.options.showPhoto"
      label="Show photo (default off for tech roles)"
    />

    <div class="space-y-2">
      <p class="text-sm font-medium text-gray-700">Education position</p>
      <UTabs
        v-model="store.resume.options.educationPosition"
        :items="positionItems"
        variant="segment"
        :content="false"
      />
    </div>
  </section>
</template>
