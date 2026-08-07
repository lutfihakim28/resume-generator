<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
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

const sectionsTrigger = ref<ComponentPublicInstance | null>(null)

/**
 * Popup navigation: close the popover and return focus to its trigger
 * synchronously, BEFORE FormNav starts its smooth scroll. reka-ui restores
 * focus to the trigger only when the popover unmounts (~150ms later); if
 * focus still moves at that point, Chromium cancels the in-progress smooth
 * scroll and the tap appears to do nothing.
 */
function onSectionNavigate(close: () => void): void {
  close()
  const el = sectionsTrigger.value?.$el
  if (el instanceof HTMLElement) el.focus({ preventScroll: true })
}

const langItems = [
  { label: 'EN', value: 'en' },
  { label: 'ID', value: 'id' },
]

const incompleteCount = computed(() => totalIncompleteCount(store.resume))
const noContactWarning = computed(() => validateResume(store.resume).warnings.noContact)
</script>

<template>
  <div class="flex min-h-0 gap-8 p-6 max-lg:p-4">
    <FormNav class="sticky top-6 h-fit w-44 shrink-0 max-lg:hidden" />

    <div class="min-w-0 flex-1 space-y-6">
      <!--
        Mobile-only section navigation: a popup anchored to a sticky bar so it
        stays reachable while scrolling the long form, without squeezing the
        form out of the viewport width (the sidebar is hidden below lg).
      -->
      <div
        class="sticky top-0 z-10 -mx-4 mb-4 border-b border-gray-200 bg-white/95 px-4 py-2 backdrop-blur lg:hidden"
        data-testid="mobile-sections-bar"
      >
        <UPopover>
          <UButton
            ref="sectionsTrigger"
            icon="i-lucide-list"
            color="neutral"
            variant="soft"
            size="sm"
            data-testid="sections-toggle"
          >
            Sections
          </UButton>

          <template #content="{ close }">
            <div class="w-56" data-testid="sections-popover">
              <FormNav @navigate="onSectionNavigate(close)" />
            </div>
          </template>
        </UPopover>
      </div>

      <div class="flex items-center justify-between gap-4">
        <h1 class="text-xl font-semibold">Resume Editor</h1>
        <UTabs
          v-model="store.activeLang"
          :items="langItems"
          variant="segment"
          :content="false"
          data-testid="lang-toggle"
        />
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
