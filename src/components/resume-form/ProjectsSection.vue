<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { FORM_SECTIONS, sectionHeading } from './sections'
import ProjectEntryForm from './ProjectEntryForm.vue'

const store = useResumeStore()
const section = FORM_SECTIONS.find((s) => s.key === 'projects')!
const heading = computed(() => sectionHeading(section, store.activeLang))
</script>

<template>
  <section :id="section.id" class="scroll-mt-6 space-y-4 border-b border-gray-200 pb-6">
    <h2 class="text-lg font-semibold">{{ heading }}</h2>
    <p class="text-sm text-gray-500">
      2–3 items. This is the fresh-grad equalizer — keep it even if short.
    </p>

    <div class="space-y-4">
      <ProjectEntryForm
        v-for="project in store.resume.projects"
        :key="project.id"
        :entry-id="project.id"
      />
    </div>

    <UButton
      variant="soft"
      label="Add project"
      data-testid="add-project"
      @click="store.addProject"
    />
  </section>
</template>
