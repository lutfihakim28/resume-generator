<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { FORM_SECTIONS, sectionHeading } from './sections'
import ExperienceEntryForm from './ExperienceEntryForm.vue'

const store = useResumeStore()
const section = FORM_SECTIONS.find((s) => s.key === 'experience')!
const heading = computed(() => sectionHeading(section, store.activeLang))
</script>

<template>
  <section
    :id="section.id"
    class="scroll-mt-6 max-lg:scroll-mt-12 space-y-4 border-b border-gray-200 pb-6"
  >
    <h2 class="text-lg font-semibold">{{ heading }}</h2>
    <p class="text-sm text-gray-500">
      Newest first. 3–5 bullets per role, each with a strong verb + metric.
    </p>

    <div class="space-y-4">
      <ExperienceEntryForm
        v-for="entry in store.resume.experience"
        :key="entry.id"
        :entry-id="entry.id"
      />
    </div>

    <UButton
      variant="soft"
      label="Add experience"
      data-testid="add-experience"
      @click="store.addExperience"
    />
  </section>
</template>
