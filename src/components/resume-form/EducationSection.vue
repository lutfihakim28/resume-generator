<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { FORM_SECTIONS, sectionHeading } from './sections'
import EducationEntryForm from './EducationEntryForm.vue'

const store = useResumeStore()
const section = FORM_SECTIONS.find((s) => s.key === 'education')!
const heading = computed(() => sectionHeading(section, store.activeLang))
</script>

<template>
  <section
    :id="section.id"
    class="scroll-mt-6 max-lg:scroll-mt-12 space-y-4 border-b border-gray-200 pb-6"
  >
    <h2 class="text-lg font-semibold">{{ heading }}</h2>
    <p class="text-sm text-gray-500">
      Positioned at the bottom for mid-level developers; the preset toggle moves it to the top for
      fresh graduates.
    </p>

    <div class="space-y-4">
      <EducationEntryForm
        v-for="education in store.resume.education"
        :key="education.id"
        :entry-id="education.id"
      />
    </div>

    <UButton
      variant="soft"
      label="Add education"
      data-testid="add-education"
      @click="store.addEducation"
    />
  </section>
</template>
