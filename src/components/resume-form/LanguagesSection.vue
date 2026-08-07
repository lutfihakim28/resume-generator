<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { FORM_SECTIONS, sectionHeading } from './sections'
import LanguageEntryForm from './LanguageEntryForm.vue'

const store = useResumeStore()
const section = FORM_SECTIONS.find((s) => s.key === 'languages')!
const heading = computed(() => sectionHeading(section, store.activeLang))
</script>

<template>
  <section :id="section.id" class="scroll-mt-6 space-y-4 border-b border-gray-200 pb-6">
    <h2 class="text-lg font-semibold">{{ heading }}</h2>

    <div class="space-y-4">
      <LanguageEntryForm
        v-for="language in store.resume.languages"
        :key="language.id"
        :entry-id="language.id"
      />
    </div>

    <UButton
      variant="soft"
      label="Add language"
      data-testid="add-language"
      @click="store.addLanguage"
    />
  </section>
</template>
