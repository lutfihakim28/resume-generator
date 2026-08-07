<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { totalIncompleteCount } from './sections'
import { validateResume } from '@/utils/validation'
import FormNav from './FormNav.vue'
import PersonalSection from './PersonalSection.vue'
import SummarySection from './SummarySection.vue'
import SkillsSection from './SkillsSection.vue'
import ExperienceSection from './ExperienceSection.vue'
import ProjectsSection from './ProjectsSection.vue'
import EducationSection from './EducationSection.vue'
import CertificationsSection from './CertificationsSection.vue'
import LanguagesSection from './LanguagesSection.vue'
import OptionsSection from './OptionsSection.vue'

const store = useResumeStore()

const langItems = [
  { label: 'EN', value: 'en' },
  { label: 'ID', value: 'id' },
]

const incompleteCount = computed(() => totalIncompleteCount(store.resume))
const noContactWarning = computed(() => validateResume(store.resume).warnings.noContact)
</script>

<template>
  <div class="flex min-h-0 gap-8 p-6">
    <FormNav class="sticky top-6 h-fit w-44 shrink-0" />

    <div class="min-w-0 flex-1 space-y-6">
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-xl font-semibold">Resume Editor</h1>
        <UTabs v-model="store.activeLang" :items="langItems" variant="segment" :content="false" data-testid="lang-toggle" />
      </div>

      <UAlert
        v-if="incompleteCount > 0"
        color="warning"
        variant="soft"
        :title="`${incompleteCount} ID field(s) still empty — switch to ID to fill them.`"
        data-testid="incomplete-alert"
      />
      <UAlert
        v-if="noContactWarning"
        color="warning"
        variant="soft"
        :title="noContactWarning"
        data-testid="contact-alert"
      />

      <PersonalSection />
      <SummarySection />
      <SkillsSection />
      <ExperienceSection />
      <ProjectsSection />
      <EducationSection />
      <CertificationsSection />
      <LanguagesSection />
      <OptionsSection />
    </div>
  </div>
</template>
