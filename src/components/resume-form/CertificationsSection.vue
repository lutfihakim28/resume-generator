<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { FORM_SECTIONS, sectionHeading } from './sections'
import CertificationEntryForm from './CertificationEntryForm.vue'

const store = useResumeStore()
const section = FORM_SECTIONS.find((s) => s.key === 'certifications')!
const heading = computed(() => sectionHeading(section, store.activeLang))
</script>

<template>
  <section :id="section.id" class="scroll-mt-6 space-y-4 border-b border-gray-200 pb-6">
    <h2 class="text-lg font-semibold">{{ heading }}</h2>
    <p class="text-sm text-gray-500">Only certifications relevant to the target stack.</p>

    <div class="space-y-4">
      <CertificationEntryForm
        v-for="cert in store.resume.certifications"
        :key="cert.id"
        :entry-id="cert.id"
      />
    </div>

    <UButton
      variant="soft"
      label="Add certification"
      data-testid="add-certification"
      @click="store.addCertification"
    />
  </section>
</template>
