<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { FORM_SECTIONS, sectionHeading } from './sections'

const store = useResumeStore()
const section = FORM_SECTIONS.find((s) => s.key === 'summary')!
const heading = computed(() => sectionHeading(section, store.activeLang))
</script>

<template>
  <section :id="section.id" class="scroll-mt-6 space-y-4 border-b border-gray-200 pb-6">
    <h2 class="text-lg font-semibold">{{ heading }}</h2>
    <p class="text-sm text-gray-500">
      2–3 lines: years + role, stack breadth, one measurable outcome.
    </p>

    <UFormField :label="`Summary (${store.activeLang.toUpperCase()})`">
      <UTextarea
        v-model="store.resume.summary[store.activeLang]"
        :rows="4"
        placeholder="Backend engineer with 4+ years building APIs and microservices for fintech products…"
        data-testid="input-summary"
      />
    </UFormField>
  </section>
</template>
